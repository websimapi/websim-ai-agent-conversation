export class ConversationManager {
    constructor(agent1Container, agent2Container) {
        this.agent1Container = agent1Container;
        this.agent2Container = agent2Container;
        this.conversationRunning = false;
        this.lastMessageTimestamp = 0;
        this.isRequestPending = false;
        this.cooldownPeriod = 15000;
        this.currentSpeaker = 1;
        this.countdownElement = document.getElementById('countdown');
        this.countdownInterval = null;
    }

    setCooldownPeriod(seconds) {
        this.cooldownPeriod = seconds * 1000;
        if (this.conversationRunning) {
            // Reset the countdown with new period
            this.updateCountdown();
        }
    }

    updateCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        const updateTimer = () => {
            const currentTime = Date.now();
            const timeSinceLastMessage = currentTime - this.lastMessageTimestamp;
            const remainingTime = Math.max(0, Math.ceil((this.cooldownPeriod - timeSinceLastMessage) / 1000));
            
            if (this.countdownElement) {
                this.countdownElement.textContent = remainingTime;
            }
        };

        this.countdownInterval = setInterval(updateTimer, 100);
        updateTimer(); // Initial update
    }

    async startConversation() {
        this.conversationRunning = true;
        await this.getAIResponse('You are Agent 1. Start a conversation about an interesting topic.', this.agent1Container);
        this.lastMessageTimestamp = Date.now();
        this.updateCountdown();
        this.continueConversation();
    }

    stopConversation() {
        this.conversationRunning = false;
        this.isRequestPending = false;
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        if (this.countdownElement) {
            this.countdownElement.textContent = Math.ceil(this.cooldownPeriod / 1000);
        }
    }

    async continueConversation() {
        if (!this.conversationRunning || this.isRequestPending) return;

        const timeSinceLast = Date.now() - this.lastMessageTimestamp;
        if (timeSinceLast < this.cooldownPeriod) {
            setTimeout(() => this.continueConversation(), this.cooldownPeriod - timeSinceLast);
            return;
        }

        this.isRequestPending = true;
        
        try {
            if (this.currentSpeaker === 2) {
                const lastMessage = this.agent1Container.lastElementChild?.textContent || '';
                await this.getAIResponse(
                    `You are Agent 2. Respond to: "${lastMessage}"`,
                    this.agent2Container
                );
                this.currentSpeaker = 1;
            } else {
                const lastMessage = this.agent2Container.lastElementChild?.textContent || '';
                await this.getAIResponse(
                    `You are Agent 1. Respond to: "${lastMessage}"`,
                    this.agent1Container
                );
                this.currentSpeaker = 2;
            }

            this.lastMessageTimestamp = Date.now();
            this.updateCountdown();
        } catch (error) {
            console.error('Conversation error:', error);
        } finally {
            this.isRequestPending = false;
        }

        if (this.conversationRunning) {
            setTimeout(() => this.continueConversation(), this.cooldownPeriod);
        }
    }

    async getAIResponse(prompt, container) {
        try {
            const response = await fetch('/api/ai_completion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ 
                    prompt: `
                    You are an AI agent engaging in a conversation. 
                    Respond with a concise, natural-sounding message.
                    
                    <typescript-interface>
                    interface Response {
                        message: string;
                    }
                    </typescript-interface>
                    <example>
                    {
                        "message": "That's an intriguing point about artificial intelligence!"
                    }
                    </example>
                    
                    Context: ${prompt}
                    `,
                    data: prompt
                }),
            });

            const data = await response.json();
            
            // Create and append message
            const messageElement = document.createElement('div');
            messageElement.classList.add('message');
            messageElement.textContent = data.message;
            container.appendChild(messageElement);
            
            // Scroll to bottom
            container.scrollTop = container.scrollHeight;

            return data.message;
        } catch (error) {
            console.error('Error fetching AI response:', error);
            return 'Error occurred';
        }
    }
}