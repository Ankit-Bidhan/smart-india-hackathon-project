import { Link } from "react-router-dom";

function PlaceCard({ place }) {
    return (
        <article className="place-card">

            <div className="place-image">

                <img
                    src={place.image}
                    alt={place.name}
                />

                <span className={`crowd-badge ${place.crowd.toLowerCase()}`}>
                    👥 {place.crowd}
                </span>

            </div>


            <div className="place-info">

                <div className="place-location">
                    📍 {place.location}
                </div>

                <h3>
                    {place.name}
                </h3>

                <p>
                    {place.description}
                </p>


                <div className="place-bottom">

                    <span className="rating">
                        ⭐ {place.rating}
                    </span>

                    <Link
                        to={`/place/${place.id}`}
                        className="place-explore-btn"
                    >
                        Explore →
                    </Link>

                </div>

            </div>

        </article>
    );
}

export default PlaceCard;