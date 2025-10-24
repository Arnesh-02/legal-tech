import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function DocumentPage() {
  const navigate = useNavigate();

  const today = new Date();
  const isoToday = today.toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    EFFECTIVE_DATE: isoToday,
    EFFECTIVE_DAY: today.getDate(),
    EFFECTIVE_MONTH: today.toLocaleString("en-US", { month: "long" }),
    EFFECTIVE_YEAR: today.getFullYear(),

    PARTY_1_NAME: "",
    PARTY_1_ADDRESS: "",
    PARTY_1_SHORT_NAME: "",
    PARTY_2_NAME: "",
    PARTY_2_ADDRESS: "",
    PROPOSED_TRANSACTION: "",
    PARTY_1_SIGNATORY_NAME: "",
    PARTY_1_SIGNATORY_DESIGNATION: "",
    PARTY_1_SIGN_PLACE: "",
    PARTY_2_SIGNATORY_NAME: "",
    PARTY_2_SIGNATORY_DESIGNATION: "",
    PARTY_2_SIGN_PLACE: "",
    PARTY_1_SIGNATURE: null,
    PARTY_2_SIGNATURE: null,
  });

  const [template, setTemplate] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Fetch template once
  useEffect(() => {
    fetch("http://127.0.0.1:5000/get-template/nda")
      .then((res) => res.text())
      .then((text) => {
        setTemplate(text);
        setIsLoading(false);
      });
  }, []);

  // ✅ Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    // If user changes effective date, update day/month/year too
    if (name === "EFFECTIVE_DATE") {
      const date = new Date(value);
      setFormData((prev) => ({
        ...prev,
        EFFECTIVE_DATE: value,
        EFFECTIVE_DAY: date.getDate(),
        EFFECTIVE_MONTH: date.toLocaleString("en-US", { month: "long" }),
        EFFECTIVE_YEAR: date.getFullYear(),
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSignatureUpload = (e, party) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () =>
      setFormData((prev) => ({ ...prev, [party]: reader.result }));
    reader.readAsDataURL(file);
  };

  // ✅ Generate dynamic preview
  const getPreview = () => {
    if (isLoading) return "<p>Loading template...</p>";

    let preview = template;

    Object.keys(formData).forEach((key) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      const value = formData[key];

      if (key.includes("SIGNATURE") && value) {
        preview = preview.replace(
          regex,
          `<img src="${value}" class="signature-image" alt="Signature" />`
        );
      } else {
        preview = preview.replace(regex, value || "<u>__________</u>");
      }
    });

    return preview;
  };

  // ✅ Download PDF
  const handleDownloadPDF = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_type: "nda",
          context: formData,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "NDA_Agreement.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();

      navigate("/download-complete");
    } catch (err) {
      console.error("Error generating PDF:", err);
    }
  };

  return (
    <div className="app-container">
      {/* Left panel */}
      <div className="form-section">
        <h2>Fill NDA Agreement</h2>

        {/* Effective Date */}
        <div className="form-field">
          <label>Effective Date</label>
          <input
            type="date"
            name="EFFECTIVE_DATE"
            value={formData.EFFECTIVE_DATE}
            onChange={handleChange}
          />
        </div>

        {/* Proposed Transaction */}
        <div className="form-field">
          <label>Proposed Transaction</label>
          <select
            name="PROPOSED_TRANSACTION"
            value={formData.PROPOSED_TRANSACTION}
            onChange={handleChange}
          >
            <option value="">Select...</option>
            <option value="Merger or Acquisition">Merger or Acquisition</option>
            <option value="Strategic Partnership">Strategic Partnership</option>
            <option value="Software Licensing">Software Licensing</option>
            <option value="Investment Review">Investment Review</option>
          </select>
        </div>

        {/* Party 1 Inputs */}
        <h3>Party 1 Details</h3>
        {[
          "PARTY_1_NAME",
          "PARTY_1_ADDRESS",
          "PARTY_1_SHORT_NAME",
          "PARTY_1_SIGNATORY_NAME",
          "PARTY_1_SIGNATORY_DESIGNATION",
          "PARTY_1_SIGN_PLACE",
        ].map((key) => (
          <div className="form-field" key={key}>
            <label>{key.replace(/_/g, " ")}</label>
            <input
              type="text"
              name={key}
              value={formData[key]}
              onChange={handleChange}
            />
          </div>
        ))}

        <div className="form-field">
          <label>Party 1 Signature</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleSignatureUpload(e, "PARTY_1_SIGNATURE")}
          />
        </div>

        {/* Party 2 Inputs */}
        <h3>Party 2 Details</h3>
        {[
          "PARTY_2_NAME",
          "PARTY_2_ADDRESS",
          "PARTY_2_SIGNATORY_NAME",
          "PARTY_2_SIGNATORY_DESIGNATION",
          "PARTY_2_SIGN_PLACE",
        ].map((key) => (
          <div className="form-field" key={key}>
            <label>{key.replace(/_/g, " ")}</label>
            <input
              type="text"
              name={key}
              value={formData[key]}
              onChange={handleChange}
            />
          </div>
        ))}

        <div className="form-field">
          <label>Party 2 Signature</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleSignatureUpload(e, "PARTY_2_SIGNATURE")}
          />
        </div>

        <button onClick={handleDownloadPDF}>Download PDF</button>
      </div>

      {/* Right panel - Live preview */}
      <div className="preview-section">
        <div
          id="contract-preview"
          dangerouslySetInnerHTML={{ __html: getPreview() }}
        />
      </div>
    </div>
  );
}

export default DocumentPage;
