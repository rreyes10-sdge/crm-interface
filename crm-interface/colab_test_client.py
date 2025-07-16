# Test client for TinyLlama server
import requests
import json
import time

def test_tinyllama_server():
    """Test the TinyLlama server running on localhost:8000"""
    
    base_url = "http://localhost:8000"
    
    print("🧪 Testing TinyLlama Server")
    print("=" * 40)
    
    # Test 1: Health check
    print("\n1️⃣ Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed!")
            print(f"   Status: {data.get('status')}")
            print(f"   Model: {data.get('model')}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure it's running on localhost:8000")
        return
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return
    
    # Test 2: Chat endpoint
    print("\n2️⃣ Testing chat endpoint...")
    test_prompts = [
        "Hello! How are you today?",
        "Tell me a short joke.",
        "What is 2 + 2?"
    ]
    
    for i, prompt in enumerate(test_prompts, 1):
        print(f"\n   Test {i}: {prompt}")
        try:
            response = requests.post(
                f"{base_url}/chat",
                json={"prompt": prompt},
                timeout=60  # Longer timeout for model inference
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Response: {data.get('response', 'No response')}")
            else:
                print(f"   ❌ Failed: {response.status_code} - {response.text}")
                
        except requests.exceptions.Timeout:
            print("   ⏰ Timeout - model taking too long to respond")
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print("\n" + "=" * 40)
    print("🎉 Testing complete!")

# Run the test
if __name__ == "__main__":
    test_tinyllama_server() 