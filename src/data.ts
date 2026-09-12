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
  icon?: string;
  skills?: string[];
  socials?: { platform: string; url: string }[];
}

export const STRANDS = 16;
export const RINGS = 12;

export const getInitialNodes = (width: number, height: number): NodeData[] => {
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.hypot(cx, cy); 

  const nodes: NodeData[] = [];

  // Profile Node
  nodes.push({
    id: 'center-profile',
    type: 'profile',
    label: 'MOHAMED.DEV',
    color: '#00E5FF',
    baseRadius: 130,
    baseX: cx,
    baseY: cy,
    x: cx,
    y: cy,
    currentRadius: 130,
    targetRadius: 130,
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
      { platform: 'WhatsApp', url: 'https://wa.me/201284302099' },
      { platform: 'Call', url: 'tel:01019920811' },
      { platform: 'Telegram', url: 'https://t.me/Falcon2006_bot' }
    ]
  });

  const projects = [
    {
      strandIndex: 2, 
      ringIndex: 4.5, 
      label: 'PROJ 01',
      title: 'Market & Shopping Store',
      desc: 'منصة تسوق متكاملة وعروض حية للمنتجات والماركت تم ربطها برابط المعاينة المباشرة.',
      image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80',
      tags: [{label: 'Store', color: '#00E5FF'}, {label: 'E-Commerce', color: '#00E5FF'}],
      link: 'https://remix-falcon-8429.ai.studio',
      icon: 'cart', // أيقونة سلة التسوق للمشروع الأول
      color: '#00E5FF' 
    },
    {
      strandIndex: 5, 
      ringIndex: 4.2, 
      label: 'PROJ 02',
      title: 'Chaos Stone Game',
      desc: 'لعبة مغامرات وقصة تفاعلية متعددة النهايات تم تطويرها باستخدام محرك Godot بنمط رسومي Low-Poly.',
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80',
      tags: [{label: 'Godot', color: '#00E5FF'}, {label: '3D Game', color: '#00E5FF'}],
      link: '#',
      icon: 'gamepad',
      color: '#00E5FF' 
    },
    {
      strandIndex: 10, 
      ringIndex: 4.5, 
      label: 'PROJ 03',
      title: 'Dynamic Certificate Portal',
      desc: 'منصة ويب مخصصة لتوليد وتعديل الشهادات التفاعلية بشكل لحظي مع خيارات تحكم متقدمة.',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
      tags: [{label: 'Web Tech', color: '#00E5FF'}, {label: 'Tools', color: '#00E5FF'}],
      link: '#',
      icon: 'code',
      color: '#00E5FF' 
    },
    {
      strandIndex: 13, 
      ringIndex: 4.5, 
      label: 'PROJ 04',
      title: 'Sign Language Teacher',
      desc: 'تطبيق تفاعلي ذكي لتعليم لغة الإشارة يعتمد على تتبع حركة اليد عبر الكاميرا.',
      image: 'https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?w=800&q=80',
      tags: [{label: 'Flutter', color: '#00E5FF'}, {label: 'AI Track', color: '#00E5FF'}],
      link: '#',
      icon: 'cpu',
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
      color: '#00E5FF',
      baseRadius: 28,
      baseX: px,
      baseY: py,
      x: px,
      y: py,
      currentRadius: 28,
      targetRadius: 28,
      title: proj.title,
      description: proj.desc,
      image: proj.image,
      tags: proj.tags,
      link: proj.link,
      icon: proj.icon
    });
  });

  return nodes;
};

