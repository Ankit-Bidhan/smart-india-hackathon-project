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

    const createUserProfile = async (user) => {

        await setDoc(
            doc(db, "users", user.uid),
            {
                name: user.displayName || "TravelEase User",
                email: user.email || "",
                photoURL: user.photoURL || "",
                role: "tourist",
                createdAt: serverTimestamp(),
            },
            {
                merge: true,
            }
        );

    };

    // =========================
    // GOOGLE LOGIN
    // =========================

    const handleGoogleLogin = async () => {
        setError("");
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(
                auth,
                provider
            );
            await createUserProfile(result.user);
            window.location.href = "/";
        } catch (error) {
            console.error(error);
            setError(
                "Google login failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // EMAIL LOGIN / SIGNUP
    // =========================

    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");
        setLoading(true);


        try {

            if (isSignup) {

                // CREATE ACCOUNT

                if (!name.trim()) {
                    throw new Error("Please enter your name.");
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
                        displayName: name,
                    }
                );
                await createUserProfile(
                    userCredential.user
                );


            } else {

                // LOGIN

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            }


            window.location.href = "/";


        } catch (error) {

            console.error(error);

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

                default:
                    setError(
                        error.message || "Something went wrong."
                    );
            }

        } finally {

            setLoading(false);

        }
    };


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

                    {isSignup && (

                        <div className="form-group">

                            <label>
                                Name
                            </label>

                            <input
                                type="text"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                placeholder="Enter your name"
                                disabled={loading}
                            />

                        </div>

                    )}


                    <div className="form-group">

                        <label>
                            Email
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            placeholder="you@example.com"
                            required
                            disabled={loading}
                        />

                    </div>


                    <div className="form-group">

                        <label>
                            Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            placeholder="Enter your password"
                            required
                            disabled={loading}
                        />

                    </div>


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
                            setIsSignup(!isSignup);
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