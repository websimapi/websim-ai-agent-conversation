import { ConversationManager } from './conversation-manager.js';

document.addEventListener('DOMContentLoaded', () => {
    const agent1Messages = document.getElementById('agent1-messages');
    const agent2Messages = document.getElementById('agent2-messages');
    const startButton = document.getElementById('start-conversation');
    const stopButton = document.getElementById('stop-conversation');
    const cooldownSlider = document.getElementById('cooldown-slider');
    const cooldownValue = document.getElementById('cooldown-value');

    const conversationManager = new ConversationManager(
        agent1Messages, 
        agent2Messages
    );

    startButton.addEventListener('click', () => {
        conversationManager.startConversation();
        startButton.disabled = true;
        stopButton.disabled = false;
    });

    stopButton.addEventListener('click', () => {
        conversationManager.stopConversation();
        startButton.disabled = false;
        stopButton.disabled = true;
    });

    cooldownSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        cooldownValue.textContent = value;
        conversationManager.setCooldownPeriod(value);
    });

    // Initially disable stop button
    stopButton.disabled = true;
});