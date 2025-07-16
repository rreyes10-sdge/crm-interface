# Step 1: Install dependencies
!pip install transformers accelerate sentencepiece pyngrok --quiet

# Step 2: Import packages
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import json
import http.server
import socketserver
import threading
from pyngrok import ngrok
import urllib.parse

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

# Step 4: Create a simple HTTP server
class TinyLlamaHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/chat':
            try:
                # Read request body
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                
                # Parse JSON
                data = json.loads(post_data.decode('utf-8'))
                prompt = data.get('prompt', '')
                
                if not prompt:
                    self.send_error_response(400, "Prompt missing")
                    return
                
                # Generate response
                response_text = self.generate_response(prompt)
                
                # Send response
                self.send_success_response({"response": response_text})
                
            except Exception as e:
                self.send_error_response(500, f"Generation failed: {str(e)}")
        else:
            self.send_error_response(404, "Endpoint not found")
    
    def do_GET(self):
        if self.path == '/health':
            self.send_success_response({
                "status": "healthy", 
                "model": model_name
            })
        else:
            self.send_error_response(404, "Endpoint not found")
    
    def generate_response(self, prompt):
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
        return response.strip()
    
    def send_success_response(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def send_error_response(self, status_code, message):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode('utf-8'))
    
    def log_message(self, format, *args):
        # Suppress logging to reduce noise
        pass

# Step 5: Setup and run the server
def setup_and_run():
    print("Setting up ngrok tunnel...")
    
    # Kill any existing ngrok processes
    ngrok.kill()
    
    # Create tunnel
    public_url = ngrok.connect(8000)
    print(f"🌐 Public URL: {public_url}")
    print(f"📡 Local URL: http://localhost:8000")
    
    print("\n🚀 Starting HTTP server...")
    print("Press Ctrl+C to stop the server")
    
    # Create and run server
    with socketserver.TCPServer(("", 8000), TinyLlamaHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped by user")
            httpd.shutdown()

# Run the setup
if __name__ == "__main__":
    setup_and_run() 