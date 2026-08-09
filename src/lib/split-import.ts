const HEADING_RE = /^(#{1,6})\s+/;

function isHeadingAt(line: string, level: number): boolean {
  const prefix = '#'.repeat(level) + ' ';
  return line.startsWith(prefix) && !line.startsWith(prefix + '#');
}

function headingText(line: string, level: number): string {
  return line.slice(level + 1);
}

function splitAtLevel(lines: string[], level: number): string[][] {
  const sections: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (isHeadingAt(line, level)) {
      if (current.length > 0) sections.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) sections.push(current);
  return sections;
}

function promoteHeading(line: string, fromLevel: number): string {
  if (fromLevel === 1) return line;
  const prefix = '#'.repeat(fromLevel) + ' ';
  if (line.startsWith(prefix)) {
    return '# ' + line.slice(prefix.length);
  }
  return line;
}

function cleanSegment(text: string): string | null {
  const t = text.trimEnd();
  return t.length > 0 ? t : null;
}

export function splitIntoChapters(markdown: string): string[] {
  if (!markdown.trim()) return [];

  const lines = markdown.split('\n');

  const levelCounts = new Map<number, number>();
  for (const line of lines) {
    const m = HEADING_RE.exec(line);
    if (m?.[1]) {
      const level = m[1].length;
      levelCounts.set(level, (levelCounts.get(level) ?? 0) + 1);
    }
  }

  const repeated: number[] = [];
  for (let l = 1; l <= 6; l++) {
    if ((levelCounts.get(l) ?? 0) >= 2) repeated.push(l);
  }

  if (repeated.length === 0) return [markdown];

  if (repeated.length === 1) {
    return splitSingleLevel(lines, repeated[0]!);
  }

  return splitTwoLevels(lines, repeated[0]!, repeated[1]!);
}

function splitSingleLevel(lines: string[], chapterLevel: number): string[] {
  const sections = splitAtLevel(lines, chapterLevel);

  const trimmed = sections
    .map((s) => s.join('\n'))
    .map((s) => cleanSegment(s))
    .filter((s): s is string => s !== null);

  if (chapterLevel === 1) return trimmed;

  return trimmed.map((seg) => {
    const segLines = seg.split('\n');
    segLines[0] = promoteHeading(segLines[0]!, chapterLevel);
    return segLines.join('\n');
  });
}

function splitTwoLevels(
  lines: string[],
  partLevel: number,
  chapterLevel: number,
): string[] {
  const partSections = splitAtLevel(lines, partLevel);
  const result: string[] = [];

  for (const section of partSections) {
    const firstLine = section[0]!;
    const isPart = isHeadingAt(firstLine, partLevel);

    if (!isPart) {
      // Pre-content before first structural heading
      const seg = cleanSegment(section.join('\n'));
      if (seg) result.push(seg);
      continue;
    }

    // Check if this part section contains any chapterLevel headings
    const hasChapters = section.some((l, i) => i > 0 && isHeadingAt(l, chapterLevel));

    if (!hasChapters) {
      // Leaf section (e.g., NOTA DEL AUTOR, PRÓLOGO): one chapter, promote to H1
      const segLines = [...section];
      segLines[0] = promoteHeading(segLines[0]!, partLevel);
      const seg = cleanSegment(segLines.join('\n'));
      if (seg) result.push(seg);
      continue;
    }

    // Part with chapters: split by chapterLevel
    const partTitle = headingText(firstLine, partLevel);
    const marker = `**${partTitle}**`;

    // Collect prose-intro between part heading and first chapter heading
    const introLines: string[] = [];
    let firstChapterIdx = -1;
    for (let i = 1; i < section.length; i++) {
      if (isHeadingAt(section[i]!, chapterLevel)) {
        firstChapterIdx = i;
        break;
      }
      introLines.push(section[i]!);
    }

    const chapterSections = splitAtLevel(
      section.slice(firstChapterIdx === -1 ? section.length : firstChapterIdx),
      chapterLevel,
    );

    for (let ci = 0; ci < chapterSections.length; ci++) {
      const chLines = [...chapterSections[ci]!];
      chLines[0] = promoteHeading(chLines[0]!, chapterLevel);

      if (ci === 0) {
        // Prepend part marker + prose-intro to first chapter of this part
        const proseIntro = introLines.join('\n').trim();
        const prefix = proseIntro ? `${marker}\n\n${proseIntro}\n\n` : `${marker}\n\n`;
        const seg = cleanSegment(prefix + chLines.join('\n'));
        if (seg) result.push(seg);
      } else {
        const seg = cleanSegment(chLines.join('\n'));
        if (seg) result.push(seg);
      }
    }
  }

  return result;
}
