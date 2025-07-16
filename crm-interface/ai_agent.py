
import requests
import json
from graphql_app.tools.get_missing_attributes import get_missing_attributes
from graphql_app.tools.get_user_edits import get_user_edits

COLAB_CHAT_ENDPOINT = "https://69687616b7db.ngrok-free.app/chat"	# adjust if your Colab cell exposes something else

def ask_llm(user_input):
	 system_prompt = """
You are an assistant that maps human language to API calls.
You support the following tools:

1. Get Missing Program Attributes
Use when the user asks: "What is missing from the [phase] phase in [projectNumber]?"
Call format: {"tool": "get_missing_attributes", "args": {"project_number": "E2210041", "phase": "prelim"}}

2. Get User Edits Report
Use when the user asks: "Can you pull a report of all my edits for the year?"
Call format: {"tool": "get_user_edits", "args": {"user_id": 101, "start_date": "2024-01-01", "end_date": "2024-12-31"}}
	 """

	 payload = {
			"messages": [
				{"role": "system", "content": system_prompt},
				{"role": "user", "content": user_input}
			]
	 }

	 response = requests.post(COLAB_CHAT_ENDPOINT, json=payload)
	 response_data = response.json()
	 model_reply = response_data["choices"][0]["message"]["content"]

	 try:
			tool_call = json.loads(model_reply)
			tool_name = tool_call["tool"]
			args = tool_call["args"]
	 except Exception as e:
			return {"error": f"Invalid tool response: {model_reply}"}

	 # 🔁 Route to correct tool
	 if tool_name == "get_missing_attributes":
			return get_missing_attributes(**args)
	 elif tool_name == "get_user_edits":
			return get_user_edits(**args)
	 else:
			return {"error": f"Unknown tool: {tool_name}"}

