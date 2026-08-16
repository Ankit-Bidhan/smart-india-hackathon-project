import { useState } from "react";
import "./NearbyPlaces.css";

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";
const RADIUS_OPTIONS = [2, 5, 10, 25];

function distanceKm(lat1, lon1, lat2, lon2) {
    const toRad = (v) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function category(tags = {}) {
    if (tags.tourism) return tags.tourism.replaceAll("_", " ");
    if (tags.historic) return "Historical";
    if (tags.natural) return tags.natural.replaceAll("_", " ");
    if (tags.leisure) return tags.leisure.replaceAll("_", " ");
    return "Place";
}
function emoji(tags = {}) {
    if (tags.historic || tags.tourism === "museum") return "🏛️";
    if (tags.amenity === "place_of_worship") return "🛕";
    if (tags.natural || tags.leisure === "park" || tags.leisure === "garden") return "🌿";
    if (tags.tourism === "viewpoint") return "🌄";
    return "📍";
}
function point(element) {
    if (element.lat && element.lon) return { lat: element.lat, lon: element.lon };
    if (element.center?.lat && element.center?.lon) return { lat: element.center.lat, lon: element.center.lon };
    return null;
}

function NearbyPlaces() {
    const [radius, setRadius] = useState(5);
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const findNearbyPlaces = () => {
        setError(""); setLoading(true); setPlaces([]);
        if (!navigator.geolocation) {
            setError("Location is not supported by this browser."); setLoading(false); return;
        }
        navigator.geolocation.getCurrentPosition(async ({ coords }) => {
            try {
                const { latitude, longitude } = coords;
                const query = `[out:json][timeout:25];(nwr(around:${radius * 1000},${latitude},${longitude})[tourism];nwr(around:${radius * 1000},${latitude},${longitude})[historic];nwr(around:${radius * 1000},${latitude},${longitude})[natural];nwr(around:${radius * 1000},${latitude},${longitude})[leisure~"park|garden|nature_reserve"];nwr(around:${radius * 1000},${latitude},${longitude})[amenity="place_of_worship"];);out center tags;`;
                const response = await fetch(OVERPASS_ENDPOINT, { method: "POST", headers: { "Content-Type": "text/plain;charset=UTF-8" }, body: query });
                if (!response.ok) throw new Error("Nearby places request failed");
                const data = await response.json();
                const seen = new Set();
                const results = data.elements.map((element) => {
                    const p = point(element); const name = element.tags?.name || element.tags?.name_en;
                    if (!p || !name) return null;
                    const key = name.toLowerCase().trim(); if (seen.has(key)) return null; seen.add(key);
                    return { id: `${element.type}-${element.id}`, name, category: category(element.tags), emoji: emoji(element.tags), distance: distanceKm(latitude, longitude, p.lat, p.lon), lat: p.lat, lon: p.lon };
                }).filter(Boolean).sort((a, b) => a.distance - b.distance).slice(0, 12);
                setPlaces(results);
                if (!results.length) setError(`No mapped places found within ${radius} km. Try a larger radius.`);
            } catch (err) {
                console.error(err); setError("Unable to discover nearby places right now. Please try again.");
            } finally { setLoading(false); }
        }, (geoError) => {
            setLoading(false); setError(geoError.code === geoError.PERMISSION_DENIED ? "Location permission was denied. Allow location and try again." : "We could not get your location. Please try again.");
        }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
    };

    return (
        <section className="nearby-places-section" id="nearby-places">
            <div className="nearby-header">
                <div><p className="section-label">DISCOVER AROUND YOU</p><h2>📍 Places near you</h2><p>Choose a radius and discover interesting places around your current location.</p></div>
                <div className="nearby-controls"><label htmlFor="nearby-radius">Radius</label><select id="nearby-radius" value={radius} onChange={(e) => setRadius(Number(e.target.value))}>{RADIUS_OPTIONS.map((km) => <option key={km} value={km}>{km} km</option>)}</select><button type="button" className="nearby-button" onClick={findNearbyPlaces} disabled={loading}>{loading ? "Finding places..." : "📍 Get places nearby"}</button></div>
            </div>
            <p className="nearby-privacy-note">🔒 Your location is requested only when you press this button.</p>
            {error && <div className="nearby-error">⚠️ {error}</div>}
            {loading && <div className="nearby-loading">Finding interesting places around you... ⏳</div>}
            {!loading && places.length > 0 && <div className="nearby-grid">{places.map((place) => <article className="nearby-card" key={place.id}><div className="nearby-card-icon">{place.emoji}</div><div className="nearby-card-content"><span className="nearby-category">{place.category}</span><h3>{place.name}</h3><p>📍 {place.distance < 1 ? `${Math.round(place.distance * 1000)} m` : `${place.distance.toFixed(1)} km`} away</p><a className="nearby-map-link" href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}#map=17/${place.lat}/${place.lon}`} target="_blank" rel="noreferrer">View on map →</a></div></article>)}</div>}
        </section>
    );
}
export default NearbyPlaces;
