
// Enum for screen navigation
export enum Screen {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER', // Nova tela de cadastro
  FORGOT_PASSWORD = 'FORGOT_PASSWORD', // Nova tela
  DASHBOARD = 'DASHBOARD', // Agora é a Home Feed
  USER_PANEL = 'USER_PANEL', // Novo Painel do Usuário (Antigo Dashboard)
  MY_ADS = 'MY_ADS',
  FAVORITES = 'FAVORITES',
  HISTORY = 'HISTORY',
  SETTINGS = 'SETTINGS',
  MESSAGES = 'MESSAGES',
  CHAT_DETAIL = 'CHAT_DETAIL',
  EDIT_PROFILE = 'EDIT_PROFILE',
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
  CREATE_AD = 'CREATE_AD',

  // Detalhes
  VEHICLE_DETAILS = 'VEHICLE_DETAILS',
  REAL_ESTATE_DETAILS = 'REAL_ESTATE_DETAILS',
  PART_SERVICE_DETAILS = 'PART_SERVICE_DETAILS',

  // Listagens (Novas Telas)
  VEHICLES_LIST = 'VEHICLES_LIST',
  REAL_ESTATE_LIST = 'REAL_ESTATE_LIST',
  PARTS_SERVICES_LIST = 'PARTS_SERVICES_LIST',
  FEATURED_VEHICLES_LIST = 'FEATURED_VEHICLES_LIST', // Nova tela de destaques
  FAIR_LIST = 'FAIR_LIST', // Nova tela: Estou na Feira Agora

  // Perfil Público
  PUBLIC_PROFILE = 'PUBLIC_PROFILE',

  // Admin
  ADMIN_PANEL = 'ADMIN_PANEL',
  ADMIN_USERS = 'ADMIN_USERS', // Nova rota de gerenciamento de usuários
  ADMIN_VEHICLES = 'ADMIN_VEHICLES', // Nova rota de gerenciamento de veículos
  ADMIN_REAL_ESTATE = 'ADMIN_REAL_ESTATE', // Nova rota de gerenciamento de imóveis
  ADMIN_PARTS_SERVICES = 'ADMIN_PARTS_SERVICES', // Nova rota de gerenciamento de peças e serviços
  ADMIN_REPORTS = 'ADMIN_REPORTS', // Nova rota de relatórios
  ADMIN_SYSTEM_SETTINGS = 'ADMIN_SYSTEM_SETTINGS', // Nova rota de configurações do sistema
  ADMIN_CONTENT_MODERATION = 'ADMIN_CONTENT_MODERATION', // Nova rota de moderação
  ADMIN_DASHBOARD_PROMOTIONS = 'ADMIN_DASHBOARD_PROMOTIONS', // Nova rota de gerenciamento de propagandas do dashboard
  ADMIN_REAL_ESTATE_PROMOTIONS = 'ADMIN_REAL_ESTATE_PROMOTIONS', // Nova rota de gerenciamento de propagandas de imóveis
  ADMIN_PARTS_SERVICES_PROMOTIONS = 'ADMIN_PARTS_SERVICES_PROMOTIONS', // Nova rota de gerenciamento de propagandas de peças e serviços
  ADMIN_VEHICLES_PROMOTIONS = 'ADMIN_VEHICLES_PROMOTIONS', // Nova rota de gerenciamento de propagandas de veículos

  ACCOUNT_DATA = 'ACCOUNT_DATA',
  NOTIFICATIONS = 'NOTIFICATIONS',
  PRIVACY = 'PRIVACY',
  SECURITY = 'SECURITY',
  ABOUT_APP = 'ABOUT_APP',
  HELP_SUPPORT = 'HELP_SUPPORT',
  ABOUT_US = 'ABOUT_US',
  TERMS_OF_USE = 'TERMS_OF_USE',
  PRIVACY_POLICY = 'PRIVACY_POLICY'
}

export interface User {
  id?: string; // Adicionado ID opcional para facilitar gerenciamento
  activePlan?: 'free' | 'basic' | 'advanced' | 'premium'; // Plano do usuário
  monthlyUsage?: { month: string; count: number }; // Controle de uso mensal (YYYY-MM)
  name: string;
  email: string;
  avatarUrl: string;
  balance: number;
  adsCount?: number; // Contagem de anúncios do usuário
  phone?: string;
  location?: string;
  cep?: string; // New field for pre-filling forms
  bio?: string;
  rating?: number; // Para perfil público
  joinDate?: string; // Para perfil público
  reviewsCount?: number; // Para perfil público
  verified?: boolean;
  isAdmin?: boolean; // Controle de acesso administrativo
  isBlocked?: boolean; // Status de bloqueio
}

export enum AdStatus {
  ACTIVE = 'Ativo',
  INACTIVE = 'Inativo',
  SOLD = 'Vendido',
  BOUGHT = 'Comprado',
  PENDING = 'Pendente',   // Novo status
  REJECTED = 'Rejeitado'  // Novo status
}

// Configuração detalhada do Plano
export interface AdBoostConfig {
  startDate: string;      // Data de início (ISO)
  expiresAt: string;      // Data de expiração do plano (ISO)
  totalBumps: number;     // Total de subidas contratadas
  bumpsRemaining: number; // Quantas restam
  nextBumpDate?: string;  // Data prevista para a próxima subida (ISO)
}


// Controle de Presença na Feira
export interface FairPresence {
  active: boolean;
  expiresAt: string; // ISO Date string
}

export interface AdItem {
  id: string;
  userId: string; // ID do dono do anúncio
  title: string;
  price: number;
  fipePrice?: number; // New Field for FIPE Reference
  location: string;
  image: string; // Capa (mantido para compatibilidade)
  images?: string[]; // Lista completa de imagens
  status: AdStatus;
  date?: string;
  category?: 'veiculos' | 'imoveis' | 'servicos' | 'autos' | 'pecas' | 'produtos'; // Mantendo antigos por compatibilidade temporária se necessário, mas priorizando novos

  isFeatured?: boolean; // Indicates if the ad is a "Destaque"
  boostPlan?: 'premium' | 'advanced' | 'basic' | 'gratis'; // Specific Plan Tier
  boostConfig?: AdBoostConfig; // Regras de data e bumps

  fairPresence?: FairPresence; // Novo campo: Presença física na feira

  // New Field for Rent vs Sale
  transactionType?: 'sale' | 'rent';

  // Vehicle Specifics
  vehicleType?: string; // e.g., 'Carro', 'Moto', 'Caminhão', 'SUV', 'Sedã', 'Picape'
  plate?: string;
  year?: number;
  mileage?: number;
  fuel?: string;
  gearbox?: string;
  color?: string;
  doors?: string;
  steering?: string;
  engine?: string;

  // Real Estate Specifics
  realEstateType?: string; // e.g., 'Apartamento', 'Casa', 'Comercial'
  area?: number;
  builtArea?: number; // Area Construida
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;

  // Parts & Services Specifics
  partType?: string; // e.g., 'Peças Mecânicas', 'Som', 'Serviços'
  condition?: string; // 'Novo', 'Usado'

  description?: string;
  features?: string[];
  additionalInfo?: string[]; // Tags genéricas (Ex: Com manual, Chave reserva, ou tags de imovel)
  isOwner?: boolean;
  ipvaPaid?: boolean;
  ownerName?: string; // Para exibição no admin
  ownerAvatar?: string | null;

  // Fields for dynamic Home sections
  createdAt?: string; // ISO string timestamp for filtering recent ads
  views?: number; // Number of views for trending calculation
  favoriteCount?: number; // Number of favorites for trending scoring
  chatCount?: number; // Number of chats initiated for trending scoring
  priceType?: 'fixed' | 'starting_at'; // For services: fixed price or "A partir de"
  estimatedTime?: string; // For services: estimated time to complete
}

export interface MessageItem {
  id: string;
  senderName: string;
  avatarUrl: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  online?: boolean;
  adTitle?: string; // Context
}

export interface ChatMessage {
  id: string;
  text: string;
  imageUrl?: string; // Optional image URL
  isMine: boolean;
  time: string;
}

export interface TransactionData {
  name: string;
  value: number;
}

export interface NotificationItem {
  id: number | string;
  type: 'chat' | 'system';
  title: string;
  message: string;
  time: string;
  unread: boolean;
  image: string | null;
}

export interface ReportItem {
  id: string;
  adId: string;
  adTitle: string;
  reason: string;
  description: string;
  reporterId: string;
  reporterName: string;
  status: 'pending' | 'resolved' | 'dismissed';
  date: string;
}

// Temporary Filter Context for Navigation
export interface FilterContext {
  mode: 'recent' | 'trending' | 'category' | 'none';
  category?: string;
  partTypes?: string[];
  sort?: 'recent' | 'price_asc' | 'price_desc' | 'trending';
}

export interface DashboardPromotion {
  id: string;
  image: string;

  title?: string;
  subtitle?: string;

  link?: string; // opcional (externo ou interno)

  startDate: string; // ISO
  endDate: string;   // ISO

  active: boolean;
  order: number; // controle de exibição

  createdAt: string;
  updatedAt: string;
}
export interface RealEstatePromotion extends DashboardPromotion { }
export interface PartsServicesPromotion extends DashboardPromotion { }
export interface VehiclesPromotion extends DashboardPromotion { }
