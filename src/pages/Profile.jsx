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

               
