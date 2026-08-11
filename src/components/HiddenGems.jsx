import places from "../data/places";

function HiddenGems() {
    return (
        <section className="hidden-gems-section" id="hidden-gems">

            <div className="hidden-gems-header">

                <div>
                    <p className="section-label">
                        OFF THE BEATEN PATH
                    </p>

                    <h2>
                        Discover hidden gems
                    </h2>

                    <p className="hidden-gems-intro">
                        Skip the usual tourist spots. Discover peaceful,
                        lesser-known places that are worth the journey.
                    </p>
                </div>

                <button className="view-all-btn">
                    Explore hidden gems →
                </button>

            </div>


            <div className="hidden-gems-grid">

                {places.map((place) => (
                    <article className="gem-card" key={place.id}>

                        <div className="gem-image">
                            <img
                                src={place.image}
                                alt={place.name}
                            />

                            <span className="gem-badge">
                                💎 Hidden Gem
                            </span>
                        </div>

                        <div className="gem-content">

                            <span className="gem-location">
                                📍 {place.location}
                            </span>

                            <h3>{place.name}</h3>

                            <p>
                                A lesser-known destination waiting
                                to be explored.
                            </p>

                            <button className="gem-button">
                                Discover →
                            </button>

                        </div>

                    </article>
                ))}

            </div>

        </section>
    );
}

export default HiddenGems;