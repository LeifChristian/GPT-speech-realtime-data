// Utility to properly set up test conversations in localStorage
// This needs to be run in the browser console or called from React

export const setupTestConversations = () => {
    console.log('🧹 Clearing existing conversations...');
    localStorage.removeItem('conversations');

    const testConversations = [
        {
            id: "test_welcome_" + Date.now(),
            name: "Welcome Chat",
            history: "Question: Hello there! How are you? Response: Hi! Welcome to ΩmnÎbot! I'm doing great, thank you for asking. I can help with conversations and create images. How can I assist you today?"
        },
        {
            id: "test_image_" + Date.now() + 1,
            name: "Image Generation Demo",
            history: "Question: Can you draw a cyberpunk city? Response: I'll create that image for you! Question: That looks amazing! Response: Generated image: A stunning cyberpunk cityscape with neon lights, towering skyscrapers, and futuristic architecture. The scene features glowing advertisements, flying vehicles, and a dark, atmospheric mood typical of the cyberpunk aesthetic."
        },
        {
            id: "test_ai_" + Date.now() + 2,
            name: "AI Discussion",
            history: "Question: What is artificial intelligence? Response: Artificial intelligence (AI) is a branch of computer science that aims to create systems capable of performing tasks that typically require human intelligence, such as learning, reasoning, problem-solving, and perception. Question: Can you give me some examples? Response: Sure! Common examples include virtual assistants like Siri and Alexa, recommendation systems on Netflix and Amazon, autonomous vehicles, medical diagnosis systems, and language models like myself that can understand and generate human language."
        },
        {
            id: "test_weather_" + Date.now() + 3,
            name: "Weather & Functions",
            history: "Question: What's the weather like in New York? Response: I can help you get current weather information! Let me check that for you. Question: Thanks! Response: Current temperature in New York is 72°F with partly cloudy skies. It's a beautiful day with light winds and good visibility."
        }
    ];

    localStorage.setItem('conversations', JSON.stringify(testConversations));
    console.log('✅ Created test conversations:', testConversations);
    console.log('📊 Total conversations created:', testConversations.length);

    return testConversations;
};

// Console command helper
export const clearAndSetupConversations = () => {
    const conversations = setupTestConversations();
    console.log('🔄 You can now refresh the page to see the conversations!');
    return conversations;
};

// Browser console helper - can be copied and pasted
window.setupTestConversations = () => {
    console.log('🧹 Clearing existing conversations...');
    localStorage.removeItem('conversations');

    const testConversations = [
        {
            id: "test_welcome_" + Date.now(),
            name: "Welcome Chat",
            history: "Question: Hello there! How are you? Response: Hi! Welcome to ΩmnÎbot! I'm doing great, thank you for asking. I can help with conversations and create images. How can I assist you today?"
        },
        {
            id: "test_image_" + Date.now() + 1,
            name: "Image Generation Demo",
            history: "Question: Can you draw a cyberpunk city? Response: I'll create that image for you! Question: That looks amazing! Response: Generated image: A stunning cyberpunk cityscape with neon lights, towering skyscrapers, and futuristic architecture. The scene features glowing advertisements, flying vehicles, and a dark, atmospheric mood typical of the cyberpunk aesthetic."
        },
        {
            id: "test_ai_" + Date.now() + 2,
            name: "AI Discussion",
            history: "Question: What is artificial intelligence? Response: Artificial intelligence (AI) is a branch of computer science that aims to create systems capable of performing tasks that typically require human intelligence, such as learning, reasoning, problem-solving, and perception. Question: Can you give me some examples? Response: Sure! Common examples include virtual assistants like Siri and Alexa, recommendation systems on Netflix and Amazon, autonomous vehicles, medical diagnosis systems, and language models like myself that can understand and generate human language."
        },
        {
            id: "test_weather_" + Date.now() + 3,
            name: "Weather & Functions",
            history: "Question: What's the weather like in New York? Response: I can help you get current weather information! Let me check that for you. Question: Thanks! Response: Current temperature in New York is 72°F with partly cloudy skies. It's a beautiful day with light winds and good visibility."
        }
    ];

    localStorage.setItem('conversations', JSON.stringify(testConversations));
    console.log('✅ Created test conversations:', testConversations);
    window.location.reload();
};
