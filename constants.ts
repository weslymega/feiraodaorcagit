
import { AdItem, AdStatus, BannerItem, MessageItem, TransactionData, User, NotificationItem, ReportItem } from './types';

// --- LOGOS DO APLICATIVO ---
// Logos recriadas para corresponder exatamente à identidade visual solicitada
export const APP_LOGOS = {
  // Logo Horizontal: Ícone quadrado com cauda vazada + Texto ao lado
  FULL: "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 450 130'%3E%3Cg transform='translate(15, 15)'%3E%3C!-- Quadrado Azul --%3E%3Crect x='10' y='10' width='90' height='90' rx='20' fill='none' stroke='%23287ba8' stroke-width='14' /%3E%3C!-- Cauda da Baleia --%3E%3Cpath d='M 55 105 C 55 105, 60 70, 25 55 C 10 50, -10 50, 5 35 C 15 25, 45 40, 55 60 C 65 40, 95 25, 105 35 C 115 45, 95 50, 85 55 C 50 70, 55 105, 55 105 Z' fill='%230f172a' stroke='white' stroke-width='3' /%3E%3C/g%3E%3C!-- Texto --%3E%3Cg font-family='sans-serif'%3E%3Ctext x='140' y='55' font-size='28' font-weight='600' fill='%230f172a' letter-spacing='1'%3EFEIRÃO DA%3C/text%3E%3Ctext x='138' y='105' font-size='72' font-weight='800' fill='%23287ba8' letter-spacing='-2'%3EORCA%3C/text%3E%3C/g%3E%3C/svg%3E",

  // Ícone Quadrado: Apenas o símbolo
  ICON: "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect x='15' y='15' width='90' height='90' rx='20' fill='none' stroke='%23287ba8' stroke-width='14' /%3E%3Cpath d='M 60 110 C 60 110, 65 75, 30 60 C 15 55, -5 55, 10 40 C 20 30, 50 45, 60 65 C 70 45, 100 30, 110 40 C 120 50, 100 55, 90 60 C 55 75, 60 110, 60 110 Z' fill='%230f172a' stroke='white' stroke-width='3' /%3E%3C/svg%3E"
};

export const ADMIN_USER: User = {
  id: 'user_admin_01',
  name: "Administrador",
  email: "admin@orca.com",
  avatarUrl: "https://ui-avatars.com/api/?name=Admin+Orca&background=004AAD&color=fff",
  balance: 99999.99,
  phone: "(61) 99999-9999",
  location: "Sede Feirão da Orca",
  bio: "Gerente do Sistema",
  isAdmin: true, // Permite acesso ao painel de administrador
  adsCount: 0,
  verified: true
};


export const REGULAR_USER: User = {
  id: 'user_regular_01',
  name: "João Usuário",
  email: "joao@email.com",
  avatarUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200",
  balance: 150.00,
  phone: "(61) 98888-7777",
  location: "Taguatinga, DF",
  bio: "Comprador de carros e motos.",
  isAdmin: false, // Acesso restrito
  adsCount: 2,
  verified: true
};

// Mantido para compatibilidade, aponta para o Regular por padrão se necessário
export const CURRENT_USER = REGULAR_USER;

// --- MOCK SELLER FOR DEMO ---
export const MOCK_SELLER: User = {
  name: "Marcos Paulo",
  email: "marcos@email.com",
  avatarUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200",
  balance: 0,
  phone: "(61) 99999-8888",
  location: "Águas Claras, DF",
  bio: "Apaixonado por carros e motos. Vendo apenas veículos de procedência.",
  rating: 4.8,
  joinDate: "Ago 2022",
  reviewsCount: 14,
  verified: true
};

// --- DEFAULT BANNERS ---
export const DEFAULT_BANNERS: BannerItem[] = [
  {
    id: '1',
    category: 'Automotivo',
    title: 'Feirão de Seminovos',
    subtitle: 'Taxas a partir de 0.99% a.m.',
    buttonText: 'Ver Ofertas',
    image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=800',
    gradient: 'from-blue-900 to-blue-600',
    expiresAt: '2025-12-31T00:00:00.000Z',
    active: true
  },
  {
    id: '2',
    category: 'Imóveis',
    title: 'Lançamento Noroeste',
    subtitle: 'Aptos de alto padrão com 10% off',
    buttonText: 'Agendar Visita',
    image: 'https://images.unsplash.com/photo-1600596542815-60c37c6525fa?auto=format&fit=crop&q=80&w=800',
    gradient: 'from-emerald-800 to-teal-600',
    expiresAt: '2025-12-31T00:00:00.000Z',
    active: true
  },
  {
    id: '3',
    category: 'App Day',
    title: 'Semana do Cliente',
    subtitle: 'Anuncie grátis por 7 dias',
    buttonText: 'Anunciar Agora',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=800',
    gradient: 'from-purple-900 to-indigo-600',
    expiresAt: '2025-12-31T00:00:00.000Z',
    active: true
  }
];

export const DEFAULT_VEHICLE_BANNERS: BannerItem[] = [
  {
    id: 'v_ban_1',
    title: 'Festival de SUVs',
    subtitle: 'As melhores taxas do ano',
    category: 'Oferta',
    buttonText: 'Ver Agora',
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&q=80&w=800',
    gradient: 'from-blue-900 to-slate-800',
    expiresAt: '2025-12-31',
    active: true
  },
  {
    id: 'v_ban_2',
    title: 'Venda seu Carro',
    subtitle: 'Anuncie grátis hoje mesmo',
    category: 'Anuncie',
    buttonText: 'Começar',
    image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=800',
    gradient: 'from-emerald-800 to-green-600',
    expiresAt: '2025-12-31',
    active: true
  },
  {
    id: 'v_ban_3',
    title: 'Laudo Cautelar',
    subtitle: 'Segurança na sua compra',
    category: 'Serviço',
    buttonText: 'Saiba Mais',
    image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80&w=800',
    gradient: 'from-orange-700 to-red-600',
    expiresAt: '2025-12-31',
    active: true
  }
];

export const DEFAULT_REAL_ESTATE_BANNERS: BannerItem[] = [
  {
    id: 'r_ban_1',
    title: 'Feirão da Casa Própria',
    subtitle: 'Financiamento facilitado',
    category: 'Imóveis',
    buttonText: 'Ver Opções',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800',
    gradient: 'from-indigo-900 to-blue-800',
    expiresAt: '2025-12-31',
    active: true
  },
  {
    id: 'r_ban_2',
    title: 'Aluguel Sem Fiador',
    subtitle: 'Mudança rápida e sem burocracia',
    category: 'Aluguel',
    buttonText: 'Saiba Mais',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800',
    gradient: 'from-purple-900 to-pink-800',
    expiresAt: '2025-12-31',
    active: true
  },
  {
    id: 'r_ban_3',
    title: 'Lançamentos Noroeste',
    subtitle: 'Invista no melhor bairro de Brasília',
    category: 'Lançamento',
    buttonText: 'Ver Decorado',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800',
    gradient: 'from-emerald-900 to-green-700',
    expiresAt: '2025-12-31',
    active: true
  }
];

export const DEFAULT_PARTS_SERVICES_BANNERS: BannerItem[] = [
  {
    id: 'p_ban_1',
    title: 'Revisão de Férias',
    subtitle: 'Garanta a segurança da sua viagem',
    category: 'Serviço',
    buttonText: 'Agendar',
    image: 'https://images.unsplash.com/photo-1632823471441-28dc124119d5?auto=format&fit=crop&q=80&w=800',
    gradient: 'from-orange-800 to-red-700',
    expiresAt: '2025-12-31',
    active: true
  },
  {
    id: 'p_ban_2',
    title: 'Pneus em Promoção',
    subtitle: 'Compre 3 e leve 4',
    category: 'Oferta',
    buttonText: 'Aproveitar',
    image: 'https://images.unsplash.com/photo-1578844251758-2f71da64522f?auto=format&fit=crop&q=80&w=800',
    gradient: 'from-gray-900 to-gray-700',
    expiresAt: '2025-12-31',
    active: true
  },
  {
    id: 'p_ban_3',
    title: 'Estética Automotiva',
    subtitle: 'Seu carro brilhando como novo',
    category: 'Estética',
    buttonText: 'Ver Planos',
    image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=80&w=800',
    gradient: 'from-cyan-900 to-blue-800',
    expiresAt: '2025-12-31',
    active: true
  }
];

// --- MOCK USERS LIST FOR ADMIN PANEL ---
export const MOCK_USERS_LIST: User[] = [
  {
    id: 'u1',
    name: "Marcos Paulo",
    email: "marcos@email.com",
    avatarUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200",
    balance: 0,
    adsCount: 12,
    phone: "(61) 99999-8888",
    location: "Águas Claras, DF",
    bio: "Vendedor de carros premium.",
    joinDate: "Ago 2022",
    verified: true,
    isBlocked: false
  },
  {
    id: 'u2',
    name: "Ana Clara",
    email: "ana.clara@test.com",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    balance: 150,
    adsCount: 2,
    phone: "(61) 98888-7777",
    location: "Asa Norte, DF",
    bio: "Comprando móveis para casa nova.",
    joinDate: "Jan 2023",
    verified: true,
    isBlocked: false
  },
  {
    id: 'u3',
    name: "Roberto Justo",
    email: "roberto.j@fake.com",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    balance: 0,
    adsCount: 0,
    phone: "(11) 97777-6666",
    location: "São Paulo, SP",
    bio: "",
    joinDate: "Mar 2024",
    verified: false,
    isBlocked: true
  },
  {
    id: 'u4',
    name: "Loja de Peças DF",
    email: "contato@lojadf.com",
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200",
    balance: 2000,
    adsCount: 45,
    phone: "(61) 3333-4444",
    location: "Taguatinga, DF",
    bio: "As melhores peças da região.",
    joinDate: "Dez 2021",
    verified: true,
    isBlocked: false
  },
  {
    id: 'u5',
    name: "Carlos Golpista",
    email: "carlos123@suspicious.com",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    balance: 0,
    adsCount: 1,
    phone: "(61) 90000-0000",
    location: "Desconhecido",
    bio: "Vendo barato.",
    joinDate: "Hoje",
    verified: false,
    isBlocked: true
  }
];

// --- REPORTS DATA ---
export const REPORTS_USER_GROWTH = [
  { name: 'Jan', value: 850 },
  { name: 'Fev', value: 920 },
  { name: 'Mar', value: 1050 },
  { name: 'Abr', value: 1100 },
  { name: 'Mai', value: 1180 },
  { name: 'Jun', value: 1204 },
];

export const REPORTS_REVENUE_BY_PLAN = [
  {
    id: 'premium',
    name: 'Diamante',
    count: 42,
    revenue: 4200,
    color: '#004AAD', // Primary
    iconColor: 'bg-yellow-400'
  },
  {
    id: 'advanced',
    name: 'Ouro',
    count: 85,
    revenue: 5100,
    color: '#3B82F6', // Blue-500
    iconColor: 'bg-cyan-400'
  },
  {
    id: 'basic',
    name: 'Prata',
    count: 120,
    revenue: 3600,
    color: '#94A3B8', // Slate-400
    iconColor: 'bg-gray-300'
  }
];

// --- MOCK NOTIFICATIONS ---
export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    type: 'chat',
    title: 'Maria Silva',
    message: 'Olá! O apartamento ainda está disponível? Tenho interesse em visitar.',
    time: '2 min atrás',
    unread: true,
    image: 'https://picsum.photos/100/100?random=20'
  },
  {
    id: 2,
    type: 'chat',
    title: 'João Ferreira',
    message: 'Podemos fechar por R$ 48.000?',
    time: '1 hora atrás',
    unread: true,
    image: 'https://picsum.photos/100/100?random=21'
  },
  {
    id: 3,
    type: 'system',
    title: 'Preço caiu!',
    message: 'O Honda Civic que você favoritou baixou de preço.',
    time: '3 horas atrás',
    unread: false,
    image: null
  },
  {
    id: 4,
    type: 'chat',
    title: 'Carla Souza',
    message: 'Respondeu sua mensagem sobre o Nissan Versa.',
    time: 'Ontem',
    unread: false,
    image: 'https://picsum.photos/100/100?random=22'
  }
];

// --- MOCK REPORTS (Updated to match existing Ads) ---
export const MOCK_REPORTS: ReportItem[] = [
  {
    id: 'rep_1',
    targetType: 'ad',
    targetName: 'Fiat Uno Mille 1995 (Sem documento)',
    targetImage: 'https://images.unsplash.com/photo-1549463518-e3256a599b53?auto=format&fit=crop&q=80&w=800',
    targetId: 'v_rejected_1', // Matches an existing ad in MOCK_ADMIN_VEHICLES
    reason: 'Veículo Irregular / Golpe',
    description: 'Vendedor afirma não ter documento. Parece veículo roubado ou "np".',
    reporterName: 'João Cliente',
    date: 'Hoje, 10:45',
    severity: 'high',
    status: 'pending'
  },
  {
    id: 'rep_2',
    targetType: 'user',
    targetName: 'Carlos Vendas Rápidas',
    targetImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    targetId: 'u5', // Matches Carlos Golpista in MOCK_USERS_LIST
    reason: 'Comportamento Abusivo',
    description: 'Me xingou no chat após eu pedir um desconto.',
    reporterName: 'Maria Silva',
    date: 'Ontem, 15:30',
    severity: 'medium',
    status: 'pending'
  },
  {
    id: 'rep_3',
    targetType: 'ad',
    targetName: 'Desbloqueio de Multimidia (Serviço Ilegal)',
    targetImage: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=800',
    targetId: 'ps_rejected_1', // Matches an existing ad in MOCK_ADMIN_PARTS_SERVICES
    reason: 'Conteúdo Proibido',
    description: 'Oferecendo serviços de desbloqueio de central original, o que viola direitos autorais.',
    reporterName: 'Sistema (Auto)',
    date: '12 Out, 09:00',
    severity: 'high',
    status: 'pending'
  }
];

// --- MOCK ADMIN VEHICLES LIST ---
export const MOCK_ADMIN_VEHICLES: AdItem[] = [
  {
    id: 'v_pending_1',
    title: 'Volkswagen Jetta GLI 350 TSI',
    price: 215000.00,
    location: 'Guará, DF',
    image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.PENDING,
    category: 'autos',
    ownerName: 'Ricardo Oliveira',
    date: 'Hoje, 10:30',
    year: 2023,
    mileage: 5000,
    boostPlan: 'advanced' // Simulating a paid plan
  },
  {
    id: 'v_pending_2',
    title: 'Honda HR-V Touring 1.5 Turbo',
    price: 184900.00,
    location: 'Águas Claras, DF',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.PENDING,
    category: 'autos',
    ownerName: 'Fernanda Lima',
    date: 'Ontem, 15:20',
    year: 2024,
    mileage: 0,
    boostPlan: 'gratis' // Simulating free plan
  },
  {
    id: 'v_active_1',
    title: 'Porsche Macan T 2.0 Turbo',
    price: 520000.00,
    location: 'Lago Sul, DF',
    image: 'https://images.unsplash.com/photo-1503376763036-066120622c74?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'autos',
    ownerName: 'Marcos Paulo',
    date: '12 Ago 2023',
    year: 2023,
    mileage: 5000
  },
  {
    id: 'v_active_2',
    title: 'Chevrolet Onix 1.0 Turbo',
    price: 84900.00,
    location: 'Taguatinga, DF',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'autos',
    ownerName: 'Loja Seminovos',
    date: '10 Set 2023',
    year: 2023,
    mileage: 15000
  },
  {
    id: 'v_rejected_1',
    title: 'Fiat Uno Mille 1995 (Sem documento)',
    price: 5000.00,
    location: 'Ceilândia, DF',
    image: 'https://images.unsplash.com/photo-1549463518-e3256a599b53?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.REJECTED,
    category: 'autos',
    ownerName: 'Carlos Golpista',
    date: '05 Out 2023',
    year: 1995,
    mileage: 200000
  }
];

// --- MOCK ADMIN REAL ESTATE LIST ---
export const MOCK_ADMIN_REAL_ESTATE: AdItem[] = [
  {
    id: 'r_pending_1',
    title: 'Apartamento de luxo - 4 Quartos',
    price: 1200000.00,
    location: 'Noroeste, DF',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.PENDING,
    category: 'imoveis',
    realEstateType: 'Apartamento',
    ownerName: 'Construtora Elite',
    date: 'Hoje, 09:00',
    area: 140,
    bedrooms: 4,
    bathrooms: 4,
    parking: 2,
    description: 'Apartamento vazado, nascente, acabamento de alto padrão. Prédio com cobertura coletiva.'
  },
  {
    id: 'r_pending_2',
    title: 'Casa em Condomínio Fechado',
    price: 850000.00,
    location: 'Jardim Botânico, DF',
    image: 'https://images.unsplash.com/photo-1600596542815-60c37c6525fa?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.PENDING,
    category: 'imoveis',
    realEstateType: 'Casa',
    ownerName: 'João da Silva',
    date: 'Ontem, 18:30',
    area: 250,
    bedrooms: 3,
    bathrooms: 3,
    parking: 2,
    description: 'Casa térrea, recém reformada, área de lazer completa.'
  },
  {
    id: 'r_active_1',
    title: 'Kitnet Mobiliada Sudoeste',
    price: 320000.00,
    location: 'Sudoeste, DF',
    image: 'https://images.unsplash.com/photo-1556020685-ae41abfc9365?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'imoveis',
    realEstateType: 'Kitnet',
    ownerName: 'Ana Clara',
    date: '10 Out 2023',
    area: 35,
    bedrooms: 1,
    bathrooms: 1,
    parking: 1
  },
  {
    id: 'r_rejected_1',
    title: 'Lote irregular em área de preservação',
    price: 50000.00,
    location: 'Área Rural',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.REJECTED,
    category: 'imoveis',
    realEstateType: 'Terreno',
    ownerName: 'Carlos Golpista',
    date: '01 Out 2023',
    area: 800,
    description: 'Vendo barato, sem escritura.'
  }
];

// --- MOCK ADMIN PARTS & SERVICES LIST ---
export const MOCK_ADMIN_PARTS_SERVICES: AdItem[] = [
  {
    id: 'ps_pending_1',
    title: 'Kit Som Automotivo JBL Completo',
    price: 1500.00,
    location: 'Taguatinga Norte, DF',
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.PENDING,
    category: 'pecas',
    partType: 'Som e Vídeo Automotivo',
    condition: 'Novo',
    ownerName: 'AudioCar Shop',
    date: 'Hoje, 11:15',
    description: 'Kit completo com caixa, módulo e cornetas. Produto novo na caixa com garantia.'
  },
  {
    id: 'ps_pending_2',
    title: 'Jogo de Rodas Aro 17 (Usadas)',
    price: 800.00,
    location: 'Ceilândia, DF',
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&q=80&w=800', // Placeholder
    status: AdStatus.PENDING,
    category: 'pecas',
    partType: 'Peças Automotivas',
    condition: 'Usado',
    ownerName: 'Borracharia do Zé',
    date: 'Ontem, 16:45',
    description: 'Rodas originais VW, com alguns arranhões de uso. Pneus meia vida inclusos.'
  },
  {
    id: 'ps_active_1',
    title: 'Higienização Interna Completa',
    price: 250.00,
    location: 'Águas Claras, DF',
    image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'servicos',
    partType: 'Limpeza e Estética',
    ownerName: 'Lava Jato Premium',
    date: '10 Out 2023',
    description: 'Lavagem detalhada de bancos, teto e carpetes. Remoção de manchas e odores.'
  },
  {
    id: 'ps_rejected_1',
    title: 'Desbloqueio de Multimidia (Serviço Ilegal)',
    price: 100.00,
    location: 'Feira dos Importados',
    image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.REJECTED,
    category: 'servicos',
    partType: 'Serviços Automotivos',
    ownerName: 'Técnico Anônimo',
    date: '02 Out 2023',
    description: 'Libero canais pagos na sua multimídia original.'
  }
];

// --- NEW FEATURED VEHICLES ---
export const FEATURED_VEHICLES: AdItem[] = [
  {
    id: 'f1',
    title: 'Porsche Macan T 2.0 Turbo',
    price: 520000.00,
    location: 'Lago Sul, DF',
    image: 'https://images.unsplash.com/photo-1503376763036-066120622c74?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'autos',
    isFeatured: true,
    boostPlan: 'premium',
    year: 2023,
    mileage: 5000,
    vehicleType: 'SUV Premium'
  },
  {
    id: 'f2',
    title: 'Toyota Hilux GR-Sport',
    price: 345000.00,
    location: 'Park Way, DF',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'autos',
    isFeatured: true,
    boostPlan: 'premium',
    year: 2024,
    mileage: 0,
    vehicleType: 'Picape'
  },
  {
    id: 'f3',
    title: 'Audi A3 Sedan S Line',
    price: 229900.00,
    location: 'Sudoeste, DF',
    image: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'autos',
    isFeatured: true,
    boostPlan: 'advanced',
    year: 2023,
    mileage: 12000,
    vehicleType: 'Sedã'
  },
  {
    id: 'f4',
    title: 'Ford Mustang Mach 1',
    price: 485000.00,
    location: 'Noroeste, DF',
    image: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'autos',
    isFeatured: true,
    boostPlan: 'basic',
    year: 2022,
    mileage: 8000,
    vehicleType: 'Esportivo'
  }
];

export const POPULAR_CARS: AdItem[] = [
  {
    id: 'c1',
    title: 'Chevrolet Onix 1.0 Turbo',
    price: 84900.00,
    location: 'Taguatinga, DF',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'autos',
    year: 2023,
    mileage: 15000,
    vehicleType: 'GM - Chevrolet Onix',
    fairPresence: {
      active: true,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString() // 4 horas restantes
    }
  },
  {
    id: 'c2',
    title: 'Fiat Strada Volcano',
    price: 112000.00,
    location: 'SIA, DF',
    image: 'https://images.unsplash.com/photo-1626850257375-3413cb60321a?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'autos',
    year: 2024,
    mileage: 0,
    vehicleType: 'Fiat Strada'
  },
  {
    id: 'c3',
    title: 'Toyota Corolla XEi',
    price: 145000.00,
    location: 'Asa Norte, DF',
    image: 'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'autos',
    year: 2022,
    mileage: 42000,
    vehicleType: 'Toyota Corolla',
    fairPresence: {
      active: true,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString() // 2 horas restantes
    }
  },
  {
    id: 'c4',
    title: 'Jeep Compass Longitude',
    price: 158900.00,
    location: 'Lago Sul, DF',
    image: 'https://images.unsplash.com/photo-1627454820574-fb40e691b00e?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'autos',
    year: 2023,
    mileage: 12500,
    vehicleType: 'Jeep Compass'
  },
  {
    id: 'c5',
    title: 'Volkswagen Nivus Highline',
    price: 129990.00,
    location: 'Guará, DF',
    image: 'https://images.unsplash.com/photo-1549463518-e3256a599b53?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'autos',
    year: 2022,
    mileage: 28000,
    vehicleType: 'VW - Volkswagen Nivus'
  },
  {
    id: 'c6',
    title: 'Fiat Toro Ranch Diesel',
    price: 165000.00,
    location: 'Sobradinho, DF',
    image: 'https://images.unsplash.com/photo-1609529669235-c07e4e1bd6e9?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'autos',
    year: 2021,
    mileage: 45000,
    vehicleType: 'Fiat Toro'
  },
  {
    id: 'c7',
    title: 'BMW X1 sDrive20i',
    price: 285000.00,
    location: 'Noroeste, DF',
    image: 'https://images.unsplash.com/photo-1555215696-99ac45e43d34?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'autos',
    year: 2023,
    mileage: 8000,
    vehicleType: 'BMW X1'
  },
  {
    id: 'c8',
    title: 'Ford Ranger Limited',
    price: 310000.00,
    location: 'Park Way, DF',
    image: 'https://images.unsplash.com/photo-1566008885218-90abf9200ddb?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'autos',
    year: 2024,
    mileage: 1000,
    vehicleType: 'Ford Ranger'
  }
];

export const POPULAR_SERVICES: AdItem[] = [
  {
    id: 's1',
    title: 'Martelinho de Ouro Express',
    price: 150.00,
    location: 'Ceilândia, DF',
    image: 'https://images.unsplash.com/photo-1632823471441-28dc124119d5?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'servicos',
    partType: 'Estética Automotiva',
    condition: 'Novo'
  },
  {
    id: 's2',
    title: 'Polimento Cristalizado 3M',
    price: 350.00,
    location: 'SIA, DF',
    image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'servicos',
    partType: 'Lavagem e Detalhamento',
    condition: 'Novo'
  },
  {
    id: 's3',
    title: 'Instalação de Som JBL',
    price: 200.00,
    location: 'Taguatinga Norte, DF',
    image: 'https://images.unsplash.com/photo-1579607823819-755c3c063f28?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'servicos',
    partType: 'Som e Acessórios',
    condition: 'Novo'
  },
  {
    id: 's4',
    title: 'Revisão Completa + Troca de Óleo',
    price: 450.00,
    location: 'Asa Sul, DF',
    image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'servicos',
    partType: 'Mecânica Geral',
    condition: 'Novo'
  },
  {
    id: 's5',
    title: 'Lavagem Ecológica a Seco',
    price: 60.00,
    location: 'Atendimento à Domicílio',
    image: 'https://images.unsplash.com/photo-1552930294-6b595f4c2974?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'servicos',
    partType: 'Lavagem',
    condition: 'Novo'
  },
  {
    id: 's6',
    title: 'Higienização de Ar Condicionado',
    price: 120.00,
    location: 'Guará II, DF',
    image: 'https://images.unsplash.com/photo-1604065625078-d069411d51a6?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'servicos',
    partType: 'Manutenção',
    condition: 'Novo'
  }
];

export const POPULAR_REAL_ESTATE: AdItem[] = [
  {
    id: 'r1',
    title: 'Apto 2 Quartos - Águas Claras',
    price: 520000.00,
    location: 'Águas Claras, DF',
    image: 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'imoveis',
    realEstateType: 'Apartamento',
    transactionType: 'sale',
    area: 68,
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    features: ['Elevador', 'Garagem', 'Academia', 'Piscina']
  },
  {
    id: 'r2',
    title: 'Casa em Condomínio',
    price: 1250000.00,
    location: 'Jardim Botânico, DF',
    image: 'https://images.unsplash.com/photo-1600596542815-60c37c6525fa?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'imoveis',
    realEstateType: 'Casa',
    transactionType: 'sale',
    area: 240,
    bedrooms: 4,
    bathrooms: 4,
    parking: 2,
    features: ['Churrasqueira', 'Piscina', 'Jardim', 'Portaria 24h']
  },
  {
    id: 'r3',
    title: 'Kitnet Mobiliada',
    price: 180000.00,
    location: 'Sudoeste, DF',
    image: 'https://images.unsplash.com/photo-1556020685-ae41abfc9365?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'imoveis',
    realEstateType: 'Kitnet',
    transactionType: 'sale',
    area: 32,
    bedrooms: 1,
    bathrooms: 1,
    parking: 0,
    features: ['Elevador', 'Ar Condicionado']
  },
  {
    id: 'r4',
    title: 'Mansão Lago Sul',
    price: 3500000.00,
    location: 'Lago Sul, DF',
    image: 'https://images.unsplash.com/photo-1613490493576-2f045a12e858?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'imoveis',
    realEstateType: 'Casa',
    transactionType: 'sale',
    area: 450,
    bedrooms: 5,
    bathrooms: 6,
    parking: 4,
    features: ['Piscina', 'Churrasqueira', 'Varanda', 'Academia', 'Ar Condicionado']
  },
  {
    id: 'r5',
    title: 'Aluguel Apto 1 Quarto',
    price: 1800.00,
    location: 'Asa Norte, DF',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'imoveis',
    realEstateType: 'Apartamento',
    transactionType: 'rent',
    area: 45,
    bedrooms: 1,
    bathrooms: 1,
    parking: 1,
    features: ['Portaria 24h', 'Elevador']
  },
  {
    id: 'r6',
    title: 'Aluguel Casa 3 Quartos',
    price: 3500.00,
    location: 'Guará I, DF',
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'imoveis',
    realEstateType: 'Casa',
    transactionType: 'rent',
    area: 120,
    bedrooms: 3,
    bathrooms: 2,
    parking: 2,
    features: ['Varanda', 'Garagem']
  },
  {
    id: 'r7',
    title: 'Sala Comercial',
    price: 220000.00,
    location: 'Taguatinga Centro, DF',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'imoveis',
    realEstateType: 'Comercial',
    transactionType: 'sale',
    area: 35,
    bedrooms: 0,
    bathrooms: 1,
    parking: 1,
    features: ['Elevador', 'Portaria 24h']
  },
  {
    id: 'r8',
    title: 'Flat Life Resort',
    price: 380000.00,
    location: 'Asa Norte, DF',
    image: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'imoveis',
    realEstateType: 'Flat',
    transactionType: 'sale',
    area: 40,
    bedrooms: 1,
    bathrooms: 1,
    parking: 1,
    features: ['Piscina', 'Academia', 'Elevador', 'Ar Condicionado']
  }
];

export const MY_ADS_DATA: AdItem[] = [
  {
    id: '1',
    title: 'Nissan Versa 1.0 12V Flexstart 4P Mec. 2020',
    price: 49900.00,
    location: 'Brasília, DF',
    image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'autos',
    plate: 'JIP-1234',
    year: 2020,
    mileage: 108000,
    fuel: 'Flex',
    gearbox: 'Manual',
    color: 'Vermelho',
    doors: '4 portas',
    steering: 'Elétrica',
    engine: '1.0',
    isOwner: true,
    ipvaPaid: true,
    description: 'Versa Conforto 19/20 Manual Motor 1.0 Completo, Super Conservado, Tudo Funcionando Bem, Com Manual, Rodas Aro 15 Com Calotas E Quatro Pneus Meia Vida, Step Bom, Baixa Quilometragem, Som Original MP3 E Bluetooth. Aceito Carro De Menor Valor!',
    features: ['Airbag', 'Ar condicionado', 'Alarme', 'Trava elétrica', 'Vidro elétrico', 'Som', 'Sensor de ré'],
    vehicleType: 'Nissan Versa'
  },
  {
    id: '2',
    title: 'Apartamento 2 Quartos - Centro',
    price: 450000.00,
    location: 'Rio de Janeiro, RJ',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'imoveis',
    realEstateType: 'Apartamento',
    transactionType: 'sale',
    bedrooms: 2,
    bathrooms: 1,
    parking: 1,
    area: 70
  },
  {
    id: '3',
    title: 'iPhone 13 Pro Max',
    price: 4500.00,
    location: 'Belo Horizonte, MG',
    image: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.INACTIVE,
    category: 'produtos'
  }
];

export const FAVORITES_DATA: AdItem[] = [
  {
    id: '101',
    title: 'Ford Mustang GT 2022',
    price: 480000.00,
    location: 'Belo Horizonte, MG',
    image: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'autos',
    year: 2022,
    mileage: 12000,
    fuel: 'Gasolina',
    gearbox: 'Automático',
    vehicleType: 'Ford Mustang'
  },
  {
    id: '102',
    title: 'Apartamento 2 Quartos',
    price: 450000.00,
    location: 'Rio de Janeiro, RJ',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'imoveis',
    realEstateType: 'Apartamento',
    transactionType: 'sale',
    bedrooms: 2,
    bathrooms: 2,
    area: 80
  },
  {
    id: '103',
    title: 'Volkswagen Gol 1.6',
    price: 55900.00,
    location: 'São Paulo, SP',
    image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.ACTIVE,
    category: 'autos',
    vehicleType: 'Volkswagen Gol'
  }
];

export const HISTORY_DATA: AdItem[] = [
  {
    id: '201',
    title: 'Honda Civic EX 2021',
    price: 135000.00,
    location: 'Curitiba, PR',
    image: 'https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?auto=format&fit=crop&q=80&w=800',
    status: AdStatus.BOUGHT,
    date: '12 de Agosto, 2023',
    category: 'autos',
    vehicleType: 'Honda Civic'
  }
];

export const MESSAGES_DATA: MessageItem[] = [
  {
    id: '1',
    senderName: 'Maria Silva',
    avatarUrl: 'https://picsum.photos/100/100?random=20',
    lastMessage: 'Olá! O apartamento ainda está disponível?',
    time: '10:42',
    unreadCount: 2,
    online: true,
    adTitle: 'Apartamento 2 Quartos - Centro'
  },
  {
    id: '2',
    senderName: 'João Ferreira',
    avatarUrl: 'https://picsum.photos/100/100?random=21',
    lastMessage: 'Ok, combinado. Obrigado!',
    time: '09:15',
    unreadCount: 0,
    online: false,
    adTitle: 'Nissan Versa 1.0 12V Flexstart'
  },
  {
    id: '3',
    senderName: 'Carla Souza',
    avatarUrl: 'https://picsum.photos/100/100?random=22',
    lastMessage: 'Tenho interesse no veículo.',
    time: 'Ontem',
    unreadCount: 1,
    online: true,
    adTitle: 'Honda Civic EX 2021'
  },
  {
    id: '4',
    senderName: 'Pedro Martins',
    avatarUrl: 'https://picsum.photos/100/100?random=23',
    lastMessage: 'Qual o melhor preço que você faz?',
    time: 'Sexta-feira',
    unreadCount: 0,
    online: false,
    adTitle: 'iPhone 13 Pro Max'
  }
];

export const HISTORY_CHART_DATA: TransactionData[] = [
  { name: 'Jan', value: 4000 },
  { name: 'Fev', value: 3000 },
  { name: 'Mar', value: 2000 },
  { name: 'Abr', value: 2780 },
  { name: 'Mai', value: 1890 },
  { name: 'Jun', value: 2390 },
  { name: 'Jul', value: 3490 },
];
