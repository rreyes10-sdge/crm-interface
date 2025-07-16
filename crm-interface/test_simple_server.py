import requests
import json

def test_simple_server():
    """Test the simple TinyLlama HTTP server"""
    
    # Test health endpoint
    try:
        health_response = requests.get("http://localhost:8000/health")
        print(f"Health check: {health_response.status_code}")
        if health_response.status_code == 200:
            result = health_response.json()
            print("✅ Health endpoint working")
            print(f"Model: {result.get('model', 'Unknown')}")
        else:
            print("❌ Health endpoint failed")
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server on localhost:8000")
        print("Make sure the Colab notebook is running the simple server")
        return
    
    # Test chat endpoint
    test_payload = {
        "prompt": "Hello! Can you tell me a short joke?"
    }
    
    try:
        print("\n🤖 Testing chat endpoint...")
        chat_response = requests.post(
            "http://localhost:8000/chat",
            json=test_payload,
            timeout=60  # Longer timeout for model inference
        )
        print(f"Chat test: {chat_response.status_code}")
        
        if chat_response.status_code == 200:
            result = chat_response.json()
            print("✅ Chat endpoint working")
            print(f"Response: {result.get('response', 'No response')}")
        else:
            print("❌ Chat endpoint failed")
            print(f"Error: {chat_response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Chat request failed: {e}")

if __name__ == "__main__":
    test_simple_server() 