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


/* ======================================================
   CLOUDINARY
====================================================== */

const CLOUDINARY_UPLOAD_URL =
    "https://api.cloudinary.com/v1_1/kbtn87n5/image/upload";

const CLOUDINARY_UPLOAD_PRESET =
    "travelease_hidden_gems";


/* ======================================================
   PROFILE COMPONENT
====================================================== */

function Profile() {

    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [application, setApplication] = useState(null);

    const [loading, setLoading] = useState(true);

    const [showApplication, setShowApplication] =
        useState(false);

    const [guideForm, setGuideForm] = useState({
        city: "",
        state: "",
        languages: "",
        expertise: "",
        experience: "",
        bio: "",
        reason: "",
    });

    const [guidePhoto, setGuidePhoto] = useState(null);
    const [guidePhotoPreview, setGuidePhotoPreview] =
        useState("");

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    /* ==================================================
       LOAD USER
    ================================================== */

    useEffect(() => {

        const unsubscribe =
            onAuthStateChanged(
                auth,
                async (currentUser) => {

                    if (!currentUser) {

                        navigate("/login");

                        return;
                    }

                    setUser(currentUser);

                    try {

                        /* USER PROFILE */

                        const profileRef =
                            doc(
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


                        /* GUIDE APPLICATION */

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

                            const applications =
                                applicationSnap.docs.map(
                                    (applicationDoc) => ({
                                        id:
                                            applicationDoc.id,

                                        ...applicationDoc.data(),
                                    })
                                );

                            applications.sort(
                                (a, b) => {

                                    const aTime =
                                        a.createdAt?.toDate
                                            ? a.createdAt
                                                .toDate()
                                                .getTime()
                                            : 0;

                                    const bTime =
                                        b.createdAt?.toDate
                                            ? b.createdAt
                                                .toDate()
                                                .getTime()
                                            : 0;

                                    return bTime - aTime;
                                }
                            );

                            setApplication(
                                applications[0]
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


    /* ==================================================
       FORM INPUT
    ================================================== */

    const handleGuideInput = (event) => {

        const {
            name,
            value
        } = event.target;

        setGuideForm(
            (previous) => ({
                ...previous,
                [name]: value,
            })
        );
    };


    /* ==================================================
       PHOTO
    ================================================== */

    const handleGuidePhoto = (event) => {

        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {

            setError(
                "Please select a valid image file."
            );

            return;
        }

        const maxSize =
            5 * 1024 * 1024;

        if (file.size > maxSize) {

            setError(
                "Guide photo must be smaller than 5 MB."
            );

            return;
        }

        setError("");

        setGuidePhoto(file);

        if (guidePhotoPreview) {

            URL.revokeObjectURL(
                guidePhotoPreview
            );
        }

        const preview =
            URL.createObjectURL(file);

        setGuidePhotoPreview(preview);
    };


    /* ==================================================
       RESET
    ================================================== */

    const resetGuideForm = () => {

        if (guidePhotoPreview) {

            URL.revokeObjectURL(
                guidePhotoPreview
            );
        }

        setGuideForm({
            city: "",
            state: "",
            languages: "",
            expertise: "",
            experience: "",
            bio: "",
            reason: "",
        });

        setGuidePhoto(null);

        setGuidePhotoPreview("");
    };


    /* ==================================================
       OPEN FORM
    ================================================== */

    const openApplication = () => {

        setError("");
        setSuccess("");

        resetGuideForm();

        setShowApplication(true);
    };


    /* ==================================================
       CLOSE FORM
    ================================================== */

    const closeApplication = () => {

        if (submitting) {
            return;
        }

        setShowApplication(false);

        setError("");
    };


    /* ==================================================
       SUBMIT APPLICATION
    ================================================== */

    const handleApplication = async (event) => {

        event.preventDefault();

        if (submitting) {
            return;
        }

        setError("");
        setSuccess("");


        /* VALIDATION */

        if (!guideForm.city.trim()) {

            setError(
                "Please enter the city where you can guide travellers."
            );

            return;
        }

        if (!guideForm.state.trim()) {

            setError(
                "Please enter your state."
            );

            return;
        }

        if (!guideForm.languages.trim()) {

            setError(
                "Please enter the languages you can speak."
            );

            return;
        }

        if (!guideForm.expertise.trim()) {

            setError(
                "Please enter your areas of expertise."
            );

            return;
        }

        if (!guideForm.experience.trim()) {

            setError(
                "Please enter your guiding experience."
            );

            return;
        }

        if (!guideForm.bio.trim()) {

            setError(
                "Please write a short guide bio."
            );

            return;
        }

        if (!guideForm.reason.trim()) {

            setError(
                "Please tell us why you want to become a local guide."
            );

            return;
        }

        if (!guidePhoto) {

            setError(
                "Please upload a profile photo."
            );

            return;
        }

        if (!user) {

            setError(
                "You must be logged in to apply."
            );

            return;
        }


        setSubmitting(true);


        try {

            /* ==================================================
               STEP 1
               UPLOAD IMAGE TO CLOUDINARY
            ================================================== */

            console.log(
                "STEP 1: Uploading image to Cloudinary..."
            );

            const formData =
                new FormData();

            formData.append(
                "file",
                guidePhoto
            );

            formData.append(
                "upload_preset",
                CLOUDINARY_UPLOAD_PRESET
            );


            const cloudinaryResponse =
                await fetch(
                    CLOUDINARY_UPLOAD_URL,
                    {
                        method: "POST",
                        body: formData,
                    }
                );


            const cloudinaryData =
                await cloudinaryResponse.json();


            if (!cloudinaryResponse.ok) {

                console.error(
                    "Cloudinary error:",
                    cloudinaryData
                );

                throw new Error(
                    cloudinaryData?.error?.message ||
                    "Cloudinary image upload failed."
                );
            }


            const photoURL =
                cloudinaryData.secure_url;


            if (!photoURL) {

                throw new Error(
                    "Cloudinary did not return an image URL."
                );
            }


            console.log(
                "STEP 1 COMPLETE: Cloudinary image uploaded."
            );


            /* ==================================================
               STEP 2
               SAVE APPLICATION TO FIRESTORE
            ================================================== */

            console.log(
                "STEP 2: Saving application to Firestore..."
            );


            const applicationData = {

                uid:
                    user.uid,

                name:
                    profile?.name ||
                    user.displayName ||
                    "TravelEase User",

                email:
                    user.email ||
                    "",

                photoURL,

                city:
                    guideForm.city.trim(),

                state:
                    guideForm.state.trim(),

                languages:
                    guideForm.languages.trim(),

                expertise:
                    guideForm.expertise.trim(),

                experience:
                    guideForm.experience.trim(),

                bio:
                    guideForm.bio.trim(),

                reason:
                    guideForm.reason.trim(),

                status:
                    "pending",

                createdAt:
                    serverTimestamp(),
            };


            const applicationRef =
                await addDoc(
                    collection(
                        db,
                        "guideApplications"
                    ),
                    applicationData
                );


            console.log(
                "STEP 2 COMPLETE:",
                applicationRef.id
            );


            /* ==================================================
               STEP 3
               UPDATE PAGE
            ================================================== */

            setApplication({

                id:
                    applicationRef.id,

                ...applicationData,

                createdAt:
                    new Date(),
            });


            resetGuideForm();

            setShowApplication(false);

            setSuccess(
                "Your local guide application has been submitted successfully! 🎉"
            );


            console.log(
                "GUIDE APPLICATION COMPLETE."
            );


        } catch (err) {

            console.error(
                "Guide application error:",
                err
            );

            setError(
                err?.message ||
                "Unable to submit your application."
            );

        } finally {

            setSubmitting(false);
        }
    };


    /* ==================================================
       LOADING
    ================================================== */

    if (loading) {

        return (

            <main className="profile-page">

                <div className="profile-loading">

                    Loading your profile... ⏳

                </div>

            </main>
        );
    }


    /* ==================================================
       PAGE
    ================================================== */

    return (

        <main className="profile-page">

            <div className="profile-container">


                {/* HEADER */}

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


                {/* PROFILE */}

                <section className="profile-card">

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

                                {profile?.role === "admin"

                                    ? "🛡️ Administrator"

                                    : profile?.role === "localGuide"

                                        ? "✓ Verified Local Guide"

                                        : "🧭 Traveller"}

                            </span>

                        </div>

                    </div>


                    <div className="profile-details">

                        <div className="profile-detail">

                            <span>
                                Account
                            </span>

                            <strong>

                                {profile?.role === "admin"

                                    ? "Administrator"

                                    : profile?.role === "localGuide"

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


                {/* GUIDE CARD */}

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


                                {application?.status === "pending" ? (

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

                                ) : application?.status === "rejected" ? (

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
                                            onClick={openApplication}
                                        >
                                            Apply Again
                                        </button>

                                    </>

                                ) : (

                                    <button
                                        className="guide-apply-btn"
                                        onClick={openApplication}
                                    >
                                        Become a Local Guide →
                                    </button>
                                )}

                            </div>

                        </section>
                    )}


                {/* VERIFIED GUIDE */}

                {profile?.role === "localGuide" && (

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
                                    navigate("/add-hidden-gem")
                                }
                            >
                                💎 Add a Hidden Gem →
                            </button>

                        </div>

                    </section>
                )}


                {/* ADMIN */}

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
                                Manage verified contributors
                                and review community submissions.
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


            {/* ==================================================
                APPLICATION MODAL
            ================================================== */}

            {showApplication && (

                <div
                    className="guide-modal-overlay"
                    onClick={closeApplication}
                >

                    <div
                        className="guide-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >


                        <button
                            className="modal-close"
                            onClick={closeApplication}
                            type="button"
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
                            Tell us about yourself and the
                            local knowledge you can share
                            with travellers.
                        </p>


                        <form
                            onSubmit={handleApplication}
                        >


                            {/* PHOTO */}

                            <div className="guide-photo-section">

                                <label>
                                    Guide Profile Photo
                                </label>


                                <div className="guide-photo-upload">

                                    {guidePhotoPreview ? (

                                        <div className="guide-photo-preview">

                                            <img
                                                src={
                                                    guidePhotoPreview
                                                }
                                                alt="Guide preview"
                                            />


                                            <button
                                                type="button"
                                                className="remove-photo-btn"
                                                disabled={submitting}
                                                onClick={() => {

                                                    if (guidePhotoPreview) {

                                                        URL.revokeObjectURL(
                                                            guidePhotoPreview
                                                        );
                                                    }

                                                    setGuidePhoto(null);

                                                    setGuidePhotoPreview("");
                                                }}
                                            >
                                                ✕
                                            </button>

                                        </div>

                                    ) : (

                                        <label
                                            className="guide-photo-placeholder"
                                            htmlFor="guide-photo"
                                        >

                                            <span>
                                                📷
                                            </span>

                                            <strong>
                                                Upload your photo
                                            </strong>

                                            <small>
                                                JPG, PNG or WEBP • Max 5 MB
                                            </small>

                                        </label>
                                    )}


                                    <input
                                        id="guide-photo"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleGuidePhoto}
                                        disabled={submitting}
                                        style={{
                                            display: "none"
                                        }}
                                    />

                                </div>

                            </div>


                            {/* CITY + STATE */}

                            <div className="guide-form-row">

                                <div className="guide-form-group">

                                    <label htmlFor="city">
                                        City *
                                    </label>

                                    <input
                                        id="city"
                                        name="city"
                                        type="text"
                                        value={
                                            guideForm.city
                                        }
                                        onChange={
                                            handleGuideInput
                                        }
                                        placeholder="e.g. Tawang"
                                        maxLength={80}
                                        disabled={submitting}
                                    />

                                </div>


                                <div className="guide-form-group">

                                    <label htmlFor="state">
                                        State *
                                    </label>

                                    <input
                                        id="state"
                                        name="state"
                                        type="text"
                                        value={
                                            guideForm.state
                                        }
                                        onChange={
                                            handleGuideInput
                                        }
                                        placeholder="e.g. Arunachal Pradesh"
                                        maxLength={80}
                                        disabled={submitting}
                                    />

                                </div>

                            </div>


                            {/* LANGUAGES */}

                            <div className="guide-form-group">

                                <label htmlFor="languages">
                                    Languages *
                                </label>

                                <input
                                    id="languages"
                                    name="languages"
                                    type="text"
                                    value={
                                        guideForm.languages
                                    }
                                    onChange={
                                        handleGuideInput
                                    }
                                    placeholder="e.g. English, Hindi, Bengali"
                                    maxLength={200}
                                    disabled={submitting}
                                />

                                <small>
                                    Separate multiple languages with commas.
                                </small>

                            </div>


                            {/* EXPERTISE */}

                            <div className="guide-form-group">

                                <label htmlFor="expertise">
                                    Areas of Expertise *
                                </label>

                                <input
                                    id="expertise"
                                    name="expertise"
                                    type="text"
                                    value={
                                        guideForm.expertise
                                    }
                                    onChange={
                                        handleGuideInput
                                    }
                                    placeholder="e.g. History, Food, Trekking, Culture"
                                    maxLength={250}
                                    disabled={submitting}
                                />

                                <small>
                                    Tell travellers what you know best.
                                </small>

                            </div>


                            {/* EXPERIENCE */}

                            <div className="guide-form-group">

                                <label htmlFor="experience">
                                    Guiding Experience *
                                </label>

                                <input
                                    id="experience"
                                    name="experience"
                                    type="text"
                                    value={
                                        guideForm.experience
                                    }
                                    onChange={
                                        handleGuideInput
                                    }
                                    placeholder="e.g. 3 years / Experienced local traveller"
                                    maxLength={150}
                                    disabled={submitting}
                                />

                            </div>


                            {/* BIO */}

                            <div className="guide-form-group">

                                <label htmlFor="bio">
                                    About You *
                                </label>

                                <textarea
                                    id="bio"
                                    name="bio"
                                    value={
                                        guideForm.bio
                                    }
                                    onChange={
                                        handleGuideInput
                                    }
                                    placeholder="Tell travellers about yourself, your connection to the place and what makes you a good local guide..."
                                    rows="5"
                                    maxLength={500}
                                    disabled={submitting}
                                />

                                <div className="character-count">
                                    {guideForm.bio.length}/500
                                </div>

                            </div>


                            {/* REASON */}

                            <div className="guide-form-group">

                                <label htmlFor="reason">
                                    Why should you become a local guide? *
                                </label>

                                <textarea
                                    id="reason"
                                    name="reason"
                                    value={
                                        guideForm.reason
                                    }
                                    onChange={
                                        handleGuideInput
                                    }
                                    placeholder="For example: I know several lesser-known historical places, local food spots and cultural traditions in my area..."
                                    rows="5"
                                    maxLength={600}
                                    disabled={submitting}
                                />

                                <div className="character-count">
                                    {guideForm.reason.length}/600
                                </div>

                            </div>


                            {/* SUBMIT */}

                            <button
                                type="submit"
                                className="guide-submit-btn"
                                disabled={submitting}
                            >

                                {submitting
                                    ? "Submitting Application..."
                                    : "Submit Guide Application"}

                            </button>


                            <p className="guide-form-note">

                                🔒 Your information will be reviewed
                                by the TravelEase admin team before
                                your guide profile becomes public.

                            </p>

                        </form>

                    </div>

                </div>
            )}

        </main>
    );
}


export default Profile;