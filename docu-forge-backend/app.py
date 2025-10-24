from flask import Flask, request, send_file, render_template, jsonify, Response
from flask_cors import CORS
from weasyprint import HTML
from io import BytesIO
import os

app = Flask(__name__)
CORS(app)  # Allow React (localhost:3000) to access Flask (localhost:5000)

# ✅ Serve templates dynamically for live preview
@app.route("/get-template/<name>", methods=["GET"])
def get_template(name):
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
        return jsonify({"error": "Template not found"}), 404


# ✅ Generate PDF from filled data
@app.route("/generate", methods=["POST"])
def generate_pdf():
    data = request.get_json()
    document_type = data.get("document_type", "nda")
    context = data.get("context", {})

    # Choose correct template
    template_file = (
        "founders-agreement-template.html"
        if document_type == "founders"
        else "nda-agreement-template.html"
    )

    # Render HTML with given context
    rendered_html = render_template(template_file, **context)

    # Convert to PDF
    pdf_stream = BytesIO()
    HTML(string=rendered_html).write_pdf(pdf_stream)
    pdf_stream.seek(0)

    # Return generated PDF
    return send_file(
        pdf_stream,
        as_attachment=True,
        download_name=f"{document_type}_agreement.pdf",
        mimetype="application/pdf",
    )


@app.route("/")
def index():
    return jsonify({"message": "Document Generator Backend Running 🚀"})


if __name__ == "__main__":
    app.run(debug=True)
