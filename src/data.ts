export type NodeType = 'profile' | 'project';

export interface NodeData {
  id: string;
  type: NodeType;
  label: string;
  color: string;
  baseRadius: number;
  
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  currentRadius: number;
  targetRadius: number;

  title?: string;
  subtitle?: string;
  description?: string;
  image?: string;
  tags?: { label: string; color: string }[];
  link?: string;
  skills?: string[];
  socials?: { platform: string; url: string; icon: string }[];
}

export const STRANDS = 16;
export const RINGS = 12;

export const getInitialNodes = (width: number, height: number): NodeData[] => {
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.hypot(cx, cy); 

  const nodes: NodeData[] = [];

  // Profile Node (تم تغيير الألوان لتوحيد النسق مع الأزرق النيون الفخم)
  nodes.push({
    id: 'center-profile',
    type: 'profile',
    label: 'MOHAMED.DEV',
    color: '#00E5FF', // لون أزرق نيون متناسق وفخم
    baseRadius: 140,
    baseX: cx,
    baseY: cy,
    x: cx,
    y: cy,
    currentRadius: 140,
    targetRadius: 140,
    title: 'Mohamed Shaban Farghaly',
    subtitle: 'Software Engineer & Game Developer',
    description: "مهندس برمجيات ومطور ألعاب متكامل. متخصص في هندسة وبناء التطبيقات عبر المنصات باستخدام Flutter، وتصميم الأنظمة الذكية، وتطوير ألعاب تفاعلية غامرة باستخدام Godot Engine ببراعة تقنية عالية.",
    image: 'https://lh3.googleusercontent.com/d/1KvG3cNZy11_92tHC03pooOHCoyKCoFl4',
    skills: [
      'Flutter',
      'Godot Engine',
      'Python',
      'Java',
      'GDScript',
      'Web Technologies',
      'Supabase',
      'Firebase',
      'UI/UX Design'
    ],
    socials: [
      { 
        platform: 'WhatsApp', 
        url: 'https://wa.me/201284302099',
        icon: 'MessageSquare'
      },
      { 
        platform: 'Call', 
        url: 'tel:01019920811',
        icon: 'Phone'
      },
      { 
        platform: 'Telegram', 
        url: 'https://t.me/share/url?url=', // أو رابط البوت المباشر الخاص بك
        icon: 'Send'
      }
    ]
  });

  const projects = [
    {
      strandIndex: 2, 
      ringIndex: 5,
      label: 'PROJ 01',
      title: 'Sign Language Teacher',
      desc: 'تطبيق تفاعلي ذكي لتعليم لغة الإشارة يعتمد على تتبع حركة اليد عبر الكاميرا مع قاموس شامل لأكثر من 1000 كلمة.',
      image: 'https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?w=800&q=80',
      tags: [{label: 'Flutter', color: '#00E5FF'}, {label: 'AI Track', color: '#00E5FF'}],
      color: '#00E5FF' 
    },
    {
      strandIndex: 6, 
      ringIndex: 8,
      label: 'PROJ 02',
      title: 'Chaos Stone Game',
      desc: 'لعبة مغامرات وقصة تفاعلية متعددة النهايات تم تطويرها باستخدام محرك Godot بنمط رسومي Low-Poly وأدوات تحكم مخصصة.',
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80',
      tags: [{label: 'Godot', color: '#00E5FF'}, {label: '3D Game', color: '#00E5FF'}],
      color: '#00E5FF' 
    },
    {
      strandIndex: 10, 
      ringIndex: 6,
      label: 'PROJ 03',
      title: 'Dynamic Certificate Portal',
      desc: 'منصة ويب مخصصة لتوليد وتعديل الشهادات التفاعلية بشكل لحظي مع خيارات تحكم متقدمة وتصدير الملفات.',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
      tags: [{label: 'Web Tech', color: '#00E5FF'}, {label: 'Tools', color: '#00E5FF'}],
      color: '#00E5FF' 
    },
    {
      strandIndex: 13, 
      ringIndex: 9,
      label: 'PROJ 04',
      title: 'Retro Emulation Configs',
      desc: 'حلول وتعديلات مخصصة لتحسين أداء محاكيات الألعاب على الهواتف المحمولة وضبط الإطارات والتطبيقات المعقدة.',
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80',
      tags: [{label: 'Optimization', color: '#00E5FF'}, {label: 'Mobile', color: '#00E5FF'}],
      color: '#00E5FF' 
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

  nodes.forEach(node => {
    node.color = '#00E5FF';
  });

  return nodes;
};

