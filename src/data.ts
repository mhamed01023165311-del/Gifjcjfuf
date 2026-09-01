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
  socials?: { platform: string; url: string; icon?: string }[];
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

  // Center Profile Node with your actual data and social links
  nodes.push({
    id: 'center-profile',
    type: 'profile',
    label: 'MOHAMED.DEV',
    color: '#FF0055', // Neon Red
    baseRadius: 140,
    baseX: cx,
    baseY: cy,
    x: cx,
    y: cy,
    currentRadius: 140,
    targetRadius: 140,
    title: 'Mohamed Shaban Farghaly',
    subtitle: 'Software Engineer & Game Developer',
    description: "مطور برمجيات وألعاب شغوف بتطوير التطبيقات عبر المنصات المختلفة باستخدام Flutter و Native، وبناء الألعاب التفاعلية باستخدام Godot Engine و GDScript، بالإضافة إلى تصميم الحلول البرمجية الذكية وتطوير الويب.",
    image: 'https://lh3.googleusercontent.com/d/1KvG3cNZy11_92tHC03pooOHCoyKCoFl4', // الصورة الشخصية الخاصة بك
    skills: [
      'Flutter',
      'Java',
      'Python',
      'Godot Engine',
      'GDScript',
      'Web Technologies',
      'Supabase',
      'Firebase',
      'UI/UX Design'
    ],
    socials: [
      { 
        platform: 'WhatsApp', 
        url: 'https://wa.me/201284302099' 
      },
      { 
        platform: 'Facebook', 
        url: 'https://facebook.com' 
      },
      { 
        platform: 'Gmail', 
        url: 'mailto:contact@mohamed.dev' 
      }
    ]
  });

  // Project Nodes (Distributed organically across different web intersections)
  const projects = [
    {
      strandIndex: 2, 
      ringIndex: 5,
      label: 'PROJ 01',
      title: 'Sign Language Teacher',
      desc: 'تطبيق تفاعلي ذكي لتعليم لغة الإشارة يعتمد على تتبع حركة اليد عبر الكاميرا مع قاموس شامل لأكثر من 1000 كلمة.',
      image: 'https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?w=800&q=80',
      tags: [{label: 'Flutter', color: '#00E5FF'}, {label: 'AI Track', color: '#FF0055'}],
      color: '#00E5FF' 
    },
    {
      strandIndex: 6, 
      ringIndex: 8,
      label: 'PROJ 02',
      title: 'Chaos Stone Game',
      desc: 'لعبة مغامرات وقصة تفاعلية متعددة النهايات تم تطويرها باستخدام محرك Godot بنمط رسومي Low-Poly وأدوات تحكم مخصصة للشاشات اللمسية.',
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80',
      tags: [{label: 'Godot', color: '#FF0055'}, {label: '3D Game', color: '#00E5FF'}],
      color: '#FF007F' 
    },
    {
      strandIndex: 10, 
      ringIndex: 6,
      label: 'PROJ 03',
      title: 'Dynamic Certificate Portal',
      desc: 'منصة ويب مخصصة لتوليد وتعديل الشهادات التفاعلية بشكل لحظي مع خيارات تحكم متقدمة وتصدير الملفات بدقة عالية.',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
      tags: [{label: 'Web Tech', color: '#00E5FF'}, {label: 'Tools', color: '#FF007F'}],
      color: '#00E5FF' 
    },
    {
      strandIndex: 13, 
      ringIndex: 9,
      label: 'PROJ 04',
      title: 'Retro Emulation Configs',
      desc: 'حلول وتعديلات مخصصة لتحسين أداء محاكيات الألعاب على الهواتف المحمولة وضبط الإطارات والتطبيقات المعقدة بسلاسة.',
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80',
      tags: [{label: 'Optimization', color: '#FF0055'}, {label: 'Mobile', color: '#00E5FF'}],
      color: '#FF007F' 
    }
  ];

  projects.forEach((proj, i) => {
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
      link: '#'
    });
  });

  return nodes;
};
