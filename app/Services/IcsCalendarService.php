<?php

namespace App\Services;

use Illuminate\Support\Collection;

class IcsCalendarService
{
    /**
     * Parses the VEVENTs out of an .ics feed into [['uid' => ..., 'start' => 'Y-m-d', 'end' => 'Y-m-d']].
     * Deliberately tolerant — OTA calendar exports vary in line-folding and
     * field order, so this reads whichever of UID/DTSTART/DTEND/DTSTART;VALUE=DATE
     * style lines it finds rather than assuming a strict layout.
     *
     * @return array<int, array{uid: string, start: string, end: string}>
     */
    public function parse(string $ics): array
    {
        // Unfold lines: a leading space/tab means "continuation of the previous line".
        $unfolded = preg_replace("/\r\n[ \t]/", '', str_replace("\r\n", "\n", $ics));
        $lines = explode("\n", (string) $unfolded);

        $events = [];
        $current = null;

        foreach ($lines as $line) {
            $line = rtrim($line, "\r");

            if ($line === 'BEGIN:VEVENT') {
                $current = ['uid' => null, 'start' => null, 'end' => null];

                continue;
            }

            if ($line === 'END:VEVENT') {
                if ($current && $current['uid'] && $current['start'] && $current['end']) {
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
        // Strip a trailing time component (VALUE=DATE-TIME) — we only care
        // about the calendar date for a whole-night stay block.
        $digits = substr(preg_replace('/[^0-9]/', '', $value), 0, 8);

        if (strlen($digits) !== 8) {
            return null;
        }

        return substr($digits, 0, 4).'-'.substr($digits, 4, 2).'-'.substr($digits, 6, 2);
    }

    /**
     * Builds an .ics feed of blocked date ranges from a set of bookings.
     * No guest details are included — same privacy convention every OTA
     * feed follows, so there's nothing sensitive to leak either direction.
     *
     * @param  Collection<int, \App\Models\Booking>  $bookings
     */
    public function build(string $calendarName, Collection $bookings): string
    {
        $lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Summit Lodge//Room Availability//EN',
            'CALSCALE:GREGORIAN',
            'X-WR-CALNAME:'.$this->escape($calendarName),
        ];

        foreach ($bookings as $booking) {
            $lines[] = 'BEGIN:VEVENT';
            $lines[] = 'UID:'.$booking->id.'@summitlodge';
            $lines[] = 'DTSTAMP:'.now()->utc()->format('Ymd\THis\Z');
            $lines[] = 'DTSTART;VALUE=DATE:'.$booking->check_in->format('Ymd');
            $lines[] = 'DTEND;VALUE=DATE:'.$booking->check_out->format('Ymd');
            $lines[] = 'SUMMARY:Not available';
            $lines[] = 'END:VEVENT';
        }

        $lines[] = 'END:VCALENDAR';

        return implode("\r\n", $lines)."\r\n";
    }

    private function escape(string $value): string
    {
        return str_replace([',', ';'], ['\,', '\;'], $value);
    }
}
