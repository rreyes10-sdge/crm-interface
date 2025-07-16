import os
import requests
from flask import Flask, request, jsonify
import json

app = Flask(__name__)

# Disable debug mode to avoid context issues in Colab
app.debug = False

# Set your OpenRouter API key here
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY") or "sk-..."
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "HTTP-Referer": "http://127.0.0.1:5000",
    "Content-Type": "application/json",
}

# Define tools (MVP functions)
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_missing_attributes",
            "description": "Returns the list of missing attributes for a given project phase.",
            "parameters": {
                "type": "object",
                "properties": {
                    "project_number": {"type": "string"},
                    "phase": {"type": "string"},
                },
                "required": ["project_number", "phase"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_user_edits",
            "description": "Returns a report of user edits in a given timeframe.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string"},
                    "start_date": {"type": "string", "format": "date"},
                    "end_date": {"type": "string", "format": "date"},
                },
                "required": ["user_id", "start_date", "end_date"],
            },
        },
    },
]

# Tool implementations (calls your local endpoints)
def get_missing_attributes(project_number, phase):
    try:
        response = requests.get(
            f"http://localhost:5000/api/projects/{project_number}/missing-attributes",
            params={"phase": phase},
            timeout=10
        )
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": f"Failed to connect to backend: {str(e)}"}

def get_user_edits(user_id, start_date, end_date):
    try:
        response = requests.get(
            "http://localhost:5000/api/user-edits",
            params={"user_id": user_id, "start_date": start_date, "end_date": end_date},
            timeout=10
        )
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": f"Failed to connect to backend: {str(e)}"}

@app.route("/chat", methods=["POST"])
def chat():
    try:
        user_input = request.json.get("input")

        if not user_input:
            return jsonify({"error": "Missing input"}), 400

        payload = {
            "model": "meta-llama/llama-4-maverick:free",
            "messages": [
                {
                    "role": "system",
                    "content": "You are an assistant that turns natural language into API calls.",
                },
                {"role": "user", "content": user_input},
            ],
            "tools": TOOLS,
            "tool_choice": "auto",
        }

        ai_response = requests.post(OPENROUTER_API_URL, headers=HEADERS, json=payload, timeout=30)

        if ai_response.status_code != 200:
            return jsonify({
                "error": "AI API call failed", 
                "status_code": ai_response.status_code,
                "details": ai_response.text
            }), 500

        result = ai_response.json()
        tool_calls = result.get("choices", [{}])[0].get("message", {}).get("tool_calls", [])

        if not tool_calls:
            return jsonify({"error": "No tool call made by AI", "raw": result}), 400

        tool_call = tool_calls[0]
        function_name = tool_call["function"]["name"]

        # Use json.loads instead of eval for safety
        try:
            arguments = json.loads(tool_call["function"]["arguments"])
        except json.JSONDecodeError:
            return jsonify({"error": "Invalid JSON in tool arguments"}), 400

        if function_name == "get_missing_attributes":
            output = get_missing_attributes(**arguments)
        elif function_name == "get_user_edits":
            output = get_user_edits(**arguments)
        else:
            output = {"error": f"Unknown function: {function_name}"}
        
        return jsonify(output)
    
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "service": "ai_bridge"})

# Colab-specific setup
def setup_colab():
    """Setup function for Colab environment"""
    print("Setting up AI Bridge for Colab...")
    print("Make sure to:")
    print("1. Set your OPENROUTER_API_KEY environment variable")
    print("2. Run your backend server on localhost:5000")
    print("3. Use ngrok to expose this service")

if __name__ == "__main__":
    setup_colab()
    # Use threaded=False to avoid context issues in Colab
    app.run(host="0.0.0.0", port=5050, threaded=False) 