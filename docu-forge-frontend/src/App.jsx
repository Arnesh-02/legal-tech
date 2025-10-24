import React from "react";
import "./App.css";
import { Routes, Route, Link } from "react-router-dom";

import Home from "./pages/home";
import DocumentPage from "./pages/DocumentPage";
import Success from "./pages/Success";
import FoundersPage from "./pages/FoundersPage";

// ✅ Navbar Component
function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">Legal Tech</div>
      <div className="navbar-right">
        <div className="navbar-links">
          <Link to="/">Home</Link>
          <Link to="/document">Templates</Link>
          <Link to="/about">About</Link>
        </div>
        <div className="navbar-profile">
          <div className="profile-avatar">R</div>
          <span className="profile-name">Ravi</span>
        </div>
      </div>
    </nav>
  );
}

// ✅ Footer Component
const Footer = () => (
  <footer className="footer-simple">
    &copy; {new Date().getFullYear()} Legal Tech Inc. All Rights Reserved.
  </footer>
);

// ✅ App Component (no <Router> here!)
function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/document" element={<DocumentPage />} />
        <Route path="/generate" element={<FoundersPage />} />
        <Route path="/download-complete" element={<Success />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
