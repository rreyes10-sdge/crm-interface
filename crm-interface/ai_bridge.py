import os
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

# Set your OpenRouter API key here
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY") or "sk-..."
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "HTTP-Referer": "http://127.0.0.1:5000",  # Change if hosted elsewhere
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

    response = requests.get(
        f"http://localhost:5000/api/projects/{project_number}/missing-attributes",
        params={"phase": phase},
    )

    return response.json()


def get_user_edits(user_id, start_date, end_date):

    response = requests.get(
        "http://localhost:5000/api/user-edits",
        params={"user_id": user_id, "start_date": start_date, "end_date": end_date},
    )

    return response.json()


@app.route("/chat", methods=["POST"])
def chat():

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

    ai_response = requests.post(OPENROUTER_API_URL, headers=HEADERS, json=payload)

    if ai_response.status_code != 200:
        return (
            jsonify({"error": "AI API call failed", "details": ai_response.text}),
            500,
        )

    result = ai_response.json()

    tool_call = result.get("tool_calls", [{}])[0]

    if not tool_call:
        return jsonify({"error": "No tool call made by AI", "raw": result}), 400

    function_name = tool_call["function"]["name"]

    arguments = eval(
        tool_call["function"]["arguments"]
    )  # Consider using json.loads() instead

    if function_name == "get_missing_attributes":
        output = get_missing_attributes(**arguments)
    elif function_name == "get_user_edits":
        output = get_user_edits(**arguments)
    else:
        output = {"error": f"Unknown function: {function_name}"}
    return jsonify(output)


if __name__ == "__main__":
    app.run(debug=True, port=5050)