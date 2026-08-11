import { Link } from "react-router-dom";

function Navbar() {
    return (
        <nav className="navbar">

            <Link to="/" className="logo">
                <span>✦</span> TravelEase
            </Link>

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

            <Link to="/login" className="login-btn">
                Login
            </Link>

            <button className="menu-btn">
                ☰
            </button>

        </nav>
    );
}

export default Navbar;