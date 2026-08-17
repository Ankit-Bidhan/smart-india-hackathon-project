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
    const [touristDestinations, setTouristDestinations] = useState([]);
    const [processingId, setProcessingId] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                navigate("/login");
                return;
            }

            try {
                const userSnap = await getDoc(doc(db, "users", currentUser.uid));
                if (!userSnap.exists()) {
                    setError("Admin profile was not found.");
                    setLoading(false);
                    return;
                }

                const userData = userSnap.data();
                if (userData.role !== "admin") {
                    setError("You do not have permission to access the Admin Dashboard.");
                    setLoading(false);
                    return;
                }

                setAdmin({ ...userData, uid: currentUser.uid });
                await loadAdminData();
            } catch (err) {
                console.error("Admin dashboard error:", err);
                setError("Unable to load admin dashboard.");
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const loadAdminData = async () => {
        const pendingQuery = (collectionName) =>
            query(collection(db, collectionName), where("status", "==", "pending"));

        const [applicationsSnap, gemsSnap, destinationsSnap] = await Promise.all([
            getDocs(pendingQuery("guideApplications")),
            getDocs(pendingQuery("hiddenGems")),
            getDocs(pendingQuery("destinations")),
        ]);

        setApplications(
            applicationsSnap.docs.map((item) => ({ id: item.id, ...item.data() }))
        );
        setHiddenGems(
            gemsSnap.docs.map((item) => ({ id: item.id, ...item.data() }))
        );
        setTouristDestinations(
            destinationsSnap.docs.map((item) => ({ id: item.id, ...item.data() }))
        );
    };

    const approveGuide = async (application) => {
        setError("");
        setSuccess("");
        setProcessingId(application.id);

        try {
            const batch = writeBatch(db);
            batch.update(doc(db, "guideApplications", application.id), { status: "approved" });
            batch.update(doc(db, "users", application.uid), { role: "localGuide" });
            await batch.commit();

            setApplications((previous) => previous.filter((item) => item.id !== application.id));
            setSuccess(`${application.name} is now a Verified Local Guide. ✅`);
        } catch (err) {
            console.error("Approve guide error:", err);
            setError("Unable to approve this guide application.");
        } finally {
            setProcessingId(null);
        }
    };

    const rejectGuide = async (application) => {
        setError("");
        setSuccess("");
        setProcessingId(application.id);

        try {
            await writeBatch(db)
                .update(doc(db, "guideApplications", application.id), { status: "rejected" })
                .commit();
            setApplications((previous) => previous.filter((item) => item.id !== application.id));
            setSuccess(`${application.name}'s application was rejected.`);
        } catch (err) {
            console.error("Reject guide error:", err);
            setError("Unable to reject this application.");
        } finally {
            setProcessingId(null);
        }
    };

    const moderatePlace = async (place, collectionName, type) => {
        setError("");
        setSuccess("");
        setProcessingId(place.id);

        try {
            await writeBatch(db)
                .update(doc(db, collectionName, place.id), {
                    status: "approved",
                    approvedBy: admin.uid,
                })
                .commit();

            if (type === "gem") {
                setHiddenGems((previous) => previous.filter((item) => item.id !== place.id));
                setSuccess(`"${place.name}" is now live on TravelEase. 💎`);
            } else {
                setTouristDestinations((previous) => previous.filter((item) => item.id !== place.id));
                setSuccess(`"${place.name}" is now live in Tourist Destinations. 🏛️`);
            }
        } catch (err) {
            console.error("Approve place error:", err);
            setError(`Unable to approve this ${type === "gem" ? "hidden gem" : "tourist destination"}.`);
        } finally {
            setProcessingId(null);
        }
    };

    const rejectPlace = async (place, collectionName, type) => {
        setError("");
        setSuccess("");
        setProcessingId(place.id);

        try {
            await writeBatch(db)
                .update(doc(db, collectionName, place.id), {
                    status: "rejected",
                    rejectedBy: admin.uid,
                })
                .commit();

            if (type === "gem") {
                setHiddenGems((previous) => previous.filter((item) => item.id !== place.id));
                setSuccess(`"${place.name}" was rejected.`);
            } else {
                setTouristDestinations((previous) => previous.filter((item) => item.id !== place.id));
                setSuccess(`"${place.name}" was rejected.`);
            }
        } catch (err) {
            console.error("Reject place error:", err);
            setError(`Unable to reject this ${type === "gem" ? "hidden gem" : "tourist destination"}.`);
        } finally {
            setProcessingId(null);
        }
    };

    const renderPlaceList = (places, type) => {
        const isGem = type === "gem";
        const collectionName = isGem ? "hiddenGems" : "destinations";

        if (places.length === 0) {
            return (
                <div className="empty-admin">
                    <div>{isGem ? "💎" : "🏛️"}</div>
                    <h3>{isGem ? "No pending hidden gems" : "No pending tourist destinations"}</h3>
                    <p>
                        {isGem
                            ? "New submissions from verified local guides will appear here."
                            : "New tourist destination submissions from verified local guides will appear here."}
                    </p>
                </div>
            );
        }

        return (
            <div className="gem-admin-list">
                {places.map((place) => (
                    <article className="gem-admin-card" key={place.id}>
                        <div className="gem-admin-top">
                            <div>
                                <span className="gem-category">{place.category}</span>
                                <h3>{place.name}</h3>
                                <p className="gem-location">📍 {place.city}, {place.state}</p>
                            </div>
                            <span className="pending-badge">Pending</span>
                        </div>

                        <p className="gem-description">{place.description}</p>

                        {place.whySpecial && (
                            <div className="gem-special">
                                <strong>✨ Why it's special</strong>
                                <p>{place.whySpecial}</p>
                            </div>
                        )}

                        <div className="gem-meta">
                            {place.bestTime && <span>🕐 {place.bestTime}</span>}
                            {place.mapUrl && (
                                <a href={place.mapUrl} target="_blank" rel="noreferrer">
                                    📍 View on Maps
                                </a>
                            )}
                        </div>

                        <div className="gem-submitter">
                            Submitted by: <strong>{place.submittedByName || "Local Guide"}</strong>
                        </div>

                        <div className="application-actions">
                            <button
                                className="reject-btn"
                                disabled={processingId === place.id}
                                onClick={() => rejectPlace(place, collectionName, type)}
                            >
                                ❌ Reject
                            </button>
                            <button
                                className="approve-btn"
                                disabled={processingId === place.id}
                                onClick={() => moderatePlace(place, collectionName, type)}
                            >
                                {processingId === place.id
                                    ? "Processing..."
                                    : isGem
                                        ? "✅ Approve & Publish"
                                        : "✅ Approve & Publish"}
                            </button>
                        </div>
                    </article>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <main className="admin-page">
                <div className="admin-loading">Checking admin access... ⏳</div>
            </main>
        );
    }

    if (!admin) {
        return (
            <main className="admin-page">
                <div className="admin-denied">
                    <div>🔒</div>
                    <h1>Access Denied</h1>
                    <p>{error || "You do not have permission to access this page."}</p>
                    <button onClick={() => navigate("/profile")}>← Back to Profile</button>
                </div>
            </main>
        );
    }

    return (
        <main className="admin-page">
            <div className="admin-container">
                <header className="admin-header">
                    <div>
                        <p className="section-label">ADMINISTRATION</p>
                        <h1>Admin Dashboard</h1>
                        <p>Review community contributors, tourist destinations and hidden gem submissions.</p>
                    </div>
                    <button className="admin-back-btn" onClick={() => navigate("/profile")}>← My Profile</button>
                </header>

                {error && <div className="admin-alert error">⚠️ {error}</div>}
                {success && <div className="admin-alert success">{success}</div>}

                <section className="admin-stats">
                    <div className="admin-stat-card">
                        <span>👥</span>
                        <div><strong>{applications.length}</strong><p>Guide Applications</p></div>
                    </div>
                    <div className="admin-stat-card">
                        <span>🏛️</span>
                        <div><strong>{touristDestinations.length}</strong><p>Tourist Destinations</p></div>
                    </div>
                    <div className="admin-stat-card">
                        <span>💎</span>
                        <div><strong>{hiddenGems.length}</strong><p>Hidden Gems</p></div>
                    </div>
                </section>

                <section className="admin-section">
                    <div className="admin-section-header">
                        <div><p className="section-label">COMMUNITY</p><h2>Local Guide Applications</h2></div>
                        <span className="admin-count">{applications.length}</span>
                    </div>

                    {applications.length === 0 ? (
                        <div className="empty-admin">
                            <div>🎉</div>
                            <h3>No pending applications</h3>
                            <p>All guide applications have been reviewed.</p>
                        </div>
                    ) : (
                        <div className="application-list">
                            {applications.map((application) => (
                                <article className="application-card" key={application.id}>
                                    <div className="application-top">
                                        <div><h3>{application.name}</h3><p>{application.email}</p></div>
                                        <span className="pending-badge">Pending</span>
                                    </div>
                                    <div className="application-reason">
                                        <span>WHY THEY WANT TO CONTRIBUTE</span>
                                        <p>{application.reason}</p>
                                    </div>
                                    <div className="application-actions">
                                        <button className="reject-btn" disabled={processingId === application.id} onClick={() => rejectGuide(application)}>❌ Reject</button>
                                        <button className="approve-btn" disabled={processingId === application.id} onClick={() => approveGuide(application)}>
                                            {processingId === application.id ? "Processing..." : "✅ Approve"}
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <section className="admin-section">
                    <div className="admin-section-header">
                        <div><p className="section-label">CONTENT MODERATION</p><h2>Tourist Destination Submissions</h2></div>
                        <span className="admin-count">{touristDestinations.length}</span>
                    </div>
                    {renderPlaceList(touristDestinations, "destination")}
                </section>

                <section className="admin-section">
                    <div className="admin-section-header">
                        <div><p className="section-label">CONTENT MODERATION</p><h2>Hidden Gem Submissions</h2></div>
                        <span className="admin-count">{hiddenGems.length}</span>
                    </div>
                    {renderPlaceList(hiddenGems, "gem")}
                </section>
            </div>
        </main>
    );
}

export default AdminDashboard;
