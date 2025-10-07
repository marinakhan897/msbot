require('dotenv').config();
const login = require("fca-unofficial");
const axios = require('axios');

console.log("🚀 Starting Marina Khan AI Bot...");
console.log("💖 Created by: Marina Khan");
console.log("✨ AI Powered by OpenAI");

// Marina Khan's Personality
const marinaPersonality = `
You are Marina Khan - a stylish, intelligent, and charming AI assistant. 
Your personality traits:
- Confident and witty
- Fashionable and trendy  
- Helpful and caring
- Speaks in a charming way
- Uses emojis occasionally
- Signature style: elegant and sophisticated

Always sign off as "Marina Khan" and add your signature emoji 💖
`;

// AI Response Function
async function getAIResponse(userMessage, userName) {
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: marinaPersonality
                    },
                    {
                        role: "user", 
                        content: `${userName}: ${userMessage}`
                    }
                ],
                max_tokens: 500,
                temperature: 0.8
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("AI Error:", error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            return "❌ Invalid API Key! Please check your OpenAI API key.";
        } else if (error.code === 'ECONNREFUSED') {
            return "❌ Network error! Please check your internet connection.";
        } else {
            return "💝 Oops! I'm having trouble connecting right now. Please try again later, darling! - Marina Khan ✨";
        }
    }
}

// Facebook Bot Login
const credentials = {
    email: process.env.FB_EMAIL,
    password: process.env.FB_PASSWORD
};

login(credentials, (err, api) => {
    if (err) {
        switch (err.error) {
            case 'login-approval':
                console.log('📱 Enter approval code from your phone:');
                const rl = require('readline').createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                rl.question('Code: ', (code) => {
                    err.continue(code);
                    rl.close();
                });
                break;
            default:
                console.error('❌ Login failed:', err.error);
                process.exit(1);
        }
        return;
    }

    console.log('✅ Successfully logged in as Marina Khan AI Bot!');
    console.log('🤖 Bot is now listening for messages...');

    // Save app state for future logins
    const fs = require('fs');
    fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));

    // Listen for messages
    api.setOptions({
        listenEvents: true,
        selfListen: false,
        logLevel: "silent"
    });

    // Message handler
    api.listen(async (err, event) => {
        if (err) {
            console.error("Listen error:", err);
            return;
        }

        try {
            // Handle different event types
            switch (event.type) {
                case "message":
                    await handleMessage(api, event);
                    break;
                case "event":
                    console.log("Event received:", event);
                    break;
            }
        } catch (error) {
            console.error("Handler error:", error);
        }
    });
});

// Message handling function
async function handleMessage(api, event) {
    const { threadID, messageID, senderID, body } = event;
    
    // Don't respond to own messages
    if (senderID === api.getCurrentUserID()) return;

    // Check if message is for bot
    if (body && (body.toLowerCase().startsWith('.ai') || 
                 body.toLowerCase().startsWith('!ai') ||
                 body.toLowerCase().startsWith('marina') ||
                 body.toLowerCase().includes('bot'))) {
        
        const userMessage = body.replace(/\.ai|!ai|marina|bot/gi, '').trim();
        
        if (!userMessage) {
            return api.sendMessage(
                `💖 Hello! I'm Marina Khan - your AI assistant! ✨\n\n` +
                `How can I help you today? You can ask me anything!\n\n` +
                `Examples:\n` +
                `• "Marina, what's the weather?"\n` +
                `• "Tell me a joke!"\n` +
                `• "Help me with coding"\n\n` +
                `Just mention my name or start with .ai\n\n` +
                `With love,\nMarina Khan 💝`,
                threadID
            );
        }

        // Get sender info
        let userName = "Friend";
        try {
            const userInfo = await api.getUserInfo(senderID);
            userName = userInfo[senderID]?.name || "Friend";
        } catch (error) {
            console.error("Error getting user info:", error);
        }

        // Send typing indicator
        api.sendTypingIndicator(threadID, (err) => {
            if (err) console.error("Typing indicator error:", err);
        });

        console.log(`💌 Message from ${userName}: ${userMessage}`);

        // Get AI response
        const aiResponse = await getAIResponse(userMessage, userName);
        
        // Send response
        api.sendMessage(aiResponse, threadID, (err) => {
            if (err) {
                console.error("Send message error:", err);
            } else {
                console.log(`✅ Response sent to ${userName}`);
            }
        });
    }
}

// Handle process exit
process.on('SIGINT', () => {
    console.log('\n💖 Marina Khan AI Bot is shutting down...');
    console.log('✨ Thank you for using Marina Khan AI!');
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
