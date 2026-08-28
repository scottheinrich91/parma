import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { getAllNotePaths } from './vault.js';
import { resolveVaultPath } from '../utils/security.js';

export interface SearchMatch {
  line: number;
  text: string;
}

export interface SearchResult {
  path: string;
  title: string;
  folder: string;
  score: number;
  snippet: string;
  matches: SearchMatch[];
}

export interface SearchOptions {
  matchCase?: boolean;
}

interface ParsedQuery {
  terms: string[];
  pathFilters: string[];
  fileFilters: string[];
  tagFilters: string[];
  lineFilters: string[][];
  sectionFilters: string[];
  propertyFilters: { key: string; value?: string }[];
}

export class VaultSearchService {
  private vaultPath: string;

  constructor(vaultPath: string) {
    this.vaultPath = vaultPath;
  }

  public setVaultPath(vaultPath: string) {
    this.vaultPath = vaultPath;
  }

  private parseQuery(rawQuery: string, matchCase: boolean): ParsedQuery {
    const query = rawQuery.trim();
    const result: ParsedQuery = {
      terms: [],
      pathFilters: [],
      fileFilters: [],
      tagFilters: [],
      lineFilters: [],
      sectionFilters: [],
      propertyFilters: [],
    };

    if (!query) return result;

    // Tokenize while respecting quotes and parens
    const tokenRegex = /(?:path|file|tag|line|section):(?:\([^)]+\)|"[^"]+"|\S+)|\[[^\]]+\]|"[^"]+"|\S+/gi;
    const tokens = query.match(tokenRegex) || [];

    for (const token of tokens) {
      const lowerToken = token.toLowerCase();

      if (lowerToken.startsWith('path:')) {
        const val = token.slice(5).replace(/^["(]|["\)]$/g, '').trim();
        if (val) result.pathFilters.push(matchCase ? val : val.toLowerCase());
      } else if (lowerToken.startsWith('file:')) {
        const val = token.slice(5).replace(/^["(]|["\)]$/g, '').trim();
        if (val) result.fileFilters.push(matchCase ? val : val.toLowerCase());
      } else if (lowerToken.startsWith('tag:')) {
        const val = token.slice(4).replace(/^["(]|["\)]$/g, '').replace(/^#/, '').trim();
        if (val) result.tagFilters.push(matchCase ? val : val.toLowerCase());
      } else if (lowerToken.startsWith('line:')) {
        const inner = token.slice(5).replace(/^["(]|["\)]$/g, '').trim();
        const subTerms = inner.split(/\s+/).filter(Boolean).map((t) => (matchCase ? t : t.toLowerCase()));
        if (subTerms.length > 0) result.lineFilters.push(subTerms);
      } else if (lowerToken.startsWith('section:')) {
        const val = token.slice(8).replace(/^["(]|["\)]$/g, '').trim();
        if (val) result.sectionFilters.push(matchCase ? val : val.toLowerCase());
      } else if (token.startsWith('[') && token.endsWith(']')) {
        const propStr = token.slice(1, -1).trim();
        if (propStr.includes(':')) {
          const [k, ...vParts] = propStr.split(':');
          const val = vParts.join(':').trim();
          result.propertyFilters.push({
            key: matchCase ? k.trim() : k.trim().toLowerCase(),
            value: matchCase ? val : val.toLowerCase(),
          });
        } else if (propStr) {
          result.propertyFilters.push({
            key: matchCase ? propStr : propStr.toLowerCase(),
          });
        }
      } else {
        const cleanTerm = token.replace(/^"|"$/g, '').trim();
        if (cleanTerm) {
          result.terms.push(matchCase ? cleanTerm : cleanTerm.toLowerCase());
        }
      }
    }

    return result;
  }

  public async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const matchCase = !!options.matchCase;
    const parsed = this.parseQuery(query, matchCase);

    const hasCriteria =
      parsed.terms.length > 0 ||
      parsed.pathFilters.length > 0 ||
      parsed.fileFilters.length > 0 ||
      parsed.tagFilters.length > 0 ||
      parsed.lineFilters.length > 0 ||
      parsed.sectionFilters.length > 0 ||
      parsed.propertyFilters.length > 0;

    if (!hasCriteria) return [];

    const notePaths = await getAllNotePaths(this.vaultPath);
    const results: SearchResult[] = [];

    for (const relPath of notePaths) {
      try {
        const fullPath = resolveVaultPath(relPath, this.vaultPath);
        const raw = await fs.readFile(fullPath, 'utf-8');
        const parsedMatter = matter(raw);

        const title =
          (parsedMatter.data.title as string) ||
          parsedMatter.content.match(/^#\s+(.+)$/m)?.[1]?.trim() ||
          path.basename(relPath, path.extname(relPath));

        const folder = path.dirname(relPath) === '.' ? 'root' : path.dirname(relPath);
        const fileName = path.basename(relPath);

        const normTitle = matchCase ? title : title.toLowerCase();
        const normPath = matchCase ? relPath : relPath.toLowerCase();
        const normFileName = matchCase ? fileName : fileName.toLowerCase();
        const normContent = matchCase ? parsedMatter.content : parsedMatter.content.toLowerCase();

        // 1. Path filters
        if (parsed.pathFilters.some((pf) => !normPath.includes(pf))) {
          continue;
        }

        // 2. File filters
        if (parsed.fileFilters.some((ff) => !normFileName.includes(ff))) {
          continue;
        }

        // 3. Tag filters
        if (parsed.tagFilters.length > 0) {
          const frontmatterTags: string[] = [];
          if (Array.isArray(parsedMatter.data.tags)) {
            frontmatterTags.push(...parsedMatter.data.tags.map((t: any) => String(t)));
          } else if (typeof parsedMatter.data.tags === 'string') {
            frontmatterTags.push(...parsedMatter.data.tags.split(/[\s,]+/));
          }
          if (parsedMatter.data.tag) {
            frontmatterTags.push(String(parsedMatter.data.tag));
          }

          // Also match #tag in content
          const contentTagMatches = normContent.match(/#([a-zA-Z0-9_\-]+)/g) || [];
          const allTags = [
            ...frontmatterTags.map((t) => (matchCase ? t.replace(/^#/, '') : t.replace(/^#/, '').toLowerCase())),
            ...contentTagMatches.map((t) => (matchCase ? t.slice(1) : t.slice(1).toLowerCase())),
          ];

          const tagsMatch = parsed.tagFilters.every((tf) => allTags.some((t) => t.includes(tf)));
          if (!tagsMatch) continue;
        }

        // 4. Property filters
        if (parsed.propertyFilters.length > 0) {
          let propMatch = true;
          for (const pf of parsed.propertyFilters) {
            const dataKeys = Object.keys(parsedMatter.data);
            const matchedKey = dataKeys.find((k) =>
              matchCase ? k === pf.key : k.toLowerCase() === pf.key
            );
            if (!matchedKey) {
              propMatch = false;
              break;
            }
            if (pf.value !== undefined) {
              const valStr = String(parsedMatter.data[matchedKey]);
              const normVal = matchCase ? valStr : valStr.toLowerCase();
              if (!normVal.includes(pf.value)) {
                propMatch = false;
                break;
              }
            }
          }
          if (!propMatch) continue;
        }

        const lines = parsedMatter.content.split('\n');
        let score = 0;
        const matchedLines: SearchMatch[] = [];

        // 5. Title matches
        for (const term of parsed.terms) {
          if (normTitle === term) {
            score += 100;
          } else if (normTitle.includes(term)) {
            score += 40;
          }
        }

        // 6. Path / Folder matches
        for (const term of parsed.terms) {
          if (normPath.includes(term)) {
            score += 15;
          }
        }

        // 7. Section filters & Line filters & Term matches across content lines
        let currentHeading = '';
        lines.forEach((lineText, idx) => {
          const normLine = matchCase ? lineText : lineText.toLowerCase();

          if (lineText.startsWith('#')) {
            currentHeading = lineText.replace(/^#+\s*/, '').trim();
          }

          let lineMatches = false;

          // Term matching
          for (const term of parsed.terms) {
            if (normLine.includes(term)) {
              lineMatches = true;
              if (lineText.startsWith('#')) {
                score += 20;
              } else {
                score += 5;
              }
            }
          }

          // Line filter check (all sub-terms on this single line)
          for (const subTerms of parsed.lineFilters) {
            if (subTerms.every((st) => normLine.includes(st))) {
              lineMatches = true;
              score += 30;
            }
          }

          // Section filter check
          for (const sec of parsed.sectionFilters) {
            const normSec = matchCase ? currentHeading : currentHeading.toLowerCase();
            if (normSec.includes(sec)) {
              lineMatches = true;
              score += 25;
            }
          }

          if (lineMatches && matchedLines.length < 15) {
            matchedLines.push({
              line: idx + 1,
              text: lineText.trim(),
            });
          }
        });

        // Filter out if specific terms had 0 score and there are active term filters
        if (parsed.terms.length > 0 && score === 0) {
          continue;
        }

        // Default base score for filter-only queries
        if (score === 0 && (parsed.pathFilters.length > 0 || parsed.fileFilters.length > 0 || parsed.tagFilters.length > 0 || parsed.propertyFilters.length > 0)) {
          score = 10;
        }

        if (score > 0) {
          const firstSnippet =
            matchedLines[0]?.text || lines.find((l) => l.trim().length > 0)?.trim() || '';
          results.push({
            path: relPath,
            title,
            folder,
            score,
            snippet: firstSnippet,
            matches: matchedLines,
          });
        }
      } catch (err) {
        console.error(`Search error indexing ${relPath}:`, err);
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }
}
