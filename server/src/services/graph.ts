import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { getAllNotePaths, readNote } from './vault.js';
import { extractWikilinks, resolveWikilinkTarget } from '../utils/markdown.js';
import { resolveVaultPath } from '../utils/security.js';

export interface GraphNode {
  id: string;
  label: string;
  path: string;
  folder: string;
  exists: boolean;
  incomingCount: number;
  outgoingCount: number;
}

export interface GraphLink {
  source: string;
  target: string;
  label?: string;
}

export interface BacklinkItem {
  sourcePath: string;
  sourceTitle: string;
  line: number;
  excerpt: string;
}

export class VaultGraphService {
  private nodesMap = new Map<string, GraphNode>();
  private linksList: GraphLink[] = [];
  private backlinksMap = new Map<string, BacklinkItem[]>();
  private vaultPath: string;
  private isIndexed = false;

  constructor(vaultPath: string) {
    this.vaultPath = vaultPath;
  }

  public setVaultPath(vaultPath: string) {
    this.vaultPath = vaultPath;
    this.isIndexed = false;
  }

  public async ensureIndexed(): Promise<void> {
    if (!this.isIndexed) {
      await this.reindex();
    }
  }

  public async reindex(): Promise<void> {
    const allNotePaths = await getAllNotePaths(this.vaultPath);
    const newNodes = new Map<string, GraphNode>();
    const newLinks: GraphLink[] = [];
    const newBacklinks = new Map<string, BacklinkItem[]>();

    // 1. Initialize nodes for existing notes
    for (const notePath of allNotePaths) {
      const folder = path.dirname(notePath) === '.' ? 'root' : path.dirname(notePath);
      const title = path.basename(notePath, path.extname(notePath));
      newNodes.set(notePath, {
        id: notePath,
        label: title,
        path: notePath,
        folder,
        exists: true,
        incomingCount: 0,
        outgoingCount: 0,
      });
    }

    // 2. Read each note and parse wikilinks
    for (const sourcePath of allNotePaths) {
      try {
        const fullPath = resolveVaultPath(sourcePath, this.vaultPath);
        const rawContent = await fs.readFile(fullPath, 'utf-8');
        const parsed = matter(rawContent);
        const sourceTitle = (parsed.data.title as string) || path.basename(sourcePath, path.extname(sourcePath));
        
        // Update label with frontmatter title if available
        const sourceNode = newNodes.get(sourcePath);
        if (sourceNode) {
          sourceNode.label = sourceTitle;
        }

        const lines = parsed.content.split('\n');
        const wikilinks = extractWikilinks(parsed.content);

        for (const link of wikilinks) {
          const { resolvedPath, exists } = resolveWikilinkTarget(link.target, sourcePath, allNotePaths);
          const targetId = resolvedPath || link.target;

          // If target is non-existent, add as ghost node
          if (!newNodes.has(targetId)) {
            const folder = path.dirname(targetId) === '.' ? 'root' : path.dirname(targetId);
            newNodes.set(targetId, {
              id: targetId,
              label: path.basename(targetId, path.extname(targetId)),
              path: targetId,
              folder,
              exists: false,
              incomingCount: 0,
              outgoingCount: 0,
            });
          }

          // Record link
          newLinks.push({
            source: sourcePath,
            target: targetId,
            label: link.alias,
          });

          // Increment counters
          const srcNode = newNodes.get(sourcePath);
          if (srcNode) srcNode.outgoingCount++;

          const tgtNode = newNodes.get(targetId);
          if (tgtNode) tgtNode.incomingCount++;

          // Extract backlink excerpt (line text trimmed)
          const lineIndex = link.line - 1;
          const lineText = lines[lineIndex] || '';
          const excerpt = lineText.trim();

          const existingBacklinks = newBacklinks.get(targetId) || [];
          existingBacklinks.push({
            sourcePath,
            sourceTitle,
            line: link.line,
            excerpt,
          });
          newBacklinks.set(targetId, existingBacklinks);
        }
      } catch (err) {
        console.error(`Failed to parse links for ${sourcePath}:`, err);
      }
    }

    this.nodesMap = newNodes;
    this.linksList = newLinks;
    this.backlinksMap = newBacklinks;
    this.isIndexed = true;
  }

  public getGraphData(): { nodes: GraphNode[]; links: GraphLink[]; edges: GraphLink[] } {
    return {
      nodes: Array.from(this.nodesMap.values()),
      links: this.linksList,
      edges: this.linksList,
    };
  }

  public getBacklinks(notePath: string): BacklinkItem[] {
    const cleanPath = notePath.endsWith('.md') ? notePath : `${notePath}.md`;
    // Direct match
    if (this.backlinksMap.has(cleanPath)) {
      return this.backlinksMap.get(cleanPath) || [];
    }

    // Try finding by basename if not direct
    const base = path.basename(cleanPath, path.extname(cleanPath)).toLowerCase();
    for (const [key, items] of this.backlinksMap.entries()) {
      if (path.basename(key, path.extname(key)).toLowerCase() === base) {
        return items;
      }
    }

    return [];
  }
}
