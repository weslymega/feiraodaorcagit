
// Enum for screen navigation
export enum Screen {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER', // Nova tela de cadastro
  FORGOT_PASSWORD = 'FORGOT_PASSWORD', // Nova tela
  DASHBOARD = 'DASHBOARD', // Agora é a Home Feed
  USER_PANEL = 'USER_PANEL', // Novo Painel do Usuário (Antigo Dashboard)
  MY_ADS = 'MY_ADS',
  FAVORITES = 'FAVORITES',
  SETTINGS = 'SETTINGS',
  MESSAGES = 'MESSAGES',
  CHAT_DETAIL = 'CHAT_DETAIL',
  EDIT_PROFILE = 'EDIT_PROFILE',
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
  CREATE_AD = 'CREATE_AD',
  BOOST_TURBO = 'BOOST_TURBO',

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
  ADMIN_SYSTEM_SETTINGS = 'ADMIN_SYSTEM_SETTINGS', // Nova rota de configurações do sistema
  ADMIN_CONTENT_MODERATION = 'ADMIN_CONTENT_MODERATION', // Nova rota de moderação
  ADMIN_DASHBOARD_PROMOTIONS = 'ADMIN_DASHBOARD_PROMOTIONS', // Nova rota de gerenciamento de propagandas do dashboard
  ADMIN_REAL_ESTATE_PROMOTIONS = 'ADMIN_REAL_ESTATE_PROMOTIONS', // Nova rota de gerenciamento de propagandas de imóveis
  ADMIN_PARTS_SERVICES_PROMOTIONS = 'ADMIN_PARTS_SERVICES_PROMOTIONS', // Nova rota de gerenciamento de propagandas de peças e serviços
  ADMIN_VEHICLES_PROMOTIONS = 'ADMIN_VEHICLES_PROMOTIONS',
  ADMIN_SECURITY_LOGS = 'ADMIN_SECURITY_LOGS', // Nova rota de gerenciamento de propagandas de veículos

  ACCOUNT_DATA = 'ACCOUNT_DATA',
  NOTIFICATIONS = 'NOTIFICATIONS',
  PRIVACY = 'PRIVACY',
  SECURITY = 'SECURITY',
  ABOUT_APP = 'ABOUT_APP',
  HELP_SUPPORT = 'HELP_SUPPORT',
  ABOUT_US = 'ABOUT_US',
  TERMS_OF_USE = 'TERMS_OF_USE',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  RESET_PASSWORD = 'RESET_PASSWORD',
  ACCEPT_TERMS = 'ACCEPT_TERMS',
  BLOCKED_USERS = 'BLOCKED_USERS',
  PRINT_PREVIEW = 'PRINT_PREVIEW'
}

export interface User {
  id?: string; // Adicionado ID opcional para facilitar gerenciamento
  activePlan?: 'free' | 'Simples' | 'Premium' | 'Topo'; // Plano do usuário
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
  showOnlineStatus?: boolean;
  readReceipts?: boolean;
  lastActiveAt?: string;
  createdAt?: string;
  emailConfirmedAt?: string;
  acceptedTerms?: boolean;
  acceptedAt?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
  termsVersion?: string;
  deletedAt?: string;
}

export enum AdStatus {
  ACTIVE = 'Ativo',
  INACTIVE = 'Inativo',
  SOLD = 'Vendido',
  BOUGHT = 'Comprado',
  PENDING = 'Pendente',   // Novo status
  REJECTED = 'Rejeitado'  // Novo status
}

export enum TurboPlan {
  PREMIUM = 'premium',
  PRO = 'pro',
  MAX = 'max'
}

export interface TurboSession {
  id: string;
  ad_id: string;
  turbo_type: TurboPlan;
  turbo_score: number;
  turbo_expires_at: string | null;
  status: 'active' | 'completed';
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

  /** @deprecated Usar turboPlan e turboSession no novo modelo */
  boostPlan?: any;
  /** @deprecated Usar turboPlan e turboSession no novo modelo */
  boostConfig?: any;
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

  // Turbo Highlights (Single Source of Truth)
  turbo_expires_at?: string;
  is_turbo_active?: boolean;
}

export interface MessageItem {
  id: string; // Message UUID (as per user directive)
  otherUserId: string; // ID of the other participant for chat detail fetching
  senderName: string;
  avatarUrl: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  online?: boolean;
  adTitle?: string; // Context
  adId?: string; // Para marcação de lido
  adImage?: string;
  adPrice?: number;
  readReceipts?: boolean; // Se o outro usuário permite ver se ele leu
}

export interface ChatMessage {
  id: string;
  text: string;
  imageUrl?: string; // Mantido por compatibilidade
  images?: string[]; // Nova lista de imagens (JSONB no DB)
  isMine: boolean;
  time: string;
  isRead?: boolean;
  sending?: boolean; // New: Optimistic UI sending state
  error?: boolean;   // New: Optimistic UI error state
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
  adId?: string;
  adTitle?: string;
  targetId: string;
  targetName: string;
  targetType: 'ad' | 'user';
  targetImage?: string;
  reportedUserId?: string;
  reason: string;
  description: string;
  reporterId: string;
  reporterName: string;
  severity: 'low' | 'medium' | 'high';
  status: 'pending' | 'resolved' | 'dismissed';
  date: string;
}

// Temporary Filter Context for Navigation
export interface FilterContext {
  mode: 'recent' | 'trending' | 'category' | 'none';
  category?: string;
  partTypes?: string[];
  sort?: 'recent' | 'price_asc' | 'price_desc' | 'trending';
  searchTerm?: string;
  brand?: string;
  model?: string;
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
export interface HighlightPlan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  priority_level: number;
  active: boolean;
}

export interface AdHighlight {
  id: string;
  ad_id: string;
  user_id: string;
  plan_id: string;
  starts_at: string;
  ends_at: string;
  status: 'active' | 'expired' | 'cancelled';
}
export interface BlockedUser {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface MarketPriceItem {
  id: string;
  brand: string;
  model: string;
  year: string;
  price: string;
  brandId?: string;
  modelId?: string;
}
