import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

function HiddenGemsPage() {
    const navigate = useNavigate();
    const [gems, setGems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadHiddenGems = async () => {
            try {
                const snapshot = await getDocs(query(collection(db, "hiddenGems"), where("status", "==", "approved")));
                const gemList = snapshot.docs
                    .map((item) => ({ id: item.id, ...item.data() }))
                    // Only explicitly classified Hidden Gems belong here.
                    // Tourist destinations must stay in Explore Destinations.
                    .filter((item) => item.placeType === "hiddenGem");
                setGems(gemList);
            } catch (err) {
                console.error("Hidden gems loading error:", err);
                setError("Unable to load hidden gems.");
            } finally {
                setLoading(false);
            }
        };
        loadHiddenGems();
    }, []);

    return (
        <main className="explore-page">
            <div className="explore-page-header">
                <p className="section-label">COMMUNITY DISCOVERY</p>
                <h1>Discover Hidden Gems 💎</h1>
                <p>Explore lesser-known places discovered and recommended by local contributors.</p>
            </div>

            {loading && <div className="no-results"><div>💎</div><h3>Discovering hidden gems...</h3></div>}
            {error && <div className="no-results"><div>⚠️</div><h3>{error}</h3></div>}
            {!loading && !error && gems.length === 0 && <div className="no-results"><div>💎</div><h3>No hidden gems yet</h3><p>Local guides are discovering amazing places. Check back soon!</p></div>}

            {!loading && !error && gems.length > 0 && (
                <div className="places-grid">
                    {gems.map((gem) => (
                        <article className="gem-card" key={gem.id}>
                            <div className="gem-image">
                                {gem.image || gem.images?.[0] ? <img src={gem.image || gem.images[0]} alt={gem.name} /> : <div className="gem-no-image">💎</div>}
                                <span className="gem-badge">💎 Hidden Gem</span>
                            </div>
                            <div className="gem-content">
                                <span className="gem-location">📍 {gem.city}, {gem.state}</span>
                                <h3>{gem.name}</h3>
                                <p>{gem.description}</p>
                                <div className="gem-meta"><span>✨ {gem.category}</span><span>🕐 {gem.bestTime}</span></div>
                                <button type="button" className="gem-button" onClick={() => navigate(`/hidden-gem/${gem.id}`)}>Discover →</button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </main>
    );
}

export default HiddenGemsPage;
