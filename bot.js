console.log("=".repeat(50));
console.log("🤖 MARINA KHAN AI BOT STARTED");
console.log("💖 Created by: Marina Khan");
console.log("=".repeat(50));

// Simple AI function
function getAIResponse(message) {
    const responses = [
        "Hello! I'm Marina Khan 💖",
        "How can I help you today? ✨",
        "Nice to meet you! I'm your AI assistant 🌸",
        "I'm here to help you! 🎀",
        "What would you like to know? 💫"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

// Simulate bot working
console.log("✅ Bot is running perfectly!");
console.log("🔧 Testing AI responses:");

// Test the bot
setInterval(() => {
    const testMessage = "Hello";
    const response = getAIResponse(testMessage);
    console.log(`💌 User: ${testMessage}`);
    console.log(`🤖 Marina: ${response}`);
    console.log("✅ Seen ✓ | ✅ Delivered ✓ | ✅ Replied ✓");
    console.log("-".repeat(40));
}, 5000);

console.log("🚀 Bot will keep running... Press Ctrl+C to stop");
