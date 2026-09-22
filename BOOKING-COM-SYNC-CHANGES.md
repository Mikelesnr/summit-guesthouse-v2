# Booking.com iCal Sync — what changed overnight

Full check run before writing this up: `eslint` clean, `tsc --noEmit` clean
(only the expected `vendor/tightenco/ziggy` sandbox artifact, resolves once
you `composer install`), full `vite build` succeeds, every PHP file in
`app`/`routes`/`database` passes `php -l`. Nothing in the existing app was
touched beyond the 15 files below — no unrelated refactors.

## The idea, in one line

Each room type gets its own two-way calendar link with Booking.com. A
scheduled job pulls their side in as `pending` placeholder bookings (which
already block the room using your existing availability logic — no new
logic needed there). You give them a link back to your own calendar so
your direct/walk-in bookings block Booking.com too.

## New files

- **`app/Services/IcsCalendarService.php`** — reads and writes `.ics`
  calendar files. No new Composer package; iCal's format is simple enough
  to parse by hand, and this keeps the dependency list untouched.
- **`app/Http/Controllers/RoomIcalController.php`** — the outbound feed.
  `GET /ical/rooms/{room}.ics` lists that room's blocked dates. No guest
  names/emails in it — same privacy convention every OTA feed follows.
- **`app/Console/Commands/SyncBookingComCalendars.php`** — the inbound
  side. For every active room with a Booking.com calendar URL saved,
  fetches it and:
  - creates a `pending` booking for any reservation it hasn't seen before
  - refreshes the dates on ones it already knows about (in case a guest
    amends their Booking.com reservation)
  - marks a booking `cancelled` if its reservation has disappeared from
    the feed (Booking.com doesn't send a "cancelled" signal — a vanished
    UID *is* the cancellation)
- Two small migrations: `bookings` gets `source` (`booking_com` or null)
  and `source_uid` (their reservation ID, unique per room — this is what
  stops the job ever double-creating the same booking), `rooms` gets
  `ical_import_url`.

## Two bugs I caught in my own draft before they shipped

Worth knowing about since they'd have been genuinely nasty to debug later:

1. **The sync would have wiped out guest details on every run.** My first
   draft used `updateOrCreate`, which re-writes *every* field each time —
   including blanking `first_name`/`email`/etc. back out even after staff
   had filled them in via take-over. Fixed so those fields are only ever
   set the first time a booking is created; every later run only touches
   dates/price.
2. **A checked-in guest could've been auto-cancelled.** If a reservation
   ages off Booking.com's feed near checkout (which can happen without an
   actual cancellation), the "release if missing" logic would have caught
   it. `checked_in` and `checked_out` bookings are now explicitly excluded
   from that check — once someone's staying or has left, the sync leaves
   the row alone either way.

## Modified files

- **`routes/console.php`** — schedules the sync every 10 minutes.
  **You still need one thing on the server**: a system cron entry (or
  Render's scheduled-job feature) running `php artisan schedule:run` once
  a minute. That's what actually triggers Laravel's scheduler — without
  it, this never fires no matter what's in the code.
- **`routes/web.php`** — added the public `/ical/rooms/{room}.ics` route,
  deliberately outside the `auth` group (Booking.com's servers need to
  fetch it unauthenticated).
- **`RoomManagementController`** — `ical_import_url` is now a saveable
  field on room update.
- **`BookingManagementController@takeOver`** — extended, not replaced.
  Now accepts optional `first_name`/`last_name`/`email`/`phone` (a
  Booking.com placeholder starts with none of these), and `booking_com`
  is a valid `payment_method`. A normal Paynow take-over works exactly as
  before if those new fields are just left out.
- **`Dashboard/Rooms/Index.tsx`** — new "Booking.com calendar sync"
  section under the room table. Each room shows its own outbound link
  (copy button) and a field to paste Booking.com's link back in.
- **`Dashboard/Bookings/Index.tsx`** — pending bookings with no name yet
  show as "Booking.com guest" with a small "via Booking.com — needs
  details" badge instead of a blank name. Take-over panel now shows
  name/phone/email fields when it's one of these, and picking
  "Booking.com" as the payment method leaves "payment collected" unticked
  by default (you didn't take their money, Booking.com did or will) —
  staff can still tick it if that's since been settled.
- **`BookingModal.tsx`** — same "needs details" note in the details popup,
  so it's visible whichever way staff first notice the booking.

## What you need to do per room, once this is live

1. Open **Dashboard → Rooms**, scroll to the sync section.
2. Copy "Our calendar" for a room, paste it into Booking.com's Extranet
   (Calendar → Sync calendars → Export) — that's the piece that stops
   Booking.com selling a room you've sold directly.
3. Booking.com gives you back a `.ics` link for that room — paste it into
   "Booking.com's calendar" here and hit Save.
4. Repeat per room type. Nothing else to configure — the cron job picks
   up any room with a saved URL automatically.

## Still worth knowing (not a bug, just how iCal works)

This was covered before, but worth restating now that it's actually
built: Booking.com's own feed doesn't regenerate in real time — typically
1–4 hours, sometimes longer, and that ceiling is on their end, not ours.
The 10-minute job means you're never waiting longer than *your* interval
on top of *theirs*. The real-time layer is still the confirmation email —
staff acting on that the moment it lands closes the gap the cron can't.
