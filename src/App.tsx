/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ExternalLink, X, Globe, Mail, MessageSquare, Code } from 'lucide-react';
import { NodeData, getInitialNodes, STRANDS, RINGS } from './data';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const loadedImages = useRef<Record<string, HTMLImageElement>>({});

  // Local assets profile image path
  const localProfilePath = '/assets/profile.jpg';

  // Mutable state for the physics loop
  const physicsState = useRef({
    nodes: [] as NodeData[],
    microThreads: [] as {strand: number, r1: number, r2: number, sag: number}[],
    mouseX: -1000,
    mouseY: -1000,
    time: 0,
    width: 0,
    height: 0,
  });

  // Initialize Canvas and Nodes
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      
      physicsState.current.width = width;
      physicsState.current.height = height;
      
      const micro = [];
      for (let i = 0; i < 100; i++) {
        const strand = Math.floor(Math.random() * STRANDS);
        const rFactor = 0.05 + Math.random() * 0.95;
        micro.push({
          strand,
          r1: rFactor,
          r2: rFactor + (Math.random() * 0.08 - 0.04),
          sag: 0.6 + Math.random() * 0.4
        });
      }
      physicsState.current.microThreads = micro;

      const newNodes = getInitialNodes(width, height);
      physicsState.current.nodes = newNodes;
      setNodes(newNodes);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Preload Profile and Node Images
  useEffect(() => {
    // 1. Force Load local profile image from /assets/profile.jpg
    const profileImg = new Image();
    profileImg.src = localProfilePath;
    profileImg.onload = () => {
      loadedImages.current['profile'] = profileImg;
      loadedImages.current['center'] = profileImg; // binding fallback
    };

    // 2. Load Node dynamic images
    nodes.forEach(node => {
      const imgSrc = node.type === 'profile' ? localProfilePath : node.image;
      if (imgSrc && !loadedImages.current[node.id]) {
        const img = new Image();
        img.src = imgSrc;
        img.onload = () => { loadedImages.current[node.id] = img; };
      }
    });
  }, [nodes]);

  // Canvas Drawing & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const state = physicsState.current;
      state.time += 0.02;
      
      ctx.clearRect(0, 0, state.width, state.height);
      
      const currentNodes = state.nodes;
      if (currentNodes.length === 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Physics Update
      currentNodes.forEach(node => {
        if (node.id === activeNodeId) return;

        const dx = state.mouseX - node.x;
        const dy = state.mouseY - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 120 && !activeNodeId) {
          node.targetRadius = node.baseRadius * 1.4;
          const repelStrength = (120 - dist) * 0.05;
          node.x -= (dx / dist) * repelStrength;
          node.y -= (dy / dist) * repelStrength;
        } else {
          node.targetRadius = node.baseRadius;
          const floatX = node.baseX + Math.sin(state.time + node.id.charCodeAt(0)) * 15;
          const floatY = node.baseY + Math.cos(state.time * 0.8 + (node.id.charCodeAt(1) || 0)) * 15;
          
          node.x += (floatX - node.x) * 0.08;
          node.y += (floatY - node.y) * 0.08;
        }

        node.currentRadius += (node.targetRadius - node.currentRadius) * 0.15;
      });

      // Drawing Edge-to-Edge Spider Web
      ctx.globalCompositeOperation = 'lighter';
      
      const center = currentNodes[0];
      const maxR = Math.hypot(state.width / 2, state.height / 2) * 1.2;
      const stepAngle = (Math.PI * 2) / STRANDS;
      
      // Increased frame radius for center profile
      const baseProfileRadius = (2.2 / RINGS) * maxR;
      
      if (activeNodeId !== center.id) {
        center.baseRadius = baseProfileRadius;
      }
      const frameRadius = center.currentRadius; 
      
      const buildWebRingPath = (radius: number) => {
        ctx.beginPath();
        for (let i = 0; i < STRANDS; i++) {
          const a1 = i * stepAngle;
          const a2 = ((i + 1) % STRANDS) * stepAngle;
          
          const x1 = center.x + Math.cos(a1) * radius;
          const y1 = center.y + Math.sin(a1) * radius;
          const x2 = center.x + Math.cos(a2) * radius;
          const y2 = center.y + Math.sin(a2) * radius;

          if (i === 0) ctx.moveTo(x1, y1);
          
          const midA = a1 + stepAngle / 2;
          const sagRadius = radius * 0.88; 
          const cx = center.x + Math.cos(midA) * sagRadius;
          const cy = center.y + Math.sin(midA) * sagRadius;

          ctx.quadraticCurveTo(cx, cy, x2, y2);
        }
        ctx.closePath();
      };

      // 1. Radial Strands
      for (let i = 0; i < STRANDS; i++) {
        const angle = i * stepAngle;
        const startX = center.x + Math.cos(angle) * frameRadius;
        const startY = center.y + Math.sin(angle) * frameRadius;
        const tx = center.x + Math.cos(angle) * maxR;
        const ty = center.y + Math.sin(angle) * maxR;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = i % 2 === 0 ? `rgba(0, 229, 255, 0.4)` : `rgba(255, 0, 85, 0.4)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // 2. Concentric Rings
      for (let r = 3; r <= RINGS; r++) {
        const breathe = Math.sin(state.time * 1.5 + r) * 4;
        const radius = (r / RINGS) * maxR + breathe;

        buildWebRingPath(radius);
        ctx.strokeStyle = r % 2 === 0 ? `rgba(255, 0, 127, 0.25)` : `rgba(0, 229, 255, 0.25)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 3. Organic Micro-Threads
      ctx.beginPath();
      state.microThreads.forEach(mt => {
        const a1 = mt.strand * stepAngle;
        const a2 = ((mt.strand + 1) % STRANDS) * stepAngle;
        const r1 = frameRadius + mt.r1 * (maxR - frameRadius);
        const r2 = frameRadius + mt.r2 * (maxR - frameRadius);

        const x1 = center.x + Math.cos(a1) * r1;
        const y1 = center.y + Math.sin(a1) * r1;
        const x2 = center.x + Math.cos(a2) * r2;
        const y2 = center.y + Math.sin(a2) * r2;

        ctx.moveTo(x1, y1);
        const midA = a1 + stepAngle / 2;
        const sagRadius = ((r1 + r2) / 2) * mt.sag;
        const cx = center.x + Math.cos(midA) * sagRadius;
        const cy = center.y + Math.sin(midA) * sagRadius;
        
        ctx.quadraticCurveTo(cx, cy, x2, y2);
      });
      ctx.strokeStyle = `rgba(255, 255, 255, 0.12)`;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Draw Nodes
      currentNodes.forEach(node => {
        if (node.id === activeNodeId) return;

        if (node.type === 'profile') {
          ctx.globalCompositeOperation = 'source-over';
          
          ctx.save();
          buildWebRingPath(node.currentRadius);
          ctx.clip();
          
          // Get profile image from assets
          const img = loadedImages.current[node.id] || loadedImages.current['profile'];
          if (img && img.complete && img.naturalWidth !== 0) {
            const s = node.currentRadius * 2.4;
            ctx.drawImage(img, node.x - s / 2, node.y - s / 2, s, s);
          } else {
            ctx.fillStyle = '#111';
            ctx.fill();
          }
          ctx.restore();
          
          // Glowing border
          ctx.save();
          buildWebRingPath(node.currentRadius);
          ctx.strokeStyle = node.color || '#00E5FF';
          ctx.lineWidth = 4;
          ctx.shadowColor = node.color || '#00E5FF';
          ctx.shadowBlur = 25;
          ctx.stroke();
          ctx.restore();
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = '600 16px "Space Grotesk"';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(node.label, node.x, node.y + node.currentRadius + 24);
        } else {
          // Project Pods
          ctx.globalCompositeOperation = 'lighter';
          
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.currentRadius, 0, Math.PI * 2);
          ctx.fillStyle = node.color;
          ctx.shadowColor = node.color;
          ctx.shadowBlur = 35;
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.beginPath();
          ctx.arc(node.x, node.y, node.currentRadius * 0.55, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(node.x, node.y, node.currentRadius * 0.25, 0, Math.PI * 2);
          ctx.fillStyle = node.color;
          ctx.fill();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.font = '600 12px "Space Grotesk"';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(node.label, node.x, node.y + node.currentRadius + 12);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [activeNodeId]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      physicsState.current.mouseX = e.clientX - rect.left;
      physicsState.current.mouseY = e.clientY - rect.top;
    }
  };

  const handleMouseLeave = () => {
    physicsState.current.mouseX = -1000;
    physicsState.current.mouseY = -1000;
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isAnimating || activeNodeId) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const clickedNode = physicsState.current.nodes.find(node => {
      const dx = mx - node.x;
      const dy = my - node.y;
      return Math.sqrt(dx * dx + dy * dy) <= node.currentRadius + 10;
    });

    if (clickedNode) {
      openNode(clickedNode);
    }
  };

  const openNode = (node: NodeData) => {
    if (!modalRef.current || !overlayRef.current || !contentRef.current) return;
    
    setIsAnimating(true);
    setActiveNodeId(node.id);

    const tl = gsap.timeline({
      onComplete: () => setIsAnimating(false)
    });

    gsap.set(modalRef.current, {
      left: node.x,
      top: node.y,
      width: node.currentRadius * 2,
      height: node.currentRadius * 2,
      backgroundColor: node.color,
      borderRadius: node.type === 'profile' ? '40%' : '50%',
      xPercent: -50,
      yPercent: -50,
      opacity: 1,
      boxShadow: `0 0 20px ${node.color}`,
      pointerEvents: 'auto'
    });

    tl.to(canvasRef.current, {
      scale: 1.1,
      duration: 0.7,
      ease: 'power2.out'
    }, 0);
    
    tl.to(overlayRef.current, {
      opacity: 1,
      backdropFilter: 'blur(15px)',
      backgroundColor: 'rgba(11, 12, 16, 0.7)',
      duration: 0.4,
      ease: 'power2.out'
    }, 0);

    tl.to(modalRef.current, {
      left: '50%',
      top: '50%',
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(11, 12, 16, 0.95)',
      borderRadius: '0px',
      boxShadow: `inset 0 0 50px rgba(${node.color === '#FF0055' ? '255,0,85' : '0,229,255'}, 0.2)`,
      border: `none`,
      duration: 0.7,
      ease: 'expo.out'
    }, 0);

    gsap.set('.modal-stagger', { opacity: 0, scale: 0.95, y: 30 });
    tl.to('.modal-stagger', {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power3.out'
    }, 0.3);
  };

  const closeNode = () => {
    if (isAnimating || !activeNodeId) return;
    
    const node = physicsState.current.nodes.find(n => n.id === activeNodeId);
    if (!node || !modalRef.current || !overlayRef.current) return;

    setIsAnimating(true);

    const tl = gsap.timeline({
      onComplete: () => {
        setActiveNodeId(null);
        setIsAnimating(false);
      }
    });

    tl.to('.modal-stagger', {
      opacity: 0,
      y: -20,
      scale: 0.95,
      duration: 0.2,
      stagger: -0.05,
      ease: 'power2.in'
    }, 0);

    tl.to(modalRef.current, {
      left: node.x,
      top: node.y,
      width: node.currentRadius * 2,
      height: node.currentRadius * 2,
      backgroundColor: node.color,
      borderRadius: node.type === 'profile' ? '40%' : '50%',
      boxShadow: `0 0 35px ${node.color}`,
      border: `none`,
      duration: 0.6,
      ease: 'expo.inOut'
    }, 0.1);

    tl.to(canvasRef.current, {
      scale: 1,
      duration: 0.6,
      ease: 'expo.inOut'
    }, 0.1);

    tl.to(overlayRef.current, {
      opacity: 0,
      backdropFilter: 'blur(0px)',
      duration: 0.4
    }, 0.3);

    tl.to(modalRef.current, {
      opacity: 0,
      duration: 0.1
    });
  };

  const activeNode = nodes.find(n => n.id === activeNodeId);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-screen overflow-hidden bg-[#0b0c10] halftone-bg text-white selection:bg-[#FF0055] selection:text-white"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-[#FF0055] opacity-5 blur-[150px] rounded-full pointer-events-none" />

      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-0 cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleCanvasClick}
      />

      <div 
        ref={overlayRef}
        className="absolute inset-0 z-10 bg-[#0b0c10]/40 opacity-0 pointer-events-none"
        onClick={closeNode}
        style={{ pointerEvents: activeNodeId && !isAnimating ? 'auto' : 'none' }}
      />

      <div 
        ref={modalRef}
        className="fixed z-20 flex flex-col overflow-hidden opacity-0 pointer-events-none"
      >
        <div ref={contentRef} className="w-full h-full relative overflow-y-auto p-6 md:p-12 lg:p-24 flex flex-col items-center justify-center">
          
          {activeNodeId && (
            <button 
              onClick={closeNode}
              className="modal-stagger fixed top-8 right-8 md:top-12 md:right-12 p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-110 transition-all z-30 backdrop-blur-md"
              style={{ color: activeNode?.color, borderColor: activeNode?.color }}
            >
              <X size={32} />
            </button>
          )}

          {activeNode?.type === 'profile' && (
            <div className="flex-1 flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-center pt-8">
              <div className="modal-stagger flex-shrink-0 relative group">
                <div className="absolute inset-0 bg-[#FF0055] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full" />
                <img 
                  src={localProfilePath} 
                  alt="Avatar" 
                  className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-full border-2 border-[#FF0055] shadow-[0_0_30px_rgba(255,0,85,0.4)] relative z-10"
                />
              </div>
              <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
                <h1 className="modal-stagger text-4xl md:text-6xl font-bold glitch-text mb-2 tracking-tighter uppercase">
                  {activeNode.title}
                </h1>
                <p className="modal-stagger text-xl text-[#00E5FF] font-medium mb-6 uppercase tracking-widest">
                  {activeNode.subtitle}
                </p>
                <p className="modal-stagger text-gray-300 text-lg md:text-xl max-w-2xl leading-relaxed mb-8">
                  {activeNode.description}
                </p>
                
                <div className="modal-stagger w-full max-w-2xl mb-8">
                  <h3 className="text-[#FF007F] font-bold uppercase tracking-wider mb-4 border-b border-[#FF007F]/30 pb-2">Tech Arsenal</h3>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                    {activeNode.skills?.map(skill => (
                      <span key={skill} className="px-4 py-2 rounded-full text-sm font-semibold bg-white/5 border border-white/10 hover:border-[#00E5FF] hover:text-[#00E5FF] hover:shadow-[0_0_10px_rgba(0,229,255,0.3)] transition-all cursor-default">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="modal-stagger flex gap-4">
                  <a href="#" className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#FF0055] hover:text-[#FF0055] hover:shadow-[0_0_15px_rgba(255,0,85,0.4)] transition-all">
                    <Globe size={24} />
                  </a>
                  <a href="#" className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#00E5FF] hover:text-[#00E5FF] hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all">
                    <MessageSquare size={24} />
                  </a>
                  <a href="#" className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#FF007F] hover:text-[#FF007F] hover:shadow-[0_0_15px_rgba(255,0,127,0.4)] transition-all">
                    <Mail size={24} />
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeNode?.type === 'project' && (
            <div className="flex-1 flex flex-col h-full">
              <div className="modal-stagger w-full h-48 md:h-72 lg:h-[40vh] rounded-xl overflow-hidden relative mb-8 border border-white/10 group">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-transparent to-transparent z-10" />
                <img 
                  src={activeNode.image} 
                  alt={activeNode.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 z-20 flex gap-2">
                  {activeNode.tags?.map(tag => (
                    <span 
                      key={tag.label} 
                      className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md bg-black/50 border"
                      style={{ color: tag.color, borderColor: tag.color }}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                <div className="flex-1">
                  <h2 className="modal-stagger text-3xl md:text-5xl font-bold mb-4 uppercase tracking-tighter" style={{ color: activeNode.color, textShadow: `0 0 20px ${activeNode.color}` }}>
                    {activeNode.title}
                  </h2>
                  <p className="modal-stagger text-gray-300 text-lg leading-relaxed max-w-3xl">
                    {activeNode.description}
                  </p>
                </div>
                <div className="modal-stagger flex-shrink-0 flex flex-col gap-4 w-full lg:w-auto">
                  <a 
                    href={activeNode.link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 px-8 py-4 font-bold uppercase tracking-widest transition-all rounded-lg"
                    style={{ 
                      backgroundColor: `${activeNode.color}20`,
                      border: `1px solid ${activeNode.color}`,
                      color: activeNode.color,
                      boxShadow: `0 0 15px ${activeNode.color}40, inset 0 0 10px ${activeNode.color}20`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = activeNode.color;
                      e.currentTarget.style.color = '#000';
                      e.currentTarget.style.boxShadow = `0 0 30px ${activeNode.color}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = `${activeNode.color}20`;
                      e.currentTarget.style.color = activeNode.color;
                      e.currentTarget.style.boxShadow = `0 0 15px ${activeNode.color}40, inset 0 0 10px ${activeNode.color}20`;
                    }}
                  >
                    <ExternalLink size={20} />
                    Live Preview
                  </a>
                  <a 
                    href="#" 
                    className="flex items-center justify-center gap-2 px-8 py-4 font-bold uppercase tracking-widest text-white border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <Code size={20} />
                    Source Code
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
