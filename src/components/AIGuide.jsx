import { useState } from "react";

function cleanAIText(text) {
    return text
        .replace(/^#{1,6}\s*/gm, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/^-{3,}$/gm, "")
        .replace(/^\s*[-*]\s+/gm, "• ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function AIGuide() {
    const [messages, setMessages] = useState([
        { role: "assistant", text: "Hi! I'm your AI travel guide. 👋" },
        {
            role: "assistant",
            text: "Tell me where you want to go and I'll help you plan your journey.",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [interactionId, setInteractionId] = useState(null);

    const sendMessage = async (messageText = input) => {
        const text = messageText.trim();
        if (!text || loading) return;

        setMessages((previous) => [...previous, { role: "user", text }]);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch("/.netlify/functions/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    previousInteractionId: interactionId,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "AI request failed.");
            }

            setInteractionId(data.interactionId || null);
            setMessages((previous) => [
                ...previous,
                { role: "assistant", text: data.reply },
            ]);
        } catch (error) {
            console.error("AI Error:", error);
            setMessages((previous) => [
                ...previous,
                {
                    role: "assistant",
                    text: "Sorry, I couldn't connect to the AI right now. Please try again.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        sendMessage();
    };

    return (
        <section className="ai-section" id="ai-guide">
            <div className="ai-heading">
                <p className="section-label">YOUR TRAVEL COMPANION</p>
                <h2>Meet your AI travel guide.</h2>
                <p>
                    Get personalized recommendations, trip ideas, local insights and answers to your travel questions.
                </p>
            </div>

            <div className="ai-container">
                <div className="ai-top">
                    <div className="ai-avatar">🤖</div>
                    <div>
                        <h3>TravelEase AI</h3>
                        <span>● Online</span>
                    </div>
                </div>

                <div className="chat-area">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={message.role === "assistant" ? "ai-message" : "user-message"}
                        >
                            {message.role === "assistant" && <span>🤖</span>}
                            <div>
                                {message.role === "assistant" ? cleanAIText(message.text) : message.text}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="ai-message">
                            <span>🤖</span>
                            <div className="typing">Thinking... 💭</div>
                        </div>
                    )}
                </div>

                <div className="suggestions">
                    <button onClick={() => sendMessage("Plan a trip for the destination we are currently discussing. If no destination has been mentioned yet, ask me which city or destination I want to visit.")}>📍 Plan my trip</button>
                    <button onClick={() => sendMessage("Suggest hidden gems for the destination we are currently discussing. If no destination has been mentioned yet, ask me which city or destination I mean.")}>💎 Find hidden gems</button>
                    <button onClick={() => sendMessage("Suggest local food for the destination we are currently discussing. If no destination has been mentioned yet, ask me which city or destination I want information about.")}>🍴 Local food</button>
                    <button onClick={() => sendMessage("Tell me the best time to visit the destination we are currently discussing. If no destination has been mentioned yet, ask me which city or destination I mean.")}>🕐 Best time to visit</button>
                </div>

                <form className="ai-input" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        placeholder="Ask anything about your trip..."
                        disabled={loading}
                    />
                    <button type="submit" disabled={loading || !input.trim()}>
                        {loading ? "..." : "➤"}
                    </button>
                </form>
            </div>
        </section>
    );
}

export default AIGuide;
