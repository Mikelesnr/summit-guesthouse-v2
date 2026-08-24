<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Services\IcsCalendarService;
use Illuminate\Http\Response;

class RoomIcalController extends Controller
{
    /**
     * GET /ical/rooms/{room}.ics
     *
     * Must stay outside the `auth` middleware — Booking.com's own servers
     * poll this on their own schedule, unauthenticated, same as any other
     * OTA calendar feed. The room's UUID is the only "credential", same
     * level of obscurity every free iCal integration relies on.
     */
    public function export(Room $room): Response
    {
        $bookings = $room->bookings()
            ->whereIn('status', ['pending', 'confirmed', 'checked_in'])
            ->get();

        $ics = (new IcsCalendarService)->build($room->name, $bookings);

        return response($ics, 200, [
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Disposition' => 'inline; filename="'.$room->slug.'.ics"',
        ]);
    }
}
