import { Link, useParams } from "react-router-dom";
import places from "../data/places";

function PlaceDetails() {

    const { id } = useParams();

    const place = places.find(
        (item) => item.id === Number(id)
    );


    // Invalid place

    if (!place) {
        return (
            <section className="not-found">

                <h1>
                    Place not found
                </h1>

                <p>
                    We couldn't find this destination.
                </p>

                <Link to="/explore">
                    ← Back to Explore
                </Link>

            </section>
        );
    }


    return (
        <section className="place-details">

            {/* Back */}

            <Link
                to="/explore"
                className="back-link"
            >
                ← Back to Explore
            </Link>


            {/* Hero */}

            <div className="details-hero">

                <img
                    src={place.image}
                    alt={place.name}
                />

                <div className="details-overlay">

                    <span>
                        📍 {place.location}
                    </span>

                    <h1>
                        {place.name}
                    </h1>

                </div>

            </div>


            {/* Content */}

            <div className="details-content">

                <div className="details-main">

                    <p className="section-label">
                        ABOUT THE DESTINATION
                    </p>

                    <h2>
                        Explore {place.name}
                    </h2>

                    <p className="details-description">
                        {place.description}
                    </p>

                    <p className="details-description">
                        Discover the culture, surroundings and
                        experiences this destination has to offer.
                        TravelEase can also help you find nearby
                        attractions and less crowded alternatives.
                    </p>

                </div>


                {/* Info Card */}

                <aside className="details-card">

                    <div className="detail-item">
                        <span>⭐ Rating</span>
                        <strong>{place.rating}</strong>
                    </div>

                    <div className="detail-item">
                        <span>👥 Crowd level</span>
                        <strong>{place.crowd}</strong>
                    </div>

                    <div className="detail-item">
                        <span>📍 Location</span>
                        <strong>{place.location}</strong>
                    </div>

                    <button className="ai-place-btn">
                        🤖 Ask AI about this place
                    </button>

                </aside>

            </div>


            {/* Future features */}

            <div className="coming-features">

                <h2>
                    Plan your visit smarter
                </h2>

                <div className="feature-row">

                    <div>
                        🗺️
                        <h3>Map</h3>
                        <p>Explore the exact location.</p>
                    </div>

                    <div>
                        👥
                        <h3>Crowd insights</h3>
                        <p>Know when it may be less crowded.</p>
                    </div>

                    <div>
                        💎
                        <h3>Nearby hidden gems</h3>
                        <p>Discover lesser-known places nearby.</p>
                    </div>

                </div>

            </div>

        </section>
    );
}

export default PlaceDetails;