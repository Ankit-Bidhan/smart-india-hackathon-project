import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export default async (request) => {
    // Handle browser preflight request
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        });
    }

    if (request.method !== "POST") {
        return Response.json(
            { error: "Method not allowed." },
            {
                status: 405,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    }

    try {
        const { message, previousInteractionId } =
            await request.json();

        if (!message || !message.trim()) {
            return Response.json(
                { error: "Message is required." },
                {
                    status: 400,
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                    },
                }
            );
        }

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

If the user refers to:
"this city"
"this place"
"there"
"the destination"
"it"

use the destination established earlier in the conversation.

If a destination has already been established, do not ask for it again.

If no destination is established and the user's request requires one,
ask the user which city or destination they mean.

IMPORTANT RULES:

1. Always answer the exact question the user asked.

2. Do not give a generic introduction unless the user asks for one.

3. If the user asks about a specific destination, answer about that destination.

4. If the user asks for an itinerary, provide a practical itinerary.

5. Always remember the destination established earlier in the conversation.

6. If the user says:
"this city"
"this place"
"there"
"the destination"
"it"

use the destination from the ongoing conversation.

7. If no destination has been mentioned and the user asks something destination-specific, ask which city or destination they mean.

8. If the user changes the destination, use the new destination from that point onward.

9. Do not pretend that crowd levels, prices, weather, availability or other changing information are live unless live data has actually been provided.

10. If you don't know something, say so instead of inventing facts.

FORMATTING RULES:

Do NOT use Markdown.

Never use:
#
##
###
**
*
---
Markdown tables

Never put asterisks around words.

Do not use Markdown headings.

Instead use emojis and normal readable text.

Use emojis such as:

📍 Location
🏛️ Attractions
💎 Hidden Gem
🍴 Food
🕐 Best Time
🚗 Travel
💡 Tip
⚠️ Important

Use short paragraphs.

Use simple bullet points with • when useful.

Make responses friendly, conversational and easy to scan.

Do not overuse emojis.
        `,
        };

        if (previousInteractionId) {
            requestData.previous_interaction_id =
                previousInteractionId;
        }

        const interaction =
            await ai.interactions.create(requestData);

        return Response.json(
            {
                reply: interaction.output_text,
                interactionId: interaction.id,
            },
            {
                status: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );

    } catch (error) {
        console.error("Gemini API Error:", error);

        return Response.json(
            {
                error: "Unable to get response from AI.",
            },
            {
                status: 500,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    }
};