import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import PlaceCard from "../components/PlaceCard";

function Explore() {
    const [places, setPlaces] = useState([]);
    const [search, setSearch] = useState("");
    const [crowdFilter, setCrowdFilter] = useState("All");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadDestinations = async () => {
            try {
                setLoading(true);
                setError("");

                const snapshot = await getDocs(collection(db, "destinations"));

                const destinationList = snapshot.docs
                    .map((item) => ({
                        id: item.id,
                        ...item.data(),
                    }))
                    .filter((place) => place.isActive !== false && place.status !== "pending");

                setPlaces(destinationList);
            } catch (err) {
                console.error("Explore destinations error:", err);
                setError("Unable to load destinations right now.");
            } finally {
                setLoading(false);
            }
        };

        loadDestinations();
    }, []);

    const filteredPlaces = places.filter((place) => {
        const searchText = search.toLowerCase().trim();
        const name = String(place.name || "").toLowerCase();
        const location = String(place.location || "").toLowerCase();
        const state = String(place.state || "").toLowerCase();
        const crowd = String(place.crowd || "");

        const matchesSearch =
            !searchText ||
            name.includes(searchText) ||
            location.includes(searchText) ||
            state.includes(searchText);

        const matchesCrowd =
            crowdFilter === "All" ||
            crowd === crowdFilter;

        return matchesSearch && matchesCrowd;
    });

    return (
        <section className="explore-page">
            <div className="explore-page-header">
                <p className="section-label">EXPLORE INDIA</p>
                <h1>Find your next destination.</h1>
                <p>
                    Discover popular destinations, hidden gems and
                    places that match your travel preferences.
                </p>
            </div>

            <div className="explore-controls">
                <div className="explore-search">
                    <span>⌕</span>
                    <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search places or locations..."
                    />
                </div>

                <div className="crowd-filters">
                    {["All", "Low", "Moderate", "High"].map((level) => (
                        <button
                            key={level}
                            className={
                                crowdFilter === level
                                    ? "filter-btn active"
                                    : "filter-btn"
                            }
                            onClick={() => setCrowdFilter(level)}
                        >
                            {level === "All" && "🌍 "}
                            {level === "Low" && "🟢 "}
                            {level === "Moderate" && "🟡 "}
                            {level === "High" && "🔴 "}
                            {level}
                        </button>
                    ))}
                </div>
            </div>

            <div className="explore-results-header">
                <h2>
                    {loading ? "Loading destinations..." : `${filteredPlaces.length} destinations found`}
                </h2>

                {(search || crowdFilter !== "All") && (
                    <button
                        className="clear-btn"
                        onClick={() => {
                            setSearch("");
                            setCrowdFilter("All");
                        }}
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {loading ? (
                <div className="no-results">
                    <div>🧭</div>
                    <h3>Loading destinations</h3>
                    <p>Fetching the latest destinations from TravelEase.</p>
                </div>
            ) : error ? (
                <div className="no-results">
                    <div>⚠️</div>
                    <h3>Could not load destinations</h3>
                    <p>{error}</p>
                </div>
            ) : filteredPlaces.length > 0 ? (
                <div className="places-grid">
                    {filteredPlaces.map((place) => (
                        <PlaceCard key={place.id} place={place} />
                    ))}
                </div>
            ) : (
                <div className="no-results">
                    <div>🔎</div>
                    <h3>No destinations found</h3>
                    <p>
                        Try searching for another place or changing the crowd filter.
                    </p>
                </div>
            )}
        </section>
    );
}

export default Explore;
