import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Explore from "./pages/Explore";
import AIGuidePage from "./pages/AIGuidePage";
import Guides from "./pages/Guides";
import Vendors from "./pages/Vendors";
import Login from "./pages/Login";
import PlaceDetails from "./pages/PlaceDetails";

function App() {
  return (
    <BrowserRouter>

      <Navbar />

      <main>

        <Routes>

          <Route path="/" element={<Home />} />

          <Route
            path="/explore"
            element={<Explore />}
          />

          <Route
            path="/ai-guide"
            element={<AIGuidePage />}
          />

          <Route
            path="/guides"
            element={<Guides />}
          />

          <Route
            path="/vendors"
            element={<Vendors />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/place/:id"
            element={<PlaceDetails />}
          />

        </Routes>

      </main>

    </BrowserRouter>
  );
}

export default App;