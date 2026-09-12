/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { X, MessageSquare, Phone, Send, ExternalLink } from 'lucide-react';
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
        color: '#00E5FF'
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

      for (let i = 0; i < STRANDS; i++) {
        const angle = i * stepAngle;
        const startX = center.x + Math.cos(angle) * frameRadius;
        const startY = center.y + Math.sin(angle) * frameRadius;
        const tx = center.x + Math.cos(angle) * maxR;
        const ty = center.y + Math.sin(angle) * maxR;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = `rgba(0, 229, 255, 0.15)`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      for (let r = 2; r <= RINGS; r++) {
        const radius = (r / RINGS) * maxR;
        buildWebRingPath(radius);
        ctx.strokeStyle = `rgba(0, 229, 255, 0.08)`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // رسم النقط المضيئة المتحركة في الخيوط وإحداث الوميض
      state.pulses.forEach(pulse => {
        const targetNode = currentNodes.find(n => n.id === pulse.targetNodeId);
        if (!targetNode) return;

        const pIndex = currentNodes.indexOf(targetNode);
        const projItem = (getInitialNodes(state.width, state.height)).find(n => n.id === pulse.targetNodeId);
        // للتعرف على رقم الخط التابع له المشروع
        let sIdx = 2;
        if (pIndex === 1) sIdx = 2;
        else if (pIndex === 2) sIdx = 5;
        else if (pIndex === 3) sIdx = 10;
        else if (pIndex === 4) sIdx = 13;

        const angle = sIdx * stepAngle;
        const startX = center.x + Math.cos(angle) * frameRadius;
        const startY = center.y + Math.sin(angle) * frameRadius;
        const endX = targetNode.x;
        const endY = targetNode.y;

        pulse.progress += pulse.speed;
        if (pulse.progress >= 1) {
          pulse.progress = 0;
          targetNode.impactGlow = 1; // حدوث الوميض عند وصول النقطة للمشروع
        }

        const px = startX + (endX - startX) * pulse.progress;
        const py = startY + (endY - startY) * pulse.progress;

        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#00E5FF';
        ctx.shadowColor = '#00E5FF';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.restore();
      });

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
          ctx.strokeStyle = '#00E5FF';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#00E5FF';
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
          const currentRadius = node.currentRadius + glow * 4;
          const currentGlowBlur = 20 + glow * 35;

          ctx.save();
          ctx.beginPath();
          ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#0b0c10';
          ctx.shadowColor = '#00E5FF';
          ctx.shadowBlur = currentGlowBlur;
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#00E5FF';
          ctx.stroke();

          // الأيقونات المخصصة
          ctx.strokeStyle = '#00E5FF';
          ctx.lineWidth = 2;
          ctx.fillStyle = '#00E5FF';

          if (node.icon === 'cart') {
            ctx.beginPath();
            ctx.moveTo(node.x - 7, node.y - 5);
            ctx.lineTo(node.x - 3, node.y - 5);
            ctx.lineTo(node.x + 2, node.y + 3);
            ctx.lineTo(node.x + 7, node.y + 3);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(node.x - 2, node.y + 7, 1.5, 0, Math.PI * 2);
            ctx.arc(node.x + 5, node.y + 7, 1.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (node.icon === 'gamepad') {
            ctx.beginPath();
            ctx.roundRect(node.x - 9, node.y - 5, 18, 10, 4);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(node.x - 4, node.y, 1.5, 0, Math.PI * 2);
            ctx.arc(node.x + 4, node.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.moveTo(node.x - 5, node.y - 4);
            ctx.lineTo(node.x - 9, node.y);
            ctx.lineTo(node.x - 5, node.y + 4);
            ctx.moveTo(node.x + 5, node.y - 4);
            ctx.lineTo(node.x + 9, node.y);
            ctx.lineTo(node.x + 5, node.y + 4);
            ctx.stroke();
          }

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
      backgroundColor: '#00E5FF',
      borderRadius: node.type === 'profile' ? '40%' : '50%',
      xPercent: -50,
      yPercent: -50,
      opacity: 1,
      boxShadow: `0 0 20px #00E5FF`,
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
      boxShadow: `inset 0 0 50px rgba(0, 229, 255, 0.2)`,
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
        gsap.set(modalRef.current, { pointerEvents: 'none' });
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
      backgroundColor: '#00E5FF',
      borderRadius: node.type === 'profile' ? '40%' : '50%',
      boxShadow: `0 0 35px #00E5FF`,
      border: `none`,
      duration: 0.5,
      ease: 'expo.inOut'
    }, 0.1);

    tl.to(canvasRef.current, {
      scale: 1,
      duration: 0.5,
      ease: 'expo.inOut'
    }, 0.1);

    tl.to(overlayRef.current, {
      opacity: 0,
      backdropFilter: 'blur(0px)',
      duration: 0.3
    }, 0.2);

    tl.to(modalRef.current, {
      opacity: 0,
      duration: 0.1
    }, 0.5);
  };

  const activeNode = nodes.find(n => n.id === activeNodeId);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-screen overflow-hidden bg-[#0b0c10] halftone-bg text-white selection:bg-[#00E5FF] selection:text-black"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-[#00E5FF] opacity-5 blur-[150px] rounded-full pointer-events-none" />

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
              className="modal-stagger fixed top-8 right-8 md:top-12 md:right-12 p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-110 transition-all z-30 backdrop-blur-md text-[#00E5FF] border-[#00E5FF]/40 cursor-pointer"
            >
              <X size={32} />
            </button>
          )}

          {activeNode?.type === 'profile' && (
            <div className="flex-1 flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-center pt-8 dir-rtl text-right">
              <div className="modal-stagger flex-shrink-0 relative group">
                <div className="absolute inset-0 bg-[#00E5FF] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full" />
                <img 
                  src={localProfilePath} 
                  alt="Avatar" 
                  className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-full border-2 border-[#00E5FF] shadow-[0_0_30px_rgba(0,229,255,0.4)] relative z-10"
                />
              </div>
              <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-right">
                <h1 className="modal-stagger text-3xl md:text-5xl font-bold glitch-text mb-2 tracking-tight text-white">
                  {activeNode.title}
                </h1>
                <p className="modal-stagger text-lg md:text-xl text-[#00E5FF] font-medium mb-6 tracking-wide">
                  {activeNode.subtitle}
                </p>
                <p className="modal-stagger text-gray-300 text-base md:text-lg max-w-2xl leading-relaxed mb-8">
                  {activeNode.description}
                </p>
                
                <div className="modal-stagger w-full max-w-2xl mb-8">
                  <h3 className="text-[#00E5FF] font-bold uppercase tracking-wider mb-4 border-b border-[#00E5FF]/30 pb-2">Tech Arsenal & Skills</h3>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                    {activeNode.skills?.map(skill => (
                      <span key={skill} className="px-4 py-2 rounded-full text-sm font-semibold bg-white/5 border border-white/10 hover:border-[#00E5FF] hover:text-[#00E5FF] hover:shadow-[0_0_10px_rgba(0,229,255,0.3)] transition-all cursor-default">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="modal-stagger flex flex-wrap justify-center lg:justify-start gap-4">
                  <a 
                    href="https://wa.me/201284302099" 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3.5 px-5 rounded-xl bg-white/5 border border-white/10 hover:border-[#00E5FF] hover:text-[#00E5FF] hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all flex items-center gap-2.5 font-bold text-sm text-white"
                  >
                    <MessageSquare size={22} className="text-[#00E5FF]" />
                    <span>WhatsApp</span>
                  </a>

                  <a 
                    href="tel:01019920811" 
                    className="p-3.5 px-5 rounded-xl bg-white/5 border border-white/10 hover:border-[#00E5FF] hover:text-[#00E5FF] hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all flex items-center gap-2.5 font-bold text-sm text-white"
                  >
                    <Phone size={22} className="text-[#00E5FF]" />
                    <span>Call</span>
                  </a>

                  <a 
                    href="https://t.me/Falcon2006_bot" 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3.5 px-5 rounded-xl bg-white/5 border border-white/10 hover:border-[#00E5FF] hover:text-[#00E5FF] hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all flex items-center gap-2.5 font-bold text-sm text-white"
                  >
                    <Send size={22} className="text-[#00E5FF]" />
                    <span>Telegram</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeNode?.type === 'project' && (
            <div className="flex-1 flex flex-col h-full dir-rtl text-right w-full justify-center max-w-4xl mx-auto">
              <div className="flex flex-col gap-6">
                <div className="flex gap-2 mb-2">
                  {activeNode.tags?.map(tag => (
                    <span 
                      key={tag.label} 
                      className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#00E5FF]/10 border text-[#00E5FF] border-[#00E5FF]/40"
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>

                <h2 className="modal-stagger text-3xl md:text-5xl font-bold uppercase tracking-tighter text-[#00E5FF]" style={{ textShadow: `0 0 20px rgba(0,229,255,0.5)` }}>
                  {activeNode.title}
                </h2>

                <p className="modal-stagger text-gray-300 text-lg md:text-xl leading-relaxed">
                  {activeNode.description}
                </p>

                <div className="modal-stagger pt-4">
                  <a 
                    href={activeNode.link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 font-bold uppercase tracking-widest transition-all rounded-lg bg-[#00E5FF]/20 border border-[#00E5FF] text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.4)] hover:bg-[#00E5FF]/30 cursor-pointer"
                  >
                    <ExternalLink size={20} />
                    فتح الموقع
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

