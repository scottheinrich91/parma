export interface VaultNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  size?: number;
  updatedAt?: string;
  children?: VaultNode[];
}

export interface NoteData {
  path: string;
  title: string;
  content: string;
  raw: string;
  frontmatter: Record<string, any>;
  stats: {
    size: number;
    mtime: string;
    birthtime: string;
  };
}

export interface GraphNode {
  id: string;
  label: string;
  path: string;
  folder: string;
  exists: boolean;
  incomingCount: number;
  outgoingCount: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  label?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface BacklinkItem {
  sourcePath: string;
  sourceTitle: string;
  line: number;
  excerpt: string;
}

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

export interface UploadResponse {
  success: boolean;
  filename: string;
  relativePath: string;
  mediaUrl: string;
  caption?: string;
  markdownSnippet: string;
}
