from flask import Blueprint, request, jsonify
from transformers import pipeline

# Blueprint so you can import into app.py
redraft_bp = Blueprint("redraft", __name__)

# Load once (choose model: contract_drafter OR mistral/llama)
generator = pipeline("text-generation", model="mistralai/Mistral-7B-Instruct-v0.2")

def redraft_with_llm(original_html, user_request):
    prompt = f"""
    You are a contract redrafting assistant.
    Original contract (HTML format): {original_html}

    User request: {user_request}

    Rewrite the contract accordingly. Keep valid HTML structure.
    """

    result = generator(prompt, max_new_tokens=1024, do_sample=True, temperature=0.7)
    return result[0]["generated_text"]

# Flask endpoint
@redraft_bp.route("/redraft", methods=["POST"])
def redraft():
    try:
        data = request.get_json(force=True)
        original_html = data.get("html")
        user_request = data.get("instructions")

        if not original_html or not user_request:
            return jsonify({"error": "Missing 'html' or 'instructions'"}), 400

        redrafted_html = redraft_with_llm(original_html, user_request)
        return jsonify({"redrafted_html": redrafted_html})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
