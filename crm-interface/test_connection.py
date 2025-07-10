import requests
import json

def test_endpoints():
    base_url = "http://localhost:5000"
    
    # Test the health endpoint
    print("Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health")
        print(f"Health status: {response.status_code}")
        print(f"Health response: {response.text}")
    except Exception as e:
        print(f"Health endpoint error: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # Test the missing attributes endpoint (one of the endpoints ai_bridge calls)
    print("Testing missing attributes endpoint...")
    try:
        response = requests.get(
            f"{base_url}/api/projects/TEST123/missing-attributes",
            params={"phase": "test"}
        )
        print(f"Missing attributes status: {response.status_code}")
        print(f"Missing attributes response: {response.text}")
    except Exception as e:
        print(f"Missing attributes endpoint error: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # Test the user edits endpoint (another endpoint ai_bridge calls)
    print("Testing user edits endpoint...")
    try:
        response = requests.get(
            f"{base_url}/api/user-edits",
            params={"user_id": "1", "start_date": "2024-01-01", "end_date": "2024-12-31"}
        )
        print(f"User edits status: {response.status_code}")
        print(f"User edits response: {response.text}")
    except Exception as e:
        print(f"User edits endpoint error: {e}")

if __name__ == "__main__":
    test_endpoints() 