import { useState } from "react";

import {
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
} from "firebase/auth";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase";


function Login() {

    const [isSignup, setIsSignup] = useState(false);

    const [name, setName] = useState("");

    const [email, setEmail] = useState("");

    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");


    // =====================================================
    // CREATE USER PROFILE ONLY IF IT DOES NOT EXIST
    // =====================================================

    const createUserProfile = async (user) => {

        const userRef = doc(
            db,
            "users",
            user.uid
        );

        const userSnap = await getDoc(userRef);


        // =================================================
        // IMPORTANT:
        // If the profile already exists, DO NOT overwrite it.
        //
        // This preserves:
        // admin
        // localGuide
        // tourist
        // =================================================

        if (userSnap.exists()) {

            console.log(
                "Existing user profile found. Role preserved:",
                userSnap.data().role
            );

            return;

        }


        // =================================================
        // ONLY NEW USERS GET THE DEFAULT TOURIST ROLE
        // =================================================

        await setDoc(
            userRef,
            {
                name:
                    user.displayName ||
                    "TravelEase User",

                email:
                    user.email ||
                    "",

                photoURL:
                    user.photoURL ||
                    "",

                role:
                    "tourist",

                createdAt:
                    serverTimestamp(),
            }
        );

    };


    // =====================================================
    // GOOGLE LOGIN
    // =====================================================

    const handleGoogleLogin = async () => {

        setError("");

        setLoading(true);


        try {

            const provider =
                new GoogleAuthProvider();


            const result =
                await signInWithPopup(
                    auth,
                    provider
                );


            // Creates profile only if it does not
            // already exist.
            await createUserProfile(
                result.user
            );


            window.location.href = "/";


        } catch (error) {

            console.error(
                "Google login error:",
                error
            );


            setError(
                "Google login failed. Please try again."
            );


        } finally {

            setLoading(false);

        }

    };


    // =====================================================
    // EMAIL LOGIN / SIGNUP
    // =====================================================

    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");

        setLoading(true);


        try {

            // =================================================
            // SIGN UP
            // =================================================

            if (isSignup) {

                if (!name.trim()) {

                    throw new Error(
                        "Please enter your name."
                    );

                }


                const userCredential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                // Save user's name in Firebase Auth

                await updateProfile(
                    userCredential.user,
                    {
                        displayName:
                            name.trim(),
                    }
                );


                // Create Firestore profile.
                // This is a NEW user, so tourist is correct.

                await createUserProfile(
                    userCredential.user
                );

            }


            // =================================================
            // LOGIN
            // =================================================

            else {

                const userCredential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                // =================================================
                // IMPORTANT:
                //
                // We DO NOT write "tourist" here.
                //
                // The existing Firestore role is preserved.
                // =================================================

                const userRef = doc(
                    db,
                    "users",
                    userCredential.user.uid
                );


                const userSnap =
                    await getDoc(userRef);


                if (userSnap.exists()) {

                    console.log(
                        "Logged in with role:",
                        userSnap.data().role
                    );

                } else {

                    // Safety fallback for an old account
                    // that does not have a Firestore profile.

                    await createUserProfile(
                        userCredential.user
                    );

                }

            }


            window.location.href = "/";


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            switch (error.code) {

                case "auth/email-already-in-use":

                    setError(
                        "This email is already registered. Try logging in."
                    );

                    break;


                case "auth/invalid-email":

                    setError(
                        "Please enter a valid email address."
                    );

                    break;


                case "auth/weak-password":

                    setError(
                        "Password should be at least 6 characters."
                    );

                    break;


                case "auth/invalid-credential":

                    setError(
                        "Incorrect email or password."
                    );

                    break;


                case "auth/popup-closed-by-user":

                    setError(
                        "Google login was cancelled."
                    );

                    break;


                default:

                    setError(
                        error.message ||
                        "Something went wrong."
                    );

            }

        } finally {

            setLoading(false);

        }

    };


    // =====================================================
    // UI
    // =====================================================

    return (

        <main className="login-page">

            <div className="login-card">


                {/* HEADER */}

                <div className="login-header">

                    <div className="login-logo">
                        ✦
                    </div>

                    <p className="section-label">
                        TRAVELEASE
                    </p>

                    <h1>

                        {isSignup
                            ? "Create your account"
                            : "Welcome back"}

                    </h1>

                    <p>

                        {isSignup
                            ? "Join TravelEase and discover smarter ways to travel."
                            : "Sign in to continue your travel journey."}

                    </p>

                </div>


                {/* ERROR */}

                {error && (

                    <div className="login-error">

                        ⚠️ {error}

                    </div>

                )}


                {/* GOOGLE */}

                <button
                    type="button"
                    className="google-btn"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                >

                    <span className="google-icon">
                        G
                    </span>

                    {loading
                        ? "Please wait..."
                        : "Continue with Google"}

                </button>


                {/* DIVIDER */}

                <div className="login-divider">

                    <span></span>

                    <p>
                        OR
                    </p>

                    <span></span>

                </div>


                {/* EMAIL FORM */}

                <form
                    className="login-form"
                    onSubmit={handleSubmit}
                >


                    {/* NAME */}

                    {isSignup && (

                        <div className="form-group">

                            <label>
                                Name
                            </label>

                            <input
                                type="text"
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter your name"
                                disabled={loading}
                            />

                        </div>

                    )}


                    {/* EMAIL */}

                    <div className="form-group">

                        <label>
                            Email
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(
                                    event.target.value
                                )
                            }
                            placeholder="you@example.com"
                            required
                            disabled={loading}
                        />

                    </div>


                    {/* PASSWORD */}

                    <div className="form-group">

                        <label>
                            Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(
                                    event.target.value
                                )
                            }
                            placeholder="Enter your password"
                            required
                            disabled={loading}
                        />

                    </div>


                    {/* SUBMIT */}

                    <button
                        type="submit"
                        className="login-submit"
                        disabled={loading}
                    >

                        {loading

                            ? "Please wait..."

                            : isSignup
                                ? "Create Account"
                                : "Login"}

                    </button>

                </form>


                {/* SWITCH LOGIN / SIGNUP */}

                <div className="login-switch">

                    {isSignup
                        ? "Already have an account?"
                        : "Don't have an account?"}


                    <button
                        type="button"
                        onClick={() => {

                            setIsSignup(
                                !isSignup
                            );

                            setError("");

                        }}
                    >

                        {isSignup
                            ? "Login"
                            : "Create Account"}

                    </button>

                </div>

            </div>

        </main>

    );

}


export default Login;