import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownContentProps {
  content: string;
  language: 'en' | 'my' | 'th';
  onRewrite: (content: string) => void;
}

const MarkdownContent = ({ content, language, onRewrite }: MarkdownContentProps) => {
  const [isRewriting, setIsRewriting] = useState(false);

  const handleRewrite = async () => {
    setIsRewriting(true);
    const rewrittenContent = await rewriteContentWithAI(content);
    onRewrite(rewrittenContent);
    setIsRewriting(false);
  };

  return (
    <div className={`translated-content ${language}`}>
      <ReactMarkdown>{content}</ReactMarkdown>
      <button
        onClick={handleRewrite}
        className="rewrite-button"
        disabled={isRewriting}
      >
        {isRewriting ? 'Rewriting...' : 'Rewrite with AI'}
      </button>
    </div>
  );
};

const rewriteContentWithAI = async (content: string): Promise<string> => {
  try {
    const groq = new Groq({
      apiKey: import.meta.env.VITE_GROQ_API_KEY,
      dangerouslyAllowBrowser: true,
    });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `Rewrite the following text to make it more polished, concise, and user-friendly:\n\n${content}`,
        },
      ],
      model: 'llama-3.2-90b-vision-preview',
      temperature: 0.95,
      max_tokens: 7000,
    });

    if (completion.choices && completion.choices[0]?.message?.content) {
      return completion.choices[0].message.content.trim();
    }
    return content;
  } catch (error) {
    console.error('Error rewriting content with AI:', error);
    return 'Error rewriting content. Please try again.';
  }
};

export default MarkdownContent;
