
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
  ADMIN_BANNERS = 'ADMIN_BANNERS', // Nova rota de banners
  ADMIN_SYSTEM_SETTINGS = 'ADMIN_SYSTEM_SETTINGS', // Nova rota de configurações do sistema
  ADMIN_CONTENT_MODERATION = 'ADMIN_CONTENT_MODERATION', // Nova rota de moderação

  ACCOUNT_DATA = 'ACCOUNT_DATA',
  NOTIFICATIONS = 'NOTIFICATIONS',
  PRIVACY = 'PRIVACY',
  SECURITY = 'SECURITY',
  ABOUT_APP = 'ABOUT_APP',
  HELP_SUPPORT = 'HELP_SUPPORT'
}

export interface User {
  id?: string; // Adicionado ID opcional para facilitar gerenciamento
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

// Controle de Banner de Propaganda
export interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  buttonText: string;
  image: string; // URL ou Base64
  gradient: string; // Classe tailwind ex: 'from-blue-900 to-blue-600'
  expiresAt: string; // ISO Date
  active: boolean;
  link?: string;
}

// Controle de Presença na Feira
export interface FairPresence {
  active: boolean;
  expiresAt: string; // ISO Date string
}

export interface AdItem {
  id: string;
  title: string;
  price: number;
  fipePrice?: number; // New Field for FIPE Reference
  location: string;
  image: string; // Capa (mantido para compatibilidade)
  images?: string[]; // Lista completa de imagens
  status: AdStatus;
  date?: string;
  category?: 'autos' | 'imoveis' | 'produtos' | 'pecas' | 'servicos';
  
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
  targetType: 'ad' | 'user' | 'comment';
  targetName: string;
  targetImage?: string;
  targetId: string;
  reason: string;
  description: string;
  reporterName: string;
  date: string;
  severity: 'low' | 'medium' | 'high';
  status: 'pending' | 'resolved' | 'dismissed';
}
