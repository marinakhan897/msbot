const axios = require('axios');
const fs = require('fs');

console.log("🎀 MARINA KHAN AI BOT STARTING...");
console.log("💖 Created by: Marina Khan");
console.log("⏰ " + new Date().toLocaleString());
console.log("=".repeat(60));

// Message tracking for workflow
let messageCount = 0;
const messageLog = [];

// Function to log messages for workflow
function logMessage(type, user, message, status = '') {
    const logEntry = {
        timestamp: new Date().toISOString(),
        type: type,
        user: user,
        message: message,
        status: status,
        count: ++messageCount
    };
    
    messageLog.push(logEntry);
    
    // Save to file for workflow access
    fs.writeFileSync('message-logs.json', JSON.stringify(messageLog, null, 2));
    
    // Console log with emojis
    const emoji = type === 'received' ? '📩' : '💌';
    const statusEmoji = status === 'seen' ? '👀' : status === 'replied' ? '🤖' : '⏳';
    
    console.log(`${emoji} ${statusEmoji} [${logEntry.count}] ${type.toUpperCase()}: ${user} - "${message}"`);
}

// AI Response Function
async function getAIResponse(userMessage, userName) {
    try {
        logMessage('processing', userName, userMessage, 'thinking');
        
        // Using a free AI API (Simulated for now)
        const responses = [
            `Hello ${userName}! I'm Marina Khan 💖 How can I help you today?`,
            `Nice to meet you ${userName}! ✨ I'm your AI assistant Marina!`,
            `Hey ${userName}! 🌸 What would you like to know?`,
            `Hi ${userName}! 🎀 I'm Marina - your stylish AI helper!`,
            `Welcome ${userName}! 💫 How can I assist you today?`
        ];
        
        // Simulate AI processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const response = responses[Math.floor(Math.random() * responses.length)];
        logMessage('sent', 'Marina Bot', response, 'replied');
        
        return response;
        
    } catch (error) {
        const errorResponse = `Sorry ${userName}! I'm having issues right now. 💝 - Marina Khan`;
        logMessage('error', 'System', error.message, 'failed');
        return errorResponse;
    }
}

// Simulate Facebook Messenger
class MessengerSimulator {
    constructor() {
        this.users = [
            { id: 'user1', name: 'Ali Khan' },
            { id: 'user2', name: 'Sara Ahmed' },
            { id: 'user3', name: 'John Smith' },
            { id: 'user4', name: 'Priya Sharma' }
        ];
        this.isRunning = true;
    }

    // Simulate receiving messages
    async startReceivingMessages() {
        console.log("🤖 Bot is now LISTENING for messages...");
        console.log("💬 Send messages in workflow to test");
        
        let simulationCount = 0;
        
        while (this.isRunning && simulationCount < 10) {
            // Simulate random user sending message
            const randomUser = this.users[Math.floor(Math.random() * this.users.length)];
            const messages = [
                "Hello Marina!",
                "Hi bot, how are you?",
                "What can you do?",
                "Tell me about yourself",
                "Help me please",
                "Marina, are you there?",
                "Good morning!",
                "How does this work?",
                "You're amazing!",
                "Test message"
            ];
            
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            
            // Log received message
            logMessage('received', randomUser.name, randomMessage, 'seen');
            
            // Mark as seen immediately
            logMessage('status', randomUser.name, randomMessage, 'seen');
            
            // Get AI response
            const aiResponse = await getAIResponse(randomMessage, randomUser.name);
            
            // Simulate delay between messages
            await new Promise(resolve => setTimeout(resolve, 5000));
            simulationCount++;
        }
        
        console.log("✅ Simulation completed! Check workflow for detailed logs.");
    }
}

// Start the bot
const bot = new MessengerSimulator();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n💖 Bot shutting down gracefully...');
    console.log(`📊 Total messages processed: ${messageCount}`);
    bot.isRunning = false;
    process.exit(0);
});

// Start receiving messages
bot.startReceivingMessages();

// Keep alive
setInterval(() => {
    console.log("💝 Marina Bot is active and running...");
}, 30000);
