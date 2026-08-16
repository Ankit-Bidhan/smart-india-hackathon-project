import { Link } from "react-router-dom";

function PlaceCard({ place }) {
    const detailsPath = place.firestoreId ? `/hidden-gem/${place.firestoreId}` : `/place/${place.id}`;

    return (
        <article className="place-card">
            <div className="place-image">
                {place.image ? <img src={place.image} alt={place.name} /> : <div className="place-no-image">🏛️</div>}
                <span className={`crowd-badge ${(place.crowd || "Community").toLowerCase()}`}>
                    👥 {place.crowd || "Community"}
                </span>
            </div>
            <div className="place-info">
                <div className="place-location">📍 {place.location}</div>
                <h3>{place.name}</h3>
                <p>{place.description}</p>
                <div className="place-bottom">
                    <span className="rating">⭐ {place.rating || "Community"}</span>
                    <Link to={detailsPath} className="place-explore-btn">Explore →</Link>
                </div>
            </div>
        </article>
    );
}

export default PlaceCard;
