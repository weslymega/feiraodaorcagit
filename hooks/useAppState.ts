
import { useState, useEffect } from 'react';
import { Screen, User, AdItem, MessageItem, BannerItem, NotificationItem, ReportItem } from '../types';
import { 
  CURRENT_USER, 
  MY_ADS_DATA, 
  FAVORITES_DATA, 
  DEFAULT_BANNERS, 
  DEFAULT_VEHICLE_BANNERS, 
  DEFAULT_REAL_ESTATE_BANNERS, 
  DEFAULT_PARTS_SERVICES_BANNERS, 
  MOCK_ADMIN_VEHICLES, 
  MOCK_NOTIFICATIONS, 
  MOCK_REPORTS 
} from '../constants';

// --- HELPER PARA CARREGAR DADOS SALVOS ---
const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    console.error(`Erro ao carregar ${key} do armazenamento`, error);
    return fallback;
  }
};

export const useAppState = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.LOGIN);
  const [previousScreen, setPreviousScreen] = useState<Screen>(Screen.DASHBOARD);

  // Initialize state from LocalStorage
  const [user, setUser] = useState<User>(() => loadFromStorage('orca_user', CURRENT_USER));
  const [myAds, setMyAds] = useState<AdItem[]>(() => loadFromStorage('orca_my_ads', MY_ADS_DATA));
  const [favorites, setFavorites] = useState<AdItem[]>(() => loadFromStorage('orca_favorites', FAVORITES_DATA));
  const [banners, setBanners] = useState<BannerItem[]>(() => loadFromStorage('orca_banners', DEFAULT_BANNERS));
  const [vehicleBanners, setVehicleBanners] = useState<BannerItem[]>(() => loadFromStorage('orca_vehicle_banners', DEFAULT_VEHICLE_BANNERS));
  const [realEstateBanners, setRealEstateBanners] = useState<BannerItem[]>(() => loadFromStorage('orca_real_estate_banners', DEFAULT_REAL_ESTATE_BANNERS));
  const [partsServicesBanners, setPartsServicesBanners] = useState<BannerItem[]>(() => loadFromStorage('orca_parts_services_banners', DEFAULT_PARTS_SERVICES_BANNERS));

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => loadFromStorage('orca_notifications', MOCK_NOTIFICATIONS));
  const [reports, setReports] = useState<ReportItem[]>(() => loadFromStorage('orca_reports', MOCK_REPORTS));

  // Configurações do Sistema
  const [fairActive, setFairActive] = useState<boolean>(() => loadFromStorage('orca_fair_active', true));
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(() => loadFromStorage('orca_maintenance', false));

  // Estado local para anúncios do admin (mocks)
  const [adminMockAds, setAdminMockAds] = useState<AdItem[]>(MOCK_ADMIN_VEHICLES);

  // States for flow
  const [selectedAd, setSelectedAd] = useState<AdItem | null>(null);
  const [adToEdit, setAdToEdit] = useState<AdItem | undefined>(undefined);
  const [selectedChat, setSelectedChat] = useState<MessageItem | null>(null);
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' | 'error' } | null>(null);

  // --- PERSISTÊNCIA ---
  useEffect(() => localStorage.setItem('orca_user', JSON.stringify(user)), [user]);
  useEffect(() => localStorage.setItem('orca_my_ads', JSON.stringify(myAds)), [myAds]);
  useEffect(() => localStorage.setItem('orca_favorites', JSON.stringify(favorites)), [favorites]);
  useEffect(() => localStorage.setItem('orca_banners', JSON.stringify(banners)), [banners]);
  useEffect(() => localStorage.setItem('orca_vehicle_banners', JSON.stringify(vehicleBanners)), [vehicleBanners]);
  useEffect(() => localStorage.setItem('orca_real_estate_banners', JSON.stringify(realEstateBanners)), [realEstateBanners]);
  useEffect(() => localStorage.setItem('orca_parts_services_banners', JSON.stringify(partsServicesBanners)), [partsServicesBanners]);
  useEffect(() => localStorage.setItem('orca_notifications', JSON.stringify(notifications)), [notifications]);
  useEffect(() => localStorage.setItem('orca_reports', JSON.stringify(reports)), [reports]);
  useEffect(() => localStorage.setItem('orca_fair_active', JSON.stringify(fairActive)), [fairActive]);
  useEffect(() => localStorage.setItem('orca_maintenance', JSON.stringify(maintenanceMode)), [maintenanceMode]);

  return {
    currentScreen, setCurrentScreen,
    previousScreen, setPreviousScreen,
    user, setUser,
    myAds, setMyAds,
    favorites, setFavorites,
    banners, setBanners,
    vehicleBanners, setVehicleBanners,
    realEstateBanners, setRealEstateBanners,
    partsServicesBanners, setPartsServicesBanners,
    notifications, setNotifications,
    reports, setReports,
    fairActive, setFairActive,
    maintenanceMode, setMaintenanceMode,
    adminMockAds, setAdminMockAds,
    selectedAd, setSelectedAd,
    adToEdit, setAdToEdit,
    selectedChat, setSelectedChat,
    viewingProfile, setViewingProfile,
    toast, setToast
  };
};
