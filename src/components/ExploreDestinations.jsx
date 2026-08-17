import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import PlaceCard from "./PlaceCard";
import { db } from "../firebase";

function ExploreDestinations() {
    const navigate = useNavigate();
    const [communityPlaces, setCommunityPlaces] = useState([]);

    useEffect(() => {
        const loadCommunityDestinations = async () => {
            try {
                const snapshot = await getDocs(
                    query(
                        collection(db, "destinations"),
                        where("status", "==", "approved")
                    )
                );

                const dynamicPlaces = snapshot.docs.map((item) => ({
                    id: item.id,
                    firestoreId: item.id,
                    name: item.data().name,
                    location: `${item.data().city || ""}${item.data().state ? `, ${item.data().state}` : ""}`,
                    image: item.data().image || item.data().images?.[0] || "",
                    description: item.data().description || "",
                    rating: item.data().rating || "Community",
                    crowd: item.data().crowd || "Community",
                }));

                setCommunityPlaces(dynamicPlaces);
            } catch (error) {
                console.error("Community destinations loading error:", error);
                setCommunityPlaces([]);
            }
        };

        loadCommunityDestinations();
    }, []);

    return (
        <section className="explore-section" id="explore">
            <div className="section-heading">
                <div>
                    <p className="section-label">EXPLORE INDIA</p>
                    <h2>Places worth discovering</h2>
                </div>
                <button className="view-all-btn" onClick={() => navigate("/explore")}>
                    View all →
                </button>
            </div>

            <div className="places-grid">
                {communityPlaces.map((place) => (
                    <PlaceCard key={place.id} place={place} />
                ))}
            </div>
        </section>
    );
}

export default ExploreDestinations;
