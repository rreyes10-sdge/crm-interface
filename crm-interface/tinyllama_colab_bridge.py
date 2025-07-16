# Step 1: Install dependencies
!pip install flask pyngrok transformers accelerate sentencepiece --quiet

# Step 2: Import packages
from flask import Flask, request, jsonify
from pyngrok import ngrok
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import os

# Step 3: Load the model
print("Loading TinyLlama model...")
model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name, 
    torch_dtype=torch.float16, 
    device_map="auto"
)
print("Model loaded successfully!")

# Step 4: Set up the Flask app
app = Flask(__name__)

# Disable debug mode to avoid Colab context issues
app.debug = False

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        prompt = data.get("prompt", "")
        
        if not prompt:
            return jsonify({"error": "Prompt missing"}), 400
        
        # Format prompt for TinyLlama chat
        formatted_prompt = f"<|system|>You are a helpful assistant.</s><|user|>{prompt}</s><|assistant|>"
        
        # Tokenize and generate
        input_ids = tokenizer.encode(formatted_prompt, return_tensors="pt")
        
        # Move to the same device as the model
        device = next(model.parameters()).device
        input_ids = input_ids.to(device)
        
        with torch.no_grad():
            output = model.generate(
                input_ids, 
                max_new_tokens=150, 
                do_sample=True, 
                top_k=50,
                temperature=0.7,
                pad_token_id=tokenizer.eos_token_id
            )
        
        # Decode only the new tokens (skip the input prompt)
        new_tokens = output[0][input_ids.shape[1]:]
        response = tokenizer.decode(new_tokens, skip_special_tokens=True)
        
        # Clean up the response
        response = response.strip()
        
        return jsonify({"response": response})
    
    except Exception as e:
        return jsonify({"error": f"Generation failed: {str(e)}"}), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "model": model_name})

# Step 5: Setup ngrok and run the app
def setup_and_run():
    print("Setting up ngrok tunnel...")
    
    # Kill any existing ngrok processes
    ngrok.kill()
    
    # Create tunnel
    public_url = ngrok.connect(5000)
    print(f"🌐 Public URL: {public_url}")
    print(f"📡 Local URL: http://localhost:5000")
    
    print("\n🚀 Starting Flask server...")
    print("Press Ctrl+C to stop the server")
    
    # Run the app
    app.run(host="0.0.0.0", port=5000, threaded=False)

# Run the setup
if __name__ == "__main__":
    setup_and_run() 