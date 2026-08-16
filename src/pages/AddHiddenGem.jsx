import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

function AddHiddenGem() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [photos, setPhotos] = useState([]);
    const [uploadStatus, setUploadStatus] = useState("");

    const [form, setForm] = useState({
        placeType: "hiddenGem",
        name: "",
        city: "",
        state: "",
        category: "Historical",
        description: "",
        whySpecial: "",
        bestTime: "",
        mapUrl: "",
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                navigate("/login");
                return;
            }
            try {
                const userSnap = await getDoc(doc(db, "users", currentUser.uid));
                if (!userSnap.exists()) {
                    navigate("/profile");
                    return;
                }
                const userData = userSnap.data();
                if (userData.role !== "localGuide" && userData.role !== "admin") {
                    navigate("/profile");
                    return;
                }
                setUser(currentUser);
                setProfile(userData);
            } catch (err) {
                console.error(err);
                setError("Unable to verify your account.");
            } finally {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!form.name.trim() || !form.city.trim() || !form.state.trim() || !form.description.trim() || !form.whySpecial.trim() || !form.bestTime.trim() || !form.mapUrl.trim()) {
            setError("Please fill all required fields.");
            return;
        }

        setSubmitting(true);
        try {
            let imageUrls = [];
            if (photos.length > 0) {
                setUploadStatus("📸 Uploading photos...");
                if (photos.length > 5) throw new Error("You can upload maximum 5 photos.");
                imageUrls = await Promise.all(photos.map(async (photo) => {
                    const uploadData = new FormData();
                    uploadData.append("file", photo);
                    uploadData.append("upload_preset", "travelease_hidden_gems");
                    const uploadResponse = await fetch("https://api.cloudinary.com/v1_1/kbtn87n5/image/upload", { method: "POST", body: uploadData });
                    if (!uploadResponse.ok) throw new Error("Photo upload failed.");
                    const uploadResult = await uploadResponse.json();
                    return uploadResult.secure_url;
                }));
                setUploadStatus("✅ Photos uploaded!");
            }

            setUploadStatus(form.placeType === "touristDestination" ? "🏛️ Submitting tourist destination..." : "💎 Submitting hidden gem...");
            await addDoc(collection(db, "hiddenGems"), {
                placeType: form.placeType,
                name: form.name.trim(),
                city: form.city.trim(),
                state: form.state.trim(),
                category: form.category,
                description: form.description.trim(),
                whySpecial: form.whySpecial.trim(),
                bestTime: form.bestTime.trim(),
                images: imageUrls,
                image: imageUrls[0] || "",
                mapUrl: form.mapUrl.trim(),
                submittedBy: user.uid,
                submittedByName: profile?.name || user.displayName || "TravelEase Contributor",
                status: "pending",
                createdAt: serverTimestamp(),
            });

            setSuccess(form.placeType === "touristDestination" ? "Tourist destination submitted successfully! It will be reviewed by an admin. 🏛️" : "Hidden gem submitted successfully! It will be reviewed by an admin. 💎");
            setTimeout(() => navigate("/profile"), 1500);
            setForm({ placeType: "hiddenGem", name: "", city: "", state: "", category: "Historical", description: "", whySpecial: "", bestTime: "", mapUrl: "" });
            setPhotos([]);
        } catch (err) {
            console.error("Place submission error:", err);
            setError(err.message || "Unable to submit the place. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <main className="gem-page"><div className="gem-loading">Checking contributor access... ⏳</div></main>;

    const isTouristDestination = form.placeType === "touristDestination";

    return (
        <main className="gem-page">
            <div className="gem-container">
                <div className="gem-header">
                    <p className="section-label">COMMUNITY CONTRIBUTIONS</p>
                    <h1>{isTouristDestination ? "Add a Tourist Destination 🏛️" : "Add a Hidden Gem 💎"}</h1>
                    <p>{isTouristDestination ? "Help travellers discover an important destination and useful local information." : "Share a lesser-known place that deserves to be discovered by travellers."}</p>
                </div>

                {error && <div className="gem-alert error">⚠️ {error}</div>}
                {success && <div className="gem-alert success">{success}</div>}

                <form className="gem-form" onSubmit={handleSubmit}>
                    <div className="gem-section">
                        <h2>🧭 What are you adding?</h2>
                        <p>Choose how this contribution should appear on TravelEase.</p>
                        <div className="gem-grid">
                            <div className="gem-field full">
                                <label>Place type *</label>
                                <select name="placeType" value={form.placeType} onChange={handleChange}>
                                    <option value="hiddenGem">💎 Hidden Gem</option>
                                    <option value="touristDestination">🏛️ Tourist Destination</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="gem-section">
                        <h2>📍 Place information</h2>
                        <p>Tell travellers about this place.</p>
                        <div className="gem-grid">
                            <div className="gem-field full"><label>Place name *</label><input type="text" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Mahabharat Anubhav Kendra" maxLength="100" /></div>
                            <div className="gem-field"><label>City / District *</label><input type="text" name="city" value={form.city} onChange={handleChange} placeholder="e.g. Kurukshetra" /></div>
                            <div className="gem-field"><label>State *</label><input type="text" name="state" value={form.state} onChange={handleChange} placeholder="e.g. Haryana" /></div>
                            <div className="gem-field full"><label>Category *</label><select name="category" value={form.category} onChange={handleChange}><option>Historical</option><option>Religious</option><option>Nature</option><option>Cultural</option><option>Food</option><option>Adventure</option><option>Other</option></select></div>
                        </div>
                    </div>

                    <div className="gem-section">
                        <h2>✨ Tell travellers about it</h2>
                        <div className="gem-field"><label>Description *</label><textarea name="description" value={form.description} onChange={handleChange} placeholder="What is this place? What can visitors see or experience there?" rows="5" maxLength="1000" /></div>
                        <div className="gem-field"><label>Why is it special? *</label><textarea name="whySpecial" value={form.whySpecial} onChange={handleChange} placeholder="Share the local knowledge or story that makes this place special." rows="5" maxLength="1000" /></div>
                        <div className="gem-field"><label>Best time to visit *</label><input type="text" name="bestTime" value={form.bestTime} onChange={handleChange} placeholder="e.g. October to March, early morning" maxLength="150" /></div>
                    </div>

                    <div className="gem-field full">
                        <label>📸 Place Photos <span>(Optional)</span></label>
                        <input type="file" accept="image/*" multiple onChange={(event) => setPhotos(Array.from(event.target.files || []))} />
                        <small>Add up to 5 photos. You can also add photos later.</small>
                    </div>

                    <div className="gem-section">
                        <h2>🗺️ Exact location</h2>
                        <p>Paste the Google Maps link of the exact place.</p>
                        <div className="gem-field full"><label>Google Maps Location *</label><input type="url" name="mapUrl" value={form.mapUrl} onChange={handleChange} placeholder="https://maps.google.com/..." /></div>
                        <div className="location-tip">💡 <strong>Mobile users:</strong> Open Google Maps, find the exact place, tap Share → Copy link and paste that link here.</div>
                    </div>

                    {uploadStatus && <div className="upload-status">{uploadStatus}</div>}
                    <div className="gem-submit-area">
                        <button type="button" className="gem-cancel-btn" onClick={() => navigate("/profile")}>Cancel</button>
                        <button type="submit" className="gem-submit-btn" disabled={submitting}>{submitting ? "Submitting..." : isTouristDestination ? "Submit Tourist Destination 🏛️" : "Submit Hidden Gem 💎"}</button>
                    </div>
                </form>
            </div>
        </main>
    );
}

export default AddHiddenGem;
