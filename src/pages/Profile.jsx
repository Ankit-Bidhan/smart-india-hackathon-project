import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from "firebase/firestore";

import { auth, db } from "../firebase";

const EMPTY_EDIT = {
    name: "",
    city: "",
    state: "",
    category: "Historical",
    description: "",
    whySpecial: "",
    bestTime: "",
    mapUrl: "",
};

function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [application, setApplication] = useState(null);
    const [contributions, setContributions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showApplication, setShowApplication] = useState(false);
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [editingGem, setEditingGem] = useState(null);
    const [editForm, setEditForm] = useState(EMPTY_EDIT);
    const [editPhotos, setEditPhotos] = useState([]);
    const [savingEdit, setSavingEdit] = useState(false);

    const loadContributions = async (uid) => {
        const contributionsQuery = query(
            collection(db, "hiddenGems"),
            where("submittedBy", "==", uid)
        );
        const snapshot = await getDocs(contributionsQuery);
        setContributions(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                navigate("/login");
                return;
            }

            setUser(currentUser);
            setLoading(true);
            setError("");

            try {
                const profileSnap = await getDoc(doc(db, "users", currentUser.uid));
                if (!profileSnap.exists()) {
                    navigate("/profile");
                    return;
                }

                const profileData = profileSnap.data();
                setProfile(profileData);
                await loadContributions(currentUser.uid);

                const applicationSnap = await getDocs(
                    query(
                        collection(db, "guideApplications"),
                        where("uid", "==", currentUser.uid)
                    )
                );

                if (!applicationSnap.empty) {
                    setApplication({
                        id: applicationSnap.docs[0].id,
                        ...applicationSnap.docs[0].data(),
                    });
                }
            } catch (err) {
                console.error("Profile loading error:", err);
                setError("Unable to load your profile.");
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const openEditor = (gem) => {
        setError("");
        setSuccess("");
        setEditingGem(gem);
        setEditForm({
            name: gem.name || "",
            city: gem.city || "",
            state: gem.state || "",
            category: gem.category || "Historical",
            description: gem.description || "",
            whySpecial: gem.whySpecial || "",
            bestTime: gem.bestTime || "",
            mapUrl: gem.mapUrl || "",
        });
        setEditPhotos([]);
    };

    const closeEditor = () => {
        if (savingEdit) return;
        setEditingGem(null);
        setEditPhotos([]);
    };

    const handleEditChange = (event) => {
        const { name, value } = event.target;
        setEditForm((previous) => ({ ...previous, [name]: value }));
    };

    const uploadPhotos = async () => {
        if (editPhotos.length === 0) return [];
        if (editPhotos.length > 5) {
            throw new Error("You can upload maximum 5 new photos at a time.");
        }

        return Promise.all(
            editPhotos.map(async (photo) => {
                const data = new FormData();
                data.append("file", photo);
                data.append("upload_preset", "travelease_hidden_gems");

                const response = await fetch(
                    "https://api.cloudinary.com/v1_1/kbtn87n5/image/upload",
                    { method: "POST", body: data }
                );
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result?.error?.message || "Photo upload failed.");
                }
                return result.secure_url;
            })
        );
    };

    const saveGemEdit = async (event) => {
        event.preventDefault();
        if (!editingGem || !user || savingEdit) return;

        setSavingEdit(true);
        setError("");
        setSuccess("");

        try {
            const required = [
                ["Place name", editForm.name],
                ["City / District", editForm.city],
                ["State", editForm.state],
                ["Description", editForm.description],
                ["Why is it special", editForm.whySpecial],
                ["Best time to visit", editForm.bestTime],
                ["Google Maps link", editForm.mapUrl],
            ];
            const missing = required.find(([, value]) => !value.trim());
            if (missing) throw new Error(`${missing[0]} is required.`);

            if (editingGem.submittedBy !== user.uid) {
                throw new Error("You can only edit your own hidden gem.");
            }

            const newImages = await uploadPhotos();
            const oldImages = Array.isArray(editingGem.images)
                ? editingGem.images
                : editingGem.image
                    ? [editingGem.image]
                    : [];
            const allImages = [...oldImages, ...newImages];

            await updateDoc(doc(db, "hiddenGems", editingGem.id), {
                name: editForm.name.trim(),
                city: editForm.city.trim(),
                state: editForm.state.trim(),
                category: editForm.category,
                description: editForm.description.trim(),
                whySpecial: editForm.whySpecial.trim(),
                bestTime: editForm.bestTime.trim(),
                mapUrl: editForm.mapUrl.trim(),
                images: allImages,
                image: allImages[0] || "",
                updatedAt: serverTimestamp(),
            });

            await loadContributions(user.uid);
            setEditingGem(null);
            setEditPhotos([]);
            setSuccess("Hidden gem updated successfully! Changes are now saved. ✅");
        } catch (err) {
            console.error("Hidden gem edit error:", err);
            setError(err.message || "Unable to update the hidden gem.");
        } finally {
            setSavingEdit(false);
        }
    };

    const handleApplication = async (event) => {
        event.preventDefault();
        if (!reason.trim()) {
            setError("Please tell us why you want to become a local guide.");
            return;
        }

        setSubmitting(true);
        setError("");
        setSuccess("");
        try {
            const data = {
                uid: user.uid,
                name: profile?.name || user.displayName || "TravelEase User",
                email: user.email || "",
                reason: reason.trim(),
                status: "pending",
                createdAt: serverTimestamp(),
            };
            await addDoc(collection(db, "guideApplications"), data);
            setApplication({ ...data, createdAt: new Date() });
            setShowApplication(false);
            setReason("");
            setSuccess("Your application has been submitted successfully! 🎉");
        } catch (err) {
            console.error("Guide application error:", err);
            setError("Unable to submit your application. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <main className="profile-page">
                <div className="profile-loading">Loading your profile... ⏳</div>
            </main>
        );
    }

    return (
        <main className="profile-page">
            <div className="profile-container">
                <div className="profile-heading">
                    <p className="section-label">YOUR ACCOUNT</p>
                    <h1>My Profile</h1>
                    <p>Manage your TravelEase account and contributor status.</p>
                </div>

                {error && <div className="profile-alert error">⚠️ {error}</div>}
                {success && <div className="profile-alert success">{success}</div>}

                <section className="profile-card">
                    <div className="profile-user">
                        <div className="profile-avatar">
                            {user?.photoURL ? <img src={user.photoURL} alt="Profile" /> : <span>👤</span>}
                        </div>
                        <div className="profile-user-info">
                            <h2>{profile?.name || user?.displayName || "TravelEase User"}</h2>
                            <p>{user?.email}</p>
                            <span className="profile-role">
                                {profile?.role === "admin" ? "🛡️ Administrator" : profile?.role === "localGuide" ? "✓ Verified Local Guide" : "🧭 Traveller"}
                            </span>
                        </div>
                    </div>
                    <div className="profile-details">
                        <div className="profile-detail"><span>Account</span><strong>{profile?.role === "admin" ? "Administrator" : profile?.role === "localGuide" ? "Verified Local Guide" : "Traveller"}</strong></div>
                        <div className="profile-detail"><span>Email</span><strong>{user?.email}</strong></div>
                    </div>
                </section>

                {profile?.role !== "admin" && profile?.role !== "localGuide" && (
                    <section className="guide-card">
                        <div className="guide-icon">💎</div>
                        <div className="guide-content">
                            <span className="guide-label">SHARE YOUR LOCAL KNOWLEDGE</span>
                            <h2>Become a Verified Local Guide</h2>
                            <p>Know hidden gems, local culture, unique food spots or lesser-known places? Help travellers discover them on TravelEase.</p>
                            {application?.status === "pending" ? (
                                <div className="application-status pending"><span>⏳</span><div><strong>Application under review</strong><p>Our admin team will review your application.</p></div></div>
                            ) : application?.status === "rejected" ? (
                                <button className="guide-apply-btn" onClick={() => setShowApplication(true)}>Apply Again</button>
                            ) : (
                                <button className="guide-apply-btn" onClick={() => setShowApplication(true)}>Become a Local Guide →</button>
                            )}
                        </div>
                    </section>
                )}

                {profile?.role === "localGuide" && (
                    <section className="verified-guide-card">
                        <div className="verified-icon">✓</div>
                        <div>
                            <span className="guide-label">VERIFIED CONTRIBUTOR</span>
                            <h2>You're a Verified Local Guide!</h2>
                            <p>You can now contribute local knowledge and suggest hidden gems for TravelEase.</p>
                            <button className="guide-apply-btn" onClick={() => navigate("/add-hidden-gem")}>💎 Add a Hidden Gem →</button>
                        </div>
                    </section>
                )}

                {profile?.role === "localGuide" && (
                    <section className="contributions-section">
                        <div className="contributions-header">
                            <div>
                                <p className="section-label">COMMUNITY CONTRIBUTIONS</p>
                                <h2>My Hidden Gems 💎</h2>
                                <p>Edit descriptions, location links, categories and photos any time.</p>
                            </div>
                            <span className="contribution-count">{contributions.length}</span>
                        </div>

                        {contributions.length === 0 ? (
                            <div className="no-contributions">
                                <div>💎</div>
                                <h3>No hidden gems yet</h3>
                                <button className="guide-apply-btn" onClick={() => navigate("/add-hidden-gem")}>Add a Hidden Gem →</button>
                            </div>
                        ) : (
                            <div className="contributions-list">
                                {contributions.map((gem) => (
                                    <article className="contribution-card" key={gem.id}>
                                        <div className="contribution-image">
                                            {gem.image ? <img src={gem.image} alt={gem.name} /> : <div className="contribution-no-image">💎</div>}
                                        </div>
                                        <div className="contribution-content">
                                            <span className="gem-location">📍 {gem.city}, {gem.state}</span>
                                            <h3>{gem.name}</h3>
                                            <p>{gem.description}</p>
                                            {gem.status === "pending" && <div className="contribution-status pending">⏳ Pending Review</div>}
                                            {gem.status === "approved" && <div className="contribution-status approved">✅ Approved — Live on TravelEase</div>}
                                            {gem.status === "rejected" && <div className="contribution-status rejected">❌ Not Approved</div>}
                                            <button className="guide-apply-btn" onClick={() => openEditor(gem)}>✏️ Edit Hidden Gem</button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {profile?.role === "admin" && (
                    <section className="verified-guide-card">
                        <div className="verified-icon">🛡️</div>
                        <div>
                            <span className="guide-label">ADMINISTRATOR</span>
                            <h2>TravelEase Admin</h2>
                            <p>Manage verified contributors and review community submissions.</p>
                            <button className="guide-apply-btn" onClick={() => navigate("/admin")}>🛡️ Open Admin Dashboard →</button>
                        </div>
                    </section>
                )}
            </div>

            {editingGem && (
                <div className="edit-gem-overlay" onClick={closeEditor}>
                    <div className="edit-gem-modal" onClick={(event) => event.stopPropagation()}>
                        <button className="edit-gem-close" onClick={closeEditor}>✕</button>
                        <p className="section-label">EDIT COMMUNITY CONTRIBUTION</p>
                        <h2>Edit Hidden Gem ✏️</h2>
                        <p>Correct any mistake in the place details, Google Maps link, description or add more photos.</p>

                        <form onSubmit={saveGemEdit} className="gem-form">
                            <div className="gem-grid">
                                <div className="gem-field full"><label>Place name *</label><input name="name" value={editForm.name} onChange={handleEditChange} /></div>
                                <div className="gem-field"><label>City / District *</label><input name="city" value={editForm.city} onChange={handleEditChange} /></div>
                                <div className="gem-field"><label>State *</label><input name="state" value={editForm.state} onChange={handleEditChange} /></div>
                                <div className="gem-field full"><label>Category *</label><select name="category" value={editForm.category} onChange={handleEditChange}>
                                    <option>Historical</option><option>Religious</option><option>Nature</option><option>Cultural</option><option>Food</option><option>Adventure</option><option>Other</option>
                                </select></div>
                                <div className="gem-field full"><label>Description *</label><textarea name="description" value={editForm.description} onChange={handleEditChange} rows="5" maxLength="1000" /></div>
                                <div className="gem-field full"><label>Why is it special? *</label><textarea name="whySpecial" value={editForm.whySpecial} onChange={handleEditChange} rows="5" maxLength="1000" /></div>
                                <div className="gem-field full"><label>Best time to visit *</label><input name="bestTime" value={editForm.bestTime} onChange={handleEditChange} /></div>
                                <div className="gem-field full"><label>Google Maps Location *</label><input type="url" name="mapUrl" value={editForm.mapUrl} onChange={handleEditChange} placeholder="https://maps.google.com/..." /></div>
                                <div className="gem-field full">
                                    <label>Add photos <span>(Optional)</span></label>
                                    <input type="file" accept="image/*" multiple onChange={(event) => setEditPhotos(Array.from(event.target.files || []))} />
                                    <small>{editPhotos.length ? `📸 ${editPhotos.length} new photo${editPhotos.length > 1 ? "s" : ""} selected` : "Add up to 5 new photos."}</small>
                                </div>
                            </div>

                            <div className="gem-submit-area">
                                <button type="button" className="gem-cancel-btn" onClick={closeEditor}>Cancel</button>
                                <button type="submit" className="gem-submit-btn" disabled={savingEdit}>{savingEdit ? "Saving..." : "Save Changes ✅"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showApplication && (
                <div className="guide-modal-overlay" onClick={() => setShowApplication(false)}>
                    <div className="guide-modal" onClick={(event) => event.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowApplication(false)}>✕</button>
                        <div className="modal-icon">💎</div>
                        <h2>Become a Verified Local Guide</h2>
                        <p>Tell us a little about your local knowledge and why you would like to contribute.</p>
                        <form onSubmit={handleApplication}>
                            <label>Why should you become a local guide?</label>
                            <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="For example: I know several lesser-known historical places and local food spots in my area..." rows="6" maxLength="600" disabled={submitting} />
                            <div className="character-count">{reason.length}/600</div>
                            <button type="submit" className="guide-submit-btn" disabled={submitting}>{submitting ? "Submitting..." : "Submit Application"}</button>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

export default Profile;
