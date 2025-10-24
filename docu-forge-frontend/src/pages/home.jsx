import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="app-layout">
      <Navbar />

      <main className="home-container">
        <h1>Welcome to Legal Tech</h1>
        <p>Choose an option to get started:</p>
        <div className="home-buttons">
          <button onClick={() => navigate("/generate")}>
            Document Generation
          </button>
          <button onClick={() => navigate("/risk")}>
            Risk Analysis
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Home;
