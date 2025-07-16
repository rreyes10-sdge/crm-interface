import requests
import json

def test_colab_bridge():
    """Test the Colab AI bridge endpoints"""
    
    # Test health endpoint
    try:
        health_response = requests.get("http://localhost:5050/health")
        print(f"Health check: {health_response.status_code}")
        if health_response.status_code == 200:
            print("✅ Health endpoint working")
        else:
            print("❌ Health endpoint failed")
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to AI bridge on localhost:5050")
        print("Make sure the Colab notebook is running the AI bridge")
        return
    
    # Test chat endpoint
    test_payload = {
        "input": "What are the missing attributes for project ABC123 in the planning phase?"
    }
    
    try:
        chat_response = requests.post(
            "http://localhost:5050/chat",
            json=test_payload,
            timeout=30
        )
        print(f"\nChat test: {chat_response.status_code}")
        
        if chat_response.status_code == 200:
            result = chat_response.json()
            print("✅ Chat endpoint working")
            print(f"Response: {json.dumps(result, indent=2)}")
        else:
            print("❌ Chat endpoint failed")
            print(f"Error: {chat_response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Chat request failed: {e}")

if __name__ == "__main__":
    test_colab_bridge() 