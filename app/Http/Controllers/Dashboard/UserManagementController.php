<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserManagementController extends Controller
{
    public function index(Request $request)
    {
        $viewer = $request->user();

        // Fetch users and sort them dynamically using the Enum's built-in rank()
        $users = User::whereIn('role', $viewer->visibleRoles())
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'phone', 'role', 'is_active'])
            ->sort(function ($a, $b) {
                // Safely extract the enum instance whether it's cast or a raw string
                $roleA = $a->role;
                $roleB = $b->role;

                // Higher rank comes first (descending order by rank)
                $rankA = is_object($roleA) && method_exists($roleA, 'rank') ? $roleA->rank() : 0;
                $rankB = is_object($roleB) && method_exists($roleB, 'rank') ? $roleB->rank() : 0;

                return $rankB <=> $rankA;
            })
            ->values();

        return Inertia::render('Dashboard/Users/Index', [
            'users' => $users,
            'assignableRoles' => $viewer->visibleRoles(),
        ]);
    }

    public function store(Request $request)
    {
        $viewer = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'role' => ['required', Rule::in($viewer->visibleRoles())],
            'password' => ['required', 'string', 'min:8'],
        ]);

        User::create([
            ...$validated,
            'password' => Hash::make($validated['password']),
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        return back()->with('success', "{$validated['name']} added.");
    }

    public function update(Request $request, User $user)
    {
        $viewer = $request->user();

        $userRoleValue = is_object($user->role) && property_exists($user->role, 'value')
            ? $user->role->value
            : $user->role;
        abort_unless(in_array($userRoleValue, $viewer->visibleRoles(), true), 403);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'role' => ['sometimes', Rule::in($viewer->visibleRoles())],
            'is_is_active' => ['sometimes', 'boolean'],
        ]);

        if ($user->is($viewer)) {
            unset($validated['role'], $validated['is_active']);
        }

        $user->update($validated);

        return back()->with('success', 'User updated.');
    }

    public function destroy(Request $request, User $user)
    {
        $viewer = $request->user();

        $userRoleValue = is_object($user->role) && property_exists($user->role, 'value')
            ? $user->role->value
            : $user->role;
        abort_unless(in_array($userRoleValue, $viewer->visibleRoles(), true), 403);
        abort_if($user->is($viewer), 422, "You can't deactivate your own account.");

        $user->update(['is_active' => false]);

        return back()->with('success', "{$user->name} deactivated.");
    }
}
