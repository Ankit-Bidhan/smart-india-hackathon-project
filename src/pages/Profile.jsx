import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { onAuthStateChanged } from "firebase/auth";
import {
    collection,
    doc,
    getDoc,
    addDoc,
    query,
    where,
    getDocs,
    serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase";


function Profile() {

    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [application, setApplication] = useState(null);
    const [contributions, setContributions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showApplication, setShowApplication] =
        useState(false);
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] =
        useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // =========================
    // LOAD USER
    // =========================

    useEffect(() => {

        const unsubscribe = onAuthStateChanged(
            auth,
            async (currentUser) => {

                if (!currentUser) {

                    navigate("/login");

                    return;
                }

                setUser(currentUser);

                try {

                    // Get profile from Firestore

                    const profileRef = doc(
                        db,
                        "users",
                        currentUser.uid
                    );
                    const profileSnap =
                        await getDoc(profileRef);

                    if (profileSnap.exists()) {
                        setProfile(
                            profileSnap.data()
                        );
                    }
 
                    // Load user's hidden gem contributions
                    try {
                        const contributionsQuery = query(
                            collection(db, "hiddenGems"),
                            where("submittedBy", "==", currentUser.uid)
                        );
                        const contributionsSnap =
                            await getDocs(contributionsQuery);
                        const contributionList =
                            contributionsSnap.docs.map((item) => ({
                                id: item.id,
                                ...item.data(),
                            }));
                        setContributions(contributionList);
                    } catch (contributionError) {
                        console.error(
                            "Hidden gem contributions loading error:",
                            contributionError
                        );
                        // Do not break the complete profile
                        setContributions([]);

                    }

                    // Check existing guide application

                    const applicationsRef =
                        collection(
                            db,
                            "guideApplications"
                        );

                    const applicationQuery =
                        query(
                            applicationsRef,
                            where(
                                "uid",
                                "==",
                                currentUser.uid
                            )
                        );

                    const applicationSnap =
                        await getDocs(
                            applicationQuery
                        );


                    if (!applicationSnap.empty) {

                        const applicationData =
                            applicationSnap.docs[0].data();

                        setApplication(
                            applicationData
                        );

                    }

                } catch (err) {

                    console.error(
                        "Profile loading error:",
                        err
                    );

                    setError(
                        "Unable to load your profile."
                    );

                } finally {

                    setLoading(false);

                }

            }
        );


        return () => unsubscribe();

    }, [navigate]);


    // =========================
    // APPLY FOR LOCAL GUIDE
    // =========================

    const handleApplication = async (event) => {

        event.preventDefault();

        setError("");
        setSuccess("");


        if (!reason.trim()) {

            setError(
                "Please tell us why you want to become a local guide."
            );

            return;
        }


        setSubmitting(true);


        try {

            const applicationData = {

                uid: user.uid,

                name:
                    profile?.name ||
                    user.displayName ||
                    "TravelEase User",

                email:
                    user.email || "",

                reason:
                    reason.trim(),

                status:
                    "pending",

                createdAt:
                    serverTimestamp(),

            };


            await addDoc(
                collection(
                    db,
                    "guideApplications"
                ),
                applicationData
            );


            setApplication({
                ...applicationData,
                createdAt: new Date(),
            });


            setShowApplication(false);

            setReason("");

            setSuccess(
                "Your application has been submitted successfully! 🎉"
            );

        } catch (err) {

            console.error(
                "Guide application error:",
                err
            );

            setError(
                "Unable to submit your application. Please try again."
            );

        } finally {

            setSubmitting(false);

        }

    };


    // =========================
    // LOADING
    // =========================

    if (loading) {

        return (
            <main className="profile-page">

                <div className="profile-loading">
                    Loading your profile... ⏳
                </div>

            </main>
        );
    }


    // =========================
    // PROFILE
    // =========================

    return (

        <main className="profile-page">

            <div className="profile-container">


                {/* PAGE HEADER */}

                <div className="profile-heading">

                    <p className="section-label">
                        YOUR ACCOUNT
                    </p>

                    <h1>
                        My Profile
                    </h1>

                    <p>
                        Manage your TravelEase account
                        and contributor status.
                    </p>

                </div>


                {/* ALERTS */}

                {error && (

                    <div className="profile-alert error">
                        ⚠️ {error}
                    </div>

                )}


                {success && (

                    <div className="profile-alert success">
                        {success}
                    </div>

                )}


                {/* PROFILE CARD */}

                <section className="profile-card">


                    {/* USER INFO */}

                    <div className="profile-user">

                        <div className="profile-avatar">

                            {user?.photoURL ? (

                                <img
                                    src={user.photoURL}
                                    alt="Profile"
                                />

                            ) : (

                                <span>
                                    👤
                                </span>

                            )}

                        </div>


                        <div className="profile-user-info">

                            <h2>
                                {profile?.name ||
                                    user?.displayName ||
                                    "TravelEase User"}
                            </h2>

                            <p>
                                {user?.email}
                            </p>

                            <span className="profile-role">

                                {profile?.role ===
                                    "admin"

                                    ? "🛡️ Administrator"

                                    : profile?.role ===
                                        "localGuide"

                                        ? "✓ Verified Local Guide"

                                        : "🧭 Traveller"}

                            </span>

                        </div>

                    </div>


                    {/* ACCOUNT DETAILS */}

                    <div className="profile-details">

                        <div className="profile-detail">

                            <span>
                                Account
                            </span>

                            <strong>
                                {profile?.role ===
                                    "admin"
                                    ? "Administrator"
                                    : profile?.role ===
                                        "localGuide"
                                        ? "Verified Local Guide"
                                        : "Traveller"}
                            </strong>

                        </div>


                        <div className="profile-detail">

                            <span>
                                Email
                            </span>

                            <strong>
                                {user?.email}
                            </strong>

                        </div>

                    </div>

                </section>


                {/* LOCAL GUIDE SECTION */}

                {profile?.role !== "admin" &&
                    profile?.role !== "localGuide" && (

                        <section className="guide-card">

                            <div className="guide-icon">
                                💎
                            </div>

                            <div className="guide-content">

                                <span className="guide-label">
                                    SHARE YOUR LOCAL KNOWLEDGE
                                </span>

                                <h2>
                                    Become a Verified Local Guide
                                </h2>

                                <p>
                                    Know hidden gems, local
                                    culture, unique food spots
                                    or lesser-known places?
                                    Help travellers discover
                                    them on TravelEase.
                                </p>


                                {/* PENDING */}

                                {application?.status ===
                                    "pending" ? (

                                    <div className="application-status pending">

                                        <span>
                                            ⏳
                                        </span>

                                        <div>

                                            <strong>
                                                Application under review
                                            </strong>

                                            <p>
                                                Our admin team will
                                                review your application.
                                            </p>

                                        </div>

                                    </div>

                                ) : application?.status ===
                                    "rejected" ? (

                                    <>

                                        <div className="application-status rejected">

                                            <span>
                                                ❌
                                            </span>

                                            <div>

                                                <strong>
                                                    Application not approved
                                                </strong>

                                                <p>
                                                    You can submit a new
                                                    application with more
                                                    information.
                                                </p>

                                            </div>

                                        </div>


                                        <button
                                            className="guide-apply-btn"
                                            onClick={() =>
                                                setShowApplication(true)
                                            }
                                        >
                                            Apply Again
                                        </button>

                                    </>
                                ) : (
                                    <button
                                        className="guide-apply-btn"
                                        onClick={() =>
                                            setShowApplication(true)
                                        }
                                    >
                                       Become a Local Guide →
                                    </button>
                                )}
                            </div>
                        </section>
                    )}

                {/* VERIFIED GUIDE */}
                {profile?.role ===
                    "localGuide" && (
                        <section className="verified-guide-card">
                            <div className="verified-icon">
                                ✓
                            </div>
                            <div>
                                <span className="guide-label">
                                    VERIFIED CONTRIBUTOR
                                </span>
                                <h2>
                                    You're a Verified Local Guide!
                                </h2>
                                <p>
                                    You can now contribute local
                                    knowledge and suggest hidden
                                    gems for TravelEase.
                                </p>

                                <button
                                    className="guide-apply-btn"
                                    onClick={() =>
                                        navigate(
                                            "/add-hidden-gem"
                                        )
                                    }
                                >
                                    💎 Add a Hidden Gem →
                                </button>
                            </div>
                        </section>
                    )}
                
                {/* =========================
                    MY CONTRIBUTIONS
                    ========================= */}

                {profile?.role === "localGuide" &&(
                    <section className="contributions-section" >
                        <div className="contributions-header">
                            <div>
                                <p className="section-label">
                                    COMMUNITY CONTRIBUTIONS
                                </p>
                                <h2>
                                       My Hidden Gems 💎
                                </h2>
                                <p>
                                    Track the places you have submitted
                                    and their review status.
                                </p>
                            </div>
                             <span className="contribution-count">
                                {contributions.length}
                             </span>
                        </div>
                        {contributions.length === 0 ? (
                            <div className="no-contributions">
                                <div>💎</div>
                                <h3>
                                    No hidden gems yet
                                </h3>
                                <p>
                                    Share a special local place with travellers.
                                </p>
                                <button
                                    className="guide-apply-btn"
                                    onClick={() =>
                                        navigate("/add-hidden-gem")
                                    }
                                >
                                    Add a Hidden Gem →
                                </button>
                            </div>
                        ) : (
                            <div className="contributions-list">
                                {contributions.map((gem) => (
                                    <article
                                        className="contribution-card"
                                        key={gem.id}
                                    >
                                        {/* IMAGE */}
                                        <div className="contribution-image">
                                            {gem.image ? (
                                                <img
                                                    src={gem.image}
                                                    alt={gem.name}
                                                />
                                            ) : (
                                                <div className="contribution-no-image">
                                                    💎
                                                </div>
                                            )}
                                        </div>

                                        {/* CONTENT */}
                                        <div className="contribution-content">
                                            <span className="gem-location">
                                                📍 {gem.city}, {gem.state}
                                            </span>
                                            <h3>
                                                {gem.name}
                                            </h3>
                                            <p>
                                                {gem.description}
                                            </p>

                                            {/* STATUS */}
                                            {gem.status === "pending" && (
                                                <div className="contribution-status pending">
                                                    ⏳ Pending Review
                                                </div>
                                            )}
                                            {gem.status === "approved" && (
                                                <div className="contribution-status approved">
                                                    ✅ Approved — Live on TravelEase
                                                </div>
                                            )}
                                            {gem.status === "rejected" && (
                                                <div className="contribution-status rejected">
                                                    ❌ Not Approved
                                                </div>
                                            )}
                                        </div>
                                    </article>
                                ))}
                        </div> )}
                        </section>
                    )}

                {profile?.role === "admin" && (
                    <section className="verified-guide-card">
                        <div className="verified-icon">
                            🛡️
                        </div>
                        <div>
                            <span className="guide-label">
                                ADMINISTRATOR
                            </span>
                            <h2>
                                TravelEase Admin
                            </h2>
                            <p>
                                Manage verified contributors and
                                review community submissions.
                            </p>
                            <button
                                className="guide-apply-btn"
                                onClick={() =>
                                    navigate("/admin")
                                }
                            >
                                🛡️ Open Admin Dashboard →
                            </button>
                        </div>
                    </section>
                )}


            </div>


            {/* APPLICATION MODAL */}

            {showApplication && (

                <div
                    className="guide-modal-overlay"
                    onClick={() =>
                        setShowApplication(false)
                    }
                >

                    <div
                        className="guide-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <button
                            className="modal-close"
                            onClick={() =>
                                setShowApplication(false)
                            }
                        >
                            ✕
                        </button>


                        <div className="modal-icon">
                            💎
                        </div>

                        <h2>
                            Become a Verified Local Guide
                        </h2>

                        <p>
                            Tell us a little about your
                            local knowledge and why you
                            would like to contribute.
                        </p>


                        <form
                            onSubmit={handleApplication}
                        >

                            <label>
                                Why should you become a
                                local guide?
                            </label>

                            <textarea
                                value={reason}
                                onChange={(event) =>
                                    setReason(
                                        event.target.value
                                    )
                                }
                                placeholder="For example: I know several lesser-known historical places and local food spots in my area..."
                                rows="6"
                                maxLength="600"
                                disabled={submitting}
                            />

                            <div className="character-count">
                                {reason.length}/600
                            </div>


                            <button
                                type="submit"
                                className="guide-submit-btn"
                                disabled={submitting}
                            >

                                {submitting
                                    ? "Submitting..."
                                    : "Submit Application"}

                            </button>

                        </form>

                    </div>

                </div>

            )}

        </main>
    );
}


export default Profile;