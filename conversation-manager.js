export class ConversationManager {
    constructor(agent1Container, agent2Container) {
        this.agent1Container = agent1Container;
        this.agent2Container = agent2Container;
        this.conversationRunning = false;
        this.canFetch = true;
        this.lastMessageTimestamp = 0;
    }

    async startConversation() {
        this.conversationRunning = true;
        // Initial prompt to start the conversation
        await this.getAIResponse('You are Agent 1. Start a conversation about an interesting topic.', this.agent1Container);
        this.continueConversation();
    }

    stopConversation() {
        this.conversationRunning = false;
    }

    async continueConversation() {
        if (!this.conversationRunning) return;

        const currentTime = Date.now();
        const timeSinceLastMessage = currentTime - this.lastMessageTimestamp;

        // Check if we can fetch and enough time has passed
        if (this.canFetch && timeSinceLastMessage >= 10000) {
            try {
                // Prevent additional fetches
                this.canFetch = false;

                // Alternate between agents
                if (this.agent1Container.lastElementChild) {
                    await this.getAIResponse(
                        `You are Agent 2. Respond to the previous message: "${this.agent1Container.lastElementChild.textContent}"`, 
                        this.agent2Container
                    );
                } else {
                    await this.getAIResponse('You are Agent 2. Start a conversation about an interesting topic.', this.agent2Container);
                }

                await this.getAIResponse(
                    `You are Agent 1. Respond to the previous message: "${this.agent2Container.lastElementChild.textContent}"`, 
                    this.agent1Container
                );

                // Update timestamp
                this.lastMessageTimestamp = Date.now();

                // Re-enable fetching after 10 seconds
                setTimeout(() => {
                    this.canFetch = true;
                }, 10000);
            } catch (error) {
                console.error('Conversation error:', error);
                // Re-enable fetching in case of error
                this.canFetch = true;
            }
        }

        // Continue checking if conversation is running
        if (this.conversationRunning) {
            setTimeout(() => this.continueConversation(), 1000);
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