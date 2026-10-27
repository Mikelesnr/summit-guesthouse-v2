<?php

namespace App\Services;

use DateTimeImmutable;

class IcsCalendarService
{
    /**
     * Every event we export carries this suffix on its UID, so when we read a
     * feed back in we can recognise our own blocks and never turn them into
     * bookings (some channels re-export calendars they have imported).
     */
    public const OWN_UID_SUFFIX = '@summitlodge';

    /** How far ahead a "fully booked" block is ever written. */
    private const HORIZON_DAYS = 730;

    public function isOwnEvent(string $uid): bool
    {
        return str_ends_with($uid, self::OWN_UID_SUFFIX);
    }

    /**
     * Parses the VEVENTs out of an .ics feed into [['uid' => ..., 'start' => 'Y-m-d', 'end' => 'Y-m-d']].
     * Deliberately tolerant: OTA calendar exports vary in line folding and
     * field order, so this reads whichever UID/DTSTART/DTEND lines it finds
     * rather than assuming a strict layout. An all-day event with no DTEND
     * is treated as a single night, as the iCalendar spec says it should be.
     *
     * @return array<int, array{uid: string, start: string, end: string}>
     */
    public function parse(string $ics): array
    {
        // Unfold first: a line break followed by a space or tab means "this
        // continues the previous line". This has to happen before line
        // endings are normalised, otherwise there is nothing left to match.
        $unfolded = preg_replace("/\r?\n[ \t]/", '', $ics);
        $lines = explode("\n", str_replace("\r\n", "\n", (string) $unfolded));

        $events = [];
        $current = null;

        foreach ($lines as $line) {
            $line = rtrim($line, "\r");

            if ($line === 'BEGIN:VEVENT') {
                $current = ['uid' => null, 'start' => null, 'end' => null];

                continue;
            }

            if ($line === 'END:VEVENT') {
                if ($current && $current['uid'] && $current['start']) {
                    $current['end'] ??= $this->addDays($current['start'], 1);
                    $events[] = $current;
                }
                $current = null;

                continue;
            }

            if ($current === null) {
                continue;
            }

            if (str_starts_with($line, 'UID')) {
                $current['uid'] = trim(explode(':', $line, 2)[1] ?? '');
            } elseif (str_starts_with($line, 'DTSTART')) {
                $current['start'] = $this->parseDate($line);
            } elseif (str_starts_with($line, 'DTEND')) {
                $current['end'] = $this->parseDate($line);
            }
        }

        return $events;
    }

    private function parseDate(string $line): ?string
    {
        $value = trim(explode(':', $line, 2)[1] ?? '');
        // Strip a trailing time component (VALUE=DATE-TIME): we only care
        // about the calendar date for a whole-night stay block.
        $digits = substr(preg_replace('/[^0-9]/', '', $value), 0, 8);

        if (strlen($digits) !== 8) {
            return null;
        }

        return substr($digits, 0, 4) . '-' . substr($digits, 4, 2) . '-' . substr($digits, 6, 2);
    }

    private function addDays(string $date, int $days): string
    {
        return (new DateTimeImmutable($date))->modify("+{$days} days")->format('Y-m-d');
    }

    /**
     * Works out the date ranges on which every room of a type is taken.
     *
     * Booking.com only lets one unit of a room type be connected over iCal,
     * so its calendar for that type is all or nothing. We therefore only
     * tell it "not available" for nights when the number of overlapping
     * stays has reached the number of physical rooms of that type.
     *
     * Each range's `end` is exclusive (the morning after the last full
     * night), which is how iCalendar describes a stay.
     *
     * @param  array<int, array{start: string, end: string}>  $stays
     * @return array<int, array{start: string, end: string}>
     */
    public function fullRanges(array $stays, int $quantity, string $fromDate): array
    {
        $until = $this->addDays($fromDate, self::HORIZON_DAYS);

        // No rooms of this type to sell (zero units, or the type is switched
        // off): everything is unavailable.
        if ($quantity < 1) {
            return [['start' => $fromDate, 'end' => $until]];
        }

        $counts = [];

        foreach ($stays as $stay) {
            $night = new DateTimeImmutable(max($stay['start'], $fromDate));
            $end = new DateTimeImmutable(min($stay['end'], $until));

            for (; $night < $end; $night = $night->modify('+1 day')) {
                $key = $night->format('Y-m-d');
                $counts[$key] = ($counts[$key] ?? 0) + 1;
            }
        }

        $fullNights = array_keys(array_filter($counts, fn(int $count) => $count >= $quantity));
        sort($fullNights);

        $ranges = [];

        foreach ($fullNights as $night) {
            $last = array_key_last($ranges);

            if ($last !== null && $ranges[$last]['end'] === $night) {
                $ranges[$last]['end'] = $this->addDays($night, 1);
            } else {
                $ranges[] = ['start' => $night, 'end' => $this->addDays($night, 1)];
            }
        }

        return $ranges;
    }

    /**
     * Builds an .ics feed from blocked date ranges. No guest details are
     * included, the same privacy convention every OTA feed follows.
     *
     * @param  array<int, array{start: string, end: string}>  $ranges
     */
    public function buildBlockedRanges(string $calendarName, string $roomId, array $ranges): string
    {
        $lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Summit Lodge//Room Availability//EN',
            'CALSCALE:GREGORIAN',
            'X-WR-CALNAME:' . $this->escape($calendarName),
        ];

        $stamp = gmdate('Ymd\THis\Z');

        foreach ($ranges as $range) {
            $lines[] = 'BEGIN:VEVENT';
            $lines[] = 'UID:' . $roomId . '-' . $range['start'] . self::OWN_UID_SUFFIX;
            $lines[] = 'DTSTAMP:' . $stamp;
            $lines[] = 'DTSTART;VALUE=DATE:' . str_replace('-', '', $range['start']);
            $lines[] = 'DTEND;VALUE=DATE:' . str_replace('-', '', $range['end']);
            $lines[] = 'SUMMARY:Not available';
            $lines[] = 'END:VEVENT';
        }

        $lines[] = 'END:VCALENDAR';

        return implode("\r\n", $lines) . "\r\n";
    }

    private function escape(string $value): string
    {
        return str_replace([',', ';'], ['\,', '\;'], $value);
    }
}
