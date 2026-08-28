import path from 'node:path';

export interface ParsedWikilink {
  target: string;
  alias?: string;
  heading?: string;
  raw: string;
  line: number;
}

export function extractWikilinks(content: string): ParsedWikilink[] {
  const links: ParsedWikilink[] = [];
  const lines = content.split('\n');

  // Match [[target]], [[target|alias]], [[target#heading]], [[target#heading|alias]]
  // Exclude image embeds like ![[...]] if needed or treat them as image wikilinks
  const regex = /(?:!?)\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;

  lines.forEach((lineText, lineIndex) => {
    let match;
    while ((match = regex.exec(lineText)) !== null) {
      const isEmbed = match[0].startsWith('!');
      if (!isEmbed) {
        links.push({
          target: match[1].trim(),
          heading: match[2]?.trim(),
          alias: match[3]?.trim(),
          raw: match[0],
          line: lineIndex + 1,
        });
      }
    }
  });

  return links;
}

export function resolveWikilinkTarget(
  target: string,
  fromNotePath: string,
  allNotePaths: string[]
): { resolvedPath: string | null; exists: boolean } {
  // Normalize target: remove .md if present, clean slashes
  let cleanTarget = target.replace(/\.md$/i, '').trim();
  cleanTarget = cleanTarget.replace(/^\/+/, '');

  // 1. Direct path check (e.g. "appliances/Espresso Machine" -> "appliances/Espresso Machine.md")
  const directPath = cleanTarget.endsWith('.md') ? cleanTarget : `${cleanTarget}.md`;
  const directMatch = allNotePaths.find(
    (p) => p.toLowerCase() === directPath.toLowerCase()
  );
  if (directMatch) {
    return { resolvedPath: directMatch, exists: true };
  }

  // 2. Relative to fromNotePath's directory
  const fromDir = path.dirname(fromNotePath);
  if (fromDir && fromDir !== '.') {
    const relativeCandidate = path.join(fromDir, directPath).replace(/\\/g, '/');
    const relativeMatch = allNotePaths.find(
      (p) => p.toLowerCase() === relativeCandidate.toLowerCase()
    );
    if (relativeMatch) {
      return { resolvedPath: relativeMatch, exists: true };
    }
  }

  // 3. Basename search across entire vault (e.g. "Espresso Machine" -> "appliances/Espresso Machine.md")
  const targetBaseName = path.basename(cleanTarget).toLowerCase();
  const basenameMatch = allNotePaths.find((p) => {
    const noteBase = path.basename(p, path.extname(p)).toLowerCase();
    return noteBase === targetBaseName;
  });

  if (basenameMatch) {
    return { resolvedPath: basenameMatch, exists: true };
  }

  // Target does not exist currently: return prospective relative or root path
  const prospectivePath = cleanTarget.includes('/')
    ? `${cleanTarget}.md`
    : `${cleanTarget}.md`;

  return { resolvedPath: prospectivePath, exists: false };
}
