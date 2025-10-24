import React from "react";
import "./App.css";
import { Routes, Route, Link } from "react-router-dom";

import Home from "./pages/home";
import NDAPage from "./pages/NDAPage";
import Success from "./pages/Success";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import FoundersPage from "./pages/FoundersPage"; 



// ✅ App Component (no <Router> here!)
function App() {
  return (
    <>
     <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/generate-nda" element={<NDAPage />} />
        <Route path="/generate-founders-agreement" element={<FoundersPage />} />
        <Route path="/download-complete" element={<Success />} />
      </Routes>
     <Footer />
    </>
  );
}

export default App;
