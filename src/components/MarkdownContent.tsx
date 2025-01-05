import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // For GitHub Flavored Markdown (tables, strikethrough, etc.)
import rehypeRaw from 'rehype-raw'; // To allow raw HTML in Markdown
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'; // For code blocks
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Code block theme

interface MarkdownContentProps {
  content: string;
}

const MarkdownContent = ({ content }: MarkdownContentProps) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]} // Enable GitHub Flavored Markdown
      rehypePlugins={[rehypeRaw]} // Allow raw HTML
      components={{
        // Customize rendering for specific Markdown elements
        h1: ({ node, ...props }) => <h1 style={{ color: '#2c3e50', fontSize: '2em', marginBottom: '20px' }} {...props} />,
        h2: ({ node, ...props }) => <h2 style={{ color: '#3498db', fontSize: '1.75em', marginBottom: '15px' }} {...props} />,
        h3: ({ node, ...props }) => <h3 style={{ color: '#e74c3c', fontSize: '1.5em', marginBottom: '10px' }} {...props} />,
        p: ({ node, ...props }) => <p style={{ marginBottom: '15px', lineHeight: '1.6' }} {...props} />,
        strong: ({ node, ...props }) => <strong style={{ color: '#e67e22' }} {...props} />,
        em: ({ node, ...props }) => <em style={{ fontStyle: 'italic', color: '#9b59b6' }} {...props} />,
        blockquote: ({ node, ...props }) => (
          <blockquote
            style={{
              borderLeft: '4px solid #3498db',
              paddingLeft: '10px',
              color: '#7f8c8d',
              marginBottom: '15px',
            }}
            {...props}
          />
        ),
        ul: ({ node, ...props }) => <ul style={{ listStyleType: 'disc', marginLeft: '20px', marginBottom: '15px' }} {...props} />,
        ol: ({ node, ...props }) => <ol style={{ listStyleType: 'decimal', marginLeft: '20px', marginBottom: '15px' }} {...props} />,
        li: ({ node, ...props }) => <li style={{ marginBottom: '5px' }} {...props} />,
        code: ({ node, inline, className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              style={dracula} // Code block theme
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code
              style={{
                backgroundColor: '#f4f4f4',
                padding: '2px 4px',
                borderRadius: '4px',
                fontFamily: 'monospace',
              }}
              {...props}
            >
              {children}
            </code>
          );
        },
        a: ({ node, ...props }) => (
          <a
            style={{ color: '#3498db', textDecoration: 'underline' }}
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          />
        ),
        img: ({ node, ...props }) => (
          <img
            style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '15px' }}
            {...props}
          />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownContent;
