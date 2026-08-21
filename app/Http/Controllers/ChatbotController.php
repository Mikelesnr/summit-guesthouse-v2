<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ChatbotController extends Controller
{
    private const MAX_TOOL_ROUNDS = 3;

    public function respond(Request $request)
    {
        $validated = $request->validate([
            'messages' => ['required', 'array', 'min:1', 'max:20'],
            'messages.*.role' => ['required', 'in:user,assistant'],
            'messages.*.content' => ['required', 'string', 'max:1000'],
        ]);

        $rooms = Room::where('is_active', true)->get(['name', 'type', 'price', 'max_guests', 'has_breakfast']);

        $roomSummary = $rooms->map(fn($r) => "{$r->name} ({$r->type}, up to {$r->max_guests} guests): \${$r->price}/night"
            . ($r->has_breakfast ? ', breakfast included' : ''))->implode('; ');

        $today = now()->toDateString();

        $systemPrompt = 'You are the booking assistant for Summit Lodge, a guesthouse in Beitbridge, Zimbabwe. '
            . "Today's date is {$today}. "
            . "All rooms and current prices: {$roomSummary}. "
            . 'When a guest asks about availability for specific or relative dates (e.g. "this weekend", '
            . '"the 20th to the 23rd"), work out real calendar dates from today\'s date and call check_availability '
            . '— never guess whether a room is free. '
            . 'When a guest mentions a budget or price range, recommend rooms from the list above that fit it — '
            . 'never invent a room or price not listed. '
            . 'If asked how booking works, explain: pick dates and party size on the "Book" page, review available '
            . 'rooms (a party over 2 guests may need more than one room, each room fits up to 2), enter guest details, '
            . 'then pay securely via Paynow (EcoCash, card, or bank). Walk-ins can also pay cash at the front desk. '
            . 'Keep replies warm and brief — under 80 words unless listing multiple rooms. If a guest wants a human, '
            . 'point them to the WhatsApp button.';

        $tools = [[
            'function_declarations' => [[
                'name' => 'check_availability',
                'description' => 'Check which room types are actually free for a given date range, with how many units of each are left.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'check_in' => ['type' => 'STRING', 'description' => 'Check-in date, YYYY-MM-DD'],
                        'check_out' => ['type' => 'STRING', 'description' => 'Check-out date, YYYY-MM-DD'],
                    ],
                    'required' => ['check_in', 'check_out'],
                ],
            ]],
        ]];

        $contents = collect($validated['messages'])->map(fn($m) => [
            'role' => $m['role'] === 'assistant' ? 'model' : 'user',
            'parts' => [['text' => $m['content']]],
        ])->values()->all();

        for ($round = 0; $round < self::MAX_TOOL_ROUNDS; $round++) {
            $response = Http::withHeaders(['Content-Type' => 'application/json'])
                ->post(
                    'https://generativelanguage.googleapis.com/v1beta/models/' . config('services.gemini.model') . ':generateContent?key='
                        . config('services.gemini.key'),
                    [
                        'system_instruction' => ['parts' => [['text' => $systemPrompt]]],
                        'contents' => $contents,
                        'tools' => $tools,
                    ]
                );

            if ($response->failed()) {
                report(new \RuntimeException('Gemini request failed: ' . $response->body()));

                return response()->json([
                    'reply' => "Sorry, I'm having trouble right now — please use the WhatsApp button and our team will help.",
                ]);
            }

            $parts = $response->json('candidates.0.content.parts', []);
            $functionCall = collect($parts)->firstWhere('functionCall');

            if (! $functionCall) {
                $reply = collect($parts)->pluck('text')->filter()->implode(' ')
                    ?: "Sorry, I didn't quite catch that — could you rephrase?";

                return response()->json(['reply' => trim($reply)]);
            }

            // Model wants to call check_availability — run it against the
            // real DB, then hand the result back for a final answer.
            $args = $functionCall['functionCall']['args'] ?? [];
            $result = $this->runAvailabilityCheck($args['check_in'] ?? null, $args['check_out'] ?? null);

            $contents[] = ['role' => 'model', 'parts' => $parts];
            $contents[] = [
                'role' => 'function',
                'parts' => [[
                    'functionResponse' => [
                        'name' => 'check_availability',
                        'response' => $result,
                    ],
                ]],
            ];
        }

        return response()->json([
            'reply' => "Sorry, that's a bit much for me to work out — try the WhatsApp button and our team will help.",
        ]);
    }

    private function runAvailabilityCheck(?string $checkIn, ?string $checkOut): array
    {
        if (! $checkIn || ! $checkOut) {
            return ['error' => 'Missing or invalid dates.'];
        }

        try {
            $rooms = Room::availableBetween($checkIn, $checkOut)
                ->withAvailableQuantity($checkIn, $checkOut)
                ->orderBy('price')
                ->get(['id', 'name', 'type', 'price', 'max_guests', 'has_breakfast']);
        } catch (\Throwable) {
            return ['error' => 'Those dates could not be checked — ask the guest to confirm the format (YYYY-MM-DD).'];
        }

        return [
            'check_in' => $checkIn,
            'check_out' => $checkOut,
            'available_rooms' => $rooms->map(fn($r) => [
                'name' => $r->name,
                'type' => $r->type,
                'price_per_night' => (float) $r->price,
                'max_guests' => $r->max_guests,
                'breakfast_included' => $r->has_breakfast,
                'units_available' => (int) $r->available_quantity,
            ])->values(),
        ];
    }
}
