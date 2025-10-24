import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import "../App.css"; // Removed this line to fix compilation error

function FoundersPage() {
  const navigate = useNavigate();

  const today = new Date();
  const isoToday = today.toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    // --- Date Fields ---
    EFFECTIVE_DATE: isoToday,

    // --- Company Details ---
    COMPANY_NAME: "",
    COMPANY_ADDRESS: "",
    COMPANY_SIGNATURE: null,
    COMPANY_SIGNATORY_NAME: "",
    COMPANY_SIGNATORY_DESIGNATION: "",

    // --- Founder Details ---
    FOUNDER_NAME: "",
    FOUNDER_ADDRESS: "",
    FOUNDER_DESIGNATION: "",
    FOUNDER_SALARY: "",
    FOUNDER_SALARY_WORDS: "",
    FOUNDER_SIGNATURE: null,

    // --- Agreement Terms ---
    NONCOMPETE_PERIOD: "12",
    NOTICE_PERIOD: "30",
    SEVERANCE_AMOUNT: "1",
    JURISDICTION_CITY: "Bangalore",
  });

  const [template, setTemplate] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Fetch template once
  useEffect(() => {
    fetch("http://127.0.0.1:5000/get-template/founders")
      .then((res) => res.text())
      .then((text) => {
        setTemplate(text);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching template:", err);
        setTemplate("<p>Error loading template. Please check the backend.</p>");
        setIsLoading(false);
      });
  }, []);

  // ✅ Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Simplified handler as we don't need to split date fields for this template
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ✅ Handle signature upload
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

    // --- Handle Image Placeholders First ---
    const companySigHtml = formData.COMPANY_SIGNATURE
      ? `<img src="${formData.COMPANY_SIGNATURE}" class="signature-image" alt="Signature" />`
      : "<u>__________</u>";
    // Replace the company signature placeholder
    preview = preview.replace("{{ company.authorized_signatory.signature }}", companySigHtml);

    const founderSigHtml = formData.FOUNDER_SIGNATURE
      ? `<img src="${formData.FOUNDER_SIGNATURE}" class="signature-image" alt="Signature" />`
      : "<u>__________</u>";
    // This specifically targets the typo in your template's founder signature block
    // It replaces "Signature{{ authorized.signatory.name }}" with the image
    preview = preview.replace("Signature{{ authorized.signatory.name }}", `Signature: ${founderSigHtml}`);

    // --- Handle Text Placeholders ---
    // These keys now match your template and have no duplicates
    const replacements = {
      "{{ effective.date }}": formData.EFFECTIVE_DATE,
      "{{ company.name }}": formData.COMPANY_NAME,
      "{{ company.address }}": formData.COMPANY_ADDRESS,
      "{{ founder.name }}": formData.FOUNDER_NAME,
      "{{ founder.address }}": formData.FOUNDER_ADDRESS,
      "{{ founder.designation }}": formData.FOUNDER_DESIGNATION,
      "{{ founder.salary }}": formData.FOUNDER_SALARY,
      "{{ founder.salary.words }}": formData.FOUNDER_SALARY_WORDS,
      "{{ noncompete.period }}": formData.NONCOMPETE_PERIOD,
      "{{ notice.period }}": formData.NOTICE_PERIOD,
      "{{ severance.amount }}": formData.SEVERANCE_AMOUNT,
      "{{ jurisdiction.city }}": formData.JURISDICTION_CITY,
      // This key is now unique and only maps to the company signatory name
      "{{ authorized.signatory.name }}": formData.COMPANY_SIGNATORY_NAME,
      "{{ authorized.signatory.designation }}": formData.COMPANY_SIGNATORY_DESIGNATION,
    };

    // Apply all text replacements
    for (const key in replacements) {
        // Create a global regex from the key to replace all occurrences
        const regex = new RegExp(key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
        preview = preview.replace(regex, replacements[key] || "<u>__________</u>");
    }

    return preview;
  };

  // ✅ Download PDF
  const handleDownloadPDF = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_type: "founders", // Corrected to match app.py
          context: formData, // Send the flat formData
        }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Founder_Agreement.pdf"; // Corrected download name
      document.body.appendChild(a);
      a.click();
      a.remove();

      navigate("/download-complete");
    } catch (err) {
      console.error("Error generating PDF:", err);
    }
  };

  // Helper for creating form fields
  const renderField = (key, label, type = "text") => (
    <div className="form-field" key={key}>
      <label>{label}</label>
      <input
        type={type}
        name={key}
        value={formData[key]}
        onChange={handleChange}
      />
    </div>
  );

  return (
    <div className="app-container">
      {/* Left panel */}
      <div className="form-section">
        <h2>Fill Founder Agreement</h2>

        <h3>Agreement Details</h3>
        {renderField("EFFECTIVE_DATE", "Effective Date", "date")}
        {renderField("JURISDICTION_CITY", "Jurisdiction City")}

        <h3>Company Details</h3>
        {renderField("COMPANY_NAME", "Company Name")}
        {renderField("COMPANY_ADDRESS", "Company Address")}
        {renderField("COMPANY_SIGNATORY_NAME", "Signatory Name")}
        {renderField("COMPANY_SIGNATORY_DESIGNATION", "Signatory Designation")}
        <div className="form-field">
          <label>Company Signature</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleSignatureUpload(e, "COMPANY_SIGNATURE")}
          />
        </div>

        <h3>Founder Details</h3>
        {renderField("FOUNDER_NAME", "Founder Name")}
        {renderField("FOUNDER_ADDRESS", "Founder Address")}
        {renderField("FOUNDER_DESIGNATION", "Founder Designation")}
        {renderField("FOUNDER_SALARY", "Salary (e.g., 1200000)")}
        {renderField("FOUNDER_SALARY_WORDS", "Salary in Words (e.g., Twelve Lakh)")}
         <div className="form-field">
          <label>Founder Signature</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleSignatureUpload(e, "FOUNDER_SIGNATURE")}
          />
        </div>

        <h3>Agreement Terms</h3>
        {renderField("NONCOMPETE_PERIOD", "Non-Compete Period (Months)", "number")}
        {renderField("NOTICE_PERIOD", "Notice Period (Days)", "number")}
        {renderField("SEVERANCE_AMOUNT", "Severance (Months)", "number")}
        
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

export default FoundersPage;


