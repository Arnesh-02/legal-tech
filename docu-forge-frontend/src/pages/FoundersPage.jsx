import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * ✅ Final Integrated Version — FoundersPage.jsx (No Signatures)
 * Features:
 * - Fetches Founder Agreement template from backend
 * - Replaces {{ placeholders }} with live form data
 * - Shows blank underlines (_____) for empty fields
 * - Live preview updates instantly
 * - Download as PDF via backend
 */

function FoundersPage() {
  const navigate = useNavigate();
  const todayIso = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    EFFECTIVE_DATE: todayIso,
    COMPANY_NAME: "",
    COMPANY_ADDRESS: "",
    COMPANY_SIGNATORY_NAME: "",
    COMPANY_SIGNATORY_DESIGNATION: "",
    FOUNDER_NAME: "",
    FOUNDER_ADDRESS: "",
    FOUNDER_DESIGNATION: "",
    FOUNDER_SALARY: "",
    FOUNDER_SALARY_WORDS: "",
    NONCOMPETE_PERIOD: "12",
    NOTICE_PERIOD: "30",
    SEVERANCE_AMOUNT: "1",
    JURISDICTION_CITY: "Chennai",
  });

  const [template, setTemplate] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Mapping between template placeholders and form keys
  // We use this for the LIVE PREVIEW replacement.
  const ALIASES = {
    "company.name": "COMPANY_NAME",
    "company.address": "COMPANY_ADDRESS",
    "authorized.signatory.name": "COMPANY_SIGNATORY_NAME",
    "authorized.signatory.designation": "COMPANY_SIGNATORY_DESIGNATION",
    "founder.name": "FOUNDER_NAME",
    "founder.address": "FOUNDER_ADDRESS",
    "founder.designation": "FOUNDER_DESIGNATION",
    "founder.salary": "FOUNDER_SALARY",
    "founder.salary.words": "FOUNDER_SALARY_WORDS",
    "noncompete.period": "NONCOMPETE_PERIOD",
    "notice.period": "NOTICE_PERIOD",
    "severance.amount": "SEVERANCE_AMOUNT",
    "effective.date": "EFFECTIVE_DATE",
    "jurisdiction.city": "JURISDICTION_CITY",
  };

  const placeholderToKey = (ph) => {
    const clean = ph.trim();
    return ALIASES[clean] || clean.replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase();
  };

  // Fetch the Founder template from backend
  useEffect(() => {
    // Make sure your backend server is running on http://127.0.0.1:5000
    fetch("http://127.0.0.1:5000/get-template/founders")
      .then((res) => res.text())
      .then((text) => {
        setTemplate(text);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching template:", err);
        setTemplate("<p>Error loading template. Please check backend.</p>");
        setIsLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  // Underline span for empty fields
  const blankSpan = (key, approxLen = 12) =>
    `<span class="placeholder-blank" data-key="${key}">${"_".repeat(
      approxLen
    )}</span>`;

  // Build the live preview from template
  const getPreview = () => {
    if (isLoading) return "<p>Loading template…</p>";
    if (!template) return "<p>No template loaded.</p>";

    let preview = template;
    // This regex finds placeholders like {{ company.name }}
    const regex = /{{\s*([^}]+)\s*}}/g;

    preview = preview.replace(regex, (match, p1) => {
      // p1 is the text inside {{ }}, e.g., "company.name"
      const key = placeholderToKey(p1); // Converts "company.name" to "COMPANY_NAME"
      const value = formData[key];

      // Handle normal text placeholders
      if (value && value !== "") {
        // Escape HTML safely for text fields
        const escaped = String(value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        return escaped;
      }

      // Handle empty values → underline placeholder
      return blankSpan(key, Math.min(20, Math.max(10, p1.length)));
    });

    return preview;
  };

  // Download as PDF
   const handleDownloadPDF = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_type: "founders", // This is correct
          context: formData, // Send the complete form data
        }),
      });

      if (!response.ok) {
         // Log the server error if possible
        const errData = await response.text();
        console.error("Server error:", errData);
        throw new Error(`Failed to generate PDF: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Founders_Agreement.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url); // Clean up the object URL

      navigate("/download-complete"); // Uncomment if you have this route
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Error generating PDF. Check the console for details.");
    }
  };

  const renderField = (key, label, type = "text", placeholder = "") => (
    <div className="form-field" key={key} style={{ marginBottom: 10 }}>
      <label style={{ display: "block", fontWeight: 600 }}>{label}</label>
      <input
        type={type}
        name={key}
        // Use formData[key] or fallback to empty string if it's null/undefined
        value={formData[key] || ""}
        onChange={handleChange}
        placeholder={placeholder}
        style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
      />
    </div>
  );

  return (
    <div
      style={{ display: "flex", gap: 24, padding: 24, fontFamily: "sans-serif" }}
    >
      <style>{`
        .preview-panel {
          width: 60%;
          border: 1px solid #ddd;
          padding: 18px;
          border-radius: 6px;
          background: #fff;
          max-height: 80vh;
          overflow: auto;
        }
        .form-panel { width: 40%; max-height: 80vh; overflow: auto; }
        .placeholder-blank {
          display: inline-block;
          min-width: 100px;
          height: 1.2em;
          vertical-align: bottom;
          /* You can add a border-bottom here if you want underlines */
          /* border-bottom: 1px solid #888; */
        }
        /* Signature styles are no longer needed */
      `}</style>

      {/* Left Panel - Form */}
      <div className="form-panel">
        <h2>Fill Founder Agreement</h2>

        <section>
          <h4>Agreement Details</h4>
          {renderField("EFFECTIVE_DATE", "Effective Date", "date")}
          {renderField("JURISDICTION_CITY", "Jurisdiction City")}
        </section>

        <section>
          <h4>Company Details</h4>
          {renderField("COMPANY_NAME", "Company Name")}
          {renderField("COMPANY_ADDRESS", "Company Address")}
          {renderField("COMPANY_SIGNATORY_NAME", "Authorized Signatory Name")}
          {renderField("COMPANY_SIGNATORY_DESIGNATION", "Signatory Designation")}
          {/* Signature upload removed */}
        </section>

        <section>
          <h4>Founder Details</h4>
          {renderField("FOUNDER_NAME", "Founder Name")}
          {renderField("FOUNDER_ADDRESS", "Founder Address")}
          {renderField("FOUNDER_DESIGNATION", "Founder Designation")}
          {renderField("FOUNDER_SALARY", "Salary (₹)", "number")}
          {renderField("FOUNDER_SALARY_WORDS", "Salary in Words")}
          {/* Signature upload removed */}
        </section>

        <section>
          <h4>Agreement Terms</h4>
          {renderField("NONCOMPETE_PERIOD", "Non-Compete (months)", "number")}
          {renderField("NOTICE_PERIOD", "Notice Period (days)", "number")}
          {renderField("SEVERANCE_AMOUNT", "Severance (months)", "number")}
        </section>

        <div style={{ marginTop: 20 }}>
          <button
            onClick={handleDownloadPDF}
            style={{ padding: "10px 14px", cursor: "pointer" }}
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div
        className="preview-panel"
        id="contract-preview"
        dangerouslySetInnerHTML={{ __html: getPreview() }}
      />
    </div>
  );
}

export default FoundersPage;

