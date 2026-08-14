import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth } from "../firebase";


function Navbar() {

    const [user, setUser] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);

    const navigate = useNavigate();


    // Check Firebase login state

    useEffect(() => {

        const unsubscribe = onAuthStateChanged(
            auth,
            (currentUser) => {
                setUser(currentUser);
            }
        );

        return () => unsubscribe();

    }, []);


    // Logout

    const handleLogout = async () => {

        try {

            await signOut(auth);

            setMenuOpen(false);

            navigate("/");

        } catch (error) {

            console.error("Logout error:", error);

        }
    };


    return (
        <nav className="navbar">

            {/* LOGO */}

            <Link
                to="/"
                className="logo"
                onClick={() => setMenuOpen(false)}
            >
                <span>✦</span> TravelEase
            </Link>


            {/* DESKTOP NAV */}

            <div className="nav-links">

                <Link to="/">
                    Home
                </Link>

                <Link to="/explore">
                    Explore
                </Link>

                <Link to="/ai-guide">
                    AI Guide
                </Link>

                <Link to="/guides">
                    Local Guides
                </Link>

            </div>


            {/* DESKTOP ACCOUNT */}

            <div className="nav-account">

                {user ? (

                    <div className="user-menu">

                        <button
                            className="user-button"
                            onClick={() =>
                                setMenuOpen(!menuOpen)
                            }
                        >

                            <span className="user-avatar">
                                {user.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt="Profile"
                                    />
                                ) : (
                                    "👤"
                                )}
                            </span>

                            <span className="user-name">
                                {user.displayName ||
                                    user.email?.split("@")[0] ||
                                    "User"}
                            </span>

                            <span className="dropdown-arrow">
                                ▾
                            </span>

                        </button>


                        {menuOpen && (

                            <div className="user-dropdown">

                                <div className="dropdown-user-info">

                                    <strong>
                                        {user.displayName ||
                                            "TravelEase User"}
                                    </strong>

                                    <span>
                                        {user.email}
                                    </span>

                                </div>


                                <button
                                    onClick={() =>
                                        navigate("/profile")
                                    }
                                >
                                    👤 My Profile
                                </button>


                                <button
                                    className="logout-button"
                                    onClick={handleLogout}
                                >
                                    🚪 Logout
                                </button>

                            </div>

                        )}

                    </div>

                ) : (

                    <Link
                        to="/login"
                        className="login-btn"
                    >
                        Login
                    </Link>

                )}

            </div>


            {/* MOBILE MENU BUTTON */}

            <button
                className="menu-btn"
                onClick={() =>
                    setMenuOpen(!menuOpen)
                }
                aria-label="Open menu"
            >
                {menuOpen ? "✕" : "☰"}
            </button>


            {/* MOBILE MENU */}

            {menuOpen && (

                <div className="mobile-menu">

                    <Link
                        to="/"
                        onClick={() => setMenuOpen(false)}
                    >
                        Home
                    </Link>

                    <Link
                        to="/explore"
                        onClick={() => setMenuOpen(false)}
                    >
                        Explore
                    </Link>

                    <Link
                        to="/ai-guide"
                        onClick={() => setMenuOpen(false)}
                    >
                        AI Guide
                    </Link>

                    <Link
                        to="/guides"
                        onClick={() => setMenuOpen(false)}
                    >
                        Local Guides
                    </Link>


                    {user ? (

                        <>
                            <div className="mobile-user-info">

                                <span className="user-avatar">
                                    {user.photoURL ? (
                                        <img
                                            src={user.photoURL}
                                            alt="Profile"
                                        />
                                    ) : (
                                        "👤"
                                    )}
                                </span>

                                <div>
                                    <strong>
                                        {user.displayName ||
                                            "TravelEase User"}
                                    </strong>

                                    <small>
                                        {user.email}
                                    </small>
                                </div>

                            </div>

                            <button
                                className="mobile-logout"
                                onClick={handleLogout}
                            >
                                🚪 Logout
                            </button>
                        </>

                    ) : (

                        <Link
                            to="/login"
                            className="mobile-login"
                            onClick={() =>
                                setMenuOpen(false)
                            }
                        >
                            Login
                        </Link>

                    )}

                </div>

            )}

        </nav>
    );
}

export default Navbar;