import { forwardRef } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../context/ThemeContext';
import './MarkdownPreview.css';

const MarkdownPreview = forwardRef(({ content }, ref) => {
  const { isDark } = useTheme();

  return (
    <div className="md-preview" ref={ref}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={isDark ? oneDark : oneLight}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.84rem',
                  border: '1px solid var(--border-light)',
                }}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={`md-inline-code ${className || ''}`} {...props}>
                {children}
              </code>
            );
          },
          a({ href, children, ...props }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          },
        }}
      >
        {content || '*No content to preview*'}
      </Markdown>
    </div>
  );
});

MarkdownPreview.displayName = 'MarkdownPreview';
export default MarkdownPreview;
