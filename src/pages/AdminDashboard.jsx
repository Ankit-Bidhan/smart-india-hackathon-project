import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { onAuthStateChanged } from "firebase/auth";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    writeBatch,
} from "firebase/firestore";

import { auth, db } from "../firebase";


function AdminDashboard() {

    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);

    const [admin, setAdmin] = useState(null);

    const [applications, setApplications] = useState([]);

    const [hiddenGems, setHiddenGems] = useState([]);

    const [processingId, setProcessingId] = useState(null);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");


    // =========================
    // CHECK ADMIN + LOAD DATA
    // =========================

    useEffect(() => {

        const unsubscribe = onAuthStateChanged(
            auth,
            async (currentUser) => {

                if (!currentUser) {
                    navigate("/login");
                    return;
                }

                try {

                    // Get current user's Firestore profile

                    const userRef = doc(
                        db,
                        "users",
                        currentUser.uid
                    );

                    const userSnap =
                        await getDoc(userRef);


                    if (!userSnap.exists()) {

                        setError(
                            "Admin profile was not found."
                        );

                        setLoading(false);

                        return;
                    }


                    const userData =
                        userSnap.data();


                    // SECURITY CHECK

                    if (userData.role !== "admin") {

                        setError(
                            "You do not have permission to access the Admin Dashboard."
                        );

                        setLoading(false);

                        return;
                    }


                    setAdmin({
                        ...userData,
                        uid: currentUser.uid,
                    });


                    await loadAdminData();


                } catch (err) {

                    console.error(
                        "Admin dashboard error:",
                        err
                    );

                    setError(
                        "Unable to load admin dashboard."
                    );

                } finally {

                    setLoading(false);

                }

            }
        );


        return () => unsubscribe();

    }, [navigate]);


    // =========================
    // LOAD APPLICATIONS + GEMS
    // =========================

    const loadAdminData = async () => {

        const applicationsQuery = query(
            collection(
                db,
                "guideApplications"
            ),
            where(
                "status",
                "==",
                "pending"
            )
        );


        const gemsQuery = query(
            collection(
                db,
                "hiddenGems"
            ),
            where(
                "status",
                "==",
                "pending"
            )
        );


        const [
            applicationsSnap,
            gemsSnap
        ] = await Promise.all([

            getDocs(
                applicationsQuery
            ),

            getDocs(
                gemsQuery
            ),

        ]);


        const applicationList =
            applicationsSnap.docs.map(
                (item) => ({

                    id: item.id,

                    ...item.data(),

                })
            );


        const gemList =
            gemsSnap.docs.map(
                (item) => ({

                    id: item.id,

                    ...item.data(),

                })
            );


        setApplications(
            applicationList
        );

        setHiddenGems(
            gemList
        );

    };


    // =========================
    // APPROVE GUIDE
    // =========================

    const approveGuide = async (
        application
    ) => {

        setError("");
        setSuccess("");

        setProcessingId(
            application.id
        );


        try {

            const batch = writeBatch(db);


            // 1. Update application

            const applicationRef = doc(
                db,
                "guideApplications",
                application.id
            );


            batch.update(
                applicationRef,
                {
                    status: "approved",
                }
            );


            // 2. Update user's role

            const userRef = doc(
                db,
                "users",
                application.uid
            );


            batch.update(
                userRef,
                {
                    role: "localGuide",
                }
            );


            // Both changes happen together

            await batch.commit();


            // Remove from pending list

            setApplications(
                (previous) =>
                    previous.filter(
                        (item) =>
                            item.id !==
                            application.id
                    )
            );


            setSuccess(
                `${application.name} is now a Verified Local Guide. ✅`
            );


        } catch (err) {

            console.error(
                "Approve guide error:",
                err
            );

            setError(
                "Unable to approve this guide application."
            );

        } finally {

            setProcessingId(null);

        }

    };


    // =========================
    // REJECT GUIDE
    // =========================

    const rejectGuide = async (
        application
    ) => {

        setError("");
        setSuccess("");

        setProcessingId(
            application.id
        );


        try {

            const applicationRef = doc(
                db,
                "guideApplications",
                application.id
            );


            const batch = writeBatch(db);


            batch.update(
                applicationRef,
                {
                    status: "rejected",
                }
            );


            await batch.commit();


            setApplications(
                (previous) =>
                    previous.filter(
                        (item) =>
                            item.id !==
                            application.id
                    )
            );


            setSuccess(
                `${application.name}'s application was rejected.`
            );


        } catch (err) {

            console.error(
                "Reject guide error:",
                err
            );

            setError(
                "Unable to reject this application."
            );

        } finally {

            setProcessingId(null);

        }

    };


    // =========================
    // APPROVE HIDDEN GEM
    // =========================

    const approveGem = async (gem) => {

        setError("");
        setSuccess("");

        setProcessingId(
            gem.id
        );


        try {

            const gemRef = doc(
                db,
                "hiddenGems",
                gem.id
            );


            const batch = writeBatch(db);


            batch.update(
                gemRef,
                {
                    status: "approved",
                    approvedBy: admin.uid,
                }
            );


            await batch.commit();


            setHiddenGems(
                (previous) =>
                    previous.filter(
                        (item) =>
                            item.id !== gem.id
                    )
            );


            setSuccess(
                `"${gem.name}" is now live on TravelEase. 💎`
            );


        } catch (err) {

            console.error(
                "Approve gem error:",
                err
            );

            setError(
                "Unable to approve this hidden gem."
            );

        } finally {

            setProcessingId(null);

        }

    };


    // =========================
    // REJECT HIDDEN GEM
    // =========================

    const rejectGem = async (gem) => {

        setError("");
        setSuccess("");

        setProcessingId(
            gem.id
        );


        try {

            const gemRef = doc(
                db,
                "hiddenGems",
                gem.id
            );


            const batch = writeBatch(db);


            batch.update(
                gemRef,
                {
                    status: "rejected",
                    rejectedBy: admin.uid,
                }
            );


            await batch.commit();


            setHiddenGems(
                (previous) =>
                    previous.filter(
                        (item) =>
                            item.id !== gem.id
                    )
            );


            setSuccess(
                `"${gem.name}" was rejected.`
            );


        } catch (err) {

            console.error(
                "Reject gem error:",
                err
            );

            setError(
                "Unable to reject this hidden gem."
            );

        } finally {

            setProcessingId(null);

        }

    };


    // =========================
    // LOADING
    // =========================

    if (loading) {

        return (

            <main className="admin-page">

                <div className="admin-loading">
                    Checking admin access... ⏳
                </div>

            </main>

        );

    }


    // =========================
    // NOT ADMIN
    // =========================

    if (!admin) {

        return (

            <main className="admin-page">

                <div className="admin-denied">

                    <div>
                        🔒
                    </div>

                    <h1>
                        Access Denied
                    </h1>

                    <p>
                        {error ||
                            "You do not have permission to access this page."}
                    </p>

                    <button
                        onClick={() =>
                            navigate("/profile")
                        }
                    >
                        ← Back to Profile
                    </button>

                </div>

            </main>

        );

    }


    return (

        <main className="admin-page">

            <div className="admin-container">


                {/* =========================
                    HEADER
                ========================= */}

                <header className="admin-header">

                    <div>

                        <p className="section-label">
                            ADMINISTRATION
                        </p>

                        <h1>
                            Admin Dashboard
                        </h1>

                        <p>
                            Review community contributors
                            and hidden gem submissions.
                        </p>

                    </div>


                    <button
                        className="admin-back-btn"
                        onClick={() =>
                            navigate("/profile")
                        }
                    >
                        ← My Profile
                    </button>

                </header>


                {/* =========================
                    ALERTS
                ========================= */}

                {error && (

                    <div className="admin-alert error">
                        ⚠️ {error}
                    </div>

                )}


                {success && (

                    <div className="admin-alert success">
                        {success}
                    </div>

                )}


                {/* =========================
                    STATS
                ========================= */}

                <section className="admin-stats">

                    <div className="admin-stat-card">

                        <span>
                            👥
                        </span>

                        <div>

                            <strong>
                                {applications.length}
                            </strong>

                            <p>
                                Guide Applications
                            </p>

                        </div>

                    </div>


                    <div className="admin-stat-card">

                        <span>
                            💎
                        </span>

                        <div>

                            <strong>
                                {hiddenGems.length}
                            </strong>

                            <p>
                                Hidden Gems
                            </p>

                        </div>

                    </div>

                </section>


                {/* =========================
                    GUIDE APPLICATIONS
                ========================= */}

                <section className="admin-section">

                    <div className="admin-section-header">

                        <div>

                            <p className="section-label">
                                COMMUNITY
                            </p>

                            <h2>
                                Local Guide Applications
                            </h2>

                        </div>

                        <span className="admin-count">
                            {applications.length}
                        </span>

                    </div>


                    {applications.length === 0 ? (

                        <div className="empty-admin">

                            <div>
                                🎉
                            </div>

                            <h3>
                                No pending applications
                            </h3>

                            <p>
                                All guide applications
                                have been reviewed.
                            </p>

                        </div>

                    ) : (

                        <div className="application-list">

                            {applications.map(
                                (application) => (

                                    <article
                                        className="application-card"
                                        key={
                                            application.id
                                        }
                                    >

                                        <div className="application-top">

                                            <div>

                                                <h3>
                                                    {application.name}
                                                </h3>

                                                <p>
                                                    {application.email}
                                                </p>

                                            </div>

                                            <span className="pending-badge">
                                                Pending
                                            </span>

                                        </div>


                                        <div className="application-reason">

                                            <span>
                                                WHY THEY WANT TO CONTRIBUTE
                                            </span>

                                            <p>
                                                {application.reason}
                                            </p>

                                        </div>


                                        <div className="application-actions">

                                            <button
                                                className="reject-btn"
                                                disabled={
                                                    processingId ===
                                                    application.id
                                                }
                                                onClick={() =>
                                                    rejectGuide(
                                                        application
                                                    )
                                                }
                                            >
                                                ❌ Reject
                                            </button>


                                            <button
                                                className="approve-btn"
                                                disabled={
                                                    processingId ===
                                                    application.id
                                                }
                                                onClick={() =>
                                                    approveGuide(
                                                        application
                                                    )
                                                }
                                            >
                                                {processingId ===
                                                    application.id
                                                    ? "Processing..."
                                                    : "✅ Approve"}
                                            </button>

                                        </div>

                                    </article>

                                )
                            )}

                        </div>

                    )}

                </section>


                {/* =========================
                    HIDDEN GEMS
                ========================= */}

                <section className="admin-section">

                    <div className="admin-section-header">

                        <div>

                            <p className="section-label">
                                CONTENT MODERATION
                            </p>

                            <h2>
                                Hidden Gem Submissions
                            </h2>

                        </div>

                        <span className="admin-count">
                            {hiddenGems.length}
                        </span>

                    </div>


                    {hiddenGems.length === 0 ? (

                        <div className="empty-admin">

                            <div>
                                💎
                            </div>

                            <h3>
                                No pending hidden gems
                            </h3>

                            <p>
                                New submissions from verified
                                local guides will appear here.
                            </p>

                        </div>

                    ) : (

                        <div className="gem-admin-list">

                            {hiddenGems.map(
                                (gem) => (

                                    <article
                                        className="gem-admin-card"
                                        key={gem.id}
                                    >

                                        <div className="gem-admin-top">

                                            <div>

                                                <span className="gem-category">
                                                    {gem.category}
                                                </span>

                                                <h3>
                                                    {gem.name}
                                                </h3>

                                                <p className="gem-location">
                                                    📍 {gem.city}, {gem.state}
                                                </p>

                                            </div>

                                            <span className="pending-badge">
                                                Pending
                                            </span>

                                        </div>


                                        <p className="gem-description">
                                            {gem.description}
                                        </p>


                                        <div className="gem-special">

                                            <strong>
                                                ✨ Why it's special
                                            </strong>

                                            <p>
                                                {gem.whySpecial}
                                            </p>

                                        </div>


                                        <div className="gem-meta">

                                            <span>
                                                🕐 {gem.bestTime}
                                            </span>

                                            {gem.location && (

                                                <a
                                                    href={`https://www.google.com/maps?q=${gem.location.latitude},${gem.location.longitude}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    📍 View on Maps
                                                </a>

                                            )}

                                        </div>


                                        <div className="gem-submitter">

                                            Submitted by:
                                            <strong>
                                                {" "}
                                                {gem.submittedByName ||
                                                    "Local Guide"}
                                            </strong>

                                        </div>


                                        <div className="application-actions">

                                            <button
                                                className="reject-btn"
                                                disabled={
                                                    processingId ===
                                                    gem.id
                                                }
                                                onClick={() =>
                                                    rejectGem(
                                                        gem
                                                    )
                                                }
                                            >
                                                ❌ Reject
                                            </button>


                                            <button
                                                className="approve-btn"
                                                disabled={
                                                    processingId ===
                                                    gem.id
                                                }
                                                onClick={() =>
                                                    approveGem(
                                                        gem
                                                    )
                                                }
                                            >
                                                {processingId ===
                                                    gem.id
                                                    ? "Processing..."
                                                    : "✅ Approve & Publish"}
                                            </button>

                                        </div>

                                    </article>

                                )
                            )}

                        </div>

                    )}

                </section>

            </div>

        </main>

    );

}


export default AdminDashboard;