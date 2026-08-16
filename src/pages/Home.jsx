import Hero from "../components/Hero";
import ExploreDestinations from "../components/ExploreDestinations";
import NearbyPlaces from "../components/NearbyPlaces";
import HiddenGems from "../components/HiddenGems";
import CrowdInsights from "../components/CrowdInsights";
import AIGuide from "../components/AIGuide";

function Home() {
    return (
        <>
            <Hero />
            <ExploreDestinations />
            <NearbyPlaces />
            <HiddenGems />
            <CrowdInsights />
            <AIGuide />
        </>
    );
}

export default Home;
