import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export default async (request) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
    };

    if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers });
    }

    if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed." }, { status: 405, headers });
    }

    try {
        const { text } = await request.json();
        const elevenApiKey = process.env.ELEVENLABS_API_KEY;
        const voiceId = process.env.ELEVENLABS_VOICE_ID;
        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (!elevenApiKey || !voiceId) {
            return Response.json(
                { error: "ElevenLabs voice service is not configured. Check ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in Netlify." },
                { status: 503, headers }
            );
        }

        if (!geminiApiKey) {
            return Response.json(
                { error: "GEMINI_API_KEY is missing for Hindi narration." },
                { status: 503, headers }
            );
        }

        if (!text || !text.trim()) {
            return Response.json({ error: "Text is required." }, { status: 400, headers });
        }

        const cleanText = text.trim().slice(0, 3000);

        let hindiText = "";

        try {
            const translation = await ai.interactions.create({
                model: "gemini-3.6-flash",
                input: cleanText,
                system_instruction: `
Translate this TravelEase travel-guide response from English into natural spoken Hindi for audio narration.

Rules:
- Translate the complete meaning. Do not summarize or omit information.
- Return ONLY the Hindi narration.
- Use natural conversational Hindi, like a friendly Indian travel guide speaking to a traveller.
- Use Devanagari Hindi.
- Keep destination names, proper nouns and place names where appropriate.
- Do not use Markdown, headings, bullets, quotes or explanations.
- Preserve the same useful details and approximately the same length.
                `,
            });

            hindiText = translation.output_text?.trim() || "";
        } catch (translationError) {
            console.error("Hindi translation error:", translationError);
            return Response.json(
                {
                    error: "Hindi narration generation failed.",
                    stage: "gemini-translation",
                    details: translationError?.message || String(translationError),
                },
                { status: 502, headers }
            );
        }

        if (!hindiText) {
            return Response.json(
                { error: "Gemini returned no Hindi narration.", stage: "gemini-translation" },
                { status: 502, headers }
            );
        }

        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
            {
                method: "POST",
                headers: {
                    "xi-api-key": elevenApiKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text: hindiText,
                    model_id: "eleven_multilingual_v2",
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("ElevenLabs error:", response.status, errorText);

            return Response.json(
                {
                    error: "ElevenLabs voice generation failed.",
                    stage: "elevenlabs",
                    status: response.status,
                    details: errorText,
                },
                { status: response.status, headers }
            );
        }

        const audio = await response.arrayBuffer();

        return new Response(audio, {
            status: 200,
            headers: {
                ...headers,
                "Content-Type": "audio/mpeg",
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("TTS error:", error);

        return Response.json(
            {
                error: "Unable to generate voice right now.",
                stage: "tts",
                details: error?.message || String(error),
            },
            { status: 500, headers }
        );
    }
};
