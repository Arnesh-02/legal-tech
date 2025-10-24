from flask import Blueprint, request, jsonify, send_file  # <-- Add send_file here
import requests
import json
import os
import uuid

redraft_bp = Blueprint("redraft", __name__, url_prefix="/redraft")

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_API_KEY = "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"
MODEL_NAME = "mistralai/mistral-7b-instruct"

# In-memory storage for demo (replace with DB/cache for production)
REDRAFT_TASKS = {}

def redraft_with_llm(original_html, user_request):
    prompt = f"""
You are a legal contract redrafting assistant.
Rewrite the HTML contract according to the user's instructions.

Requirements:
- Keep HTML minimal: <html>, <head>, <body>, <h1>/<h2>/<h3>, <p>.
- No styling <div>, <span>, or CSS.
- Keep placeholders like [Company Name], [Founder Name].
- Maintain meaning unless user requests changes.
- Use professional legal language.

Original contract:
{original_html}

User instructions:
{user_request}

Return only the full HTML.
"""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "Legal Contract Redrafting Assistant"
    }
    payload = {
        "model": MODEL_NAME,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.4,
        "max_tokens": 2000
    }

    response = requests.post(OPENROUTER_API_URL, headers=headers, data=json.dumps(payload), timeout=60)
    response.raise_for_status()
    result = response.json()
    return result["choices"][0]["message"]["content"].strip()

@redraft_bp.route("", methods=["POST"])
def redraft():
    try:
        data = request.get_json(force=True)
        original_html = data.get("html")
        user_request = data.get("instructions")

        if not original_html or not user_request:
            return jsonify({"error": "Missing 'html' or 'instructions'"}), 400

        # Generate a unique task ID
        task_id = str(uuid.uuid4())

        # Immediately return task ID to frontend
        REDRAFT_TASKS[task_id] = {
            "status": "processing",
            "html": None
        }

        # Process redraft in "background" (blocking here, async recommended)
        redrafted_html = redraft_with_llm(original_html, user_request)
        REDRAFT_TASKS[task_id]["status"] = "completed"
        REDRAFT_TASKS[task_id]["html"] = redrafted_html

        return jsonify({
            "message": "Redrafting in progress. Use the task ID to check status.",
            "task_id": task_id
        })

    except Exception as e:
        print("Error in redraft:", e)
        return jsonify({"error": str(e)}), 500

@redraft_bp.route("/status/<task_id>", methods=["GET"])
def get_redraft_status(task_id):
    task = REDRAFT_TASKS.get(task_id)
    if not task:
        return jsonify({"error": "Task ID not found"}), 404

    return jsonify({
        "status": task["status"],
        "download_ready": task["status"] == "completed"
    })

@redraft_bp.route("/download/<task_id>", methods=["GET"])
def download_redrafted(task_id):
    from weasyprint import HTML
    from io import BytesIO

    task = REDRAFT_TASKS.get(task_id)
    if not task or task["status"] != "completed":
        return jsonify({"error": "Task not completed yet"}), 400

    pdf_stream = BytesIO()
    HTML(string=task["html"]).write_pdf(pdf_stream)
    pdf_stream.seek(0)

    return send_file(
        pdf_stream,
        as_attachment=True,
        download_name="redrafted_contract.pdf",
        mimetype="application/pdf"
    )
