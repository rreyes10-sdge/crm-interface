import requests

def get_user_edits(user_id, start_date, end_date):
    url = "http://127.0.0.1:5000/api/activity/user"
    params = {
        "user_id": user_id,
        "start_date": start_date,
        "end_date": end_date
    }
    response = requests.get(url, params=params)
    return response.json()