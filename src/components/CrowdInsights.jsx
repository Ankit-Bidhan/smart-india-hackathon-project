import places from "../data/places";

function CrowdInsights() {
    return (
        <section className="crowd-section" id="crowd">

            <div className="crowd-header">

                <div>
                    <p className="section-label">
                        SMART TRAVEL INSIGHTS
                    </p>

                    <h2>
                        Know the crowd before you go.
                    </h2>

                    <p className="crowd-intro">
                        Check the current crowd level at popular
                        destinations and choose the best time to visit.
                    </p>
                </div>

                <div className="live-indicator">
                    <span></span>
                    Live insights
                </div>

            </div>


            <div className="crowd-layout">

                {/* Crowd cards */}

                <div className="crowd-list">

                    {places.map((place) => (

                        <div className="crowd-card" key={place.id}>

                            <div className="crowd-place">

                                <div className="crowd-icon">
                                    📍
                                </div>

                                <div>
                                    <h3>{place.name}</h3>
                                    <p>{place.location}</p>
                                </div>

                            </div>


                            <div className="crowd-status">

                                <span
                                    className={`status-dot ${place.crowd.toLowerCase()}`}
                                ></span>

                                <span>
                                    {place.crowd}
                                </span>

                            </div>

                        </div>

                    ))}

                </div>


                {/* Recommendation */}

                <div className="crowd-recommendation">

                    <div className="recommendation-icon">
                        💡
                    </div>

                    <p className="recommendation-label">
                        SMART RECOMMENDATION
                    </p>

                    <h3>
                        Avoid the rush.
                    </h3>

                    <p>
                        This destination is currently getting busy.
                        Consider exploring a nearby hidden gem for
                        a more peaceful experience.
                    </p>

                    <button>
                        Find a quieter place →
                    </button>

                </div>

            </div>

        </section>
    );
}

export default CrowdInsights;