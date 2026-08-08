// src/components/MarkdownViewer/MarkdownViewer.tsx
import React from 'react';
// নতুন MarkdownRenderer ইমপোর্ট করা হলো
import { MarkdownRenderer } from '../../utils/parseMarkdown';
import './MarkdownViewer.css';

interface MarkdownViewerProps {
  content: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  return (
    <div className="md-body">
      {/* dangerouslySetInnerHTML এবং useMemo বাদ দিয়ে সরাসরি কম্পোনেন্ট ব্যবহার */}
      <MarkdownRenderer content={content} />
    </div>
  );
};