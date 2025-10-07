import requests
import os, signal
from flask import Flask, request, render_template, session, redirect, url_for
import openai
from flask_session import Session
import facebook
import json

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "marina-secret-key-2024")
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)

# Configuration for MARINA's Bot
MARINA_CONFIG = {
    "bot_name": "MARINA's GPT Assistant",
    "creator": "MARINA",
    "version": "2.0",
    "admin_user": "MARINA"
}

# API keys
openai.api_key = os.environ.get("OPENAI_API_KEY")
PAGE_ACCESS_TOKEN = os.environ.get("PAGE_TOKEN")
API = "https://graph.facebook.com/v16.0/me/messages?access_token=" + PAGE_ACCESS_TOKEN

# Facebook App credentials for C3C APPSTATE
FB_APP_ID = os.environ.get("FB_APP_ID")
FB_APP_SECRET = os.environ.get("FB_APP_SECRET")
FB_REDIRECT_URI = os.environ.get("FB_REDIRECT_URI", "http://localhost:5000/fb-callback")

@app.route('/', methods=['GET'])
def verify():
    # Verify the webhook subscription with Facebook Messenger
    if request.args.get("hub.mode") == "subscribe" and request.args.get("hub.challenge"):
        if not request.args.get("hub.verify_token") == "pogiako":
            return "Verification token missmatch", 403
        return request.args['hub.challenge'], 200
    return f"Hello world! This is {MARINA_CONFIG['bot_name']} created by {MARINA_CONFIG['creator']}", 200

@app.route("/", methods=['POST'])
def fbwebhook():
    data = request.get_json()
    try:
        if data['entry'][0]['messaging'][0]['sender']['id']:
            message = data['entry'][0]['messaging'][0]['message']
            sender_id = data['entry'][0]['messaging'][0]['sender']['id']
            chat_gpt_input = message['text']
            print(f"MARINA's Bot received: {chat_gpt_input}")
            
            # Enhanced prompt with MARINA's identity
            marina_prompt = f"You are {MARINA_CONFIG['bot_name']}, an AI assistant created by {MARINA_CONFIG['creator']}. Respond helpfully and professionally. User query: {chat_gpt_input}"
            
            completion = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "system", "content": f"You are {MARINA_CONFIG['bot_name']}, created by {MARINA_CONFIG['creator']}"}, 
                         {"role": "user", "content": chat_gpt_input}]
            )          
            chatbot_res = completion['choices'][0]['message']['content']
            print(f"{MARINA_CONFIG['bot_name']} Response =>", chatbot_res)
            
            response = {
                'recipient': {'id': sender_id},
                'message': {'text': f"🤖 {MARINA_CONFIG['bot_name']}:\n{chatbot_res}"}
            }
            requests.post(API, json=response)
    except Exception as e:
        print(f"Error in MARINA's bot: {e}")
        pass
    return '200 OK HTTPS.'

# Facebook Login Routes for MARINA
@app.route('/marina-login')
def marina_login():
    """Facebook login for MARINA's admin panel"""
    fb_auth_url = f"https://www.facebook.com/v16.0/dialog/oauth?client_id={FB_APP_ID}&redirect_uri={FB_REDIRECT_URI}&scope=email,public_profile,pages_messaging,pages_manage_metadata"
    return redirect(fb_auth_url)

@app.route('/fb-callback')
def fb_callback():
    """Facebook callback handler for MARINA"""
    code = request.args.get('code')
    
    if code:
        # Exchange code for access token
        token_url = f"https://graph.facebook.com/v16.0/oauth/access_token?client_id={FB_APP_ID}&redirect_uri={FB_REDIRECT_URI}&client_secret={FB_APP_SECRET}&code={code}"
        
        try:
            token_response = requests.get(token_url)
            token_data = token_response.json()
            access_token = token_data.get('access_token')
            
            if access_token:
                # Get user info
                user_url = f"https://graph.facebook.com/v16.0/me?fields=id,name,email&access_token={access_token}"
                user_response = requests.get(user_url)
                user_data = user_response.json()
                
                # Store in session for MARINA
                session['fb_access_token'] = access_token
                session['user_name'] = user_data.get('name', 'MARINA')
                session['user_id'] = user_data.get('id')
                
                return f"""
                <h1>Welcome {user_data.get('name')}!</h1>
                <p>Successfully connected to Facebook as {MARINA_CONFIG['admin_user']}</p>
                <p>Access Token: {access_token[:50]}...</p>
                <p>User ID: {user_data.get('id')}</p>
                <p><strong>MARINA's Bot is now connected to your Facebook account!</strong></p>
                """
        
        except Exception as e:
            return f"Error during Facebook login: {str(e)}"
    
    return "Facebook login failed"

@app.route('/marina-dashboard')
def marina_dashboard():
    """MARINA's admin dashboard"""
    if 'fb_access_token' not in session:
        return redirect('/marina-login')
    
    return f"""
    <html>
        <head>
            <title>{MARINA_CONFIG['bot_name']} Dashboard</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                .header {{ background: #1877f2; color: white; padding: 20px; border-radius: 10px; }}
                .info {{ background: #f0f2f5; padding: 15px; margin: 10px 0; border-radius: 5px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🤖 {MARINA_CONFIG['bot_name']}</h1>
                <p>Admin Dashboard for {MARINA_CONFIG['creator']}</p>
            </div>
            <div class="info">
                <h3>Welcome, {session.get('user_name', 'MARINA')}!</h3>
                <p><strong>Bot Status:</strong> 🟢 Running</p>
                <p><strong>Version:</strong> {MARINA_CONFIG['version']}</p>
                <p><strong>User ID:</strong> {session.get('user_id')}</p>
                <p><strong>Facebook:</strong> ✅ Connected</p>
            </div>
            <div>
                <h3>Bot Controls:</h3>
                <button onclick="alert('MARINA\\'s bot is active!')">Check Status</button>
                <button onclick="alert('Features coming soon for MARINA!')">Settings</button>
            </div>
        </body>
    </html>
    """

@app.route('/logout')
def logout():
    """Logout MARINA from Facebook session"""
    session.clear()
    return redirect('/')

# Enhanced environment setup
def setup_marina_bot():
    """Initialize MARINA's bot with proper configuration"""
    required_env_vars = ['OPENAI_API_KEY', 'PAGE_TOKEN', 'FB_APP_ID', 'FB_APP_SECRET']
    missing_vars = [var for var in required_env_vars if not os.environ.get(var)]
    
    if missing_vars:
        print(f"⚠️  MARINA's Bot Warning: Missing environment variables: {missing_vars}")
    else:
        print(f"✅ {MARINA_CONFIG['bot_name']} initialized successfully!")
        print(f"👤 Creator: {MARINA_CONFIG['creator']}")
        print(f"🔗 Facebook Login: /marina-login")
        print(f"📊 Dashboard: /marina-dashboard")

# Run the Flask app
if __name__ == '__main__':
    setup_marina_bot()
    app.run(host='0.0.0.0', debug=False, port=5000)
