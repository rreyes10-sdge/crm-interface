import requests

def get_missing_attributes(project_number, phase):
    url = "http://127.0.0.1:5000/api/projects/missing-attributes"
    params = {
        "project_number": project_number,
        "phase": phase
    }
    response = requests.get(url, params=params)
    return response.json()
