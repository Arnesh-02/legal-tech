import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
// Removed: import "bootstrap/dist/css/bootstrap.min.css";
// Removed: import "../App.css";

function NDAPage() {
  const navigate = useNavigate();
  const previewPanelRef = useRef(null); // For interactive preview

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
  const [isDownloading, setIsDownloading] = useState(false); // For download button

  // Mapping for template placeholders (assuming dot-notation) to form keys
  // We use this for the LIVE PREVIEW replacement.
  const ALIASES = {
    "effective.date": "EFFECTIVE_DATE",
    "effective.day": "EFFECTIVE_DAY",
    "effective.month": "EFFECTIVE_MONTH",
    "effective.year": "EFFECTIVE_YEAR",
    "party.1.name": "PARTY_1_NAME",
    "party.1.address": "PARTY_1_ADDRESS",
    "party.1.short.name": "PARTY_1_SHORT_NAME",
    "party.1.signatory.name": "PARTY_1_SIGNATORY_NAME",
    "party.1.signatory.designation": "PARTY_1_SIGNATORY_DESIGNATION",
    "party.1.sign.place": "PARTY_1_SIGN_PLACE",
    "party.1.signature": "PARTY_1_SIGNATURE",
    "party.2.name": "PARTY_2_NAME",
    "party.2.address": "PARTY_2_ADDRESS",
    "party.2.signatory.name": "PARTY_2_SIGNATORY_NAME",
    "party.2.signatory.designation": "PARTY_2_SIGNATORY_DESIGNATION",
    "party.2.sign.place": "PARTY_2_SIGN_PLACE",
    "party.2.signature": "PARTY_2_SIGNATURE",
    "proposed.transaction": "PROPOSED_TRANSACTION",
  };

 const placeholderToKey = (ph) => {
  const clean = String(ph || "").trim();

  // safe check in case formData is undefined/null or has no prototype
  const hasKey = formData && Object.prototype.hasOwnProperty.call(formData, clean);
  if (hasKey) {
    return clean;
  }

  // dot-notation alias map (ALIASES defined above)
  const alias = ALIASES[clean.toLowerCase()];
  if (alias) return alias;

  // fallback: normalize to UPPER_SNAKE_CASE
  return clean.replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase();
};

  // Fetch the NDA template from backend
  useEffect(() => {
    fetch("http://127.0.0.1:5000/get-template/nda")
      .then((res) => res.text())
      .then((text) => {
        setTemplate(text);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching template:", err);
        setTemplate(
          "<p class='text-danger'>Error loading template. Please check backend.</p>"
        );
        setIsLoading(false);
      });
  }, []);

  // ✅ New useEffect for interactive preview (from FoundersPage)
  useEffect(() => {
    const panel = previewPanelRef.current;
    if (!panel || isLoading) return;

    const handleMouseOver = (e) => {
      const target = e.target;
      if (target.classList.contains("placeholder-blank")) {
        const key = target.dataset.key;
        if (key) {
          const inputEl = document.getElementById(key);
          if (inputEl) {
            inputEl.classList.add("form-control-highlight");
          }
        }
      }
    };

    const handleMouseOut = (e) => {
      const target = e.target;
      if (target.classList.contains("placeholder-blank")) {
        const key = target.dataset.key;
        if (key) {
          const inputEl = document.getElementById(key);
          if (inputEl) {
            inputEl.classList.remove("form-control-highlight");
          }
        }
      }
    };

    const handleClick = (e) => {
      const target = e.target;
      if (target.classList.contains("placeholder-blank")) {
        e.preventDefault();
        const key = target.dataset.key;
        if (key) {
          const inputEl = document.getElementById(key);
          if (inputEl) {
            inputEl.focus();
            const accordionBody = inputEl.closest(".accordion-collapse");
            if (accordionBody && !accordionBody.classList.contains("show")) {
              const button = document.querySelector(
                `[data-bs-target="#${accordionBody.id}"]`
              );
              if (button) {
                button.click();
              }
            }
          }
        }
      }
    };

    panel.addEventListener("mouseover", handleMouseOver);
    panel.addEventListener("mouseout", handleMouseOut);
    panel.addEventListener("click", handleClick);

    return () => {
      panel.removeEventListener("mouseover", handleMouseOver);
      panel.removeEventListener("mouseout", handleMouseOut);
      panel.removeEventListener("click", handleClick);
    };
  }, [isLoading]); // Runs once after template is loaded

  // ✅ Handle input change (from original NDAPage)
  const handleChange = (e) => {
    const { name, value } = e.target;

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

  // ✅ Handle signature upload (from original NDAPage)
  const handleSignatureUpload = (e, party) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () =>
      setFormData((prev) => ({ ...prev, [party]: reader.result }));
    reader.readAsDataURL(file);
  };

  // ✅ Helper for intuitive placeholder text
  const friendlyKey = (key) => {
    const names = {
      EFFECTIVE_DATE: "Effective Date",
      EFFECTIVE_DAY: "Day",
      EFFECTIVE_MONTH: "Month",
      EFFECTIVE_YEAR: "Year",
      PARTY_1_NAME: "Party 1 Name",
      PARTY_1_ADDRESS: "Party 1 Address",
      PARTY_1_SHORT_NAME: "Party 1 Short Name",
      PARTY_1_SIGNATORY_NAME: "Party 1 Signatory",
      PARTY_1_SIGNATORY_DESIGNATION: "Party 1 Designation",
      PARTY_1_SIGN_PLACE: "Party 1 Sign Place",
      PARTY_2_NAME: "Party 2 Name",
      PARTY_2_ADDRESS: "Party 2 Address",
      PARTY_2_SIGNATORY_NAME: "Party 2 Signatory",
      PARTY_2_SIGNATORY_DESIGNATION: "Party 2 Designation",
      PARTY_2_SIGN_PLACE: "Party 2 Sign Place",
      PROPOSED_TRANSACTION: "Proposed Transaction",
    };
    return names[key] || key.replace(/_/g, " ").toLowerCase();
  };

  // ✅ Updated blankSpan to be interactive
  const blankSpan = (key) => {
    // These keys are derived from EFFECTIVE_DATE, so we don't need a placeholder
    if (
      key === "EFFECTIVE_DAY" ||
      key === "EFFECTIVE_MONTH" ||
      key === "EFFECTIVE_YEAR"
    ) {
      return formData[key] || "____"; // Show default or blank
    }
    // These are file uploads, not text fields
    if (key.includes("SIGNATURE")) {
      return `<span class="placeholder-blank-file" data-key="${key}_UPLOAD" title="Upload a signature file"> [Upload Signature] </span>`;
    }

    const text = friendlyKey(key);
    return `<span class="placeholder-blank" data-key="${key}" title="Click to fill '${text}' in the form"> [${text}] </span>`;
  };

  // ✅ Generate dynamic preview (adapted from FoundersPage)
  const getPreview = () => {
    if (isLoading) return ""; // Show spinner instead
    if (!template) return "<p>No template loaded.</p>";

    let preview = template;
    const regex = /{{\s*([^}]+)\s*}}/g;

    preview = preview.replace(regex, (match, p1) => {
      const key = placeholderToKey(p1.trim());
      const value = formData[key];

      // Handle signatures
      if (key.includes("SIGNATURE") && value) {
        return `<img src="${value}" class="signature-image" alt="Signature" />`;
      }

      // Handle text values
      if (value) {
        return String(value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
      }

      // Handle blanks
      return blankSpan(key);
    });

    return preview;
  };

  // ✅ Download PDF (adapted from FoundersPage)
  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_type: "nda", // NDA document type
          context: formData,
        }),
      });

      if (!response.ok) {
        const errData = await response.text();
        console.error("Server error:", errData);
        throw new Error(`Failed to generate PDF: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "NDA_Agreement.pdf"; // NDA filename
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      // Navigate to success page with preview
      navigate("/download-complete", { state: { html: getPreview() } });
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Error generating PDF. Check the console for details.");
    } finally {
      setIsDownloading(false);
    }
  };

  // ✅ New renderField function
  const renderField = (
    key,
    label,
    type = "text",
    placeholder = "",
    options = []
  ) => {
    if (type === "select") {
      return (
        <div className="mb-3" key={key}>
          <label htmlFor={key} className="form-label fw-semibold">
            {label}
          </label>
          <select
            id={key}
            name={key}
            value={formData[key]}
            onChange={handleChange}
            className="form-select"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div className="mb-3" key={key}>
        <label htmlFor={key} className="form-label fw-semibold">
          {label}
        </label>
        <input
          type={type}
          className="form-control"
          id={key}
          name={key}
          value={formData[key] || ""}
          onChange={handleChange}
          placeholder={placeholder}
        />
      </div>
    );
  };

  // ✅ New renderFileUpload function
  const renderFileUpload = (key, label, partyKey) => (
    <div className="mb-3" key={key}>
      <label htmlFor={key} className="form-label fw-semibold">
        {label}
      </label>
      <input
        type="file"
        className="form-control"
        id={key} // ID for placeholder interaction
        accept="image/*"
        onChange={(e) => handleSignatureUpload(e, partyKey)}
      />
    </div>
  );

  const transactionOptions = [
    { value: "", label: "Select..." },
    { value: "Merger or Acquisition", label: "Merger or Acquisition" },
    { value: "Strategic Partnership", label: "Strategic Partnership" },
    { value: "Software Licensing", label: "Software Licensing" },
    { value: "Investment Review", label: "Investment Review" },
    { value: "Vendor/Supplier Agreement", label: "Vendor/Supplier Agreement" },
    { value: "Employment/Contractor", label: "Employment/Contractor" },
    { value: "Other", label: "Other" },
  ];

  return (
    <div className="container-fluid founders-page-container">
      {/* Adding styles directly to the component */}
      <style>{`
        .founders-page-container {
          padding-top: 2rem;
          padding-bottom: 2rem;
          background-color: #f8f9fa;
          min-height: calc(100vh - 70px); 
        }
        .form-panel {
          max-height: 85vh;
          overflow-y: auto;
          padding-right: 1rem;
        }
        .form-panel::-webkit-scrollbar {
          width: 8px;
        }
        .form-panel::-webkit-scrollbar-thumb {
          background-color: #ccc;
          border-radius: 4px;
        }
        .form-panel::-webkit-scrollbar-track {
          background-color: #f1f1f1;
        }
        .preview-panel {
          max-height: 85vh;
          overflow-y: auto;
          font-family: 'Times New Roman', Times, serif;
          font-size: 1.1rem;
          line-height: 1.6;
          background-color: #fff;
        }
        .preview-panel .card-body {
            padding: 2.5rem 3rem;
        }
        
        /* New Intuitive Styles */
        .placeholder-blank {
          font-weight: 600;
          color: #0d6efd;
          background-color: #e7f1ff;
          border: 1px dashed #0d6efd;
          padding: 0.1em 0.4em;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          font-size: 0.9em;
          font-family: Arial, sans-serif;
        }
        .placeholder-blank:hover {
            background-color: #cfe2ff;
            border-style: solid;
        }
        .placeholder-blank-file {
          font-weight: 600;
          color: #5a3c94;
          background-color: #f0eaff;
          border: 1px dashed #5a3c94;
          padding: 0.1em 0.4em;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          font-size: 0.9em;
          font-family: Arial, sans-serif;
        }
        .placeholder-blank-file:hover {
          background-color: #e0d6f9;
          border-style: solid;
        }
        .spinner-container {
            height: 100%;
            min-height: 400px;
        }
        .form-control-highlight {
          border-color: #0d6efd;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
          transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out;
        }
        /* Signature image style */
        .signature-image {
          max-width: 200px;
          max-height: 80px;
          margin-top: 10px;
        }
      `}</style>

      <div className="row">
        {/* Left Panel - Form */}
        <div className="col-lg-5">
          <div className="card shadow-sm form-panel">
            <div className="card-header bg-light">
              <h3 className="mb-0">NDA Agreement Details</h3>
            </div>
            <div className="card-body">
              <div className="accordion" id="formSections">
                {/* Section 1: Agreement Details */}
                <div className="accordion-item">
                  <h2 className="accordion-header" id="headingOne">
                    <button
                      className="accordion-button"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseOne"
                    >
                      Agreement Details
                    </button>
                  </h2>
                  <div
                    id="collapseOne"
                    className="accordion-collapse collapse show"
                    data-bs-parent="#formSections"
                  >
                    <div className="accordion-body">
                      {renderField("EFFECTIVE_DATE", "Effective Date", "date")}
                      {renderField(
                        "PROPOSED_TRANSACTION",
                        "Proposed Transaction",
                        "select",
                        "",
                        transactionOptions
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: Party 1 Details */}
                <div className="accordion-item">
                  <h2 className="accordion-header" id="headingTwo">
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseTwo"
                    >
                      Party 1 Details
                    </button>
                  </h2>
                  <div
                    id="collapseTwo"
                    className="accordion-collapse collapse"
                    data-bs-parent="#formSections"
                  >
                    <div className="accordion-body">
                      {renderField(
                        "PARTY_1_NAME",
                        "Party 1 Name",
                        "text",
                        "e.g., Your Company Inc."
                      )}
                      {renderField(
                        "PARTY_1_ADDRESS",
                        "Party 1 Address",
                        "text",
                        "e.g., 123 Main St, Coimbatore"
                      )}
                      {renderField(
                        "PARTY_1_SHORT_NAME",
                        "Party 1 Short Name",
                        "text",
                        "e.g., YCI"
                      )}
                      {renderField(
                        "PARTY_1_SIGNATORY_NAME",
                        "Party 1 Signatory",
                        "text",
                        "e.g., John Doe"
                      )}
                      {renderField(
                        "PARTY_1_SIGNATORY_DESIGNATION",
                        "Party 1 Designation",
                        "text",
                        "e.g., CEO"
                      )}
                      {renderField(
                        "PARTY_1_SIGN_PLACE",
                        "Party 1 Sign Place",
                        "text",
                        "e.g., Coimbatore"
                      )}
                      {renderFileUpload(
                        "PARTY_1_SIGNATURE_UPLOAD", // Unique ID for the input
                        "Party 1 Signature",
                        "PARTY_1_SIGNATURE" // State key to update
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 3: Party 2 Details */}
                <div className="accordion-item">
                  <h2 className="accordion-header" id="headingThree">
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseThree"
                    >
                      Party 2 Details
                    </button>
                  </h2>
                  <div
                    id="collapseThree"
                    className="accordion-collapse collapse"
                    data-bs-parent="#formSections"
                  >
                    <div className="accordion-body">
                      {renderField(
                        "PARTY_2_NAME",
                        "Party 2 Name",
                        "text",
                        "e.g., Other Company LLC"
                      )}
                      {renderField(
                        "PARTY_2_ADDRESS",
                        "Party 2 Address",
                        "text",
                        "e.g., 456 Business Ave, Bangalore"
                      )}
                      {renderField(
                        "PARTY_2_SIGNATORY_NAME",
                        "Party 2 Signatory",
                        "text",
                        "e.g., Jane Smith"
                      )}
                      {renderField(
                        "PARTY_2_SIGNATORY_DESIGNATION",
                        "Party 2 Designation",
                        "text",
                        "e.g., Founder"
                      )}
                      {renderField(
                        "PARTY_2_SIGN_PLACE",
                        "Party 2 Sign Place",
                        "text",
                        "e.g., Bangalore"
                      )}
                      {renderFileUpload(
                        "PARTY_2_SIGNATURE_UPLOAD", // Unique ID
                        "Party 2 Signature",
                        "PARTY_2_SIGNATURE" // State key
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <button
                  className="btn btn-primary w-100 py-2"
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                  ) : (
                    "Generate & Download PDF"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="col-lg-7" ref={previewPanelRef}>
          <div className="card shadow-sm preview-panel">
            <div className="card-body">
              {isLoading ? (
                <div className="d-flex justify-content-center align-items-center spinner-container">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading Template...</span>
                  </div>
                </div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: getPreview() }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NDAPage;
