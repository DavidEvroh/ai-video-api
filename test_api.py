import requests
# The fast internal highway to talk directly to your server port
url = "http://127.0.0.1:8000/v1/videos"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "super_secret_test_key_123"
}
payload = {
    "prompt": "A cinematic drone shot of a neon cyberpunk city street at night, 4k",
    "aspect_ratio": "16:9"
}
print("🚀 Launching internal request directly to local server port...")
try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"📡 Internal Server Response Code: {response.status_code}")
    print("📝 Output JSON Structure:")
    print(response.json())
except Exception as e:
    print(f"❌ Execution failed: {e}")