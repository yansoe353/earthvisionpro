import React, { useState } from 'react';
import Groq from 'groq'; // Import the Groq library
import './WorldChat.css';

// Define the type for a message
type Message = {
  sender: 'user' | 'ai';
  text: string;
};

// Define the props for the WorldChat component
type WorldChatProps = {
  onClose: () => void;
};

const WorldChat: React.FC<WorldChatProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const generateNewsWithAI = async (location: string) => {
    try {
      const groq = new Groq({
        apiKey: import.meta.env.VITE_GROQ_API_KEY, // Replace with your Groq API key
        dangerouslyAllowBrowser: true,
      });

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: `Generate a brief news summary about ${location}. Focus on recent events, cultural highlights, or significant developments.`,
          },
        ],
        model: 'llama-3.2-90b-vision-preview', // Use the appropriate model
        temperature: 0.7,
        max_tokens: 1000,
      });

      if (completion.choices && completion.choices[0]?.message?.content) {
        return completion.choices[0].message.content.trim();
      }
      return 'No news available for this location.';
    } catch (error) {
      console.error('Error generating news:', error);
      return 'Failed to generate news. Please try again.';
    }
  };

  const sendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');

    const aiResponse = await generateNewsWithAI(input);
    const aiMessage: Message = { sender: 'ai', text: aiResponse };
    setMessages((prevMessages) => [...prevMessages, aiMessage]);
  };

  return (
    <div className="world-chat-container">
      <div className="chat-box">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            {message.text}
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
      <button className="close-button" onClick={onClose}>
        Close
      </button>
    </div>
  );
};

export default WorldChat;
