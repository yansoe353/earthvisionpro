import React, { useState } from 'react';

interface CustomPromptProps {
  onSubmit: (prompt: string) => void;
}

const CustomPrompt: React.FC<CustomPromptProps> = ({ onSubmit }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt);
      setPrompt('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="custom-prompt-form">
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask about the map image..."
        className="custom-prompt-input"
      />
      <button type="submit" className="custom-prompt-button">
        Ask
      </button>
    </form>
  );
};

export default CustomPrompt;
