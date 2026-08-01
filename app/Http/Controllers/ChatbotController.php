<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ChatbotController extends Controller
{
    public function respond(Request $request)
    {
        $validated = $request->validate([
            'messages' => ['required', 'array', 'min:1', 'max:20'],
            'messages.*.role' => ['required', 'in:user,assistant'],
            'messages.*.content' => ['required', 'string', 'max:1000'],
        ]);

        $rooms = Room::where('is_active', true)->get(['name', 'type', 'price', 'max_guests', 'has_breakfast']);

        $roomSummary = $rooms->map(fn ($r) => "{$r->name} ({$r->type}, up to {$r->max_guests} guests): \${$r->price}/night"
            .($r->has_breakfast ? ', breakfast included' : ''))->implode('; ');

        $systemPrompt = 'You are the booking assistant for Summit Lodge, a guesthouse in Zimbabwe. '
            ."Current rooms and prices: {$roomSummary}. "
            .'Answer briefly and warmly. If a guest wants to actually book, direct them to use the '
            .'"Check availability" search on the site, or offer the WhatsApp button for a human. '
            .'Never invent prices or rooms not listed above. Keep replies under 80 words.';

        $contents = collect($validated['messages'])->map(fn ($m) => [
            'role' => $m['role'] === 'assistant' ? 'model' : 'user',
            'parts' => [['text' => $m['content']]],
        ])->values()->all();

        $response = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key='
                    .config('services.gemini.key'),
                [
                    'system_instruction' => ['parts' => [['text' => $systemPrompt]]],
                    'contents' => $contents,
                ]
            );

        if ($response->failed()) {
            report(new \RuntimeException('Gemini request failed: '.$response->body()));

            return response()->json([
                'reply' => "Sorry, I'm having trouble right now — please use the WhatsApp button and our team will help.",
            ]);
        }

        $reply = $response->json('candidates.0.content.parts.0.text')
            ?? "Sorry, I didn't quite catch that — could you rephrase?";

        return response()->json(['reply' => trim($reply)]);
    }
}
