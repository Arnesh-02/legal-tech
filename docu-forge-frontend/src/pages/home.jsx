import React, { useState, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

// ...existing code...
function Home() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ddRef = useRef(null);

  // close dropdown on outside click or Escape
  useEffect(() => {
    const onDoc = (e) => {
      if (e.key === "Escape") return setOpen(false);
      if (ddRef.current && !ddRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onDoc);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onDoc);
    };
  }, []);

  return (
    <div className="app-layout">
      <div className="home-container" style={{ padding: 24 }}>
        <h1>Welcome to Legal Tech</h1>
        <p>Choose an option to get started:</p>

        <div className="home-buttons" style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div ref={ddRef} style={{ position: "relative" }}>
            <button
              className="btn"
              aria-expanded={open}
              aria-haspopup="menu"
              onClick={() => setOpen((s) => !s)}
            >
              Document ▾
            </button>

            {open && (
              <div
                role="menu"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  minWidth: 180,
                  background: "#fff",
                  borderRadius: 8,
                  boxShadow: "0 8px 30px rgba(2,6,23,0.08)",
                  padding: 8,
                  zIndex: 50,
                }}
              >
                <button
                  className="btn-ghost"
                  role="menuitem"
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px", marginBottom: 6 }}
                  onClick={() => { setOpen(false); navigate("/generate-founders-agreement"); }}
                >
                  Founders Agreement
                </button>
                <button
                  className="btn-ghost"
                  role="menuitem"
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px" }}
                  onClick={() => { setOpen(false); navigate("/generate-nda"); }}
                >
                  NDA Document
                </button>
              </div>
            )}
          </div>

          <button className="btn" onClick={() => navigate("/risk")}>
            Risk Analysis
          </button>
        </div>
      </div>

     
    </div>
  );
}

export default Home;
// ...existing code...