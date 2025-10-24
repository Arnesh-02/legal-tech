import React from "react";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate("/home")}>Legal Tech</div>
      <div className="navbar-right">
        <div className="navbar-links">
          <a href="/">Home</a>
          <a href="/document">Templates</a>
          <a href="/about">About</a>
        </div>
        <div className="navbar-profile">
          <div className="profile-avatar">R</div>
          <span className="profile-name">Ravi</span>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
