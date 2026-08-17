import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import { auth, db } from "../firebase";

const REPORT_WINDOW_MS = 2 * 60 * 60 * 1000;

function CrowdInsights() {
    const [places, setPlaces] = useState([]);
    const [reports, setReports] = useState([]);
    const [user, setUser] = useState(null);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [reporting, setReporting] = useState(false);
    const [message, setMessage] = useState("");
    const [loadingPlaces, setLoadingPlaces] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, setUser);
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const loadPlaces = async () => {
            try {
                setLoadingPlaces(true);

                // Tourist destinations now live in their own collection.
                // Only approved destinations should appear in Crowd Insights.
                const snapshot = await getDocs(collection(db, "destinations"));

                const destinationList = snapshot.docs
                    .map((item) => ({
                        id: item.id,
                        ...item.data(),
                    }))
                    .filter((place) => place.status === "approved");

                setPlaces(destinationList);
                setMessage("");
            } catch (error) {
                console.error("Destinations loading error:", error);
                setMessage("Could not load destinations for crowd insights.");
                setPlaces([]);
            } finally {
                setLoadingPlaces(false);
            }
        };

        loadPlaces();
    }, []);

    const loadReports = async () => {
        try {
            const snapshot = await getDocs(collection(db, "crowdReports"));
            setReports(
                snapshot.docs.map((item) => ({
                    id: item.id,
                    ...item.data(),
                }))
            );
        } catch (error) {
            console.error("Crowd reports loading error:", error);
        }
    };

    useEffect(() => {
        loadReports();
        const interval = setInterval(loadReports, 60000);
        return () => clearInterval(interval);
    }, []);

    const crowdData = useMemo(() => {
        const now = Date.now();
        const result = {};

        places.forEach((place) => {
            const recent = reports.filter((report) => {
                if (String(report.placeId) !== String(place.id)) return false;

                const created = report.createdAt?.toMillis
                    ? report.createdAt.toMillis()
                    : new Date(report.createdAt || 0).getTime();

                return Number.isFinite(created) && now - created <= REPORT_WINDOW_MS;
            });

            const latestByUser = new Map();

            recent.forEach((report) => {
                const key = report.userId || report.id;
                const existing = latestByUser.get(key);
                const created = report.createdAt?.toMillis
                    ? report.createdAt.toMillis()
                    : new Date(report.createdAt || 0).getTime();

                if (!existing || created > existing.created) {
                    latestByUser.set(key, { ...report, created });
                }
            });

            const counts = { Low: 0, Moderate: 0, High: 0 };

            latestByUser.forEach((report) => {
                if (counts[report.level] !== undefined) {
                    counts[report.level] += 1;
                }
            });

            const total = counts.Low + counts.Moderate + counts.High;
            let crowd = "No recent reports";

            if (total > 0) {
                if (counts.High >= counts.Moderate && counts.High >= counts.Low) {
                    crowd = "High";
                } else if (counts.Moderate >= counts.Low) {
                    crowd = "Moderate";
                } else {
                    crowd = "Low";
                }
            }

            result[place.id] = { crowd, total, counts };
        });

        return result;
    }, [places, reports]);

    const submitReport = async (level) => {
        if (!selectedPlace || !user || reporting) return;

        setReporting(true);
        setMessage("");

        try {
            await addDoc(collection(db, "crowdReports"), {
                placeId: selectedPlace.id,
                placeName: selectedPlace.name,
                userId: user.uid,
                level,
                createdAt: serverTimestamp(),
            });

            setSelectedPlace(null);
            setMessage("Thanks! Your crowd report is live for the next 2 hours. 📍");
            await loadReports();
        } catch (error) {
            console.error("Crowd report error:", error);
            setMessage("Could not submit the crowd report. Please try again.");
        } finally {
            setReporting(false);
        }
    };

    return (
        <section className="crowd-section" id="crowd">
            <div className="crowd-header">
                <div>
                    <p className="section-label">SMART TRAVEL INSIGHTS</p>
                    <h2>Know the crowd before you go.</h2>
                    <p className="crowd-intro">
                        See recent community-reported crowd levels and help other travellers by sharing what you see.
                    </p>
                </div>

                <div className="live-indicator">
                    <span></span>
                    Community live reports
                </div>
            </div>

            {message && <p className="crowd-message">{message}</p>}

            <div className="crowd-layout">
                <div className="crowd-list">
                    {loadingPlaces ? (
                        <div className="crowd-card">
                            <div className="crowd-place">
                                <div className="crowd-icon">🧭</div>
                                <div>
                                    <h3>Loading destinations...</h3>
                                    <p>Fetching approved tourist destinations from TravelEase.</p>
                                </div>
                            </div>
                        </div>
                    ) : places.length > 0 ? (
                        places.map((place) => {
                            const data = crowdData[place.id];
                            const statusClass = data?.crowd.toLowerCase().replace(" ", "-");

                            return (
                                <div className="crowd-card" key={place.id}>
                                    <div className="crowd-place">
                                        <div className="crowd-icon">📍</div>
                                        <div>
                                            <h3>{place.name}</h3>
                                            <p>{place.location || [place.city, place.state].filter(Boolean).join(", ")}</p>
                                        </div>
                                    </div>

                                    <div className="crowd-status">
                                        <span className={`status-dot ${statusClass}`}></span>
                                        <span>{data?.crowd || "No recent reports"}</span>
                                        {data?.total > 0 && (
                                            <small>{data.total} report{data.total > 1 ? "s" : ""}</small>
                                        )}
                                    </div>

                                    <button
                                        className="crowd-report-btn"
                                        onClick={() => setSelectedPlace(place)}
                                    >
                                        📍 Report crowd
                                    </button>
                                </div>
                            );
                        })
                    ) : (
                        <div className="crowd-card">
                            <div className="crowd-place">
                                <div className="crowd-icon">🔎</div>
                                <div>
                                    <h3>No approved tourist destinations found</h3>
                                    <p>Approve a tourist destination from the Local Guide submissions to show it here.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="crowd-recommendation">
                    <div className="recommendation-icon">💡</div>
                    <p className="recommendation-label">HOW IT WORKS</p>
                    <h3>Help travellers avoid the rush.</h3>
                    <p>
                        Crowd levels are based on recent reports from TravelEase users. Reports automatically become old after 2 hours, so the section does not pretend to be live sensor data.
                    </p>
                    {!user && <p><strong>Sign in to submit a crowd report.</strong></p>}
                </div>
            </div>

            {selectedPlace && (
                <div className="guide-modal-overlay" onClick={() => setSelectedPlace(null)}>
                    <div className="guide-modal" onClick={(event) => event.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedPlace(null)}>✕</button>
                        <div className="modal-icon">📍</div>
                        <h2>How crowded is {selectedPlace.name}?</h2>
                        <p>Your report will be counted for the next 2 hours.</p>

                        {!user ? (
                            <p>Please sign in first to report the crowd.</p>
                        ) : (
                            <div className="crowd-report-options">
                                <button disabled={reporting} onClick={() => submitReport("Low")}>🟢 Low</button>
                                <button disabled={reporting} onClick={() => submitReport("Moderate")}>🟡 Moderate</button>
                                <button disabled={reporting} onClick={() => submitReport("High")}>🔴 High</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

export default CrowdInsights;
