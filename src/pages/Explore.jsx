import { useState } from "react";
import places from "../data/places";
import PlaceCard from "../components/PlaceCard";

function Explore() {
    const [search, setSearch] = useState("");
    const [crowdFilter, setCrowdFilter] = useState("All");

    const filteredPlaces = places.filter((place) => {
        const searchText = search.toLowerCase();

        const matchesSearch =
            place.name.toLowerCase().includes(searchText) ||
            place.location.toLowerCase().includes(searchText);

        const matchesCrowd =
            crowdFilter === "All" ||
            place.crowd === crowdFilter;

        return matchesSearch && matchesCrowd;
    });

    return (
        <section className="explore-page">

            {/* Header */}

            <div className="explore-page-header">

                <p className="section-label">
                    EXPLORE INDIA
                </p>

                <h1>
                    Find your next destination.
                </h1>

                <p>
                    Discover popular destinations, hidden gems and
                    places that match your travel preferences.
                </p>

            </div>


            {/* Search + Filters */}

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


            {/* Results */}

            <div className="explore-results-header">

                <h2>
                    {filteredPlaces.length} destinations found
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


            {filteredPlaces.length > 0 ? (

                <div className="places-grid">

                    {filteredPlaces.map((place) => (
                        <PlaceCard
                            key={place.id}
                            place={place}
                        />
                    ))}

                </div>

            ) : (

                <div className="no-results">
                    <div>🔎</div>

                    <h3>
                        No destinations found
                    </h3>

                    <p>
                        Try searching for another place or changing
                        the crowd filter.
                    </p>

                </div>

            )}

        </section>
    );
}

export default Explore;