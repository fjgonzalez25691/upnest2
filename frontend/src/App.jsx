import React from "react";
import { useAuth } from "react-oidc-context";
import { Route, Routes } from "react-router-dom";


// Components
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";


// Pages
import Landing from "./pages/Landing.jsx";

export default function App() {

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Landing />} />
      </Routes>
      <Footer />
    </>
  );
}
