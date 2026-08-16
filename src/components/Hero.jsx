import adventureMap from "../assets/adventure-map.png";
function Hero() {
    return (
        <section className="hero" id="home">

            <div className="hero-content">

                <p className="eyebrow">
                    TRAVEL SMARTER • DISCOVER MORE
                </p>

                <h1>
                    Discover places
                    <br />
                    <span>worth exploring.</span>
                </h1>

                <p className="hero-text">
                    Find hidden gems, explore amazing destinations,
                    check crowd levels and get personalized travel
                    guidance with AI.
                </p>

                <div className="search-box">
                    <span>⌕</span>

                    <input
                        type="text"
                        placeholder="Where do you want to go?"
                    />

                    <button>
                        Explore
                    </button>
                </div>

                <div className="quick-info">
                    <span>📍 Hidden Gems</span>
                    <span>🤖 AI Travel Guide</span>
                    <span>👥 Crowd Insights</span>
                </div>

            </div>


            <div className="hero-visual">

                <div className="visual-card">

                    <div className="mountain">
                        <img src={adventureMap} alt="Adventure map" />
                    </div>

                    <div className="destination-info">
                        <p>Featured Destination</p>

                        <h3>
                            Explore India
                        </h3>

                        <span>
                            ✨ Discover something new
                        </span>
                    </div>

                </div>

            </div>

        </section>
    );
}

export default Hero;