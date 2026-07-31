import { renderMarkdown } from '@/lib/markdown';

export default function MarkdownRenderer({ content }: { content: string }) {
  const html = renderMarkdown(content);
  return <div className="reader-content" dangerouslySetInnerHTML={{ __html: html }} />;
}
