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
        const apiKey = process.env.ELEVENLABS_API_KEY;
        const voiceId = process.env.ELEVENLABS_VOICE_ID;

        if (!apiKey || !voiceId) {
            return Response.json(
                { error: "Voice service is not configured yet." },
                { status: 503, headers }
            );
        }

        if (!text || !text.trim()) {
            return Response.json({ error: "Text is required." }, { status: 400, headers });
        }

        const cleanText = text.trim().slice(0, 3000);

        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
            {
                method: "POST",
                headers: {
                    "xi-api-key": apiKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text: cleanText,
                    model_id: "eleven_multilingual_v2",
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("ElevenLabs error:", errorText);
            return Response.json(
                { error: "Unable to generate voice right now." },
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
            { error: "Unable to generate voice right now." },
            { status: 500, headers }
        );
    }
};
