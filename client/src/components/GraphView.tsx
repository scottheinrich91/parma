import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3-force';
import { 
  Network, 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Search, 
  Play, 
  Pause, 
  Sparkles,
  Layers
} from 'lucide-react';
import { fetchGraph } from '../api';
import { GraphData, GraphNode, GraphLink } from '../types';

interface GraphViewProps {
  isOpen: boolean;
  currentNotePath: string;
  onClose: () => void;
  onSelectNote: (path: string) => void;
}

const FOLDER_COLORS: Record<string, string> = {
  root: '#3b82f6', // blue
  appliances: '#10b981', // emerald
  recipes: '#f59e0b', // amber
  household: '#8b5cf6', // purple
  guides: '#ec4899', // pink
};

export const GraphView: React.FC<GraphViewProps> = ({
  isOpen,
  currentNotePath,
  onClose,
  onSelectNote,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [isLocalOnly, setIsLocalOnly] = useState(false);
  const [isSimulating, setIsSimulating] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Pan and zoom state
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<GraphNode | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchGraph()
        .then((data) => {
          setGraphData(data);
        })
        .catch((err) => console.error('Failed to load graph:', err));
    }
  }, [isOpen]);

  // Filter nodes and links based on query or local mode
  const filteredData = useMemo(() => {
    if (!graphData) return { nodes: [], links: [] };

    let nodes = [...graphData.nodes];
    let links = [...graphData.links];

    // Local mode: filter to current note and immediate neighbors
    if (isLocalOnly && currentNotePath) {
      const neighborIds = new Set<string>([currentNotePath]);
      links.forEach((l) => {
        const srcId = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const tgtId = typeof l.target === 'object' ? (l.target as any).id : l.target;
        if (srcId === currentNotePath) neighborIds.add(tgtId);
        if (tgtId === currentNotePath) neighborIds.add(srcId);
      });

      nodes = nodes.filter((n) => neighborIds.has(n.id));
      links = links.filter((l) => {
        const srcId = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const tgtId = typeof l.target === 'object' ? (l.target as any).id : l.target;
        return neighborIds.has(srcId) && neighborIds.has(tgtId);
      });
    }

    // Search filter
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      nodes = nodes.map((n) => ({
        ...n,
        isHighlighted: n.label.toLowerCase().includes(q) || n.path.toLowerCase().includes(q),
      })) as any;
    }

    return { nodes, links };
  }, [graphData, isLocalOnly, currentNotePath, filterQuery]);

  // D3 force simulation
  useEffect(() => {
    if (!isOpen || !canvasRef.current || filteredData.nodes.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Deep copy nodes and links for d3 simulation mutation
    const simNodes: GraphNode[] = filteredData.nodes.map((d) => ({ ...d }));
    const nodeMap = new Map(simNodes.map((n) => [n.id, n]));

    const simLinks = filteredData.links
      .map((l) => {
        const srcId = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const tgtId = typeof l.target === 'object' ? (l.target as any).id : l.target;
        return {
          source: nodeMap.get(srcId),
          target: nodeMap.get(tgtId),
        };
      })
      .filter((l) => l.source && l.target);

    const simulation = d3.forceSimulation(simNodes as any)
      .force('link', d3.forceLink(simLinks as any).distance(90).strength(0.6))
      .force('charge', d3.forceManyBody().strength(-240))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => 14 + (d.incomingCount || 0) * 2));

    const isDarkMode = document.documentElement.classList.contains('dark');

    const render = () => {
      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // Apply zoom & pan transform
      ctx.translate(transformRef.current.x, transformRef.current.y);
      ctx.scale(transformRef.current.scale, transformRef.current.scale);

      // Draw Links
      ctx.strokeStyle = isDarkMode ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.45)';
      ctx.lineWidth = 1.5;
      simLinks.forEach((link: any) => {
        if (!link.source || !link.target) return;
        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.lineTo(link.target.x, link.target.y);
        ctx.stroke();
      });

      // Draw Nodes
      simNodes.forEach((node: any) => {
        const isCurrent = node.id === currentNotePath;
        const radius = Math.max(7, Math.min(20, 7 + (node.incomingCount || 0) * 2.5));
        const color = FOLDER_COLORS[node.folder] || '#64748b';

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);

        if (!node.exists) {
          ctx.fillStyle = isDarkMode ? '#475569' : '#cbd5e1';
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
        } else {
          ctx.fillStyle = isCurrent ? '#2563eb' : color;
          ctx.setLineDash([]);
          ctx.strokeStyle = isCurrent ? '#ffffff' : (isDarkMode ? '#1e293b' : '#ffffff');
          ctx.lineWidth = isCurrent ? 3 : 2;
        }

        ctx.fill();
        ctx.stroke();

        // Label
        ctx.fillStyle = isDarkMode ? '#e2e8f0' : '#1e293b';
        ctx.font = isCurrent ? 'bold 12px Inter, sans-serif' : '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + radius + 14);
      });

      ctx.restore();
    };

    simulation.on('tick', render);

    // Canvas interaction handlers
    const getCanvasPoint = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const transform = transformRef.current;
      return {
        x: (x - transform.x) / transform.scale,
        y: (y - transform.y) / transform.scale,
      };
    };

    const handleMouseDown = (e: MouseEvent) => {
      const pt = getCanvasPoint(e);
      const clickedNode = simNodes.find((n: any) => {
        const dx = (n.x || 0) - pt.x;
        const dy = (n.y || 0) - pt.y;
        return Math.sqrt(dx * dx + dy * dy) < 20;
      });

      if (clickedNode) {
        draggedNodeRef.current = clickedNode;
        (clickedNode as any).fx = clickedNode.x;
        (clickedNode as any).fy = clickedNode.y;
        simulation.alphaTarget(0.3).restart();
      } else {
        isDraggingRef.current = true;
        dragStartRef.current = { x: e.clientX - transformRef.current.x, y: e.clientY - transformRef.current.y };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const pt = getCanvasPoint(e);
      if (draggedNodeRef.current) {
        (draggedNodeRef.current as any).fx = pt.x;
        (draggedNodeRef.current as any).fy = pt.y;
      } else if (isDraggingRef.current) {
        transformRef.current.x = e.clientX - dragStartRef.current.x;
        transformRef.current.y = e.clientY - dragStartRef.current.y;
        render();
      } else {
        const hover = simNodes.find((n: any) => {
          const dx = (n.x || 0) - pt.x;
          const dy = (n.y || 0) - pt.y;
          return Math.sqrt(dx * dx + dy * dy) < 18;
        });
        setHoveredNode(hover || null);
        canvas.style.cursor = hover ? 'pointer' : 'grab';
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (draggedNodeRef.current) {
        (draggedNodeRef.current as any).fx = null;
        (draggedNodeRef.current as any).fy = null;
        draggedNodeRef.current = null;
        simulation.alphaTarget(0);
      }
      isDraggingRef.current = false;
    };

    const handleClick = (e: MouseEvent) => {
      const pt = getCanvasPoint(e);
      const clicked = simNodes.find((n: any) => {
        const dx = (n.x || 0) - pt.x;
        const dy = (n.y || 0) - pt.y;
        return Math.sqrt(dx * dx + dy * dy) < 20;
      });

      if (clicked && clicked.exists) {
        onSelectNote(clicked.path);
        onClose();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      transformRef.current.scale = Math.max(0.2, Math.min(4, transformRef.current.scale * zoomFactor));
      render();
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('wheel', handleWheel);

    return () => {
      simulation.stop();
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [isOpen, filteredData, currentNotePath]);

  if (!isOpen) return null;

  const handleZoom = (factor: number) => {
    transformRef.current.scale = Math.max(0.2, Math.min(4, transformRef.current.scale * factor));
  };

  const handleReset = () => {
    transformRef.current = { x: 0, y: 0, scale: 1 };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-5xl w-full h-[85vh] border border-slate-200 dark:border-slate-800 overflow-hidden font-sans flex flex-col relative">
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3">
            <Network className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Vault Knowledge Graph</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {filteredData.nodes.length} notes · {filteredData.links.length} connections
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter graph..."
                className="pl-8 pr-3 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-36 sm:w-48"
              />
            </div>

            {/* Local / Global Toggle */}
            <button
              onClick={() => setIsLocalOnly(!isLocalOnly)}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${
                isLocalOnly
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isLocalOnly ? 'Local (1-hop)' : 'Global'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative bg-slate-50 dark:bg-slate-950 overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
          />

          {/* Floating Controls */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 p-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-slate-200 dark:border-slate-800 shadow-md">
            <button
              onClick={() => handleZoom(1.2)}
              title="Zoom In"
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(0.8)}
              title="Zoom Out"
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              title="Reset View"
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-slate-200 dark:border-slate-800 shadow-md text-[11px] space-y-1.5 hidden sm:block">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Folders</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-slate-600 dark:text-slate-400">Root</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600 dark:text-slate-400">Appliances</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-slate-600 dark:text-slate-400">Recipes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span className="text-slate-600 dark:text-slate-400">Household</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
              <span className="text-slate-600 dark:text-slate-400">Guides</span>
            </div>
          </div>

          {/* Hovered Node Tooltip */}
          {hoveredNode && (
            <div className="absolute top-4 left-4 p-3 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-blue-500/40 shadow-lg text-xs pointer-events-none max-w-xs animate-in fade-in">
              <div className="font-semibold text-slate-900 dark:text-slate-100">{hoveredNode.label}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{hoveredNode.path}</div>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                <span>Incoming: {hoveredNode.incomingCount || 0}</span>
                <span>Outgoing: {hoveredNode.outgoingCount || 0}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
