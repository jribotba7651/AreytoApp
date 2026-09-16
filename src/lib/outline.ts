export function getChapterOutline(content: string) {
  const lines = content.split('\n');
  const outline = [];
  for (const line of lines) {
    if (line.startsWith('# ')) {
      outline.push({ level: 1, text: line.substring(2).trim() });
    } else if (line.startsWith('## ')) {
      outline.push({ level: 2, text: line.substring(3).trim() });
    }
    if (outline.length >= 6) break;
  }
  return outline;
}
