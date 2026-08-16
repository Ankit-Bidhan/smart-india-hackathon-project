import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import PlaceCard from "./PlaceCard";
import places from "../data/places";
import { db } from "../firebase";

function ExploreDestinations() {
    const navigate = useNavigate();
    const [communityPlaces, setCommunityPlaces] = useState([]);

    useEffect(() => {
        const loadCommunityDestinations = async () => {
            try {
                const snapshot = await getDocs(query(collection(db, "hiddenGems"), where("status", "==", "approved")));
                const dynamicPlaces = snapshot.docs
                    .map((item) => ({ id: item.id, ...item.data() }))
                    .filter((item) => item.placeType === "touristDestination")
                    .map((item) => ({
                        id: item.id,
                        firestoreId: item.id,
                        name: item.name,
                        location: `${item.city}, ${item.state}`,
                        image: item.image || item.images?.[0] || "",
                        description: item.description,
                        rating: item.rating || "Community",
                        crowd: item.crowd || "Community",
                    }));
                setCommunityPlaces(dynamicPlaces);
            } catch (error) {
                console.error("Community destinations loading error:", error);
            }
        };
        loadCommunityDestinations();
    }, []);

    const allPlaces = [...communityPlaces, ...places];

    return (
        <section className="explore-section" id="explore">
            <div className="section-heading">
                <div>
                    <p className="section-label">EXPLORE INDIA</p>
                    <h2>Places worth discovering</h2>
                </div>
                <button className="view-all-btn" onClick={() => navigate("/explore")}>View all →</button>
            </div>

            <div className="places-grid">
                {allPlaces.map((place) => <PlaceCard key={`${place.firestoreId || "static"}-${place.id}`} place={place} />)}
            </div>
        </section>
    );
}

export default ExploreDestinations;
