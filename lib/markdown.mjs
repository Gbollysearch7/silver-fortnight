import { readFileSync, writeFileSync } from 'fs';

// --- YAML Frontmatter Parsing ---

export function parseFile(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  return parseString(raw);
}

export function parseString(raw) {
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) {
    return { frontmatter: {}, content: raw, raw };
  }
  const frontmatter = parseYaml(fmMatch[1]);
  const content = fmMatch[2].trim();
  return { frontmatter, content, raw };
}

function parseYaml(yamlStr) {
  const result = {};
  const lines = yamlStr.split('\n');
  let currentKey = null;
  let currentIndent = 0;
  let arrayKey = null;
  let objectKey = null;
  let objectValue = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '' || line.trim().startsWith('#')) continue;

    const indent = line.search(/\S/);

    // Top-level array item
    if (indent === 2 && line.trim().startsWith('- ') && arrayKey) {
      const val = line.trim().slice(2).replace(/^["']|["']$/g, '');
      if (!Array.isArray(result[arrayKey])) result[arrayKey] = [];
      result[arrayKey].push(val);
      continue;
    }

    // Nested object value
    if (indent >= 2 && objectKey && line.includes(':')) {
      const [k, ...rest] = line.trim().split(':');
      const v = rest.join(':').trim().replace(/^["']|["']$/g, '');
      if (!result[objectKey]) result[objectKey] = {};
      if (v === '' || v === 'null') {
        result[objectKey][k.trim()] = null;
      } else if (v.startsWith('[')) {
        result[objectKey][k.trim()] = v.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
      } else if (v === 'true') {
        result[objectKey][k.trim()] = true;
      } else if (v === 'false') {
        result[objectKey][k.trim()] = false;
      } else {
        result[objectKey][k.trim()] = v;
      }
      continue;
    }

    // Top-level key: value
    if (indent === 0 && line.includes(':')) {
      arrayKey = null;
      objectKey = null;
      const colonIdx = line.indexOf(':');
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();

      if (val === '') {
        // Could be object or array - check next line
        const nextLine = lines[i + 1];
        if (nextLine && nextLine.trim().startsWith('- ')) {
          arrayKey = key;
          result[key] = [];
        } else {
          objectKey = key;
          result[key] = {};
        }
      } else if (val === 'null') {
        result[key] = null;
      } else if (val === 'true') {
        result[key] = true;
      } else if (val === 'false') {
        result[key] = false;
      } else if (val.startsWith('[')) {
        result[key] = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
      } else if (/^\d+$/.test(val)) {
        result[key] = parseInt(val, 10);
      } else {
        result[key] = val.replace(/^["']|["']$/g, '');
      }
      currentKey = key;
    }
  }

  return result;
}

// --- Serialize frontmatter + content ---

export function serialize(frontmatter, content) {
  const yaml = serializeYaml(frontmatter);
  return `---\n${yaml}---\n\n${content}\n`;
}

function serializeYaml(obj, indent = 0) {
  let out = '';
  const pad = ' '.repeat(indent);

  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) {
      out += `${pad}${key}: null\n`;
    } else if (typeof val === 'boolean') {
      out += `${pad}${key}: ${val}\n`;
    } else if (typeof val === 'number') {
      out += `${pad}${key}: ${val}\n`;
    } else if (typeof val === 'string') {
      if (val.includes(':') || val.includes('#') || val.includes('"')) {
        out += `${pad}${key}: "${val}"\n`;
      } else {
        out += `${pad}${key}: ${val}\n`;
      }
    } else if (Array.isArray(val)) {
      if (val.length === 0) {
        out += `${pad}${key}: []\n`;
      } else {
        out += `${pad}${key}:\n`;
        for (const item of val) {
          out += `${pad}  - "${item}"\n`;
        }
      }
    } else if (typeof val === 'object') {
      out += `${pad}${key}:\n`;
      out += serializeYaml(val, indent + 2);
    }
  }

  return out;
}

// --- Update frontmatter in a file ---

export function updateFrontmatter(filePath, updates) {
  const { frontmatter, content } = parseFile(filePath);
  const merged = deepMerge(frontmatter, updates);
  const serialized = serialize(merged, content);
  writeFileSync(filePath, serialized, 'utf-8');
  return merged;
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const [key, val] of Object.entries(source)) {
    if (val && typeof val === 'object' && !Array.isArray(val) && typeof result[key] === 'object' && !Array.isArray(result[key])) {
      result[key] = deepMerge(result[key], val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

// --- Markdown to HTML conversion ---

export function toHtml(markdown) {
  let html = markdown;

  // Code blocks (must be first to avoid interference)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code${lang ? ` class="language-${lang}"` : ''}>${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Headings
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  // Merge consecutive blockquotes
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');

  // Tables
  html = convertTables(html);

  // Lists
  html = convertLists(html);

  // Paragraphs - wrap remaining text lines
  html = wrapParagraphs(html);

  return html.trim();
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function convertTables(html) {
  const lines = html.split('\n');
  const result = [];
  let inTable = false;
  let tableLines = [];

  for (const line of lines) {
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableLines = [];
      }
      tableLines.push(line);
    } else {
      if (inTable) {
        result.push(buildTable(tableLines));
        inTable = false;
        tableLines = [];
      }
      result.push(line);
    }
  }
  if (inTable) result.push(buildTable(tableLines));

  return result.join('\n');
}

function buildTable(lines) {
  const rows = lines
    .filter(l => !l.match(/^\|[\s-:|]+\|$/)) // Remove separator rows
    .map(l => l.split('|').slice(1, -1).map(c => c.trim()));

  if (rows.length === 0) return '';

  const [header, ...body] = rows;
  let html = '<table>\n<thead>\n<tr>';
  for (const cell of header) html += `<th>${cell}</th>`;
  html += '</tr>\n</thead>\n<tbody>';
  for (const row of body) {
    html += '\n<tr>';
    for (const cell of row) html += `<td>${cell}</td>`;
    html += '</tr>';
  }
  html += '\n</tbody>\n</table>';
  return html;
}

function convertLists(html) {
  const lines = html.split('\n');
  const result = [];
  let listType = null; // 'ul' or 'ol'
  let listItems = [];

  for (const line of lines) {
    const ulMatch = line.match(/^(\s*)[-*] (.+)/);
    const olMatch = line.match(/^(\s*)\d+\. (.+)/);

    if (ulMatch && !line.startsWith('<')) {
      if (listType !== 'ul') {
        if (listType) result.push(closeList(listType, listItems));
        listType = 'ul';
        listItems = [];
      }
      listItems.push(ulMatch[2]);
    } else if (olMatch && !line.startsWith('<')) {
      if (listType !== 'ol') {
        if (listType) result.push(closeList(listType, listItems));
        listType = 'ol';
        listItems = [];
      }
      listItems.push(olMatch[2]);
    } else {
      if (listType) {
        result.push(closeList(listType, listItems));
        listType = null;
        listItems = [];
      }
      result.push(line);
    }
  }
  if (listType) result.push(closeList(listType, listItems));

  return result.join('\n');
}

function closeList(type, items) {
  const inner = items.map(i => `<li>${i}</li>`).join('\n');
  return `<${type}>\n${inner}\n</${type}>`;
}

function wrapParagraphs(html) {
  const lines = html.split('\n');
  const result = [];
  let paragraphLines = [];

  const blockTags = /^<(h[1-6]|ul|ol|li|table|thead|tbody|tr|th|td|pre|blockquote|hr|img|div|details|summary)/;
  const closingBlockTags = /^<\/(ul|ol|table|thead|tbody|pre|blockquote|div|details)/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') {
      if (paragraphLines.length > 0) {
        result.push(`<p>${paragraphLines.join(' ')}</p>`);
        paragraphLines = [];
      }
    } else if (blockTags.test(trimmed) || closingBlockTags.test(trimmed)) {
      if (paragraphLines.length > 0) {
        result.push(`<p>${paragraphLines.join(' ')}</p>`);
        paragraphLines = [];
      }
      result.push(line);
    } else {
      paragraphLines.push(trimmed);
    }
  }
  if (paragraphLines.length > 0) {
    result.push(`<p>${paragraphLines.join(' ')}</p>`);
  }

  return result.join('\n');
}

// --- Content analysis ---

export function extractHeadings(content) {
  const headings = [];
  const regex = /^(#{1,6}) (.+)$/gm;
  let match;
  while ((match = regex.exec(content))) {
    headings.push({ level: match[1].length, text: match[2].trim() });
  }
  return headings;
}

export function extractLinks(content) {
  const links = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(content))) {
    const url = match[2];
    links.push({
      text: match[1],
      url,
      isInternal: url.startsWith('/') || url.includes('tradersyard.com'),
    });
  }
  return links;
}

export function countWords(content) {
  // Strip markdown syntax for accurate count
  const plain = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/[*_~`]/g, '')
    .replace(/\|.*\|/g, '')
    .replace(/---/g, '');
  return plain.split(/\s+/).filter(w => w.length > 0).length;
}
