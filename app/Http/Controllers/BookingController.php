<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Room;
use App\Services\PaynowService;
use Carbon\Carbon;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    /**
     * Creates a booking and starts its Paynow payment, safely repeatable.
     *
     * The browser makes up the booking's UUID (`group_reference`) before the
     * first attempt and sends the same one on every retry. If the connection
     * drops part-way, the retry finds the booking already there and carries
     * on from where things stopped (hands back the same checkout, or reports
     * that it was paid) instead of creating a second booking and a second
     * payment.
     */
    public function store(Request $request, PaynowService $paynow): JsonResponse
    {
        Log::info('Booking Request Payload:', $request->all());

        $validated = $request->validate([
            // Optional so an older cached page, which does not send one, still
            // works (it just is not protected against retries).
            'group_reference' => ['nullable', 'uuid'],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email'],
            'phone' => ['required', 'string', 'max:30'],
            'check_in' => ['required', 'date', 'after_or_equal:today'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'party_size' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.room_id' => ['required', 'uuid', 'exists:rooms,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:20'],
        ]);

        $groupReference = $validated['group_reference'] ?? (string) Str::uuid();

        try {
            // One request at a time per booking: a double click, or a retry
            // arriving while the first attempt is still running, waits here
            // rather than racing it into a duplicate.
            return Cache::lock("booking-group:{$groupReference}", 60)->block(
                15,
                fn () => $this->createOrResume($validated, $groupReference, $paynow),
            );
        } catch (LockTimeoutException) {
            return response()->json([
                'code' => 'booking_in_progress',
                'message' => 'Your booking is still being processed. Please wait a moment and try again.',
            ], 409);
        }
    }

    private function createOrResume(array $validated, string $groupReference, PaynowService $paynow): JsonResponse
    {
        $existing = Booking::where('group_reference', $groupReference)->get();

        if ($existing->isEmpty()) {
            $bookings = $this->createBookings($validated, $groupReference);
            $replayed = false;
        } else {
            if ($conflict = $this->conflictWith($existing, $validated)) {
                return $conflict;
            }

            $bookings = $this->refreshContactDetails($existing, $groupReference, $validated);
            $replayed = true;
        }

        return $this->respondWithPayment($bookings, $groupReference, $replayed, $paynow);
    }

    private function createBookings(array $validated, string $groupReference): Collection
    {
        $nights = Carbon::parse($validated['check_in'])->diffInDays(Carbon::parse($validated['check_out']));

        $bookings = DB::transaction(function () use ($validated, $nights, $groupReference) {
            $created = collect();

            foreach ($validated['items'] as $item) {
                $room = Room::availableBetween($validated['check_in'], $validated['check_out'])
                    ->withAvailableQuantity($validated['check_in'], $validated['check_out'])
                    ->whereKey($item['room_id'])
                    ->first();

                if (!$room || $room->available_quantity < $item['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => "Only " . ($room?->available_quantity ?? 0) . " \"" . ($room?->name ?? 'room') . "\" room(s) left for those dates.",
                    ]);
                }

                for ($i = 0; $i < $item['quantity']; $i++) {
                    $created->push(Booking::create([
                        'group_reference' => $groupReference,
                        'room_id' => $room->id,
                        'first_name' => $validated['first_name'],
                        'last_name' => $validated['last_name'],
                        'email' => $validated['email'],
                        'phone' => $validated['phone'],
                        'check_in' => $validated['check_in'],
                        'check_out' => $validated['check_out'],
                        'guests' => min($room->max_guests, $validated['party_size']),
                        'party_size' => $validated['party_size'],
                        'total_price' => $room->price * $nights,
                        'notes' => $validated['notes'] ?? null,
                        'status' => 'pending',
                        'payment_status' => 'unpaid',
                    ]));
                }
            }

            return $created;
        });

        return Collection::make($bookings)->load('room');
    }

    /**
     * A retry must be for the same stay. If the same key turns up with
     * different dates or rooms, or for a booking that has since been
     * cancelled, say so rather than quietly returning the old one.
     */
    private function conflictWith(Collection $existing, array $validated): ?JsonResponse
    {
        if ($existing->every(fn (Booking $b) => $b->status === BookingStatus::CANCELLED)) {
            return response()->json([
                'code' => 'booking_cancelled',
                'message' => 'This booking was cancelled. Please start a new booking.',
            ], 409);
        }

        $checkIn = Carbon::parse($validated['check_in'])->toDateString();
        $checkOut = Carbon::parse($validated['check_out'])->toDateString();

        $sameDates = $existing->every(
            fn (Booking $b) => $b->check_in->toDateString() === $checkIn
                && $b->check_out->toDateString() === $checkOut
        );

        $requested = collect($validated['items'])
            ->groupBy('room_id')
            ->map(fn ($rows) => (int) $rows->sum('quantity'))
            ->sortKeys()
            ->all();

        $stored = $existing->groupBy('room_id')->map->count()->sortKeys()->all();

        if (! $sameDates || $requested !== $stored) {
            return response()->json([
                'code' => 'booking_reference_conflict',
                'message' => 'These rooms or dates differ from your earlier attempt. Please go back and start the booking again.',
            ], 409);
        }

        return null;
    }

    /**
     * On a retry the guest may have fixed a typo in their contact details
     * (a wrong email is a common reason Paynow refuses a first attempt).
     * Accept that, but only while nothing has been paid and no staff member
     * has taken the booking over.
     */
    private function refreshContactDetails(Collection $existing, string $groupReference, array $validated): Collection
    {
        $editable = $existing->every(
            fn (Booking $b) => $b->payment_status === 'unpaid'
                && $b->status === BookingStatus::PENDING
                && $b->created_by === null
        );

        if ($editable) {
            Booking::where('group_reference', $groupReference)->update(
                Arr::only($validated, ['first_name', 'last_name', 'email', 'phone', 'notes'])
            );
        }

        return Booking::where('group_reference', $groupReference)->with('room')->get();
    }

    private function respondWithPayment(Collection $bookings, string $groupReference, bool $replayed, PaynowService $paynow): JsonResponse
    {
        $checkout = ['paid' => true, 'redirect_url' => null];

        if (! $bookings->every(fn (Booking $b) => $b->payment_status === 'paid')) {
            try {
                // The first booking is the anchor record for Paynow. This
                // starts a payment, or picks up the one already under way.
                $checkout = $paynow->startOrResume($bookings->first()->fresh('room'));
            } catch (\Throwable $e) {
                // The bookings are already saved (correctly still blocking
                // the rooms), only the payment could not be started. Leave
                // them pending/unpaid: the guest's retry carries on from here.
                report($e);

                return response()->json([
                    'message' => $e->getMessage() ?: 'Payment could not be started — please try again.',
                ], 502);
            }

            if ($checkout['paid']) {
                // Paynow says it went through while we were not looking.
                $bookings = Booking::where('group_reference', $groupReference)->with('room')->get();
            }
        }

        return response()->json([
            'group_reference' => $groupReference,
            'bookings' => $bookings,
            'redirect_url' => $checkout['paid'] ? null : $checkout['redirect_url'],
            'paid' => $checkout['paid'],
            'confirmation_url' => $checkout['paid']
                ? route('bookings.confirmation', ['reference' => $groupReference], false)
                : null,
            'replayed' => $replayed,
        ]);
    }
}
