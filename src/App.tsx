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

  const localProfilePath = new URL('../public/assets/profile.jpg', import.meta.url).href;

  const physicsState = useRef({
    nodes: [] as (NodeData & { impactGlow?: number })[],
    microThreads: [] as {strand: number, r1: number, r2: number, sag: number}[],
    pulses: [] as {targetNodeId: string, progress: number, speed: number, color: string}[],
    time: 0,
    width: 0,
    height: 0,
  });

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
      for (let i = 0; i < 120; i++) {
        const strand = Math.floor(Math.random() * STRANDS);
        const rFactor = 0.05 + Math.random() * 0.95;
        micro.push({
          strand,
          r1: rFactor,
          r2: rFactor + (Math.random() * 0.08 - 0.04),
          sag: 0.7 + Math.random() * 0.3
        });
      }
      physicsState.current.microThreads = micro;

      const newNodes = getInitialNodes(width, height).map(n => ({ ...n, impactGlow: 0 }));
      physicsState.current.nodes = newNodes;
      setNodes(newNodes);

      const projectNodes = newNodes.filter(n => n.type === 'project');
      const pulses = projectNodes.map(pNode => ({
        targetNodeId: pNode.id,
        progress: Math.random() * 0.6,
        speed: 0.005 + Math.random() * 0.003,
        color: pNode.color
      }));
      physicsState.current.pulses = pulses;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const profileImg = new Image();
    profileImg.src = localProfilePath;
    profileImg.onload = () => {
      loadedImages.current['profile'] = profileImg;
    };
  }, [localProfilePath]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const state = physicsState.current;
      state.time += 0.015;
      
      ctx.clearRect(0, 0, state.width, state.height);
      
      const currentNodes = state.nodes;
      if (currentNodes.length === 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      currentNodes.forEach(node => {
        if (node.id === activeNodeId) return;
        node.x = node.baseX;
        node.y = node.baseY;
        node.targetRadius = node.baseRadius;
        node.currentRadius += (node.targetRadius - node.currentRadius) * 0.1;

        if (node.impactGlow && node.impactGlow > 0) {
          node.impactGlow -= 0.04;
          if (node.impactGlow < 0) node.impactGlow = 0;
        }
      });

      const center = currentNodes[0];
      const maxR = Math.hypot(state.width / 2, state.height / 2) * 1.1;
      const stepAngle = (Math.PI * 2) / STRANDS;
      
      const baseProfileRadius = Math.min(state.width, state.height) * 0.12;
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
          const sagRadius = radius * 0.92; 
          const cx = center.x + Math.cos(midA) * sagRadius;
          const cy = center.y + Math.sin(midA) * sagRadius;

          ctx.quadraticCurveTo(cx, cy, x2, y2);
        }
        ctx.closePath();
      };

      // 1. الخيوط الرئيسية
      for (let i = 0; i < STRANDS; i++) {
        const angle = i * stepAngle;
        const startX = center.x + Math.cos(angle) * frameRadius;
        const startY = center.y + Math.sin(angle) * frameRadius;
        const tx = center.x + Math.cos(angle) * maxR;
        const ty = center.y + Math.sin(angle) * maxR;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = i % 2 === 0 ? `rgba(0, 229, 255, 0.18)` : `rgba(255, 0, 85, 0.18)`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // 2. الحلقات الدائرية
      for (let r = 2; r <= RINGS; r++) {
        const radius = (r / RINGS) * maxR;
        buildWebRingPath(radius);
        ctx.strokeStyle = r % 2 === 0 ? `rgba(255, 0, 127, 0.1)` : `rgba(0, 229, 255, 0.1)`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // 3. الخيوط الفرعية
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
      ctx.strokeStyle = `rgba(255, 255, 255, 0.04)`;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // 4. النبضات العصبية (Neural Pulses) - رفيعة ودقيقة داخل مسار الخيط
      state.pulses.forEach(p => {
        const targetNode = currentNodes.find(n => n.id === p.targetNodeId);
        if (!targetNode) return;

        p.progress += p.speed;

        const angle = Math.atan2(targetNode.y - center.y, targetNode.x - center.x);
        const startX = center.x + Math.cos(angle) * frameRadius;
        const startY = center.y + Math.sin(angle) * frameRadius;
        const endX = targetNode.x;
        const endY = targetNode.y;

        const currentX = startX + (endX - startX) * p.progress;
        const currentY = startY + (endY - startY) * p.progress;

        const distToTarget = Math.hypot(endX - currentX, endY - currentY);

        if (distToTarget <= targetNode.currentRadius || p.progress >= 1.0) {
          targetNode.impactGlow = 1.0; 
          p.progress = 0; 
        } else {
          // رسم الشرارة العصبية: خط ساطع رفيع مع توهج دقيق
          ctx.save();
          
          // ذيل الشرارة الخفيف
          const tailLength = 15;
          const tailX = currentX - Math.cos(angle) * tailLength;
          const tailY = currentY - Math.sin(angle) * tailLength;

          const gradient = ctx.createLinearGradient(tailX, tailY, currentX, currentY);
          gradient.addColorStop(0, 'transparent');
          gradient.addColorStop(1, p.color);

          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(currentX, currentY);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // رأس الشرارة الدقيق جداً
          ctx.beginPath();
          ctx.arc(currentX, currentY, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
          ctx.fill();
          
          ctx.restore();
        }
      });

      // رسم العناصر
      currentNodes.forEach(node => {
        if (node.id === activeNodeId) return;

        if (node.type === 'profile') {
          ctx.save();
          buildWebRingPath(node.currentRadius);
          ctx.clip();
          
          const img = loadedImages.current['profile'];
          if (img && img.complete && img.naturalWidth !== 0) {
            const s = node.currentRadius * 2.2;
            ctx.drawImage(img, node.x - s / 2, node.y - s / 2, s, s);
          } else {
            ctx.fillStyle = '#0b0c10';
            ctx.fill();
          }
          ctx.restore();
          
          ctx.save();
          buildWebRingPath(node.currentRadius);
          ctx.strokeStyle = node.color || '#00E5FF';
          ctx.lineWidth = 3;
          ctx.shadowColor = node.color || '#00E5FF';
          ctx.shadowBlur = 20;
          ctx.stroke();
          ctx.restore();
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = '600 15px "Space Grotesk"';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(node.label, node.x, node.y + node.currentRadius + 18);
        } else {
          const glow = node.impactGlow || 0;
          const currentRadius = node.currentRadius + glow * 3;
          const currentGlowBlur = 20 + glow * 30;

          ctx.save();
          ctx.beginPath();
          ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
          ctx.fillStyle = node.color;
          ctx.shadowColor = node.color;
          ctx.shadowBlur = currentGlowBlur;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(node.x, node.y, currentRadius * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.restore();

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
      scale: 1.05,
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
        className="absolute inset-0 z-0 cursor-pointer"
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
            <div className="flex-1 flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-center pt-8 dir-rtl text-right">
              <div className="modal-stagger flex-shrink-0 relative group">
                <div className="absolute inset-0 bg-[#FF0055] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full" />
                <img 
                  src={localProfilePath} 
                  alt="Avatar" 
                  className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-full border-2 border-[#FF0055] shadow-[0_0_30px_rgba(255,0,85,0.4)] relative z-10"
                />
              </div>
              <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-right">
                <h1 className="modal-stagger text-3xl md:text-5xl font-bold glitch-text mb-2 tracking-tight">
                  {activeNode.title}
                </h1>
                <p className="modal-stagger text-lg md:text-xl text-[#00E5FF] font-medium mb-6 tracking-wide">
                  {activeNode.subtitle}
                </p>
                <p className="modal-stagger text-gray-300 text-base md:text-lg max-w-2xl leading-relaxed mb-8">
                  {activeNode.description}
                </p>
                
                <div className="modal-stagger w-full max-w-2xl mb-8">
                  <h3 className="text-[#FF007F] font-bold uppercase tracking-wider mb-4 border-b border-[#FF007F]/30 pb-2">Tech Arsenal & Skills</h3>
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
            <div className="flex-1 flex flex-col h-full dir-rtl text-right">
              <div className="modal-stagger w-full h-48 md:h-72 lg:h-[40vh] rounded-xl overflow-hidden relative mb-8 border border-white/10 group">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-transparent to-transparent z-10" />
                <img 
                  src={activeNode.image} 
                  alt={activeNode.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 right-4 z-20 flex gap-2">
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

