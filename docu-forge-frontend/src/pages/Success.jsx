import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ClipLoader from "react-spinners/ClipLoader"; // stylish spinner

function Success() {
  const location = useLocation();
  const navigate = useNavigate();

  const [instructions, setInstructions] = useState("");
  const [showRedraftBox, setShowRedraftBox] = useState(false);
  const [loading, setLoading] = useState(false); // <-- loading state
  const [redrafted, setRedrafted] = useState(null);
  const [message, setMessage] = useState("");

  const handleRedraft = async () => {
    setLoading(true);
    setMessage("Redrafting your contract...");
    try {
      const response = await fetch("http://127.0.0.1:5000/redraft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: location.state?.html || "",
          instructions,
        }),
      });

      const data = await response.json();
      if (data.redrafted_html) {
        setRedrafted(data.redrafted_html);
        setMessage("Redraft complete! Click the button below to download.");
      }
    } catch (err) {
      console.error("Redraft error:", err);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!redrafted) return;

    setLoading(true);
    setMessage("Generating PDF...");
    try {
      const res = await fetch("http://127.0.0.1:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: redrafted }),
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "redrafted_agreement.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();

      setMessage("PDF downloaded successfully ✅");
    } catch (err) {
      console.error("PDF download error:", err);
      setMessage("Failed to generate PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="success-container">
      <h2>Document Ready</h2>
      <p>{message}</p>

      {loading && (
        <div className="loader-container">
          <ClipLoader color="#4B9CE2" size={60} />
        </div>
      )}

      <div className="success-buttons">
        <button onClick={() => navigate("/generate-nda")}>
          Craft Another Document
        </button>
        {redrafted && (
          <button onClick={downloadPDF}>Download Redrafted PDF</button>
        )}
        <button onClick={() => setShowRedraftBox(true)}>Redraft using AI</button>
      </div>

      {showRedraftBox && (
        <div className="redraft-box">
          <h3>Enter your requirements:</h3>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows="5"
            placeholder="e.g., Make it more formal and add a clause"
          />
          <button onClick={handleRedraft}>Submit Redraft</button>
        </div>
      )}
    </main>
  );
}

export default Success;
