<?php

namespace Tests\Feature;

use App\Enums\ReviewStatus;
use App\Enums\UserRole;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GuestAccountTest extends TestCase
{
    use RefreshDatabase;

    private function guest(array $attributes = []): User
    {
        return User::factory()->create(['role' => UserRole::Guest, ...$attributes]);
    }

    private function staff(UserRole $role = UserRole::Staff): User
    {
        return User::factory()->create(['role' => $role]);
    }

    public function test_sign_up_creates_a_guest_never_staff(): void
    {
        $this->post('/register', [
            'name' => 'Jane Guest',
            'email' => 'jane@example.com',
            'phone' => '0771234567',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect('/account');

        $user = User::where('email', 'jane@example.com')->firstOrFail();

        $this->assertSame(UserRole::Guest, $user->role);
        $this->assertSame('0771234567', $user->phone);
    }

    public function test_sign_up_needs_a_full_name_and_a_phone_number(): void
    {
        $this->post('/register', [
            'name' => 'Jane',
            'email' => 'jane@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertSessionHasErrors(['name', 'phone']);

        $this->assertGuest();
    }

    public function test_a_posted_role_cannot_make_a_sign_up_into_staff(): void
    {
        $this->post('/register', [
            'name' => 'Sneaky Guest',
            'email' => 'sneaky@example.com',
            'phone' => '0771234567',
            'role' => 'system_admin',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertSame(UserRole::Guest, User::where('email', 'sneaky@example.com')->firstOrFail()->role);
    }

    public function test_guests_are_kept_out_of_the_staff_dashboard(): void
    {
        $guest = $this->guest();

        $this->actingAs($guest)->get('/dashboard')->assertForbidden();
        $this->actingAs($guest)->get('/dashboard/bookings')->assertForbidden();
        $this->actingAs($guest)->get('/dashboard/bookings/create')->assertForbidden();
        $this->actingAs($guest)->get('/dashboard/reviews')->assertForbidden();
        $this->actingAs($guest)->get('/dashboard/users')->assertForbidden();
    }

    public function test_staff_cannot_use_the_guest_account_page(): void
    {
        $this->actingAs($this->staff())->get('/account')->assertForbidden();
    }

    public function test_portal_sends_each_person_to_their_own_home(): void
    {
        $this->actingAs($this->guest())->get('/portal')->assertRedirect(route('account.index'));
        $this->actingAs($this->staff())->get('/portal')->assertRedirect(route('dashboard.index'));
    }

    public function test_guests_land_on_their_account_after_login(): void
    {
        // The user factory's default password is 'password'.
        $guest = $this->guest();

        $this->post('/login', ['email' => $guest->email, 'password' => 'password'])
            ->assertRedirect('/account');
    }

    public function test_a_review_starts_pending_and_is_not_public(): void
    {
        $guest = $this->guest(['name' => 'Jane Guest']);

        $this->actingAs($guest)->post('/account/reviews', [
            'rating' => 5,
            'body' => 'Lovely stay, very friendly staff.',
        ])->assertSessionHasNoErrors();

        $review = Review::firstOrFail();
        $this->assertSame(ReviewStatus::PENDING, $review->status);
        $this->assertSame('Jane G.', $review->author_name);

        $this->get('/')->assertInertia(fn (Assert $page) => $page->component('Welcome')->has('reviews', 0));
    }

    public function test_review_needs_a_rating_and_some_text(): void
    {
        $this->actingAs($this->guest())
            ->post('/account/reviews', ['rating' => 9, 'body' => 'short'])
            ->assertSessionHasErrors(['rating', 'body']);

        $this->assertSame(0, Review::count());
    }

    public function test_staff_can_approve_a_review_and_it_then_shows_on_the_site(): void
    {
        $guest = $this->guest(['name' => 'Jane Guest']);
        $this->actingAs($guest)->post('/account/reviews', ['rating' => 4, 'body' => 'Clean rooms and good food.']);
        $review = Review::firstOrFail();

        $staff = $this->staff();
        $this->actingAs($staff)
            ->put("/dashboard/reviews/{$review->id}", ['status' => 'approved'])
            ->assertSessionHasNoErrors();

        $review->refresh();
        $this->assertSame(ReviewStatus::APPROVED, $review->status);
        $this->assertSame($staff->id, $review->moderated_by);

        $this->get('/')->assertInertia(fn (Assert $page) => $page->has('reviews', 1));
    }

    public function test_a_rejected_review_stays_off_the_site(): void
    {
        $guest = $this->guest();
        $this->actingAs($guest)->post('/account/reviews', ['rating' => 1, 'body' => 'Something I should not say.']);
        $review = Review::firstOrFail();

        $this->actingAs($this->staff())->put("/dashboard/reviews/{$review->id}", ['status' => 'rejected']);

        $this->get('/')->assertInertia(fn (Assert $page) => $page->has('reviews', 0));
    }

    public function test_a_guest_cannot_approve_reviews_or_delete_someone_elses(): void
    {
        $author = $this->guest();
        $other = $this->guest();
        $review = Review::create([
            'user_id' => $author->id,
            'author_name' => 'Someone S.',
            'rating' => 3,
            'body' => 'An ordinary review of the stay.',
            'status' => ReviewStatus::PENDING,
        ]);

        $this->actingAs($other)->put("/dashboard/reviews/{$review->id}", ['status' => 'approved'])->assertForbidden();
        $this->actingAs($other)->delete("/account/reviews/{$review->id}")->assertForbidden();
        $this->assertDatabaseHas('reviews', ['id' => $review->id]);

        $this->actingAs($author)->delete("/account/reviews/{$review->id}")->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('reviews', ['id' => $review->id]);
    }
}
