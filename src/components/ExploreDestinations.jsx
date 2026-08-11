import PlaceCard from "./PlaceCard";
import places from "../data/places";

function ExploreDestinations() {
    return (
        <section className="explore-section" id="explore">

            <div className="section-heading">

                <div>
                    <p className="section-label">
                        EXPLORE INDIA
                    </p>

                    <h2>
                        Places worth discovering
                    </h2>
                </div>

                <button className="view-all-btn">
                    View all →
                </button>

            </div>


            <div className="places-grid">

                {places.map((place) => (
                    <PlaceCard
                        key={place.id}
                        place={place}
                    />
                ))}

            </div>

        </section>
    );
}

export default ExploreDestinations;