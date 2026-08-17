import { useEffect, useState } from "react";

import {
    collection,
    getDocs,
    query,
    where,
} from "firebase/firestore";

import { db } from "../firebase";

import "./Guides.css";


function Guides() {

    const [guides, setGuides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedGuide, setSelectedGuide] =
        useState(null);


    /* =====================================================
       LOAD VERIFIED GUIDES
    ===================================================== */

    useEffect(() => {

        const loadGuides = async () => {

            try {

                setLoading(true);
                setError("");

                const guidesQuery =
                    query(
                        collection(
                            db,
                            "guideApplications"
                        ),
                        where(
                            "status",
                            "==",
                            "approved"
                        )
                    );


                const snapshot =
                    await getDocs(
                        guidesQuery
                    );


                const guideData =
                    snapshot.docs.map(
                        (guideDoc) => ({

                            id:
                                guideDoc.id,

                            ...guideDoc.data(),

                        })
                    );


                setGuides(guideData);


            } catch (err) {

                console.error(
                    "Error loading guides:",
                    err
                );

                setError(
                    "Unable to load local guides."
                );

            } finally {

                setLoading(false);
            }
        };


        loadGuides();

    }, []);


    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {

        return (

            <main className="guides-page">

                <div className="guides-container">

                    <div className="guides-loading">

                        Loading local guides... ⏳

                    </div>

                </div>

            </main>
        );
    }


    /* =====================================================
       ERROR
    ===================================================== */

    if (error) {

        return (

            <main className="guides-page">

                <div className="guides-container">

                    <div className="guides-error">

                        ⚠️ {error}

                    </div>

                </div>

            </main>
        );
    }


    /* =====================================================
       PAGE
    ===================================================== */

    return (

        <main className="guides-page">

            <div className="guides-container">


                {/* =================================================
                   HEADER
                ================================================= */}

                <section className="guides-header">

                    <span className="guides-label">
                        DISCOVER WITH A LOCAL
                    </span>

                    <h1>
                        Local Guides
                    </h1>

                    <p>
                        Meet verified local guides who know
                        their destinations beyond the usual
                        tourist spots.
                    </p>

                </section>


                {/* =================================================
                   NO GUIDES
                ================================================= */}

                {guides.length === 0 ? (

                    <section className="guides-empty">

                        <div className="empty-icon">
                            🧭
                        </div>

                        <h2>
                            No local guides yet
                        </h2>

                        <p>
                            Verified local guides will appear
                            here after their applications are
                            approved by the admin.
                        </p>

                    </section>

                ) : (


                    /* =================================================
                       GUIDE GRID
                    ================================================= */

                    <section className="guides-grid">

                        {guides.map((guide) => (

                            <article
                                className="guide-profile-card"
                                key={guide.id}
                            >


                                {/* PHOTO */}

                                <div className="guide-card-image">

                                    {guide.photoURL ? (

                                        <img
                                            src={guide.photoURL}
                                            alt={
                                                guide.name ||
                                                "Local guide"
                                            }
                                            onError={(event) => {

                                                event.currentTarget.style.display =
                                                    "none";

                                                event.currentTarget.parentElement
                                                    .classList.add(
                                                        "image-failed"
                                                    );

                                            }}
                                        />

                                    ) : (

                                        <div className="guide-no-photo">
                                            👤
                                        </div>

                                    )}

                                    <span className="verified-badge">
                                        ✓ Verified
                                    </span>

                                </div>


                                {/* CONTENT */}

                                <div className="guide-card-content">


                                    <h2>
                                        {guide.name ||
                                            "Local Guide"}
                                    </h2>


                                    {/* LOCATION */}

                                    <p className="guide-location">

                                        📍{" "}

                                        {guide.city ||
                                            "Location not specified"}

                                        {guide.state
                                            ? `, ${guide.state}`
                                            : ""}

                                    </p>


                                    {/* EXPERTISE */}

                                    {guide.expertise && (

                                        <div className="guide-info-row">

                                            <span className="info-label">
                                                ⭐ Expertise
                                            </span>

                                            <p>
                                                {guide.expertise}
                                            </p>

                                        </div>

                                    )}


                                    {/* LANGUAGES */}

                                    {guide.languages && (

                                        <div className="guide-info-row">

                                            <span className="info-label">
                                                🗣️ Languages
                                            </span>

                                            <p>
                                                {guide.languages}
                                            </p>

                                        </div>

                                    )}


                                    {/* EXPERIENCE */}

                                    {guide.experience && (

                                        <div className="guide-info-row">

                                            <span className="info-label">
                                                🧭 Experience
                                            </span>

                                            <p>
                                                {guide.experience}
                                            </p>

                                        </div>

                                    )}


                                    {/* BIO */}

                                    {guide.bio && (

                                        <p className="guide-short-bio">

                                            {guide.bio.length > 140

                                                ? `${guide.bio.substring(
                                                    0,
                                                    140
                                                )}...`

                                                : guide.bio}

                                        </p>

                                    )}


                                    {/* DETAILS */}

                                    <button
                                        className="guide-details-btn"
                                        onClick={() =>
                                            setSelectedGuide(
                                                guide
                                            )
                                        }
                                    >

                                        View Full Details →

                                    </button>

                                </div>

                            </article>

                        ))}

                    </section>
                )}

            </div>


            {/* =====================================================
               DETAILS MODAL
            ===================================================== */}

            {selectedGuide && (

                <div
                    className="guide-details-overlay"
                    onClick={() =>
                        setSelectedGuide(null)
                    }
                >

                    <div
                        className="guide-details-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >


                        {/* CLOSE */}

                        <button
                            className="guide-details-close"
                            onClick={() =>
                                setSelectedGuide(null)
                            }
                        >
                            ✕
                        </button>


                        {/* PHOTO */}

                        <div className="details-photo">

                            {selectedGuide.photoURL ? (

                                <img
                                    src={
                                        selectedGuide.photoURL
                                    }
                                    alt={
                                        selectedGuide.name ||
                                        "Local guide"
                                    }
                                />

                            ) : (

                                <div className="details-no-photo">
                                    👤
                                </div>

                            )}

                        </div>


                        {/* NAME */}

                        <span className="details-verified">
                            ✓ VERIFIED LOCAL GUIDE
                        </span>


                        <h2>
                            {selectedGuide.name ||
                                "Local Guide"}
                        </h2>


                        {/* LOCATION */}

                        <p className="details-location">

                            📍{" "}

                            {selectedGuide.city ||
                                "Location not specified"}

                            {selectedGuide.state
                                ? `, ${selectedGuide.state}`
                                : ""}

                        </p>


                        {/* =================================================
                           DETAILS
                        ================================================= */}

                        <div className="details-section">

                            <h3>
                                🗣️ Languages
                            </h3>

                            <p>
                                {selectedGuide.languages ||
                                    "Not specified"}
                            </p>

                        </div>


                        <div className="details-section">

                            <h3>
                                ⭐ Areas of Expertise
                            </h3>

                            <p>
                                {selectedGuide.expertise ||
                                    "Not specified"}
                            </p>

                        </div>


                        <div className="details-section">

                            <h3>
                                🧭 Guiding Experience
                            </h3>

                            <p>
                                {selectedGuide.experience ||
                                    "Not specified"}
                            </p>

                        </div>


                        <div className="details-section">

                            <h3>
                                👤 About the Guide
                            </h3>

                            <p>
                                {selectedGuide.bio ||
                                    "No biography provided."}
                            </p>

                        </div>


                        <div className="details-section">

                            <h3>
                                💡 Why They Want to Guide
                            </h3>

                            <p>
                                {selectedGuide.reason ||
                                    "No information provided."}
                            </p>

                        </div>


                        {/* EMAIL */}

                        {selectedGuide.email && (

                            <div className="guide-contact">

                                <span>
                                    📧
                                </span>

                                <div>

                                    <strong>
                                        Contact
                                    </strong>

                                    <p>
                                        {selectedGuide.email}
                                    </p>

                                </div>

                            </div>

                        )}

                    </div>

                </div>

            )}

        </main>
    );
}


export default Guides;