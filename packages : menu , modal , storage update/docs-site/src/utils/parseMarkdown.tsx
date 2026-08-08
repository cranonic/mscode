// src/utils/parseMarkdown.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// 🌟 যদি HTML ট্যাগ (যেমন <br> বা <img>) সাপোর্ট করতে চান, 
// টার্মিনালে `npm install rehype-raw` করে নিচের লাইনটি আনকমেন্ট করতে পারেন:
// import rehypeRaw from 'rehype-raw';

interface MarkdownProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownProps> = ({ content, className = '' }) => {
  return (
    <div className={`ms-markdown-body ${className}`} style={{ color: 'var(--ms-text-main)', lineHeight: '1.6', fontSize: '14px' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // rehypePlugins={[rehypeRaw]} // HTML সাপোর্টের জন্য
        components={{
          // ── 1. Headings ──
          h1: ({ children }) => <h1 style={{ borderBottom: '1px solid var(--ms-separator)', paddingBottom: '8px', color: 'var(--ms-text-bright)', marginTop: '24px' }}>{children}</h1>,
          h2: ({ children }) => <h2 style={{ borderBottom: '1px solid var(--ms-separator)', paddingBottom: '6px', color: 'var(--ms-text-bright)', marginTop: '20px' }}>{children}</h2>,
          h3: ({ children }) => <h3 style={{ color: 'var(--ms-text-bright)', marginTop: '16px' }}>{children}</h3>,
          
          // ── 2. Links ──
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ms-accent)', textDecoration: 'none' }}
               onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
               onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
              {children}
            </a>
          ),

          // ── 3. Code & Codeblocks ──
          code: ({ node, inline, className, children, ...props }: any) => {
            const isBlock = !inline;
            return isBlock ? (
              <div style={{ background: 'var(--ms-bg-activity)', padding: '12px', borderRadius: '6px', overflowX: 'auto', margin: '12px 0', border: '1px solid var(--ms-border-light)' }}>
                <code style={{ fontFamily: 'monospace', color: 'var(--ms-text-main)', fontSize: '13px' }} {...props}>
                  {children}
                </code>
              </div>
            ) : (
              <code style={{ background: 'var(--ms-activity-hover)', color: '#ce9178', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '13px' }} {...props}>
                {children}
              </code>
            );
          },

          // ── 4. Blockquotes ──
          blockquote: ({ children }) => (
            <blockquote style={{ borderLeft: '4px solid var(--ms-accent)', margin: '12px 0', padding: '4px 0 4px 14px', color: 'var(--ms-text-faded)', fontStyle: 'italic', background: 'rgba(0, 0, 0, 0.1)' }}>
              {children}
            </blockquote>
          ),

          // ── 5. Tables ──
          table: ({ children }) => <table style={{ borderCollapse: 'collapse', width: '100%', margin: '16px 0', fontSize: '13px' }}>{children}</table>,
          th: ({ children }) => <th style={{ borderBottom: '1px solid var(--ms-border-light)', padding: '8px 12px', textAlign: 'left', fontWeight: 'bold', background: 'var(--ms-activity-hover)' }}>{children}</th>,
          td: ({ children }) => <td style={{ borderBottom: '1px solid var(--ms-border-light)', padding: '8px 12px', textAlign: 'left' }}>{children}</td>,

          // ── 6. Lists ──
          ul: ({ children }) => <ul style={{ paddingLeft: '20px', margin: '12px 0' }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ paddingLeft: '20px', margin: '12px 0' }}>{children}</ol>,
          li: ({ children }) => <li style={{ marginBottom: '4px' }}>{children}</li>,

          // ── 7. Images ──
          img: ({ src, alt }) => <img src={src} alt={alt} style={{ maxWidth: '100%', borderRadius: '6px', marginTop: '12px' }} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};