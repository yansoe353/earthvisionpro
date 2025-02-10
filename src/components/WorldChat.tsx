import React, { useState } from 'react';
import axios from 'axios';
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

  const sendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');

    try {
      const response = await axios.post(
        'https://api.deepseek.ai/chat',
        {
          message: input,
        },
        {
          headers: {
            Authorization: `Bearer sk-0ab15026736a4c278c2220548e35c96f`,
            'Content-Type': 'application/json',
          },
        }
      );

      const aiMessage: Message = { sender: 'ai', text: response.data.reply };
      setMessages((prevMessages) => [...prevMessages, userMessage, aiMessage]);
    } catch (error) {
      console.error('Error sending message to Deepseek API:', error);
    }
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
