import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
// Removed: import "bootstrap/dist/css/bootstrap.min.css";
// Removed: import "../App.css";

// We need bootstrap's JS for the accordion collapse to work via click
// This is a common way to import it in a React component if not done globally
// Removed: import "bootstrap/dist/js/bootstrap.bundle.min.js";

function FoundersPage() {
  const navigate = useNavigate();
  const todayIso = new Date().toISOString().split("T")[0];
  const previewPanelRef = useRef(null); // Ref for the preview panel

  const [formData, setFormData] = useState({
    EFFECTIVE_DATE: todayIso, // Stays in state to be sent to backend
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
    JURISDICTION_CITY: "Coimbatore", // Stays in state
  });

  const [template, setTemplate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  // ALIASES remain the same
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

  useEffect(() => {
    fetch("http://127.0.0.1:5000/get-template/founders")
      .then((res) => res.text())
      .then((text) => {
        setTemplate(text);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching template:", err);
        setTemplate(
          "<p class='text-danger'>Error loading template. Please check the backend connection.</p>"
        );
        setIsLoading(false);
      });
  }, []);

  // ✅ New useEffect for interactive preview
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
        const key = target.dataset.key;
        if (key) {
          const inputEl = document.getElementById(key);
          if (inputEl) {
            // Focus the input
            inputEl.focus();

            // Find its parent accordion section and open it
            const accordionBody = inputEl.closest(".accordion-collapse");
            if (accordionBody && !accordionBody.classList.contains("show")) {
              const button = document.querySelector(
                `[data-bs-target="#${accordionBody.id}"]`
              );
              if (button) {
                button.click(); // Programmatically click the accordion button
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  // ✅ Helper for more intuitive placeholder text
  const friendlyKey = (key) => {
    const names = {
      COMPANY_NAME: "Company Name",
      COMPANY_ADDRESS: "Company Address",
      COMPANY_SIGNATORY_NAME: "Signatory Name",
      COMPANY_SIGNATORY_DESIGNATION: "Signatory Designation",
      FOUNDER_NAME: "Founder Name",
      FOUNDER_ADDRESS: "Founder Address",
      FOUNDER_DESIGNATION: "Founder Designation",
      FOUNDER_SALARY: "Salary Amount",
      FOUNDER_SALARY_WORDS: "Salary in Words",
      NONCOMPETE_PERIOD: "Non-compete Period",
      NOTICE_PERIOD: "Notice Period",
      SEVERANCE_AMOUNT: "Severance Amount",
    };
    return names[key] || key.replace(/_/g, " ").toLowerCase();
  };

  // ✅ Updated blankSpan to be more intuitive
  const blankSpan = (key) => {
    const text = friendlyKey(key);
    return `<span class="placeholder-blank" data-key="${key}" title="Click to fill '${text}' in the form"> [${text}] </span>`;
  };

  const getPreview = () => {
    if (isLoading) return ""; // We'll show a spinner instead
    if (!template) return "<p>No template loaded.</p>";

    let preview = template;
    const regex = /{{\s*([^}]+)\s*}}/g;

    preview = preview.replace(regex, (match, p1) => {
      const key = placeholderToKey(p1);
      const value = formData[key];
      if (value) {
        return String(value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
      }
      // These fields are pre-filled and have no input, so they should never be blank
      if (key === "EFFECTIVE_DATE" || key === "JURISDICTION_CITY") {
        return formData[key]; // Should always have a value
      }
      return blankSpan(key);
    });

    return preview;
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_type: "founders", context: formData }),
      });

      if (!response.ok) {
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
      window.URL.revokeObjectURL(url);

      navigate("/download-complete", { state: { html: getPreview() } });
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Error generating PDF. Check the console for details.");
    } finally {
      setIsDownloading(false);
    }
  };

  const renderField = (key, label, type = "text", placeholder = "") => (
    <div className="mb-3" key={key}>
      <label htmlFor={key} className="form-label fw-semibold">
        {label}
      </label>
      <input
        type={type}
        className="form-control"
        id={key} // ID is crucial for the highlight interaction
        name={key}
        value={formData[key] || ""}
        onChange={handleChange}
        placeholder={placeholder}
      />
    </div>
  );

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
        
        /* ✅ New Intuitive Styles */
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
          font-family: Arial, sans-serif; /* Use a sans-serif font for the tag */
        }
        .placeholder-blank:hover {
            background-color: #cfe2ff;
            border-style: solid;
        }
        .spinner-container {
            height: 100%;
            min-height: 400px;
        }
        /* ✅ Style for the highlighted input */
        .form-control-highlight {
          border-color: #0d6efd;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
          transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out;
        }
      `}</style>

      <div className="row">
        {/* Left Panel - Form */}
        <div className="col-lg-5">
          <div className="card shadow-sm form-panel">
            <div className="card-header bg-light">
              <h3 className="mb-0">Founder's Agreement Details</h3>
            </div>
            <div className="card-body">
              <div className="accordion" id="formSections">
                {/* ✅ Section 1 Removed 
                  "Agreement Details" (Date & City) are now handled by default.
                */}

                {/* Section 2: Company Details (now starts expanded) */}
                <div className="accordion-item">
                  <h2 className="accordion-header" id="headingTwo">
                    <button
                      className="accordion-button" // No 'collapsed' class
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseTwo"
                    >
                      Company Details
                    </button>
                  </h2>
                  <div
                    id="collapseTwo"
                    className="accordion-collapse collapse show" // 'show' class
                    data-bs-parent="#formSections"
                  >
                    <div className="accordion-body">
                      {renderField(
                        "COMPANY_NAME",
                        "Company Name",
                        "text",
                        "e.g., TechInnovate Pvt. Ltd."
                      )}
                      {renderField(
                        "COMPANY_ADDRESS",
                        "Company Address",
                        "text",
                        "e.g., 123 Tech Park, Saravanampatti"
                      )}
                      {renderField(
                        "COMPANY_SIGNATORY_NAME",
                        "Authorized Signatory Name",
                        "text",
                        "e.g., Jane Doe"
                      )}
                      {renderField(
                        "COMPANY_SIGNATORY_DESIGNATION",
                        "Signatory Designation",
                        "text",
                        "e.g., CEO"
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 3: Founder Details */}
                <div className="accordion-item">
                  <h2 className="accordion-header" id="headingThree">
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseThree"
                    >
                      Founder Details
                    </button>
                  </h2>
                  <div
                    id="collapseThree"
                    className="accordion-collapse collapse"
                    data-bs-parent="#formSections"
                  >
                    <div className="accordion-body">
                      {renderField(
                        "FOUNDER_NAME",
                        "Founder Name",
                        "text",
                        "e.g., Ravi Kumar"
                      )}
                      {renderField(
                        "FOUNDER_ADDRESS",
                        "Founder Address",
                        "text",
                        "e.g., 456 Main St, R.S. Puram"
                      )}
                      {renderField(
                        "FOUNDER_DESIGNATION",
                        "Founder Designation",
                        "text",
                        "e.g., CTO"
                      )}
                      {renderField(
                        "FOUNDER_SALARY",
                        "Salary (₹)",
                        "number",
                        "e.g., 150000"
                      )}
                      {renderField(
                        "FOUNDER_SALARY_WORDS",
                        "Salary in Words",
                        "text",
                        "e.g., One Lakh Fifty Thousand"
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 4: Agreement Terms */}
                <div className="accordion-item">
                  <h2 className="accordion-header" id="headingFour">
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseFour"
                    >
                      Agreement Terms
                    </button>
                  </h2>
                  <div
                    id="collapseFour"
                    className="accordion-collapse collapse"
                    data-bs-parent="#formSections"
                  >
                    <div className="accordion-body">
                      {renderField(
                        "NONCOMPETE_PERIOD",
                        "Non-Compete (months)",
                        "number",
                        "e.g., 12"
                      )}
                      {renderField(
                        "NOTICE_PERIOD",
                        "Notice Period (days)",
                        "number",
                        "e.g., 30"
                      )}
                      {renderField(
                        "SEVERANCE_AMOUNT",
                        "Severance (months)",
                        "number",
                        "e.g., 1"
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
        <div
          className="col-lg-7"
          ref={previewPanelRef} // ✅ Added ref
        >
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

export default FoundersPage;
