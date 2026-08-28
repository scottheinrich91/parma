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

export class VaultSearchService {
  private vaultPath: string;

  constructor(vaultPath: string) {
    this.vaultPath = vaultPath;
  }

  public setVaultPath(vaultPath: string) {
    this.vaultPath = vaultPath;
  }

  public async search(query: string): Promise<SearchResult[]> {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return [];

    const queryTerms = cleanQuery.split(/\s+/).filter(Boolean);
    const notePaths = await getAllNotePaths(this.vaultPath);
    const results: SearchResult[] = [];

    for (const relPath of notePaths) {
      try {
        const fullPath = resolveVaultPath(relPath, this.vaultPath);
        const raw = await fs.readFile(fullPath, 'utf-8');
        const parsed = matter(raw);

        const title = (parsed.data.title as string) || 
          (parsed.content.match(/^#\s+(.+)$/m)?.[1]?.trim()) || 
          path.basename(relPath, path.extname(relPath));
        
        const folder = path.dirname(relPath) === '.' ? 'root' : path.dirname(relPath);
        const lines = parsed.content.split('\n');

        let score = 0;
        const matchedLines: SearchMatch[] = [];

        // Check title match
        const lowerTitle = title.toLowerCase();
        for (const term of queryTerms) {
          if (lowerTitle === term) {
            score += 100;
          } else if (lowerTitle.includes(term)) {
            score += 40;
          }
        }

        // Check path / folder match
        const lowerPath = relPath.toLowerCase();
        for (const term of queryTerms) {
          if (lowerPath.includes(term)) {
            score += 15;
          }
        }

        // Check content lines
        lines.forEach((lineText, idx) => {
          const lowerLine = lineText.toLowerCase();
          let lineMatches = false;

          for (const term of queryTerms) {
            if (lowerLine.includes(term)) {
              lineMatches = true;
              // Higher weight for headings
              if (lineText.startsWith('#')) {
                score += 15;
              } else {
                score += 5;
              }
            }
          }

          if (lineMatches && matchedLines.length < 5) {
            matchedLines.push({
              line: idx + 1,
              text: lineText.trim(),
            });
          }
        });

        if (score > 0) {
          const firstSnippet = matchedLines[0]?.text || lines.find((l) => l.trim().length > 0)?.trim() || '';
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

    // Sort by descending score
    return results.sort((a, b) => b.score - a.score);
  }
}
