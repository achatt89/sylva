import os
import requests

WIX_API_KEY = os.getenv("WIX_API_KEY")

def fetch_products():
    url = "https://www.wixapis.com/stores/v1/products"
    headers = {
        "Authorization": f"Bearer {WIX_API_KEY}"
    }
    response = requests.get(url, headers=headers)
    return response.json()
