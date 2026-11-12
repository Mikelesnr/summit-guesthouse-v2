<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Room;
use App\Services\PaynowService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * A booking request can be sent more than once (the connection drops, the
 * guest double-clicks). These check that doing so never creates a second
 * booking, and that the Paynow side is only asked to start a payment through
 * PaynowService::startOrResume (mocked here, so nothing reaches Paynow).
 */
class BookingIdempotencyTest extends TestCase
{
    use RefreshDatabase;

    private Room $room;

    protected function setUp(): void
    {
        parent::setUp();

        $this->room = Room::create([
            'name' => 'Queen',
            'type' => 'double',
            'price' => 60,
            'max_guests' => 2,
            'quantity' => 3,
        ]);

        $this->paynowStartsCheckout();
    }

    private function paynowStartsCheckout(): void
    {
        $this->mock(PaynowService::class, function ($mock) {
            $mock->shouldReceive('startOrResume')
                ->andReturn(['paid' => false, 'redirect_url' => 'https://paynow.test/pay/abc']);
        });
    }

    private function payload(?string $key, array $overrides = []): array
    {
        return array_merge([
            'group_reference' => $key,
            'first_name' => 'Jane',
            'last_name' => 'Guest',
            'email' => 'jane@example.com',
            'phone' => '0771234567',
            'check_in' => now()->addDays(10)->toDateString(),
            'check_out' => now()->addDays(12)->toDateString(),
            'party_size' => 2,
            'items' => [['room_id' => $this->room->id, 'quantity' => 2]],
        ], $overrides);
    }

    public function test_the_first_request_creates_the_booking_under_the_browsers_uuid(): void
    {
        $key = (string) Str::uuid();

        $this->postJson('/api/bookings', $this->payload($key))
            ->assertOk()
            ->assertJson([
                'group_reference' => $key,
                'redirect_url' => 'https://paynow.test/pay/abc',
                'paid' => false,
                'replayed' => false,
            ]);

        $this->assertSame(2, Booking::where('group_reference', $key)->count());
    }

    public function test_a_retry_with_the_same_uuid_does_not_create_a_second_booking(): void
    {
        $key = (string) Str::uuid();

        $this->postJson('/api/bookings', $this->payload($key))->assertOk();

        $this->postJson('/api/bookings', $this->payload($key))
            ->assertOk()
            ->assertJson([
                'group_reference' => $key,
                'redirect_url' => 'https://paynow.test/pay/abc',
                'replayed' => true,
            ]);

        $this->assertSame(2, Booking::count());
    }

    public function test_a_retry_can_correct_the_contact_details_while_unpaid(): void
    {
        $key = (string) Str::uuid();

        $this->postJson('/api/bookings', $this->payload($key, ['email' => 'jane@exmaple.com']))->assertOk();
        $this->postJson('/api/bookings', $this->payload($key, ['email' => 'jane@example.com']))->assertOk();

        $this->assertSame(2, Booking::count());
        $this->assertSame(2, Booking::where('email', 'jane@example.com')->count());
    }

    public function test_the_same_uuid_for_different_dates_is_refused(): void
    {
        $key = (string) Str::uuid();

        $this->postJson('/api/bookings', $this->payload($key))->assertOk();

        $this->postJson('/api/bookings', $this->payload($key, [
            'check_in' => now()->addDays(20)->toDateString(),
            'check_out' => now()->addDays(22)->toDateString(),
        ]))->assertStatus(409)->assertJson(['code' => 'booking_reference_conflict']);

        $this->assertSame(2, Booking::count());
    }

    public function test_the_same_uuid_for_a_different_number_of_rooms_is_refused(): void
    {
        $key = (string) Str::uuid();

        $this->postJson('/api/bookings', $this->payload($key))->assertOk();

        $this->postJson('/api/bookings', $this->payload($key, [
            'items' => [['room_id' => $this->room->id, 'quantity' => 1]],
        ]))->assertStatus(409)->assertJson(['code' => 'booking_reference_conflict']);
    }

    public function test_an_already_paid_booking_is_reported_as_paid_without_asking_paynow_again(): void
    {
        $key = (string) Str::uuid();
        $this->postJson('/api/bookings', $this->payload($key))->assertOk();

        Booking::where('group_reference', $key)->update(['payment_status' => 'paid', 'status' => 'confirmed']);
        $this->mock(PaynowService::class, fn ($mock) => $mock->shouldNotReceive('startOrResume'));

        $this->postJson('/api/bookings', $this->payload($key))
            ->assertOk()
            ->assertJson([
                'paid' => true,
                'redirect_url' => null,
                'confirmation_url' => "/bookings/{$key}/confirmation",
            ]);

        $this->assertSame(2, Booking::count());
    }

    public function test_a_cancelled_booking_cannot_be_resumed(): void
    {
        $key = (string) Str::uuid();
        $this->postJson('/api/bookings', $this->payload($key))->assertOk();

        Booking::where('group_reference', $key)->update(['status' => 'cancelled']);

        $this->postJson('/api/bookings', $this->payload($key))
            ->assertStatus(409)
            ->assertJson(['code' => 'booking_cancelled']);
    }

    public function test_the_browser_uuid_is_optional_so_older_cached_pages_still_work(): void
    {
        $this->postJson('/api/bookings', $this->payload(null))
            ->assertOk()
            ->assertJson(['replayed' => false]);

        $this->assertSame(2, Booking::count());
    }

    public function test_a_different_booking_cannot_take_rooms_that_are_gone(): void
    {
        $this->postJson('/api/bookings', $this->payload((string) Str::uuid()))->assertOk(); // takes 2 of 3

        $this->postJson('/api/bookings', $this->payload((string) Str::uuid()))
            ->assertStatus(422)
            ->assertJsonValidationErrors('items');

        $this->assertSame(2, Booking::count());
    }

    public function test_a_payment_that_cannot_be_started_leaves_the_booking_to_retry(): void
    {
        $key = (string) Str::uuid();

        $this->mock(PaynowService::class, function ($mock) {
            $mock->shouldReceive('startOrResume')->andThrow(new \RuntimeException('Paynow said no'));
        });

        $this->postJson('/api/bookings', $this->payload($key))
            ->assertStatus(502)
            ->assertJson(['message' => 'Paynow said no']);

        // Held, not lost, and not doubled up by the retry:
        $this->paynowStartsCheckout();
        $this->postJson('/api/bookings', $this->payload($key))->assertOk()->assertJson(['replayed' => true]);

        $this->assertSame(2, Booking::count());
    }
}
