import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";

import places from "../data/places";
import { db } from "../firebase";

function HiddenGems() {
    const navigate = useNavigate();
    const [communityGems, setCommunityGems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGem, setSelectedGem] = useState(null);

    useEffect(() => {
        const loadApprovedGems = async () => {
            try {
                const gemsQuery = query(
                    collection(db, "hiddenGems"),
                    where("status", "==", "approved")
                );

                const snapshot = await getDocs(gemsQuery);

                const gems = snapshot.docs.map((item) => ({
                    id: item.id,
                    ...item.data(),
                }));

                setCommunityGems(gems);
            } catch (error) {
                console.error(
                    "Unable to load hidden gems:",
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        loadApprovedGems();
    }, []);

    const staticGems = places.map((place) => ({
        id: `static-${place.id}`,
        name: place.name,
        location: place.location,
        image: place.image,
        description: place.description,
        community: false,
    }));

    const approvedCommunityGems = communityGems.map((gem) => ({
        id: gem.id,
        name: gem.name,
        location: `${gem.city}, ${gem.state}`,
        image: gem.image || null,
        description: gem.description,
        community: true,
        latitude: gem.location?.latitude,
        longitude: gem.location?.longitude,
    }));

    const allGems = [
        ...staticGems,
        ...approvedCommunityGems,
    ];

    return (
        <>
        <section
            className="hidden-gems-section"
            id="hidden-gems"
        >
            <div className="hidden-gems-header">

                <div>
                    <p className="section-label">
                        OFF THE BEATEN PATH
                    </p>

                    <h2>
                        Discover hidden gems
                    </h2>

                    <p className="hidden-gems-intro">
                        Skip the usual tourist spots. Discover
                        peaceful, lesser-known places that are
                        worth the journey.
                    </p>
                </div>

                <button
                    className="view-all-btn"
                    onClick={() =>
                        navigate("/hidden-gems")
                    }
                >
                    Explore hidden gems →
                </button>

            </div>

            {loading ? (
                <p>
                    Discovering hidden gems... ⏳
                </p>
            ) : (
                <div className="hidden-gems-grid">

                    {allGems.map((place) => (

                        <article
                            className="gem-card"
                            key={place.id}
                        >

                            <div className="gem-image">

                                {place.image ? (
                                    <img
                                        src={place.image}
                                        alt={place.name}
                                    />
                                ) : (
                                    <div className="gem-no-image">
                                        💎
                                    </div>
                                )}

                                <span className="gem-badge">
                                    💎 Hidden Gem
                                </span>

                            </div>

                            <div className="gem-content">

                                <span className="gem-location">
                                    📍 {place.location}
                                </span>

                                <h3>
                                    {place.name}
                                </h3>

                                <p>
                                    {place.description ||
                                        "A lesser-known destination waiting to be discovered."}
                                </p>

                                {place.community && (
                                    <span className="community-gem-label">
                                        🤝 Community Discovery
                                    </span>
                                )}

                                <button
                                    className="gem-button"
                                    onClick={() => setSelectedGem(place)}
                                >
                                    Discover →
                                </button>

                            </div>

                        </article>

                    ))}

                </div>
            )}
        </section>
       
        {selectedGem && (
            <div
                className="gem-detail-overlay"
                onClick={() => setSelectedGem(null)}
            >
                <div
                    className="gem-detail-modal"
                    onClick={(event) => event.stopPropagation()}
                >
                    <button
                        className="gem-detail-close"
                        onClick={() => setSelectedGem(null)}
                    >
                        ✕
                    </button>

                    {selectedGem.image ? (
                        <img
                            src={selectedGem.image}
                            alt={selectedGem.name}
                            className="gem-detail-image"
                        />
                    ) : (
                        <div className="gem-no-image">
                            💎
                        </div>
                    )}

                    <div className="gem-detail-content">

                        <span className="gem-location">
                            📍 {selectedGem.location}
                        </span>

                        <h2>{selectedGem.name}</h2>

                        <p>
                            {selectedGem.description ||
                                "A lesser-known destination waiting to be discovered."}
                        </p>

                        {selectedGem.category && (
                            <p>
                                <strong>✨ Category:</strong>{" "}
                                {selectedGem.category}
                            </p>
                        )}

                        {selectedGem.bestTime && (
                            <p>
                                <strong>🕐 Best time:</strong>{" "}
                                {selectedGem.bestTime}
                            </p>
                        )}

                        {selectedGem.latitude &&
                            selectedGem.longitude && (
                                <button
                                    className="gem-button"
                                    onClick={() =>
                                        window.open(
                                            `https://www.google.com/maps?q=${selectedGem.latitude},${selectedGem.longitude}`,
                                            "_blank"
                                        )
                                    }
                                >
                                    📍 View on Map
                                </button>
                            )}

                    </div>
                </div>
            </div>
        )} 
        </>
    );
}

export default HiddenGems;