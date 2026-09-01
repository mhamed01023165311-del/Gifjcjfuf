export type NodeType = 'profile' | 'project';

export interface NodeData {
  id: string;
  type: NodeType;
  label: string;
  color: string;
  baseRadius: number;
  
  // Dynamic runtime physics properties
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  currentRadius: number;
  targetRadius: number;

  // Content for Modal
  title?: string;
  subtitle?: string;
  description?: string;
  image?: string;
  tags?: { label: string; color: string }[];
  link?: string;
  skills?: string[];
  socials?: { platform: string; url: string }[];
}

// Generate the initial nodes
export const STRANDS = 16;
export const RINGS = 12;

// Generate the initial nodes
export const getInitialNodes = (width: number, height: number): NodeData[] => {
  const cx = width / 2;
  const cy = height / 2;
  
  // Calculate max distance to corner for full-screen edge-to-edge spanning
  const maxRadius = Math.hypot(cx, cy); 

  const nodes: NodeData[] = [];

  // Center Profile Node
  nodes.push({
    id: 'center-profile',
    type: 'profile',
    label: 'MILES.DEV',
    color: '#FF0055', // Neon Red
    baseRadius: 140,
    baseX: cx,
    baseY: cy,
    x: cx,
    y: cy,
    currentRadius: 140,
    targetRadius: 140,
    title: 'Miles Developer',
    subtitle: 'Creative Frontend Engineer & Web Weaver',
    description: "I'm a senior frontend developer specializing in interactive, motion-heavy web experiences. I swing between HTML5 Canvas, React, and GSAP to build experiences that leap off the screen.",
    image: 'https://lh3.googleusercontent.com/d/1KvG3cNZy11_92tHC03pooOHCoyKCoFl4',
    skills: ['React', 'TypeScript', 'GSAP', 'HTML5 Canvas', 'Tailwind CSS', 'Three.js'],
    socials: [
      { platform: 'GitHub', url: '#' },
      { platform: 'Twitter / X', url: '#' },
      { platform: 'LinkedIn', url: '#' }
    ]
  });

  // Project Nodes (Distributed organically across different web intersections)
  // We use strandIndex (0-15) for angle and ringIndex (1-12) for distance.
  const projects = [
    {
      strandIndex: 2, // Top Right-ish
      ringIndex: 5,
      label: 'PROJ 01',
      title: 'Neon E-Commerce',
      desc: 'A cyberpunk-themed storefront with 3D product viewers and seamless page transitions powered by Framer Motion and GSAP.',
      image: 'https://images.unsplash.com/photo-1515630278258-407f66498911?w=800&q=80',
      tags: [{label: 'Next.js', color: '#00E5FF'}, {label: 'GSAP', color: '#88ce02'}],
      color: '#00E5FF' // Cyan
    },
    {
      strandIndex: 6, // Bottom Right
      ringIndex: 8,
      label: 'PROJ 02',
      title: 'Web3 Analytics Dashboard',
      desc: 'Real-time cryptocurrency tracking platform featuring custom D3 data visualizations and glowing glassmorphic UI components.',
      image: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?w=800&q=80',
      tags: [{label: 'React', color: '#00E5FF'}, {label: 'D3.js', color: '#FF007F'}],
      color: '#FF007F' // Magenta
    },
    {
      strandIndex: 10, // Bottom Left
      ringIndex: 6,
      label: 'PROJ 03',
      title: 'Neural AI Generator',
      desc: 'An AI-powered image generation interface with fluid prompt controls, real-time generation previews, and stylized loading states.',
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80',
      tags: [{label: 'Vue', color: '#41b883'}, {label: 'Tailwind', color: '#38bdf8'}],
      color: '#00E5FF' // Cyan
    },
    {
      strandIndex: 13, // Top Left
      ringIndex: 9,
      label: 'PROJ 04',
      title: 'Immersive Game UI',
      desc: 'Concept HUD and menu systems for a futuristic VR game. Built entirely with web technologies utilizing WebGL and Canvas API.',
      image: 'https://images.unsplash.com/photo-1617802690992-15d93263d3a9?w=800&q=80',
      tags: [{label: 'Three.js', color: '#fff'}, {label: 'Canvas', color: '#FF0055'}],
      color: '#FF007F' // Magenta
    },
    {
      strandIndex: 15, // Top Right
      ringIndex: 4,
      label: 'PROJ 05',
      title: 'Interactive City Map',
      desc: 'A heavily customized WebGL map showing real-time transit data through the lens of a retro-futuristic holographic display.',
      image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
      tags: [{label: 'Mapbox', color: '#00E5FF'}, {label: 'WebGL', color: '#FF0055'}],
      color: '#00E5FF' // Cyan
    }
  ];

  projects.forEach((proj, i) => {
    // Calculate exact position on the web grid
    const angle = (proj.strandIndex / STRANDS) * Math.PI * 2; 
    const distance = (proj.ringIndex / RINGS) * maxRadius;
    const px = cx + Math.cos(angle) * distance;
    const py = cy + Math.sin(angle) * distance;

    nodes.push({
      id: `project-${i}`,
      type: 'project',
      label: proj.label,
      color: proj.color,
      baseRadius: 25,
      baseX: px,
      baseY: py,
      x: px,
      y: py,
      currentRadius: 25,
      targetRadius: 25,
      title: proj.title,
      description: proj.desc,
      image: proj.image,
      tags: proj.tags,
      link: 'https://github.com'
    });
  });

  return nodes;
};
