import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "../components/AIVoice.css";

function AIGuide() {
    const [searchParams] = useSearchParams();
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            text: "Hi! I'm your AI travel guide. 👋",
        },
        {
            role: "assistant",
            text: "Tell me where you want to go and I'll help you plan your journey.",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [interactionId, setInteractionId] = useState(null);
    const [speakingIndex, setSpeakingIndex] = useState(null);
    const [audio, setAudio] = useState(null);
    const [placeContext, setPlaceContext] = useState(null);

    useEffect(() => {
        const name = searchParams.get("place");
        const city = searchParams.get("city");
        const description = searchParams.get("description");
        const category = searchParams.get("category");

        if (name) {
            setPlaceContext({ name, city, description, category });
        }
    }, [searchParams]);

    const stopVoice = () => {
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
        setAudio(null);
        setSpeakingIndex(null);
    };

    const listenToMessage = async (text, index) => {
        if (speakingIndex === index) {
            stopVoice();
            return;
        }

        stopVoice();
        setSpeakingIndex(index);

        try {
            const response = await fetch("/.netlify/functions/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                throw new Error("Voice generation failed");
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const nextAudio = new Audio(url);

            nextAudio.onended = () => {
                URL.revokeObjectURL(url);
                setAudio(null);
                setSpeakingIndex(null);
            };

            setAudio(nextAudio);
            await nextAudio.play();
        } catch (error) {
            console.error("Voice error:", error);
            setSpeakingIndex(null);
            setAudio(null);
        }
    };

    const sendMessage = async (messageText = input) => {
        const text = messageText.trim();
        if (!text || loading) return;

        setMessages((previous) => [
            ...previous,
            { role: "user", text },
        ]);
        setInput("");
        setLoading(true);

        try {
            const context = placeContext
                ? `CURRENT TRAVEL DESTINATION / COMMUNITY PLACE:\nName: ${placeContext.name}\nCity: ${placeContext.city || ""}\nCategory: ${placeContext.category || ""}\nDescription: ${placeContext.description || ""}\n\nUse this place as the primary context for the user's question unless they clearly change destination.`
                : "";

            const response = await fetch("/.netlify/functions/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    previousInteractionId: interactionId,
                    context,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "AI request failed.");

            setInteractionId(data.interactionId);
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
                    Get personalized recommendations, trip ideas, local insights
                    and answers to your travel questions.
                </p>
            </div>

            {placeContext && (
                <div className="ai-place-context">
                    💎 AI is currently helping you with <strong>{placeContext.name}</strong>
                    {placeContext.city ? ` • ${placeContext.city}` : ""}
                </div>
            )}

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
                            <div className="ai-message-content">
                                <div>{message.text}</div>
                                {message.role === "assistant" && (
                                    <button
                                        type="button"
                                        className="ai-listen-btn"
                                        onClick={() => listenToMessage(message.text, index)}
                                    >
                                        {speakingIndex === index ? "⏹ Stop" : "🔊 Listen"}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="ai-message">
                            <span>🤖</span>
                            <div className="typing">Thinking...</div>
                        </div>
                    )}
                </div>

                <div className="suggestions">
                    <button onClick={() => sendMessage("Plan a one day trip for the destination we are currently discussing. If no destination has been mentioned, ask me which destination I want to visit.")}>📍 Plan my 1 day trip</button>
                    <button onClick={() => sendMessage("Find hidden gems in the destination we are currently discussing. If no destination has been mentioned, ask me which destination.")}>💎 Find hidden gems</button>
                    <button onClick={() => sendMessage("Suggest some local food to try for the destination we are currently discussing. If no destination has been mentioned, ask me which destination.")}>🍴 Local food</button>
                    <button onClick={() => sendMessage("What is the best time to visit the destination we are currently discussing? If no destination has been mentioned, ask me which destination.")}>🕐 Best time to visit</button>
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
