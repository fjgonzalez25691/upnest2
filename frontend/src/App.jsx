import React from "react";

import { Route, Routes } from "react-router-dom";

// Components
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import AuthTokenSetup from "./auth/AuthTokenSetup.jsx";

// Auth
import ProtectedRoute from "./auth/ProtectedRoute.jsx";

// Pages
import Landing from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import BabyProfile from "./pages/babies/BabyProfile.jsx";
import AddBaby from "./pages/babies/AddBaby.jsx";
import AddMeasurement from "./pages/measurements/AddMeasurement.jsx";
import GrowthTracking from "./pages/measurements/GrowthTracking.jsx";
import PercentilesView from "./pages/measurements/PercentilesView.jsx";
import EditMeasurement from "./pages/measurements/EditMeasurement.jsx";
import TestPollingCounter from "./test/TestPollingCounter.jsx";

// Growth Tracking Pages
/* import GrowthTracking from "./pages/GrowthTracking.jsx";
import AddMeasurement from "./pages/AddMeasurement.jsx";
import GrowthHistory from "./pages/GrowthHistory.jsx";
import EditMeasurement from "./pages/EditMeasurement.jsx"; */

export default function App() {
  return (
    <>
      <AuthTokenSetup />
      <Header />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/baby/:babyId" element={<ProtectedRoute element={<BabyProfile />} />} />
        <Route path="/add-baby" element={<ProtectedRoute element={<AddBaby />} />} />
        
        {/* Growth Tracking Routes */}
        <Route path="/add-measurement" element={<ProtectedRoute element={<AddMeasurement />} />} />
        <Route path="/baby/:babyId/growth/tracking" element={<ProtectedRoute element={<GrowthTracking />} />} />
        <Route path="/baby/:babyId/charts" element={<ProtectedRoute element={<PercentilesView />} />} />
        <Route path="/edit-measurement/:measurementId" element={<ProtectedRoute element={<EditMeasurement />} />} />
        <Route path="/test-polling-counter" element={<ProtectedRoute element={<TestPollingCounter />} />} />
      </Routes>
      <Footer />
    </>
  );
}
