import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export default async (request) => {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed." }, { status: 405, headers: corsHeaders });
    }

    try {
        const { message, previousInteractionId, context } = await request.json();

        if (!message || !message.trim()) {
            return Response.json({ error: "Message is required." }, { status: 400, headers: corsHeaders });
        }

        const placeContext = context?.trim()
            ? `\n\nCOMMUNITY PLACE CONTEXT:\n${context.trim()}\n\nUse this verified TravelEase community-place context when relevant. Do not invent details that are not present.\n`
            : "";

        const requestData = {
            model: "gemini-3.6-flash",
            input: message,
            system_instruction: `
You are TravelEase AI, a smart and helpful travel assistant.

Your job is to answer the user's actual question directly.

Focus on:
- Indian destinations
- trip planning
- itineraries
- sightseeing
- hidden gems
- local culture
- local food
- travel tips
- best times to visit

CONVERSATION CONTEXT:
Always pay attention to the ongoing conversation.
If the user refers to "this city", "this place", "there", "the destination" or "it", use the destination established earlier in the conversation.
If a destination has already been established, do not ask for it again.
If no destination is established and the request requires one, ask which city or destination they mean.
If the user changes the destination, use the new destination from that point onward.

COMMUNITY PLACE CONTEXT:
If community-place context is supplied, treat it as TravelEase's current place context and use it to answer questions about that place. You may explain the supplied description, category, location and local information, but do not invent facts that are not supplied.

IMPORTANT RULES:
1. Always answer the exact question the user asked.
2. Do not give a generic introduction unless the user asks for one.
3. If the user asks about a specific destination, answer about that destination.
4. If the user asks for an itinerary, provide a practical itinerary.
5. Always remember the destination established earlier in the conversation.
6. Do not pretend that crowd levels, prices, weather, availability or other changing information are live unless live data has actually been provided.
7. If you don't know something, say so instead of inventing facts.

FORMATTING RULES:
Do NOT use Markdown.
Never use #, ##, ###, **, *, ---, Markdown tables, or asterisks around words.
Use emojis and normal readable text.
Use short paragraphs and simple bullet points with • when useful.
Do not overuse emojis.
${placeContext}
            `,
        };

        if (previousInteractionId) {
            requestData.previous_interaction_id = previousInteractionId;
        }

        const interaction = await ai.interactions.create(requestData);

        return Response.json(
            {
                reply: interaction.output_text,
                interactionId: interaction.id,
            },
            { status: 200, headers: corsHeaders }
        );
    } catch (error) {
        console.error("Gemini API Error:", error);
        return Response.json(
            { error: "Unable to get response from AI." },
            { status: 500, headers: corsHeaders }
        );
    }
};
