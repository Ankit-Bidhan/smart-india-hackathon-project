import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import "../components/GemDetailsExtras.css";

const weatherLabels = { 0:"Clear sky",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Foggy",48:"Rime fog",51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",61:"Light rain",63:"Rain",65:"Heavy rain",71:"Light snow",73:"Snow",75:"Heavy snow",80:"Rain showers",81:"Rain showers",82:"Heavy rain showers",95:"Thunderstorm",96:"Thunderstorm with hail",99:"Thunderstorm with hail" };
const weatherEmoji = { 0:"☀️",1:"🌤️",2:"⛅",3:"☁️",45:"🌫️",48:"🌫️",51:"🌦️",53:"🌦️",55:"🌧️",61:"🌧️",63:"🌧️",65:"🌧️",71:"🌨️",73:"❄️",75:"❄️",80:"🌦️",81:"🌧️",82:"🌧️",95:"⛈️",96:"⛈️",99:"⛈️" };
function formatDay(dateString){return new Date(`${dateString}T12:00:00`).toLocaleDateString("en-IN",{weekday:"short"});}

async function geocodePlace(name, city, state){
    const searches = [name, `${name}, ${city}`, `${city}, ${state}`];
    for (const search of searches) {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(search)}&count=5&language=en&format=json&countryCode=IN`);
        if (!response.ok) continue;
        const data = await response.json();
        if (data.results?.length) {
            const preferred = data.results.find((item) => {
                const admin = `${item.admin1 || ""} ${item.admin2 || ""}`.toLowerCase();
                return admin.includes(state.toLowerCase()) || item.name.toLowerCase() === name.toLowerCase();
            }) || data.results[0];
            return { latitude: preferred.latitude, longitude: preferred.longitude };
        }
    }
    return null;
}

function HiddenGemDetails(){
    const { id } = useParams();
    const navigate = useNavigate();
    const [gem,setGem]=useState(null); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
    const [coordinates,setCoordinates]=useState(null); const [locationLoading,setLocationLoading]=useState(false); const [weather,setWeather]=useState(null); const [weatherLoading,setWeatherLoading]=useState(false);

    useEffect(()=>{
        const loadGem=async()=>{
            try{
                if(id.startsWith("static-")){setError("This hidden gem is no longer available.");return;}
                const snap=await getDoc(doc(db,"hiddenGems",id));
                if(!snap.exists()){setError("Hidden gem not found.");return;}
                const data=snap.data();
                if(data.status!=="approved"){setError("This hidden gem is not available.");return;}
                setGem({id:snap.id,...data});
            }catch(err){console.error("Hidden gem details error:",err);setError("Unable to load this hidden gem.");}
            finally{setLoading(false);}
        };
        loadGem();
    },[id]);

    useEffect(()=>{
        if(!gem)return;
        const loadLocationAndWeather=async()=>{
            setLocationLoading(true); setWeatherLoading(true);
            try{
                let latitude=Number(gem.latitude); let longitude=Number(gem.longitude);
                if(!Number.isFinite(latitude)||!Number.isFinite(longitude)){
                    const found=await geocodePlace(gem.name,gem.city,gem.state);
                    if(found){latitude=found.latitude;longitude=found.longitude;
                        try{await updateDoc(doc(db,"hiddenGems",gem.id),{latitude,longitude,coordinatesUpdatedAt:new Date().toISOString()});setGem((old)=>({...old,latitude,longitude}));}
                        catch(saveError){console.warn("Could not save coordinates:",saveError);}
                    }
                }
                if(!Number.isFinite(latitude)||!Number.isFinite(longitude))throw new Error("Location coordinates not found.");
                setCoordinates({latitude,longitude});
                const weatherResponse=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=3&timezone=auto`);
                if(!weatherResponse.ok)throw new Error("Weather request failed.");
                setWeather(await weatherResponse.json());
            }catch(err){console.error("Location/weather error:",err);}
            finally{setLocationLoading(false);setWeatherLoading(false);}
        };
        loadLocationAndWeather();
    },[gem]);

    if(loading)return <main className="gem-details-page"><div className="gem-details-loading">Loading hidden gem... ⏳</div></main>;
    if(error||!gem)return <main className="gem-details-page"><div className="gem-details-error"><div className="gem-details-icon">💎</div><h1>Hidden Gem</h1><p>{error}</p><button className="gem-details-back-btn" onClick={()=>navigate("/hidden-gems")}>← Back to Hidden Gems</button></div></main>;

    const images=gem.images?.length>0?gem.images:gem.image?[gem.image]:[];
    const mapEmbedUrl=coordinates?`https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.longitude-0.015}%2C${coordinates.latitude-0.015}%2C${coordinates.longitude+0.015}%2C${coordinates.latitude+0.015}&layer=mapnik&marker=${coordinates.latitude}%2C${coordinates.longitude}`:"";

    return <main className="gem-details-page"><div className="gem-details-container">
        <button className="gem-details-back" onClick={()=>navigate(-1)}>← Back</button>
        <section className="gem-details-hero">{images.length>0?<img src={images[0]} alt={gem.name}/>:<div className="gem-details-no-image">💎</div>}<div className="gem-details-hero-overlay"><span>💎 Hidden Gem</span><h1>{gem.name}</h1><p>📍 {gem.city}, {gem.state}</p></div></section>
        <div className="gem-details-layout"><section className="gem-details-main"><span className="gem-details-category">{gem.category}</span><h2>About this place</h2><p className="gem-details-description">{gem.description}</p>{gem.whySpecial&&<><h2>✨ Why is it special?</h2><p className="gem-details-description">{gem.whySpecial}</p></>}{images.length>1&&<section className="gem-details-gallery"><h2>📸 Photos</h2><div className="gem-details-photo-grid">{images.map((image,index)=><img key={index} src={image} alt={`${gem.name} ${index+1}`}/>)}</div></section>}</section>
        <aside className="gem-details-card"><div className="gem-detail-item"><span>📍 Location</span><strong>{gem.city}, {gem.state}</strong></div><div className="gem-detail-item"><span>🏷️ Category</span><strong>{gem.category}</strong></div>{gem.bestTime&&<div className="gem-detail-item"><span>🕐 Best time</span><strong>{gem.bestTime}</strong></div>}{gem.submittedByName&&<div className="gem-detail-item"><span>🤝 Submitted by</span><strong>{gem.submittedByName}</strong></div>}{gem.mapUrl&&<button className="gem-view-map-btn" onClick={()=>window.open(gem.mapUrl,"_blank","noopener,noreferrer")}>📍 Open in Maps</button>}</aside></div>
        <section className="gem-extras-grid"><div className="gem-extra-card"><div className="gem-extra-header"><div><p className="section-label">LOCATION</p><h2>📍 Explore on map</h2></div>{coordinates&&<span className="gem-coordinate-badge">{coordinates.latitude.toFixed(3)}, {coordinates.longitude.toFixed(3)}</span>}</div>{locationLoading?<div className="gem-extra-loading">Finding this place on the map... ⏳</div>:coordinates?<iframe className="gem-map-frame" title={`Map showing ${gem.name}`} src={mapEmbedUrl} loading="lazy"/>:<div className="gem-extra-empty">Map preview is unavailable for this place. {gem.mapUrl&&"Use Open in Maps above to view it."}</div>}</div>
        <div className="gem-extra-card gem-weather-card"><div className="gem-extra-header"><div><p className="section-label">LOCAL WEATHER</p><h2>🌤️ Weather here</h2></div>{weather?.timezone&&<span className="gem-coordinate-badge">Live forecast</span>}</div>{weatherLoading?<div className="gem-extra-loading">Checking local weather... 🌤️</div>:weather?.current?<><div className="gem-current-weather"><div className="gem-weather-icon">{weatherEmoji[weather.current.weather_code]||"🌤️"}</div><div><strong>{Math.round(weather.current.temperature_2m)}°C</strong><span>{weatherLabels[weather.current.weather_code]||"Current conditions"}</span></div></div><div className="gem-weather-stats"><span>🌡️ Feels like <strong>{Math.round(weather.current.apparent_temperature)}°C</strong></span><span>💧 Humidity <strong>{weather.current.relative_humidity_2m}%</strong></span><span>💨 Wind <strong>{Math.round(weather.current.wind_speed_10m)} km/h</strong></span></div><div className="gem-forecast">{weather.daily.time.map((date,index)=><div key={date} className="gem-forecast-day"><strong>{formatDay(date)}</strong><span>{weatherEmoji[weather.daily.weather_code[index]]||"🌤️"}</span><small>{Math.round(weather.daily.temperature_2m_max[index])}° / {Math.round(weather.daily.temperature_2m_min[index])}°</small></div>)}</div><p className="gem-weather-source">Weather data by Open-Meteo • Updated forecast</p></>:<div className="gem-extra-empty">Weather is currently unavailable for this place.</div>}</div></section>
    </div></main>;
}
export default HiddenGemDetails;
