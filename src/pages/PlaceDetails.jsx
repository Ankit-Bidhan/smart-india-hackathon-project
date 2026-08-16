import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

function PlaceDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [place, setPlace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadPlace = async () => {
            try {
                setLoading(true);
                setError("");

                if (!id) {
                    setError("Destination was not specified.");
                    return;
                }

                const snapshot = await getDoc(doc(db, "destinations", id));

                if (!snapshot.exists()) {
                    setError("We couldn't find this destination.");
                    return;
                }

                const data = snapshot.data();

                if (data.isActive === false || data.status === "pending") {
                    setError("This destination is currently unavailable.");
                    return;
                }

                setPlace({
                    id: snapshot.id,
                    ...data,
                });
            } catch (err) {
                console.error("Place details error:", err);
                setError("Unable to load this destination right now.");
            } finally {
                setLoading(false);
            }
        };

        loadPlace();
    }, [id]);

    if (loading) {
        return (
            <section className="not-found">
                <h1>Loading destination...</h1>
                <p>TravelEase is fetching the destination details.</p>
            </section>
        );
    }

    if (error || !place) {
        return (
            <section className="not-found">
                <h1>Place not found</h1>
                <p>{error || "We couldn't find this destination."}</p>
                <Link to="/explore">← Back to Explore</Link>
            </section>
        );
    }

    const image = place.image || place.imageUrl || place.images?.[0] || "";
    const location = place.location || [place.city, place.state].filter(Boolean).join(", ");
    const description = place.description || place.shortDescription || "Discover this destination with TravelEase.";
    const aiUrl = `/ai-guide?place=${encodeURIComponent(place.name || "")}&city=${encodeURIComponent(place.city || location || "")}&category=${encodeURIComponent(place.destinationType || place.category || "")}&description=${encodeURIComponent(description)}`;

    return (
        <section className="place-details">
            <Link to="/explore" className="back-link">
                ← Back to Explore
            </Link>

            <div className="details-hero">
                {image ? (
                    <img src={image} alt={place.name} />
                ) : (
                    <div className="place-no-image">🏛️</div>
                )}

                <div className="details-overlay">
                    <span>📍 {location || "India"}</span>
                    <h1>{place.name}</h1>
                </div>
            </div>

            <div className="details-content">
                <div className="details-main">
                    <p className="section-label">ABOUT THE DESTINATION</p>
                    <h2>Explore {place.name}</h2>
                    <p className="details-description">{description}</p>

                    {place.detailedDescription && (
                        <p className="details-description">
                            {place.detailedDescription}
                        </p>
                    )}

                    {place.famousFor && (
                        <>
                            <h3>Famous for</h3>
                            <p className="details-description">{place.famousFor}</p>
                        </>
                    )}

                    {place.topAttractions?.length > 0 && (
                        <>
                            <h3>Top attractions</h3>
                            <ul>
                                {place.topAttractions.map((attraction, index) => (
                                    <li key={`${attraction}-${index}`}>{attraction}</li>
                                ))}
                            </ul>
                        </>
                    )}

                    {place.famousFood?.length > 0 && (
                        <>
                            <h3>Local food</h3>
                            <ul>
                                {place.famousFood.map((food, index) => (
                                    <li key={`${food}-${index}`}>{food}</li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>

                <aside className="details-card">
                    {place.rating !== undefined && (
                        <div className="detail-item">
                            <span>⭐ Rating</span>
                            <strong>{place.rating}</strong>
                        </div>
                    )}

                    {place.crowd && (
                        <div className="detail-item">
                            <span>👥 Crowd level</span>
                            <strong>{place.crowd}</strong>
                        </div>
                    )}

                    <div className="detail-item">
                        <span>📍 Location</span>
                        <strong>{location || "India"}</strong>
                    </div>

                    {place.bestTimeToVisit && (
                        <div className="detail-item">
                            <span>🌤️ Best time</span>
                            <strong>{place.bestTimeToVisit}</strong>
                        </div>
                    )}

                    {place.recommendedDuration && (
                        <div className="detail-item">
                            <span>🗓️ Ideal duration</span>
                            <strong>{place.recommendedDuration}</strong>
                        </div>
                    )}

                    {place.destinationType && (
                        <div className="detail-item">
                            <span>🏷️ Type</span>
                            <strong>{Array.isArray(place.destinationType) ? place.destinationType.join(", ") : place.destinationType}</strong>
                        </div>
                    )}

                    <button
                        className="ai-place-btn"
                        onClick={() => navigate(aiUrl)}
                    >
                        🤖 Ask AI about this place
                    </button>
                </aside>
            </div>

            <div className="coming-features">
                <h2>Plan your visit smarter</h2>

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
