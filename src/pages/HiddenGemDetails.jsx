import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../firebase";

function HiddenGemDetails() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [gem, setGem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {

        const loadGem = async () => {

            try {

                // Static places are not stored in Firestore
                if (id.startsWith("static-")) {
                    setError(
                        "This hidden gem is part of the original TravelEase destinations."
                    );
                    return;
                }

                const gemRef = doc(
                    db,
                    "hiddenGems",
                    id
                );

                const gemSnap = await getDoc(gemRef);

                if (!gemSnap.exists()) {
                    setError("Hidden gem not found.");
                    return;
                }

                const data = gemSnap.data();

                if (data.status !== "approved") {
                    setError(
                        "This hidden gem is not available."
                    );
                    return;
                }

                setGem({
                    id: gemSnap.id,
                    ...data,
                });

            } catch (err) {

                console.error(
                    "Hidden gem details error:",
                    err
                );

                setError(
                    "Unable to load this hidden gem."
                );

            } finally {

                setLoading(false);

            }
        };

        loadGem();

    }, [id]);


    if (loading) {
        return (
            <main className="gem-details-page">
                <div className="gem-details-loading">
                    Loading hidden gem... ⏳
                </div>
            </main>
        );
    }


    if (error || !gem) {
        return (
            <main className="gem-details-page">

                <div className="gem-details-error">

                    <div className="gem-details-icon">
                        💎
                    </div>

                    <h1>
                        Hidden Gem
                    </h1>

                    <p>
                        {error}
                    </p>

                    <button
                        className="gem-details-back-btn"
                        onClick={() =>
                            navigate("/hidden-gems")
                        }
                    >
                        ← Back to Hidden Gems
                    </button>

                </div>

            </main>
        );
    }


    const images =
        gem.images?.length > 0
            ? gem.images
            : gem.image
                ? [gem.image]
                : [];


    return (

        <main className="gem-details-page">

            <div className="gem-details-container">

                <button
                    className="gem-details-back"
                    onClick={() =>
                        navigate(-1)
                    }
                >
                    ← Back
                </button>


                {/* HERO IMAGE */}

                <section className="gem-details-hero">

                    {images.length > 0 ? (

                        <img
                            src={images[0]}
                            alt={gem.name}
                        />

                    ) : (

                        <div className="gem-details-no-image">
                            💎
                        </div>

                    )}

                    <div className="gem-details-hero-overlay">

                        <span>
                            💎 Hidden Gem
                        </span>

                        <h1>
                            {gem.name}
                        </h1>

                        <p>
                            📍 {gem.city}, {gem.state}
                        </p>

                    </div>

                </section>


                {/* CONTENT */}

                <div className="gem-details-layout">

                    <section className="gem-details-main">

                        <span className="gem-details-category">
                            {gem.category}
                        </span>

                        <h2>
                            About this place
                        </h2>

                        <p className="gem-details-description">
                            {gem.description}
                        </p>


                        {gem.whySpecial && (
                            <>
                                <h2>
                                    ✨ Why is it special?
                                </h2>

                                <p className="gem-details-description">
                                    {gem.whySpecial}
                                </p>
                            </>
                        )}


                        {/* PHOTO GALLERY */}

                        {images.length > 1 && (

                            <section className="gem-details-gallery">

                                <h2>
                                    📸 Photos
                                </h2>

                                <div className="gem-details-photo-grid">

                                    {images.map(
                                        (image, index) => (

                                            <img
                                                key={index}
                                                src={image}
                                                alt={`${gem.name} ${index + 1}`}
                                            />

                                        )
                                    )}

                                </div>

                            </section>

                        )}

                    </section>


                    {/* SIDE CARD */}

                    <aside className="gem-details-card">

                        <div className="gem-detail-item">

                            <span>
                                📍 Location
                            </span>

                            <strong>
                                {gem.city}, {gem.state}
                            </strong>

                        </div>


                        <div className="gem-detail-item">

                            <span>
                                🏷️ Category
                            </span>

                            <strong>
                                {gem.category}
                            </strong>

                        </div>


                        {gem.bestTime && (

                            <div className="gem-detail-item">

                                <span>
                                    🕐 Best time
                                </span>

                                <strong>
                                    {gem.bestTime}
                                </strong>

                            </div>

                        )}


                        {gem.submittedByName && (

                            <div className="gem-detail-item">

                                <span>
                                    🤝 Submitted by
                                </span>

                                <strong>
                                    {gem.submittedByName}
                                </strong>

                            </div>

                        )}


                        {gem.mapUrl && (

                            <button
                                className="gem-view-map-btn"
                                onClick={() =>
                                    window.open(
                                        gem.mapUrl,
                                        "_blank",
                                        "noopener,noreferrer"
                                    )
                                }
                            >
                                📍 View on Map
                            </button>

                        )}

                    </aside>

                </div>

            </div>

        </main>
    );
}

export default HiddenGemDetails;