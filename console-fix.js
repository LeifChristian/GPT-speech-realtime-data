// COPY AND PASTE THIS INTO YOUR BROWSER CONSOLE TO FIX CONVERSATIONS
// Based on EXACT format from useConversations.js handleGreeting function

console.log('🧹 Clearing and setting up conversations...');
localStorage.removeItem('conversations');
const testConversations = [
    {
        id: "test_welcome_" + Date.now(),
        name: "Welcome Chat",
        history: "Question: Hello there! Response: Hi! Welcome to ΩmnÎbot! I can help with conversations and create images. How can I assist you today? Question: That's great! Response: I'm glad you're excited! Feel free to ask me anything or request an image to be generated."
    },
    {
        id: "test_image_" + Date.now() + 1,
        name: "Image Generation Demo",
        history: "Question: Can you draw a cyberpunk city? Response: Generated image: A stunning cyberpunk cityscape with neon lights and futuristic architecture. Question: That looks amazing! Response: I'm glad you like it! The cyberpunk aesthetic with neon lights and towering buildings creates such a cool atmosphere."
    },
    {
        id: "test_ai_" + Date.now() + 2,
        name: "AI Discussion",
        history: "Question: What is artificial intelligence? Response: Artificial intelligence (AI) is a branch of computer science that aims to create systems capable of performing tasks that typically require human intelligence, such as learning, reasoning, problem-solving, and perception. Question: Can you give examples? Response: Sure! Examples include virtual assistants like Siri and Alexa, recommendation systems, autonomous vehicles, medical diagnosis systems, and language models like myself."
    }
];
localStorage.setItem('conversations', JSON.stringify(testConversations));
console.log('✅ Created', testConversations.length, 'test conversations with EXACT format from useConversations.js');
console.log('📊 Sample history format:', testConversations[0].history);
console.log('🔄 Refreshing page...');
window.location.reload();
