import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { onAuthStateChanged } from "firebase/auth";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase";


function AddHiddenGem() {

    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [photo, setPhoto] = useState(null);
    const [uploadStatus, setUploadStatus] = useState("");

    const [form, setForm] = useState({
        name: "",
        city: "",
        state: "",
        category: "Historical",
        description: "",
        whySpecial: "",
        bestTime: "",
        latitude: "",
        longitude: "",
    });


    // =========================
    // CHECK USER + ROLE
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
                    const userRef = doc(
                        db,
                        "users",
                        currentUser.uid
                    );

                    const userSnap =
                        await getDoc(userRef);

                    if (!userSnap.exists()) {
                        navigate("/profile");
                        return;
                    }

                    const userData = userSnap.data();

                    if (
                        userData.role !== "localGuide" &&
                        userData.role !== "admin"
                    ) {
                        navigate("/profile");
                        return;
                    }

                    setUser(currentUser);
                    setProfile(userData);

                } catch (err) {

                    console.error(err);

                    setError(
                        "Unable to verify your account."
                    );

                } finally {

                    setLoading(false);

                }

            }
        );

        return () => unsubscribe();

    }, [navigate]);


    // =========================
    // HANDLE INPUT
    // =========================

    const handleChange = (event) => {

        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));

    };


    // =========================
    // SUBMIT
    // =========================

    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");
        setSuccess("");


        if (
            !form.name.trim() ||
            !form.city.trim() ||
            !form.state.trim() ||
            !form.description.trim() ||
            !form.whySpecial.trim() ||
            !form.bestTime.trim() ||
            !form.latitude ||
            !form.longitude
        ) {

            setError(
                "Please fill all required fields."
            );

            return;
        }


        const latitude =
            Number(form.latitude);

        const longitude =
            Number(form.longitude);


        if (
            Number.isNaN(latitude) ||
            Number.isNaN(longitude) ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
        ) {

            setError(
                "Please enter valid latitude and longitude."
            );

            return;
        }


        setSubmitting(true);


        try {

            let imageUrl = "";

            if (photo) {

                setUploadStatus("📸 Uploading photo...");

                const cloudinaryUrl =
                    "https://api.cloudinary.com/v1_1/kbtn87n5/image/upload";

                const uploadData = new FormData();

                uploadData.append("file", photo);

                uploadData.append(
                    "upload_preset",
                    "travelease_hidden_gems"
                );

                const uploadResponse = await fetch(
                    cloudinaryUrl,
                    {
                        method: "POST",
                        body: uploadData,
                    }
                );

                if (!uploadResponse.ok) {

                    const errorText =
                        await uploadResponse.text();

                    console.error(
                        "Cloudinary HTTP status:",
                        uploadResponse.status
                    );

                    console.error(
                        "Cloudinary response:",
                        errorText
                    );

                    throw new Error(
                        `Cloudinary upload failed (${uploadResponse.status})`
                    );
                }

                const uploadResult =
                    await uploadResponse.json();

                imageUrl =
                    uploadResult.secure_url || "";

                setUploadStatus("✅ Photo uploaded!");
            }

            setUploadStatus("💎 Submitting hidden gem...");
             
            await addDoc(
                collection(db, "hiddenGems"),
                {
                    name: form.name.trim(),
                    city: form.city.trim(),
                    state: form.state.trim(),
                    category: form.category,
                    description:
                        form.description.trim(),
                    whySpecial:
                        form.whySpecial.trim(),
                    bestTime:
                        form.bestTime.trim(),
                    image: imageUrl,
                    location: {
                        latitude,
                        longitude,
                    },
                    submittedBy: user.uid,
                    submittedByName:
                        profile?.name ||
                        user.displayName ||
                        "TravelEase Contributor",

                    status: "pending",
                    createdAt:
                        serverTimestamp(),

                }
            );


            setSuccess(
                "Hidden gem submitted successfully! It will be reviewed by an admin. 💎"
            );

            setTimeout(() => {
                navigate("/profile");
            }, 1500);


            setForm({
                name: "",
                city: "",
                state: "",
                category: "Historical",
                description: "",
                whySpecial: "",
                bestTime: "",
                latitude: "",
                longitude: "",
            });

            setPhoto(null);

        } catch (err) {

            console.error(
                "Hidden gem submission error:",
                err
            );

            setError(
                "Unable to submit the hidden gem. Please try again."
            );

        } finally {

            setSubmitting(false);

        }

    };


    if (loading) {

        return (
            <main className="gem-page">

                <div className="gem-loading">
                    Checking contributor access... ⏳
                </div>

            </main>
        );

    }


    return (

        <main className="gem-page">

            <div className="gem-container">

                {/* HEADER */}

                <div className="gem-header">

                    <p className="section-label">
                        COMMUNITY DISCOVERY
                    </p>

                    <h1>
                        Add a Hidden Gem 💎
                    </h1>

                    <p>
                        Share a lesser-known place that
                        deserves to be discovered by travellers.
                    </p>

                </div>


                {/* ALERTS */}

                {error && (

                    <div className="gem-alert error">
                        ⚠️ {error}
                    </div>

                )}

                {success && (

                    <div className="gem-alert success">
                        {success}
                    </div>

                )}


                {/* FORM */}

                <form
                    className="gem-form"
                    onSubmit={handleSubmit}
                >

                    <div className="gem-section">

                        <h2>
                            📍 Place information
                        </h2>

                        <p>
                            Tell travellers about this place.
                        </p>


                        <div className="gem-grid">

                            <div className="gem-field full">

                                <label>
                                    Place name *
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Mahabharat Anubhav Kendra"
                                    maxLength="100"
                                />

                            </div>


                            <div className="gem-field">

                                <label>
                                    City / District *
                                </label>

                                <input
                                    type="text"
                                    name="city"
                                    value={form.city}
                                    onChange={handleChange}
                                    placeholder="e.g. Kurukshetra"
                                />

                            </div>


                            <div className="gem-field">

                                <label>
                                    State *
                                </label>

                                <input
                                    type="text"
                                    name="state"
                                    value={form.state}
                                    onChange={handleChange}
                                    placeholder="e.g. Haryana"
                                />
                            </div>
                            <div className="gem-field full">
                                <label>
                                    Category *
                                </label>
                                <select
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                >
                                    <option>
                                        Historical
                                    </option>
                                    <option>
                                        Religious
                                    </option>
                                    <option>
                                        Nature
                                    </option>
                                    <option>
                                        Cultural
                                    </option>
                                    <option>
                                        Food
                                    </option>
                                    <option>
                                        Adventure
                                    </option>
                                    <option>
                                        Other
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* DESCRIPTION */}

                    <div className="gem-section">

                        <h2>
                            ✨ Tell travellers about it
                        </h2>


                        <div className="gem-field">

                            <label>
                                Description *
                            </label>

                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="What is this place? What can visitors see or experience there?"
                                rows="5"
                                maxLength="1000"
                            />

                        </div>


                        <div className="gem-field">

                            <label>
                                Why is it special? *
                            </label>

                            <textarea
                                name="whySpecial"
                                value={form.whySpecial}
                                onChange={handleChange}
                                placeholder="Share the local knowledge or story that makes this place special."
                                rows="5"
                                maxLength="1000"
                            />

                        </div>


                        <div className="gem-field">

                            <label>
                                Best time to visit *
                            </label>

                            <input
                                type="text"
                                name="bestTime"
                                value={form.bestTime}
                                onChange={handleChange}
                                placeholder="e.g. October to March, early morning"
                                maxLength="150"
                            />

                        </div>

                    </div>

                    <div className="gem-field full">

                        <label>
                            📸 Place Photo <span>(Optional)</span>
                        </label>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                                setPhoto(
                                    event.target.files?.[0] || null
                                )
                            }
                        />
                        <small>
                            You can add a photo now or add it later from your profile.
                        </small>
                    </div>


                    {/* LOCATION */}

                    <div className="gem-section">

                        <h2>
                            🗺️ Exact location
                        </h2>

                        <p>
                            Add the exact coordinates of the
                            place so travellers can navigate
                            to it.
                        </p>


                        <div className="gem-grid">

                            <div className="gem-field">

                                <label>
                                    Latitude *
                                </label>

                                <input
                                    type="number"
                                    name="latitude"
                                    value={form.latitude}
                                    onChange={handleChange}
                                    placeholder="e.g. 29.9695"
                                    step="any"
                                />

                            </div>


                            <div className="gem-field">

                                <label>
                                    Longitude *
                                </label>

                                <input
                                    type="number"
                                    name="longitude"
                                    value={form.longitude}
                                    onChange={handleChange}
                                    placeholder="e.g. 76.8783"
                                    step="any"
                                />

                            </div>

                        </div>


                        <div className="location-tip">

                            💡 You can get coordinates from
                            Google Maps by right-clicking the
                            exact location and copying the
                            coordinates.

                        </div>

                    </div>


                    {/* SUBMIT */}

                    {uploadStatus && (
                        <div className="upload-status">
                            {uploadStatus}
                        </div>
                    )}

                    <div className="gem-submit-area">

                        <button
                            type="button"
                            className="gem-cancel-btn"
                            onClick={() =>
                                navigate("/profile")
                            }
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            className="gem-submit-btn"
                            disabled={submitting}
                        >

                            {submitting
                                ? "Submitting..."
                                : "Submit Hidden Gem 💎"}

                        </button>

                    </div>

                </form>

            </div>

        </main>
    );
}


export default AddHiddenGem;