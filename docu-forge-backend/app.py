from flask import Flask, request, send_file, render_template, jsonify, Response
from flask_cors import CORS
from weasyprint import HTML
from io import BytesIO
import os
import re # <-- Import Regular Expressions

# Import the blueprint
from redraft import redraft_bp

app = Flask(__name__)

# Enable CORS globally for all routes (including blueprint routes)
CORS(app, origins=["http://localhost:5173"])  

app.config['TEMPLATES_AUTO_RELOAD'] = True

# Register the blueprint
app.register_blueprint(redraft_bp)

@app.route("/get-template/<name>", methods=["GET"])
def get_template(name):
    """
    Serves the raw HTML template text to the React frontend for live preview.
    """
    file_map = {
        "nda": "nda-agreement-template.html",
        "founders": "founders-agreement-template.html",
    }
    
    file_name = file_map.get(name, "nda-agreement-template.html")
    template_path = os.path.join(app.root_path, "templates", file_name)

    if os.path.exists(template_path):
        with open(template_path, "r", encoding="utf-8") as f:
            return Response(f.read(), mimetype="text/html")
    else:
        return jsonify({"error": f"Template not found: {template_path}"}), 404


@app.route("/generate", methods=["POST"])
def generate_pdf():
    """
    Generates the PDF from the submitted data.
    This version uses Regex to handle messy placeholders and adds
    a visible line for empty fields.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data received"}), 400

        document_type = data.get("document_type", "nda")
        context = data.get("context", {})

        print(f"--- Generating PDF for: {document_type} ---")

        template_file_name = (
            "founders-agreement-template.html"
            if document_type == "founders"
            else "nda-agreement-template.html"
        )
        template_path = os.path.join(app.root_path, "templates", template_file_name)

        if not os.path.exists(template_path):
            return jsonify({"error": f"Template file not found: {template_path}"}), 404
            
        # This map MUST match the ALIASES in your FoundersPage.jsx
        ALIASES = {
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
        }

        # 1. Read the raw HTML template text
        with open(template_path, "r", encoding="utf-8") as f:
            rendered_html = f.read()

        # 2. Loop through the ALIASES map to perform replacement
        for template_key, data_key in ALIASES.items():
            
            value = context.get(data_key)
            str_value = str(value if value is not None else "")

            # --- FIX #1: "I need more space" ---
            # If the value is empty, replace it with a long underline
            if value is None or str_value.strip() == "":
                # Use non-breaking spaces (&nbsp;) and an underline
                replacement_value = "&nbsp;&nbsp;____________________&nbsp;&nbsp;"
            else:
                # Escape HTML special characters for security
                replacement_value = str_value.replace("&", "&amp;") \
                                         .replace("<", "&lt;") \
                                         .replace(">", "&gt;")
            
            # --- FIX #2: "Visible Placeholders" ---
            # Use a Regex to replace the placeholder, ignoring whitespace
            # This will find {{ key }}, {{key}}, {{  key  }}, etc.
            placeholder_regex = re.compile(r"{{\s*" + re.escape(template_key) + r"\s*}}")
            rendered_html = placeholder_regex.sub(replacement_value, rendered_html)

        # 3. Convert the manually-filled HTML to PDF
        pdf_stream = BytesIO()
        HTML(string=rendered_html, base_url=request.host_url).write_pdf(pdf_stream)
        pdf_stream.seek(0)

        # Return generated PDF
        return send_file(
            pdf_stream,
            as_attachment=True,
            download_name=f"{document_type}_agreement.pdf",
            mimetype="application/pdf",
        )
        
    except Exception as e:
        print(f"!!! SERVER ERROR in /generate: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/")
def index():
    return jsonify({"message": "Document Generator Backend Running 🚀"})


if __name__ == "__main__":
    app.run(debug=True)