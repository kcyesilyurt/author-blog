import { slugify } from './utils';

export function renderMarkdown(md: string): string {
  // 1. Extract code blocks to protect them from further processing
  const codeBlocks: string[] = [];
  let processedMd = md.replace(/```([\s\S]*?)```/g, (match, content) => {
    // Extract language if present
    const firstLineEnd = content.indexOf('\n');
    let lang = '';
    let code = content;
    
    if (firstLineEnd !== -1) {
      const possibleLang = content.slice(0, firstLineEnd).trim();
      if (possibleLang && !possibleLang.includes(' ')) {
        lang = possibleLang;
        code = content.slice(firstLineEnd + 1);
      }
    }
    
    // HTML-escape the content
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
      
    codeBlocks.push(`<pre><code${lang ? ` class="language-${lang}"` : ''}>${escapedCode}</code></pre>`);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // Basic HTML sanitization for non-code block text
  processedMd = processedMd
    .replace(/&/g, '&amp;') // Must do & first
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Split into paragraphs/blocks (separated by 2+ newlines)
  const blocks = processedMd.split(/\n\s*\n/);
  
  const parsedBlocks = blocks.map(block => {
    // Check if it's a code block placeholder
    if (/^__CODE_BLOCK_\d+__$/.test(block.trim())) {
      return block.trim();
    }
    
    // Check for headings
    const headingMatch = block.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = parseInline(headingMatch[2]);
      const id = slugify(headingMatch[2]);
      return `<h${level} id="${id}">${content}</h${level}>`;
    }
    
    // Check for horizontal rules
    if (/^(---|___|\*\*\*)$/m.test(block.trim())) {
      return `<hr />`;
    }
    
    // Check for blockquotes
    if (/^>/.test(block.trim())) {
      const lines = block.trim().split('\n');
      const isBlockquote = lines.every(line => line.startsWith('>'));
      if (isBlockquote) {
        const content = lines.map(line => parseInline(line.replace(/^>\s?/, ''))).join('<br />');
        return `<blockquote>${content}</blockquote>`;
      }
    }
    
    // Check for unordered lists
    if (/^[-*]\s/.test(block.trim())) {
      const lines = block.trim().split('\n');
      const isList = lines.every(line => /^[-*]\s/.test(line));
      if (isList) {
        const listItems = lines.map(line => `<li>${parseInline(line.replace(/^[-*]\s/, ''))}</li>`).join('');
        return `<ul>${listItems}</ul>`;
      }
    }
    
    // Check for ordered lists
    if (/^\d+\.\s/.test(block.trim())) {
      const lines = block.trim().split('\n');
      const isList = lines.every(line => /^\d+\.\s/.test(line));
      if (isList) {
        const listItems = lines.map(line => `<li>${parseInline(line.replace(/^\d+\.\s/, ''))}</li>`).join('');
        return `<ol>${listItems}</ol>`;
      }
    }
    
    // Default to paragraph
    return `<p>${parseInline(block.trim())}</p>`;
  });
  
  let html = parsedBlocks.join('\n');
  
  // Reinsert code blocks
  html = html.replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => {
    return codeBlocks[parseInt(index, 10)];
  });
  
  return html;
}

function parseInline(text: string): string {
  let result = text;
  
  // Images: ![alt](url)
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />');
  
  // Links: [text](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Bold: **text**
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Italic: *text*
  result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // Inline code: `code`
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  return result;
}

export default renderMarkdown;
