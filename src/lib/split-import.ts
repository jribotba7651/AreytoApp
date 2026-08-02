const HEADING_RE = /^(#{1,6})\s+/;

export function splitIntoChapters(markdown: string): string[] {
  if (!markdown.trim()) return [];

  const lines = markdown.split('\n');

  // Count occurrences of each heading level
  const levelCounts = new Map<number, number>();
  for (const line of lines) {
    const m = HEADING_RE.exec(line);
    if (m?.[1]) {
      const level = m[1].length;
      levelCounts.set(level, (levelCounts.get(level) ?? 0) + 1);
    }
  }

  // Find shallowest level that appears 2+ times
  let chapterLevel: number | null = null;
  for (let l = 1; l <= 6; l++) {
    if ((levelCounts.get(l) ?? 0) >= 2) {
      chapterLevel = l;
      break;
    }
  }

  if (chapterLevel === null) {
    return [markdown];
  }

  const chapterPrefix = '#'.repeat(chapterLevel) + ' ';
  const segments: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (line.startsWith(chapterPrefix) && !line.startsWith(chapterPrefix + '#')) {
      if (current.length > 0) {
        segments.push(current.join('\n'));
      }
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) {
    segments.push(current.join('\n'));
  }

  // Trim trailing whitespace from each segment, drop empty ones
  const trimmed = segments.map((s) => s.trimEnd()).filter((s) => s.length > 0);

  // Promote chapter headings to H1 if chapterLevel > 1
  if (chapterLevel > 1) {
    return trimmed.map((seg) => {
      const segLines = seg.split('\n');
      if (segLines[0]?.startsWith(chapterPrefix)) {
        segLines[0] = '# ' + segLines[0].slice(chapterPrefix.length);
      }
      return segLines.join('\n');
    });
  }

  return trimmed;
}
