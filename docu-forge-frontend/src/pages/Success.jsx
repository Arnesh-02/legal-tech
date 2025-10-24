import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function Success() {
  const location = useLocation();
  const navigate = useNavigate();

  const [instructions, setInstructions] = useState("");
  const [showRedraftBox, setShowRedraftBox] = useState(false);
  const [redrafted, setRedrafted] = useState(null);

  const handleRedraft = async () => {
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

        // Auto download PDF
        const res2 = await fetch("http://127.0.0.1:5000/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html: data.redrafted_html }),
        });

        const blob = await res2.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "redrafted_agreement.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      console.error("Redraft error:", err);
    }
  };

  return (
    <div className="success-layout">
      <main className="success-container">
        <h2>Download Complete ✅</h2>
        <p>Your document has been successfully downloaded.</p>

        <div className="success-buttons">
          <button onClick={() => navigate("/generate")}>
            Craft Another Document
          </button>
          <button onClick={() => setShowRedraftBox(true)}>
            Redraft using AI
          </button>
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

        {redrafted && (
          <div className="redraft-preview">
            <h3>Redrafted Contract Preview:</h3>
            <div
              dangerouslySetInnerHTML={{ __html: redrafted }}
              className="contract-preview"
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default Success;
