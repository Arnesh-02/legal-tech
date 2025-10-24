import React from "react";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">Legal Tech</div>
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
