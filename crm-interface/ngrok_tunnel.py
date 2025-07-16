from pyngrok import ngrok

ngrok.set_auth_token("2zhhauJ5xHrIpgRRR9Pk4Vld6M5_4rEDEKKYBVWdWPnaHaSjx")

public_url = ngrok.connect(5000)
print(f" public url: {public_url}")

input("Press Enter to terminate tunnel...\n")