require('dotenv').config();
const login = require("fca-unofficial");
const axios = require('axios');

console.log("🚀 Marina Khan AI Bot Starting...");
console.log("💖 Created by: Marina Khan");
console.log("📱 Messenger Bot Active");

// Marina Khan Personality
const marinaPersonality = `
You are Marina Khan - a stylish, intelligent, and charming AI assistant. 
Your personality:
- Confident and witty, fashionable and trendy
- Helpful and caring, uses emojis occasionally
- Always sign as Marina Khan with 💖

Keep responses conversational and engaging.
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
                max_tokens: 300,
                temperature: 0.8
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 25000
            }
        );

        let reply = response.data.choices[0].message.content;
        
        // Ensure Marina signature
        if (!reply.includes("Marina") && !reply.includes("💖")) {
            reply += "\n\n- Marina Khan 💖";
        }
        
        return reply;
    } catch (error) {
        console.error("AI Error:", error.message);
        return "💝 Sorry darling! I'm having technical issues. Try again later! - Marina Khan 💖";
    }
}

// Facebook Login with better options
const loginOptions = {
    forceLogin: true,
    listenEvents: true,
    logLevel: "silent",
    selfListen: false,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
};

login({ email: process.env.FB_EMAIL, password: process.env.FB_PASSWORD }, loginOptions, (err, api) => {
    if (err) {
        console.error('❌ Login Failed:', err.error);
        
        // Handle 2FA
        if (err.error === 'login-approval') {
            console.log('📱 Enter the code sent to your phone:');
            const rl = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.question('🔢 Approval Code: ', (code) => {
                err.continue(code);
                rl.close();
            });
            return;
        }
        process.exit(1);
    }

    console.log('✅ Successfully logged in as Marina Khan!');
    console.log('👤 Bot ID:', api.getCurrentUserID());
    console.log('🤖 Listening for messages...');

    // Save app state
    const fs = require('fs');
    fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));

    // Mark as online and active
    api.setOptions({
        listenEvents: true,
        selfListen: false,
        online: true,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    });

    // Mark bot as online
    api.markAsReadAll((err) => {
        if (err) console.error("Mark as read error:", err);
        else console.log("✅ Marked all messages as read");
    });

    // Message event listener - FIXED
    api.listenMqtt((err, event) => {
        if (err) {
            console.error("Listen Error:", err);
            return;
        }

        try {
            handleMessageEvent(api, event);
        } catch (error) {
            console.error("Handler Error:", error);
        }
    });

    // Alternative listener
    api.listen((err, event) => {
        if (err) return console.error("Alternative listener error:", err);
        handleMessageEvent(api, event);
    });
});

// Improved message handler
async function handleMessageEvent(api, event) {
    if (!event || !event.body) return;

    const { threadID, senderID, body, messageID, type } = event;
    
    // Don't respond to self
    if (senderID === api.getCurrentUserID()) return;
    
    console.log(`💌 New message from ${senderID}: ${body}`);

    // Mark as seen immediately
    api.markAsRead(threadID, (err) => {
        if (err) console.error("❌ Seen error:", err);
        else console.log("✅ Message marked as seen");
    });

    // Check if message is for bot
    const triggerWords = ['.ai', '!ai', 'marina', 'bot', 'ai', 'help'];
    const shouldRespond = triggerWords.some(word => 
        body.toLowerCase().includes(word.toLowerCase())
    );

    if (shouldRespond && body.length > 1) {
        const userMessage = body.replace(/\.ai|!ai|marina|bot/gi, '').trim();
        
        if (!userMessage) {
            // Send welcome message
            return api.sendMessage(
                `💖 Hello! I'm Marina Khan - Your AI Assistant! ✨\n\n` +
                `I can help you with:\n` +
                `• Answering questions\n` +
                `• Chatting and conversations\n` +
                `• Creative writing\n` +
                `• Problem solving\n\n` +
                `Just type your message or start with "Marina"!\n\n` +
                `With love,\nMarina Khan 💝`,
                threadID
            );
        }

        // Send typing indicator
        api.sendTypingIndicator(threadID, (err) => {
            if (err) console.error("Typing error:", err);
            else console.log("⌨️ Typing indicator sent");
        });

        // Get user info
        let userName = "Friend";
        try {
            const userInfo = await api.getUserInfo(senderID);
            userName = userInfo[senderID]?.name || "Friend";
            console.log(`👤 User: ${userName}`);
        } catch (error) {
            console.error("User info error:", error);
        }

        // Get AI response
        console.log(`🤔 Processing: ${userMessage}`);
        const aiResponse = await getAIResponse(userMessage, userName);
        
        // Send response
        try {
            await api.sendMessage(aiResponse, threadID);
            console.log(`✅ Reply sent to ${userName}`);
            
            // Mark as delivered
            api.markAsDelivered(threadID, messageID, (err) => {
                if (err) console.error("Delivered error:", err);
            });
            
        } catch (sendError) {
            console.error("❌ Send message error:", sendError);
            
            // Try alternative send method
            try {
                api.sendMessage(
                    "💝 Sorry! Technical issue. Try again! - Marina Khan 💖",
                    threadID
                );
            } catch (retryError) {
                console.error("❌ Retry also failed:", retryError);
            }
        }
    }
}

// Keep alive and monitoring
setInterval(() => {
    console.log("💖 Marina AI Bot is running... " + new Date().toLocaleTimeString());
}, 60000); // Every minute

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n💖 Marina AI Bot shutting down gracefully...');
    console.log('✨ Thank you for using Marina Khan AI!');
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
