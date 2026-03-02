
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X, Car, Package, Home, Briefcase,
  Plus, Camera, ChevronLeft, MapPin, Phone, CheckCircle, Search, Trash2, AlignLeft,
  Truck, Bike, Settings, Wrench, Smartphone, Bed, Bath, Maximize, Warehouse, Building,
  Loader2, Speaker, Hammer, Sparkles, Disc, QrCode, Download, Printer, Share2, AlertCircle, Star,
  Trophy, Clock, CreditCard, Copy, Wallet, Check, ShieldCheck, Lock, TrendingUp,
  ArrowDown, ArrowUp, Minus, Zap, ClipboardCheck, Info
} from 'lucide-react';
import { AdItem, AdBoostConfig, AdStatus, User, HighlightPlan } from '../types';
import { fipeApi, FipeItem, FipeDetail } from '../services/fipeApi';
import { api } from '../services/api';
import { APP_URL } from '../constants';
import { getPlanMetadata } from '../utils/planConstants';
import { HighlightAdModal } from '../components/HighlightAdModal';
import { useAppState } from '../hooks/useAppState'; // Import to use context if needed (though passed via props usually)


interface CreateAdProps {
  onBack: () => void;
  onFinish: (adData: Partial<AdItem>) => void;
  editingAd?: AdItem;
  user: User;
}

enum CreateStep {
  CATEGORY = 0,
  VEHICLE_TYPE = 1,
  REAL_ESTATE_TYPE = 2,
  PARTS_TYPE = 16,
  PARTS_CONDITION = 17,
  PHOTOS = 3,
  PLATE = 4,
  SPECS = 5,
  INFO = 6,
  FEATURES = 7,
  ADDITIONAL_INFO = 8,
  REAL_ESTATE_SPECS = 9,
  REAL_ESTATE_FEATURES = 10,
  TITLE = 11,
  DESCRIPTION = 15, // Changed from 11 to avoid collision and keep order
  PRICE = 12,
  CONTACT = 13,
  BOOST = 14,
  PAYMENT_METHOD = 20,
  PAYMENT_CARD = 21,
  PAYMENT_PIX = 22,
  PAYMENT_PROCESSING = 23,
  PAYMENT_APPROVED = 24,
  SUCCESS = 25 // Changed from 15
}

const ACTION_BTN_CLASS = "bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98]";

// REMOVED: TURBO_PLAN_DISPLAY_NAMES, BOOST_PLANS - Now fetching dynamically


interface StepContainerProps {
  title: string;
  progress: number;
  children: React.ReactNode;
  onNext?: () => void;
  nextDisabled?: boolean;
  onBack: () => void;
  hideHeader?: boolean;
  hideFooter?: boolean;
}

const StepContainer: React.FC<StepContainerProps> = ({ title, progress, children, onNext, nextDisabled, onBack, hideHeader = false, hideFooter = false }) => (
  <div className="flex flex-col h-full animate-slide-in-from-right">
    {!hideHeader && (
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="p-1 -ml-1 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-6 h-6 text-gray-800" /></button>
        <span className="font-bold text-gray-900">{title}</span>
        <div className="w-6"></div>
      </div>
    )}
    {!hideHeader && (
      <div className="h-1.5 w-full bg-gray-100 mb-8 rounded-full overflow-hidden">
        <div className="h-full bg-accent w-full rounded-full transition-all duration-500 ease-out origin-left transform" style={{ transform: `scaleX(${progress})` }}></div>
      </div>
    )}
    <div className="flex-1 overflow-y-auto no-scrollbar -mx-2 px-2 pb-24">
      {children}
    </div>
    {!hideFooter && (
      <div className="sticky bottom-0 bg-white p-4 border-t z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] -mx-2 flex gap-4">
        <button onClick={onBack} className="flex-1 py-4 border-2 border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">
          Voltar
        </button>
        {onNext && (
          <button
            onClick={onNext}
            disabled={nextDisabled}
            className={`flex-1 ${ACTION_BTN_CLASS} ${nextDisabled ? 'opacity-50 cursor-not-allowed bg-gray-400' : ''}`}
          >
            Continuar
          </button>
        )}
      </div>
    )}
  </div>
);

// REMOVED: PaymentProcessingView

export const CreateAd: React.FC<CreateAdProps> = ({ onBack, onFinish, editingAd, user }) => {
  const initialStep = useMemo(() => {
    if (!editingAd) return CreateStep.CATEGORY;
    if (editingAd.category === 'veiculos') return CreateStep.VEHICLE_TYPE;
    if (editingAd.category === 'imoveis') return CreateStep.REAL_ESTATE_TYPE;
    if (editingAd.category === 'servicos' || editingAd.category === 'pecas') return CreateStep.PARTS_TYPE;
    return CreateStep.DESCRIPTION;
  }, [editingAd]);

  const [step, setStep] = useState<CreateStep>(initialStep);
  const [history, setHistory] = useState<CreateStep[]>([initialStep]);
  const [isUploading, setIsUploading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [adTitle, setAdTitle] = useState(''); // Added this state for the ad title

  const initialAddressDetails = useMemo(() => {
    let details = { logradouro: '', bairro: '', localidade: '', uf: '' };
    const baseLocation = editingAd?.location || user.location;
    if (baseLocation) {
      if (baseLocation.includes(' - ')) {
        const [bairro, rest] = baseLocation.split(' - ');
        if (rest && rest.includes(',')) {
          const [cidade, uf] = rest.split(',');
          details = { ...details, bairro: bairro.trim(), localidade: cidade.trim(), uf: uf.trim() };
        }
      } else if (baseLocation.includes(',')) {
        const [cidade, uf] = baseLocation.split(',');
        details = { ...details, localidade: cidade.trim(), uf: uf.trim() };
      }
    }
    return details;
  }, [user.location, editingAd?.location]);

  const [addressDetails, setAddressDetails] = useState(initialAddressDetails);
  const [fipeBrands, setFipeBrands] = useState<FipeItem[]>([]);
  const [fipeModels, setFipeModels] = useState<FipeItem[]>([]);
  const [fipeYears, setFipeYears] = useState<FipeItem[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedBaseModel, setSelectedBaseModel] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [selectedYearId, setSelectedYearId] = useState('');
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingYears, setIsLoadingYears] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  // REMOVED: cardDetails state (legacy payment)

  const [dbPlans, setDbPlans] = useState<HighlightPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  // New states for immediate payment flow
  const [createdAd, setCreatedAd] = useState<AdItem | null>(null);
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoadingPlans(true);
      try {
        const plans = await api.getHighlightPlans();
        setDbPlans(plans);
      } catch (error) {
        console.error("Failed to fetch highlight plans", error);
      } finally {
        setIsLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  const [formData, setFormData] = useState({
    category: editingAd?.category || '',
    title: editingAd?.title || '',
    vehicleType: editingAd?.vehicleType || '',
    plate: editingAd?.plate || '',
    isZeroKm: false,
    brandName: '',
    modelName: '',
    year: editingAd?.year?.toString() || '',
    fuel: editingAd?.fuel || '',
    gearbox: editingAd?.gearbox || '',
    color: editingAd?.color || '',
    doors: editingAd?.doors || '',
    steering: editingAd?.steering || '',
    engine: editingAd?.engine || '',
    mileage: editingAd?.mileage?.toString() || '',
    fipePrice: editingAd?.fipePrice || 0,
    realEstateType: editingAd?.realEstateType || '',
    area: editingAd?.area?.toString() || '',
    builtArea: editingAd?.builtArea?.toString() || '',
    bedrooms: editingAd?.bedrooms?.toString() || '',
    bathrooms: editingAd?.bathrooms?.toString() || '',
    parking: editingAd?.parking?.toString() || '',
    partType: editingAd?.partType || '',
    condition: editingAd?.condition || '',
    images: editingAd?.images && editingAd.images.length > 0 ? editingAd.images : (editingAd?.image ? [editingAd.image] : [] as string[]),
    features: editingAd?.features || [] as string[],
    additionalInfo: editingAd?.additionalInfo || [] as string[],
    description: editingAd?.description || '',
    price: editingAd?.price || 0,
    acceptsTrade: false,
    cep: editingAd?.location ? '' : (user.cep || ''),
    location: editingAd?.location || user.location || '',
    phone: user.phone || '',
    boostPlan: (editingAd?.boostPlan || '') as string
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Removido useEffect de pulo de etapa (agora feito na inicialização)

  useEffect(() => {
    const isPaidAd = editingAd; // Logic simplified, if editing, we skip boost selection if already set, or allow edit?
    // For now, if editing, we might want to allow changing details but boost is handled separately or maintained
  }, [step, editingAd]);

  useEffect(() => {
    if (formData.category === 'veiculos' && step === CreateStep.SPECS) {
      loadBrands();
    }
  }, [formData.category, step]);

  const loadBrands = async () => {
    setIsLoadingBrands(true);
    const brands = await fipeApi.getBrands();
    setFipeBrands(brands);
    setIsLoadingBrands(false);
  };

  const handleBrandChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const brandId = e.target.value;
    const brandName = e.target.options[e.target.selectedIndex].text;
    setSelectedBrandId(brandId);
    setFormData(prev => ({ ...prev, brandName, modelName: '', year: '', fipePrice: 0 }));
    setSelectedBaseModel('');
    setSelectedModelId('');
    setSelectedYearId('');
    setFipeModels([]);
    setFipeYears([]);
    if (brandId) {
      setIsLoadingModels(true);
      const models = await fipeApi.getModels(brandId);
      setFipeModels(models);
      setIsLoadingModels(false);
    }
  };

  const handleBaseModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const baseModel = e.target.value;
    setSelectedBaseModel(baseModel);
    setSelectedModelId('');
    setSelectedYearId('');
    setFipeYears([]);
    setFormData(prev => ({ ...prev, modelName: '', year: '', fipePrice: 0 }));
  };

  const handleVersionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const modelId = e.target.value;
    const modelName = e.target.options[e.target.selectedIndex].text;
    setSelectedModelId(modelId);
    setFormData(prev => ({ ...prev, modelName, year: '', fipePrice: 0 }));
    setSelectedYearId('');
    setFipeYears([]);
    if (modelId) {
      setIsLoadingYears(true);
      const years = await fipeApi.getYears(selectedBrandId, modelId);
      setFipeYears(years);
      setIsLoadingYears(false);
    }
  };

  const uniqueBaseModels = useMemo(() => {
    if (fipeModels.length === 0) return [];
    const baseNames = fipeModels.map(m => m.nome.split(' ')[0]);
    return Array.from(new Set(baseNames)).sort();
  }, [fipeModels]);

  const availableVersions = useMemo(() => {
    if (!selectedBaseModel) return [];
    return fipeModels.filter(m => m.nome.split(' ')[0] === selectedBaseModel);
  }, [fipeModels, selectedBaseModel]);

  const handleYearChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const yearId = e.target.value;
    setSelectedYearId(yearId);
    if (yearId) {
      setIsLoadingDetail(true);
      const detail = await fipeApi.getDetail(selectedBrandId, selectedModelId, yearId);
      setIsLoadingDetail(false);
      if (detail) {
        const priceNum = parseFloat(detail.Valor.replace('R$ ', '').replace('.', '').replace(',', '.'));
        setFormData(prev => ({
          ...prev,
          year: detail.AnoModelo.toString(),
          fuel: detail.Combustivel,
          fipePrice: priceNum,
          price: 0,
          vehicleType: `${prev.brandName} ${prev.modelName}`,
          description: `${prev.brandName} ${prev.modelName} ${detail.AnoModelo} - ${detail.Combustivel}.\n\n` + prev.description
        }));
      }
    }
  };

  useEffect(() => {
    if (step === CreateStep.SUCCESS) {
      const adTitle = formData.category === 'veiculos' ? formData.vehicleType : (formData.realEstateType || 'Anúncio');
      setAdTitle(adTitle);

      const dataString = `${APP_URL}/ad/view?title=${encodeURIComponent(adTitle)}&price=${formData.price}&cat=${formData.category}`;
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(dataString)}&color=004AAD&bgcolor=ffffff&margin=10`;
      setQrCodeUrl(url);
    }
  }, [step, formData]);

  const goToStep = (newStep: CreateStep) => {
    setHistory(prev => [...prev, newStep]);
    setStep(newStep);
  };

  const goBack = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      const previousStep = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      setStep(previousStep);
    } else {
      onBack();
    }
  };

  const nextStep = () => {
    let next: CreateStep;
    switch (step) {
      case CreateStep.CATEGORY:
        if (formData.category === 'veiculos') next = CreateStep.VEHICLE_TYPE;
        else if (formData.category === 'imoveis') next = CreateStep.REAL_ESTATE_TYPE;
        else if (formData.category === 'servicos') next = CreateStep.PARTS_TYPE;
        else next = CreateStep.CATEGORY;
        break;
      case CreateStep.VEHICLE_TYPE: next = CreateStep.PHOTOS; break;
      case CreateStep.REAL_ESTATE_TYPE:
        if (!formData.realEstateType) return;
        next = CreateStep.PHOTOS;
        break;
      case CreateStep.PARTS_TYPE:
        if (!formData.partType) return;
        if (formData.partType === 'Serviços Automotivos' || formData.partType === 'Limpeza e Estética') {
          next = CreateStep.PHOTOS;
        } else {
          next = CreateStep.PARTS_CONDITION;
        }
        break;
      case CreateStep.PARTS_CONDITION:
        if (!formData.condition) return;
        next = CreateStep.PHOTOS;
        break;
      case CreateStep.PHOTOS:
        if (formData.category === 'veiculos') next = CreateStep.PLATE;
        else if (formData.category === 'imoveis') next = CreateStep.REAL_ESTATE_SPECS;
        else if (formData.category === 'servicos') next = CreateStep.DESCRIPTION;
        else next = CreateStep.DESCRIPTION;
        break;
      case CreateStep.PLATE: next = CreateStep.SPECS; break;
      case CreateStep.SPECS: next = CreateStep.INFO; break;
      case CreateStep.INFO: next = CreateStep.FEATURES; break;
      case CreateStep.FEATURES: next = CreateStep.ADDITIONAL_INFO; break;
      case CreateStep.ADDITIONAL_INFO: next = CreateStep.TITLE; break;
      case CreateStep.REAL_ESTATE_SPECS: next = CreateStep.REAL_ESTATE_FEATURES; break;
      case CreateStep.REAL_ESTATE_FEATURES: next = CreateStep.TITLE; break;
      case CreateStep.TITLE: next = CreateStep.DESCRIPTION; break;
      case CreateStep.DESCRIPTION: next = CreateStep.PRICE; break;
      case CreateStep.PRICE: next = CreateStep.CONTACT; break;
      case CreateStep.CONTACT:
        // Se já está editando e tem plano, vai para sucesso direto, senão para BOOST
        const isPaidAd = editingAd && (
          (editingAd.boostPlan && editingAd.boostPlan !== 'gratis') ||
          (editingAd.isFeatured && (!editingAd.boostPlan || editingAd.boostPlan !== 'gratis'))
        );
        if (isPaidAd) {
          next = CreateStep.SUCCESS;
        } else {
          next = CreateStep.BOOST;
        }
        break;
      case CreateStep.BOOST:
        // Sempre chama handleCreateAd() para garantir que o anúncio seja criado no banco
        // independente de ser grátis ou pago.
        handleCreateAd();
        break;
      // REMOVED LEGACY PAYMENT STEPS
      case CreateStep.SUCCESS: return;
      default: next = CreateStep.CATEGORY;
    }
    goToStep(next);
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          if (scaleSize < 1) { canvas.width = MAX_WIDTH; canvas.height = img.height * scaleSize; }
          else { canvas.width = img.width; canvas.height = img.height; }
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const currentCount = formData.images.length;
      const remainingSlots = 20 - currentCount;
      if (remainingSlots <= 0) { alert("Limite máximo de fotos atingido."); return; }
      setIsUploading(true);
      const filesArray = Array.from(files) as File[];
      const validFiles = filesArray.filter(file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type));
      const filesToProcess = validFiles.slice(0, remainingSlots);
      try {
        const imagePromises = filesToProcess.map(file => compressImage(file));
        const newImages = await Promise.all(imagePromises);
        await new Promise(resolve => setTimeout(resolve, 800));
        setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
      } catch (error) { console.error("Error processing images", error); alert("Erro ao carregar imagens."); }
      finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, index) => index !== indexToRemove) }));
  };

  const handleSetCover = (index: number) => {
    if (index === 0) return;
    setFormData(prev => {
      const newImages = [...prev.images];
      const itemToMove = newImages[index];
      newImages.splice(index, 1);
      newImages.unshift(itemToMove);
      return { ...prev, images: newImages };
    });
  };

  const toggleFeature = (feature: string) => {
    setFormData(prev => {
      const exists = prev.features.includes(feature);
      return { ...prev, features: exists ? prev.features.filter(f => f !== feature) : [...prev.features, feature] };
    });
  };

  const toggleAdditionalInfo = (info: string) => {
    setFormData(prev => {
      const exists = prev.additionalInfo.includes(info);
      return { ...prev, additionalInfo: exists ? prev.additionalInfo.filter(i => i !== info) : [...prev.additionalInfo, info] };
    });
  };

  const formatMileageInput = (value: string) => {
    const rawValue = value.replace(/\D/g, '');
    if (!rawValue) return '';
    return Number(rawValue).toLocaleString('pt-BR');
  };

  const parseFormattedValue = (val: string) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(val.replace(/\./g, '').replace(',', '.'));
  };

  const calculateBoostConfig = (planId: string): AdBoostConfig | undefined => {
    if (planId === 'gratis' || !planId) return undefined;

    // Se estiver editando e o plano não mudou, mantém a config (exceto se for upgrade, mas aqui assumimos create)
    if (editingAd && editingAd.boostConfig && editingAd.boostPlan === planId) {
      return editingAd.boostConfig;
    }

    const selectedPlan = dbPlans.find(p => p.id === planId);
    if (!selectedPlan) return undefined; // Should not happen if logic is correct

    const now = new Date();
    const daysToAdd = selectedPlan.duration_days;
    // Bumps logic could be improved with data from DB (e.g. metadata column), mostly relying on priority_level for defaults
    // Assuming defaults based on plan names or priority for now to keep compatibility
    let totalBumps = 3;
    let bumpIntervalDays = 2;

    const lowerName = selectedPlan.name.toLowerCase();
    if (lowerName === 'topo' || selectedPlan.priority_level >= 3) {
      totalBumps = 10;
      bumpIntervalDays = 3;
    } else if (lowerName === 'premium' || selectedPlan.priority_level === 2) {
      totalBumps = 5;
      bumpIntervalDays = 3;
    }

    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + daysToAdd);
    const nextBump = new Date(now);
    nextBump.setDate(nextBump.getDate() + bumpIntervalDays);
    return {
      startDate: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      totalBumps: totalBumps,
      bumpsRemaining: totalBumps,
      nextBumpDate: nextBump.toISOString()
    };
  };

  const handleCreateAd = async () => {
    // PREPARE DATA
    let title = formData.title || editingAd?.title || 'Anúncio';
    if (!title || title.trim() === '') {
      if (formData.category === 'veiculos') { title = `${formData.brandName} ${formData.modelName} ${formData.year || ''}`.trim() || formData.vehicleType; }
      else if (formData.category === 'imoveis') { title = `${formData.realEstateType || 'Imóvel'} - ${formData.area}m²`; }
      else if (formData.category === 'servicos') { title = `${formData.partType || 'Peça/Serviço'} ${formData.condition ? `(${formData.condition})` : ''}`; }
    }
    if (!title || title.trim() === '') title = 'Anúncio sem título';

    const boostConfig = calculateBoostConfig(formData.boostPlan);
    const adData = {
      title,
      price: (formData.price && formData.price > 0) ? formData.price : null,
      fipePrice: formData.fipePrice,
      location: formData.location || "Localização não informada",
      image: formData.images[0] || "https://placehold.co/400",
      images: formData.images,
      features: formData.features,
      description: formData.description,
      status: AdStatus.PENDING,
      category: formData.category as any,
      vehicleType: formData.vehicleType || `${formData.brandName} ${formData.modelName}`,
      plate: formData.plate,
      year: Number(formData.year),
      fuel: formData.fuel,
      gearbox: formData.gearbox,
      mileage: Number(formData.mileage),
      engine: formData.engine,
      realEstateType: formData.realEstateType,
      area: parseFormattedValue(formData.area),
      builtArea: parseFormattedValue(formData.builtArea),
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      parking: Number(formData.parking),
      partType: formData.partType,
      condition: formData.condition,
      additionalInfo: formData.additionalInfo,
      boostPlan: formData.boostPlan,
      isFeatured: formData.boostPlan !== 'gratis' && formData.boostPlan !== '',
      boostConfig: boostConfig
    };

    // IF EDITING, JUST FINISH (Legacy/Simplification)
    if (editingAd) {
      onFinish(adData);
      return;
    }

    setIsCreating(true);

    try {
      // 1. CREATE AD IMMEDIATELY
      const newAd = await api.createAd(adData as any);
      setCreatedAd(newAd);

      // 2. CHECK PLAN TYPE
      if (formData.boostPlan && formData.boostPlan !== 'gratis') {
        // PAID PLAN: Open Modal for immediate payment
        setShowHighlightModal(true);
      } else {
        // FREE PLAN: Show Success screen inside CreateAd
        // The Success screen has a button that calls onFinish(adData, newAd)
        goToStep(CreateStep.SUCCESS);
      }

    } catch (error: any) {
      console.error("Error creating ad:", error);
      if (error.message?.includes('Limit Exceeded')) {
        alert("LIMITE ATINGIDO: Você atingiu o limite de 3 anúncios gratuitos.");
      } else {
        alert("Erro ao criar anúncio. Tente novamente.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const onHighlightClose = () => {
    // User closed modal without paying (or finished paying and closed)
    // If payment wasn't confirmed inside modal (handled via onSuccess), 
    // we assume they gave up on paying BUT ad is created.
    // Navigate to MyAds/Success as "Free Ad" (Pending).
    setShowHighlightModal(false);

    if (createdAd) {
      // Pass createdAd so it's added to list but not re-created
      // Logic: "O pagamento não foi concluído. Seu anúncio foi publicado gratuitamente."
      // We can show a toast here or rely on the one in useAppActions
      alert("O pagamento não foi concluído/detectado. Seu anúncio foi publicado gratuitamente e pode ser destacado depois em 'Meus Anúncios'.");
      onFinish({}, createdAd);
    }
  };

  const onHighlightSuccess = () => {
    // Payment confirmed!
    setShowHighlightModal(false);
    if (createdAd) {
      // Just to be sure, update local object status if needed, 
      // but backend handles 'highlighted' status.
      // Note: createAd returns PENDING. Payment success makes it FEATURED/ACTIVE?
      // The modal handles the 'ad_highlights' insert. 
      // We just proceed.
      onFinish({}, createdAd);
    }
  };

  const renderRealEstateType = () => (
    <StepContainer title="Tipo de Imóvel" progress={0.1} onNext={nextStep} nextDisabled={!formData.realEstateType} onBack={goBack}>
      <div className="flex flex-col gap-4">
        {["Apartamento", "Casa", "Terreno", "Comercial", "Rural"].map(type => (
          <button key={type} onClick={() => { setFormData(p => ({ ...p, realEstateType: type })); nextStep(); }} className={`flex items-center gap-4 p-5 border shadow-sm rounded-2xl transition-all active:scale-[0.99] ${formData.realEstateType === type ? 'border-primary bg-blue-50/30' : 'bg-white border-gray-100 hover:border-primary hover:shadow-md'}`}>
            <div className={`p-3 rounded-xl ${formData.realEstateType === type ? 'bg-primary text-white' : 'bg-purple-50 text-purple-600'}`}><Home className="w-6 h-6" /></div>
            <span className={`font-bold text-lg flex-1 text-left ${formData.realEstateType === type ? 'text-gray-900' : 'text-gray-800'}`}>{type}</span>
            <ChevronLeft className={`w-5 h-5 rotate-180 ${formData.realEstateType === type ? 'text-primary' : 'text-gray-300'}`} />
          </button>
        ))}
      </div>
    </StepContainer>
  );

  const renderRealEstateSpecs = () => {
    const canProceed = !!formData.area && !!formData.bedrooms && !!formData.bathrooms && !!formData.parking;

    return (
      <StepContainer title="Detalhes do Imóvel" progress={0.5} onNext={nextStep} nextDisabled={!canProceed} onBack={goBack}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Área Total (m²)</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={formatMileageInput(formData.area)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setFormData(p => ({ ...p, area: raw }));
                }}
                className="w-full border border-gray-200 bg-gray-50 rounded-2xl p-4 focus:border-primary outline-none"
                placeholder="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">m²</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Quartos</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setFormData(p => ({ ...p, bedrooms: n.toString() }))} className={`flex-1 py-3 rounded-xl font-bold border transition-all ${formData.bedrooms === n.toString() ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{n}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Banheiros</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(n => (
                <button key={n} onClick={() => setFormData(p => ({ ...p, bathrooms: n.toString() }))} className={`flex-1 py-3 rounded-xl font-bold border transition-all ${formData.bathrooms === n.toString() ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{n}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Vagas</label>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map(n => (
                <button key={n} onClick={() => setFormData(p => ({ ...p, parking: n.toString() }))} className={`flex-1 py-3 rounded-xl font-bold border transition-all ${formData.parking === n.toString() ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{n}</button>
              ))}
            </div>
          </div>
        </div>
      </StepContainer>
    );
  };

  const renderRealEstateFeatures = () => (
    <StepContainer title="Comodidades" progress={0.6} onNext={nextStep} onBack={goBack}>
      <div className="flex flex-wrap gap-2">
        {["Piscina", "Churrasqueira", "Academia", "Elevador", "Portaria 24h", "Varanda", "Armários", "Ar Condicionado", "Jardim"].map(f => (
          <button key={f} onClick={() => toggleFeature(f)} className={`px-4 py-2.5 rounded-2xl border text-sm font-medium transition-all ${formData.features.includes(f) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'}`}>{f}</button>
        ))}
      </div>
    </StepContainer>
  );

  const renderPartsType = () => (
    <StepContainer title="Categoria da Peça/Serviço" progress={0.1} onNext={nextStep} nextDisabled={!formData.partType} onBack={goBack}>
      <div className="flex flex-col gap-4">
        {["Peças Mecânicas", "Som e Vídeo", "Acessórios", "Pneus e Rodas", "Serviços Automotivos", "Limpeza e Estética"].map(type => (
          <button key={type} onClick={() => { setFormData(p => ({ ...p, partType: type })); nextStep(); }} className={`flex items-center gap-4 p-5 border shadow-sm rounded-2xl transition-all active:scale-[0.99] ${formData.partType === type ? 'border-primary bg-blue-50/30' : 'bg-white border-gray-100 hover:border-primary hover:shadow-md'}`}>
            <div className={`p-3 rounded-xl ${formData.partType === type ? 'bg-primary text-white' : 'bg-orange-50 text-orange-600'}`}><Wrench className="w-6 h-6" /></div>
            <span className={`font-bold text-lg flex-1 text-left ${formData.partType === type ? 'text-gray-900' : 'text-gray-800'}`}>{type}</span>
            <ChevronLeft className={`w-5 h-5 rotate-180 ${formData.partType === type ? 'text-primary' : 'text-gray-300'}`} />
          </button>
        ))}
      </div>
    </StepContainer>
  );

  const renderPartsCondition = () => (
    <StepContainer title="Condição" progress={0.2} onNext={nextStep} nextDisabled={!formData.condition} onBack={goBack}>
      <div className="flex flex-col gap-4">
        {["Novo", "Usado"].map(cond => (
          <button key={cond} onClick={() => { setFormData(p => ({ ...p, condition: cond })); nextStep(); }} className={`flex items-center gap-4 p-5 border shadow-sm rounded-2xl transition-all active:scale-[0.99] ${formData.condition === cond ? 'border-primary bg-blue-50/30' : 'bg-white border-gray-100 hover:border-primary hover:shadow-md'}`}>
            <div className={`p-3 rounded-xl ${formData.condition === cond ? 'bg-primary text-white' : 'bg-gray-50 text-gray-600'}`}><Package className="w-6 h-6" /></div>
            <span className={`font-bold text-lg flex-1 text-left ${formData.condition === cond ? 'text-gray-900' : 'text-gray-800'}`}>{cond}</span>
            <ChevronLeft className={`w-5 h-5 rotate-180 ${formData.condition === cond ? 'text-primary' : 'text-gray-300'}`} />
          </button>
        ))}
      </div>
    </StepContainer>
  );

  const renderCategory = () => (<StepContainer title="Categoria" progress={0.05} onNext={nextStep} nextDisabled={!formData.category} onBack={goBack}><h1 className="text-2xl font-bold text-gray-900 leading-tight mb-6">O que você vai anunciar?</h1><div className="flex flex-col gap-4">{[{ id: 'veiculos', label: 'Veículos', icon: <Car className="w-6 h-6" />, desc: 'Carros, motos e caminhões' }, { id: 'imoveis', label: 'Imóveis', icon: <Home className="w-6 h-6" />, desc: 'Casas, apartamentos, terrenos' }, { id: 'servicos', label: 'Peças e Serviços', icon: <Wrench className="w-6 h-6" />, desc: 'Peças, som e serviços automotivos' }].map((cat) => (<button key={cat.id} onClick={() => setFormData(p => ({ ...p, category: cat.id }))} className={`flex items-center gap-4 p-5 border-2 rounded-2xl transition-all text-left group active:scale-[0.99] ${formData.category === cat.id ? 'border-primary bg-blue-50/50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'}`}><div className={`p-3 rounded-xl transition-colors ${formData.category === cat.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-primary'}`}>{cat.icon}</div><div className="flex-1"><span className={`font-bold text-lg block ${formData.category === cat.id ? 'text-gray-900' : 'text-gray-700'}`}>{cat.label}</span><span className="text-sm text-gray-400 font-medium">{cat.desc}</span></div><div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.category === cat.id ? 'border-primary' : 'border-gray-200'}`}>{formData.category === cat.id && <div className="w-3 h-3 bg-primary rounded-full" />}</div></button>))}</div></StepContainer>);

  const renderPhotos = () => (
    <StepContainer title="Fotos" progress={0.3} onNext={nextStep} nextDisabled={formData.images.length === 0} onBack={goBack}>
      {formData.images.length === 0 ? (
        <div onClick={() => !isUploading && fileInputRef.current?.click()} className={`border-2 border-dashed border-gray-300 bg-gray-50 rounded-3xl h-64 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-primary transition-all group ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {isUploading ? (<div className="flex flex-col items-center animate-in zoom-in"><Loader2 className="w-12 h-12 text-primary animate-spin mb-4" /><p className="text-gray-500 font-bold">Processando imagens...</p></div>) : (<><div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Camera className="w-8 h-8 text-primary" /></div><h3 className="font-bold text-gray-900 text-lg mb-1">Adicionar Fotos</h3><p className="text-gray-500 text-sm">Toque para enviar</p></>)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-4 animate-in fade-in">
          <button onClick={() => fileInputRef.current?.click()} className="aspect-square bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 hover:bg-gray-100 hover:border-primary transition-all group" disabled={isUploading}>{isUploading ? (<Loader2 className="w-6 h-6 text-primary animate-spin" />) : (<Plus className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors" />)}</button>
          {formData.images.map((img, index) => (
            <div key={index} className="aspect-square relative rounded-xl overflow-hidden group border border-gray-100 shadow-sm bg-white">
              <img src={img} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
              {index === 0 && (<div className="absolute top-0 left-0 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-br-lg shadow-sm z-10">Capa</div>)}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2"><button onClick={(e) => { e.stopPropagation(); removeImage(index); }} className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"><Trash2 className="w-4 h-4" /></button>{index !== 0 && (<button onClick={(e) => { e.stopPropagation(); handleSetCover(index); }} className="px-2 py-1 bg-white text-primary text-[10px] font-bold rounded-md hover:bg-gray-100 transition-colors shadow-sm">Capa</button>)}</div>
            </div>
          ))}
        </div>
      )}
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" multiple accept="image/jpeg, image/png, image/webp" />
      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3"><div className="bg-white p-1.5 rounded-full shadow-sm"><Camera className="w-4 h-4 text-primary" /></div><p className="text-xs text-blue-800 leading-tight flex-1"><strong>Dica:</strong> Boas fotos aumentam em 3x as chances de venda. Use luz natural.</p><span className="text-xs font-bold text-blue-400">{formData.images.length}/20</span></div>
    </StepContainer>
  );

  const renderVehicleType = () => (<StepContainer title="Tipo de Veículo" progress={0.1} onNext={nextStep} onBack={goBack}><div className="flex flex-col gap-4">{[{ id: 'Passeio', label: 'Carro de Passeio', icon: <Car className="w-6 h-6" /> }, { id: 'Moto', label: 'Motocicleta', icon: <Bike className="w-6 h-6" /> }, { id: 'Caminhão', label: 'Caminhão / Ônibus', icon: <Truck className="w-6 h-6" /> }].map((type) => (<button key={type.id} onClick={() => { setFormData(p => ({ ...p, vehicleType: type.id })); nextStep(); }} className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-primary hover:shadow-md transition-all active:scale-[0.99]"><div className="p-3 bg-blue-50 text-primary rounded-xl">{type.icon}</div><span className="font-bold text-gray-800 text-lg flex-1 text-left">{type.label}</span><ChevronLeft className="w-5 h-5 text-gray-300 rotate-180" /></button>))}</div></StepContainer>);

  const renderPlate = () => (
    <StepContainer title="Placa (Opcional)" progress={0.4} onNext={nextStep} onBack={goBack} nextDisabled={formData.plate.length > 0 && formData.plate.length < 7}>
      <div className="relative mb-8"><input type="text" value={formData.plate} onChange={(e) => setFormData(p => ({ ...p, plate: e.target.value.toUpperCase() }))} placeholder="ABC1D23" className="w-full border-2 border-gray-200 rounded-2xl px-4 py-6 text-center text-4xl font-bold tracking-widest uppercase focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" maxLength={7} /></div><div className="flex items-center gap-3 mb-8 cursor-pointer p-4 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all" onClick={() => setFormData(p => ({ ...p, isZeroKm: !p.isZeroKm }))}><div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${formData.isZeroKm ? 'bg-primary border-primary' : 'border-gray-300'}`}>{formData.isZeroKm && <div className="w-2.5 h-2.5 bg-white rounded-full" />}</div><span className="text-gray-900 font-medium">Veículo 0km (Sem placa)</span></div>
      {!formData.plate && !formData.isZeroKm && (
        <p className="text-center text-gray-500 text-sm animate-pulse">Você pode pular esta etapa clicando em Continuar</p>
      )}
    </StepContainer>
  );

  const renderSpecs = () => {
    const isFipeSelected = (!!selectedYearId || !!editingAd);
    const areDetailsSelected = !!formData.color && !!formData.gearbox;
    const canProceed = isFipeSelected && areDetailsSelected;
    return (
      <StepContainer title="Dados do Veículo" progress={0.5} onNext={nextStep} nextDisabled={!canProceed} onBack={goBack}>
        <div className="space-y-6"><div><label className="block text-sm font-bold text-gray-700 mb-2">Marca</label><div className="relative"><select value={selectedBrandId} onChange={handleBrandChange} disabled={isLoadingBrands} className="w-full border border-gray-200 bg-gray-50 rounded-2xl p-4 focus:border-primary focus:bg-white outline-none transition-all appearance-none disabled:opacity-50"><option value="">{editingAd ? formData.brandName || "Marca Original" : "Selecione a marca"}</option>{fipeBrands.map(b => (<option key={b.codigo} value={b.codigo}>{b.nome}</option>))}</select>{isLoadingBrands && (<div className="absolute right-4 top-4"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>)}</div></div><div><label className="block text-sm font-bold text-gray-700 mb-2">Família do Carro</label><div className="relative"><select value={selectedBaseModel} onChange={handleBaseModelChange} disabled={!selectedBrandId || isLoadingModels} className="w-full border border-gray-200 bg-gray-50 rounded-2xl p-4 focus:border-primary focus:bg-white outline-none transition-all appearance-none disabled:opacity-50"><option value="">{editingAd ? "Modelo Original" : "Selecione a família"}</option>{uniqueBaseModels.map(name => (<option key={name} value={name}>{name}</option>))}</select>{isLoadingModels && (<div className="absolute right-4 top-4"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>)}</div></div>{selectedBaseModel && (<div className="animate-in slide-in-from-top-2"><label className="block text-sm font-bold text-gray-700 mb-2">Versão Específica</label><div className="relative"><select value={selectedModelId} onChange={handleVersionChange} disabled={!selectedBaseModel} className="w-full border border-gray-200 bg-gray-50 rounded-2xl p-4 focus:border-primary focus:bg-white outline-none transition-all appearance-none disabled:opacity-50"><option value="">Selecione a versão</option>{availableVersions.map(m => (<option key={m.codigo} value={m.codigo}>{m.nome}</option>))}</select></div></div>)}{selectedModelId && (<div className="animate-in slide-in-from-top-2"><label className="block text-sm font-bold text-gray-700 mb-2">Ano</label><div className="relative"><select value={selectedYearId} onChange={handleYearChange} disabled={!selectedModelId || isLoadingYears} className="w-full border border-gray-200 bg-gray-50 rounded-2xl p-4 focus:border-primary focus:bg-white outline-none transition-all appearance-none disabled:opacity-50"><option value="">Selecione o ano</option>{fipeYears.map(y => (<option key={y.codigo} value={y.codigo}>{y.nome}</option>))}</select>{isLoadingYears && (<div className="absolute right-4 top-4"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>)}</div></div>)}{isLoadingDetail && (<div className="flex justify-center py-4 text-primary font-bold gap-2 items-center"><Loader2 className="w-5 h-5 animate-spin" /> Buscando detalhes...</div>)}{(formData.fipePrice > 0 || editingAd) && !isLoadingDetail && (<div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 animate-in fade-in"><div className="col-span-1"><label className="block text-sm font-bold text-gray-700 mb-2">Cor *</label><select value={formData.color} onChange={(e) => setFormData(p => ({ ...p, color: e.target.value }))} className="w-full border border-gray-200 bg-gray-50 rounded-2xl p-4 focus:border-primary focus:bg-white outline-none transition-all appearance-none"><option value="">Selecione</option><option value="Branco">Branco</option><option value="Preto">Preto</option><option value="Prata">Prata</option><option value="Cinza">Cinza</option><option value="Vermelho">Vermelho</option><option value="Azul">Azul</option><option value="Verde">Verde</option><option value="Amarelo">Amarelo</option><option value="Marrom">Marrom</option><option value="Bege">Bege</option><option value="Outros">Outros</option></select></div><div className="col-span-1"><label className="block text-sm font-bold text-gray-700 mb-2">Câmbio *</label><select value={formData.gearbox} onChange={(e) => setFormData(p => ({ ...p, gearbox: e.target.value }))} className="w-full border border-gray-200 bg-gray-50 rounded-2xl p-4 focus:border-primary focus:bg-white outline-none transition-all"><option value="">Selecione</option><option value="Manual">Manual</option><option value="Automático">Automático</option></select></div></div>)}</div>
      </StepContainer>
    );
  };

  const renderInfo = () => (
    <StepContainer title="Quilometragem" progress={0.6} onNext={nextStep} onBack={goBack} nextDisabled={!formData.mileage || formData.mileage === ''}>
      <div className="bg-gray-50 p-6 rounded-3xl mb-6 text-center border border-gray-100"><h2 className="text-xl font-bold text-gray-900 mb-4">Qual a KM atual?</h2><div className="relative inline-block w-full"><input type="text" inputMode="numeric" value={formatMileageInput(formData.mileage.toString())} onChange={(e) => { const raw = e.target.value.replace(/\D/g, ''); if (raw.length > 7) return; setFormData(p => ({ ...p, mileage: raw })); }} className="w-full text-center text-4xl font-bold bg-transparent border-b-2 border-gray-300 focus:border-primary outline-none py-2 text-gray-900 placeholder-gray-300" placeholder="0" /><span className="block text-sm font-bold text-gray-400 mt-2">KM</span></div></div>
    </StepContainer>
  );

  const renderFeatures = () => (<StepContainer title="Opcionais" progress={0.7} onNext={nextStep} onBack={goBack}><p className="text-gray-500 mb-6">Selecione o que seu veículo tem de bom.</p><div className="flex flex-wrap gap-2">{["Airbag", "Ar condicionado", "Alarme", "Bancos de couro", "Câmera de ré", "Sensor de ré", "Som", "Teto solar", "Vidro elétrico", "Trava elétrica"].map(feature => (<button key={feature} onClick={() => toggleFeature(feature)} className={`px-4 py-2.5 rounded-2xl border text-sm font-medium transition-all duration-200 ${formData.features.includes(feature) ? 'bg-primary text-white border-primary shadow-lg shadow-blue-100 transform scale-105' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{feature}</button>))}</div></StepContainer>);
  const renderAdditionalInfo = () => (<StepContainer title="Infos Adicionais" progress={0.8} onNext={nextStep} onBack={goBack}><div className="flex flex-col gap-3">{["Único dono", "IPVA pago", "Licenciado", "Todas as revisões feitas", "Na garantia de fábrica", "Aceita troca"].map(item => (<button key={item} onClick={() => toggleAdditionalInfo(item)} className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${formData.additionalInfo.includes(item) ? 'bg-blue-50 border-primary shadow-sm' : 'bg-white border-gray-100 hover:border-gray-300'}`}><span className={`font-medium ${formData.additionalInfo.includes(item) ? 'text-primary font-bold' : 'text-gray-700'}`}>{item}</span>{formData.additionalInfo.includes(item) && <CheckCircle className="w-5 h-5 text-primary" />}</button>))}</div></StepContainer>);
  const renderTitle = () => {
    const wordCount = formData.title.trim() ? formData.title.trim().split(/\s+/).length : 0;
    const charCount = formData.title.length;
    const isExceeded = charCount > 40 || wordCount > 10;
    const isEmpty = charCount === 0;
    const canContinue = !isEmpty && !isExceeded;

    // Categorized titles
    const placeholder = formData.category === 'imoveis'
      ? "Ex: Casa em Condomínio com 3 Quartos"
      : formData.category === 'veiculos'
        ? "Ex: Honda Civic 2020 Impecável"
        : "Ex: Pneu Aro 17 Novo Michelin";

    const suggestion = formData.category === 'imoveis'
      ? "Use o tipo de imóvel, localização e um diferencial (Ex: Vista para o Mar, Reformado)."
      : formData.category === 'veiculos'
        ? "Use a marca, modelo e um diferencial (Ex: Único Dono, Completo)."
        : "Use o nome da peça ou serviço e o estado (Ex: Na Garantia, Original).";

    return (
      <StepContainer
        title="Título do Anúncio"
        progress={0.82}
        onNext={nextStep}
        nextDisabled={!canContinue}
        onBack={goBack}
      >
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 leading-tight">Dê um nome para o seu anúncio</h2>
          <p className="text-sm text-gray-500 font-medium">Um bom título ajuda compradores a encontrarem seu anúncio mais rápido.</p>

          <div className="relative">
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
              placeholder={placeholder}
              className={`w-full border-2 rounded-2xl px-5 py-4 text-xl font-bold focus:ring-4 outline-none transition-all ${isExceeded ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-primary focus:ring-primary/10'
                }`}
            />

            <div className="flex justify-between mt-2 px-1">
              <div className="flex gap-4">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${charCount > 40 ? 'text-red-500' : 'text-gray-400'}`}>
                  {charCount}/40 caracteres
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${wordCount > 10 ? 'text-red-500' : 'text-gray-400'}`}>
                  {wordCount}/10 palavras
                </span>
              </div>
              {isExceeded && (
                <span className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Limite excedido
                </span>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-full shadow-sm">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-blue-800 leading-tight flex-1">
              <strong>Sugestão:</strong> {suggestion}
            </p>
          </div>
        </div>
      </StepContainer>
    );
  };

  const renderDescription = () => {
    const wordCount = formData.description.trim() ? formData.description.trim().split(/\s+/).length : 0;
    const charCount = formData.description.length;
    const isExceeded = charCount > 500 || wordCount > 200;
    const canContinue = charCount >= 5 && !isExceeded;

    const descriptionPlaceholder = formData.category === 'imoveis'
      ? "Ex: Apartamento reformado, ventilado, com vista livre, armários embutidos e ótima localização..."
      : formData.category === 'veiculos'
        ? "Ex: Carro em perfeito estado, revisado recentemente, único dono e com manual..."
        : "Ex: Peça original, sem uso, na embalagem de fábrica e com garantia...";

    return (
      <StepContainer
        title="Descrição"
        progress={0.88}
        onNext={nextStep}
        nextDisabled={!canContinue}
        onBack={goBack}
      >
        <div className="space-y-4">
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
            className={`w-full h-64 border-2 bg-gray-50 rounded-2xl p-5 focus:bg-white focus:ring-4 outline-none resize-none text-gray-800 text-lg leading-relaxed shadow-inner transition-all ${isExceeded ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-primary focus:ring-primary/10'
              }`}
            placeholder={descriptionPlaceholder}
          />
          <div className="flex justify-between items-center px-1">
            <div className="flex gap-4">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${charCount > 500 ? 'text-red-500' : 'text-gray-400'}`}>
                {charCount}/500 caracteres
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${wordCount > 200 ? 'text-red-500' : 'text-gray-400'}`}>
                {wordCount}/200 palavras
              </span>
            </div>
            {isExceeded && (
              <span className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Limite excedido
              </span>
            )}
          </div>
        </div>
      </StepContainer>
    );
  };

  const renderPrice = () => {
    let fipeComparison = null;
    if (formData.fipePrice > 0) {
      const diff = formData.price - formData.fipePrice;
      const percentage = formData.fipePrice > 0 ? Math.abs((diff / formData.fipePrice) * 100) : 0;
      if (formData.price === 0) { } else if (diff < 0) { fipeComparison = { text: `${percentage.toFixed(1)}% abaixo da Tabela`, color: 'text-green-700', bg: 'bg-green-100', barColor: 'bg-green-500', width: `${Math.max(10, (formData.price / formData.fipePrice) * 80)}%` }; } else if (diff > 0) { fipeComparison = { text: `${percentage.toFixed(1)}% acima da Tabela`, color: 'text-orange-700', bg: 'bg-orange-100', barColor: 'bg-orange-500', width: `${Math.min(100, (formData.price / formData.fipePrice) * 80)}%` }; } else { fipeComparison = { text: `Igual à Tabela FIPE`, color: 'text-blue-700', bg: 'bg-blue-100', barColor: 'bg-blue-500', width: '80%' }; }
    }
    return (
      <StepContainer title="Preço" progress={0.9} onNext={nextStep} onBack={goBack}>
        <div className="flex flex-col items-center justify-center py-6"><p className="text-gray-500 font-medium mb-4">Quanto você quer pedir?</p><div className="relative w-full mb-8"><input type="text" inputMode="numeric" value={formData.price ? formData.price.toLocaleString('pt-BR') : ''} onChange={(e) => { const raw = e.target.value.replace(/\D/g, ''); if (raw.length > 9) return; const val = raw ? Number(raw) : 0; setFormData(p => ({ ...p, price: val })); }} placeholder="0" className="w-full text-center text-5xl font-bold text-primary bg-transparent outline-none placeholder-blue-200" /><span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-primary opacity-50">R$</span></div>{formData.fipePrice > 0 && (<div className="w-full bg-gray-50 rounded-2xl p-5 border border-gray-200 animate-in fade-in slide-in-from-bottom-2"><div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200"><div className="flex flex-col"><span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Referência FIPE</span><span className="text-xs text-gray-400 font-medium">{formData.year} • {formData.fuel}</span></div><span className="font-bold text-gray-900 text-xl">R$ {formData.fipePrice.toLocaleString('pt-BR')}</span></div>{formData.price > 0 && fipeComparison ? (<><div className={`flex items-center justify-between mb-2 text-xs font-bold ${fipeComparison.color}`}><span>Seu Preço</span><span>{fipeComparison.text}</span></div><div className="relative h-3 bg-gray-200 rounded-full overflow-hidden mb-4"><div className="absolute top-0 bottom-0 w-1 bg-gray-400 left-[80%] z-10" title="Marca FIPE"></div><div className={`h-full rounded-full transition-all duration-500 ${fipeComparison.barColor}`} style={{ width: fipeComparison.width }}></div></div><div className={`p-3 rounded-xl ${fipeComparison.bg} border border-transparent`}><p className={`text-xs text-center font-medium ${fipeComparison.color}`}>{fipeComparison.text === 'Igual à Tabela FIPE' ? 'Preço justo aumenta suas chances de venda!' : (formData.price < formData.fipePrice ? 'Preço competitivo! Alta chance de venda rápida.' : 'Acima da média. Justifique com opcionais e estado de conservação.')}</p></div></>) : (<div className="flex items-center gap-2 justify-center py-2 text-gray-400 bg-white rounded-xl border border-gray-100"><Info className="w-4 h-4" /><p className="text-xs font-medium">Digite um valor para comparar com a tabela.</p></div>)}</div>)}</div>
      </StepContainer>
    );
  };

  const renderContact = () => {
    const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 8) return;
      let formatted = value;
      if (value.length > 5) formatted = value.replace(/^(\d{5})(\d)/, '$1-$2');
      setFormData(prev => ({ ...prev, cep: formatted }));
      if (value.length === 8) {
        setIsLoadingCep(true);
        try {
          const response = await fetch(`https://viacep.com.br/ws/${value}/json/`);
          const data = await response.json();
          if (!data.erro) {
            const bairro = data.bairro || 'Centro';
            const cityState = `${data.localidade}, ${data.uf}`;
            const locationString = `${bairro} - ${cityState}`;
            setFormData(prev => ({ ...prev, location: locationString }));
            setAddressDetails({ logradouro: data.logradouro || 'Rua não informada', bairro: bairro, localidade: data.localidade, uf: data.uf });
          } else {
            alert("CEP não encontrado.");
            setFormData(prev => ({ ...prev, location: '' }));
            setAddressDetails({ logradouro: '', bairro: '', localidade: '', uf: '' });
          }
        } catch (error) { console.error("Erro ao buscar CEP", error); alert("Erro ao buscar informações do CEP."); } finally { setIsLoadingCep(false); }
      }
    };

    return (
      <StepContainer title="Localização" progress={0.95} onNext={nextStep} onBack={goBack} nextDisabled={!formData.cep || formData.cep.replace(/\D/g, '').length < 8 || !formData.location}>
        <div className="space-y-4"><div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 relative"><label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">CEP</label><div className="relative"><input type="text" value={formData.cep} onChange={handleCepChange} placeholder="00000-000" className="w-full bg-white border border-gray-200 rounded-xl p-3 font-medium text-gray-900 pr-10" inputMode="numeric" />{isLoadingCep && (<div className="absolute right-3 top-3"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>)}</div></div>{formData.location && (<div className="p-4 bg-white border border-green-100 bg-green-50/50 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-1"><div className="flex items-start gap-3 mb-3 border-b border-green-100 pb-3"><div className="bg-white p-2 rounded-full shadow-sm text-green-600"><MapPin className="w-5 h-5" /></div><div><p className="text-xs text-green-700 font-bold uppercase mb-0.5">Localização Identificada</p><span className="font-bold text-gray-900 text-lg leading-tight block">{addressDetails.localidade ? `${addressDetails.localidade}, ${addressDetails.uf}` : formData.location}</span></div></div>{addressDetails.bairro && (<div className="space-y-2">{addressDetails.logradouro && addressDetails.logradouro !== 'Rua não informada' && (<div className="flex justify-between items-center text-sm"><span className="text-gray-500 font-medium">Logradouro</span><span className="text-gray-800 font-bold truncate max-w-[180px]">{addressDetails.logradouro}</span></div>)}<div className="flex justify-between items-center text-sm"><span className="text-gray-500 font-medium">Bairro</span><span className="text-gray-800 font-bold">{addressDetails.bairro}</span></div></div>)}</div>)}{!formData.location && !isLoadingCep && formData.cep.replace(/\D/g, '').length === 8 && (<div className="p-3 bg-red-50 text-red-600 text-xs font-medium rounded-xl text-center">Localização não identificada. Verifique o CEP.</div>)}<div className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm"><div className="bg-green-50 p-2 rounded-full"><Phone className="w-5 h-5 text-green-600" /></div><div className="flex-1"><p className="text-xs text-gray-400 font-bold uppercase mb-1">Contato</p><input type="tel" placeholder="(00) 00000-0000" value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} className="w-full font-bold text-gray-800 outline-none" /></div></div></div>
      </StepContainer>
    );
  };

  const renderBoost = () => {
    // --- LÓGICA DE LIMITE VISUAL ---
    const currentYearMonth = new Date().toISOString().slice(0, 7);
    const userUsage = user.monthlyUsage || { month: currentYearMonth, count: 0 };
    const usageCount = userUsage.month === currentYearMonth ? userUsage.count : 0;
    const isFreePlan = (!user.activePlan || user.activePlan === 'free');
    const isLimitReached = isFreePlan && usageCount >= 3;
    // -------------------------------

    if (isLoadingPlans) {
      return (
        <div className="flex flex-col h-full bg-gray-50 items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-gray-500 font-bold">Carregando planos...</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full bg-gray-50 animate-slide-in-from-right">
        <div className="bg-primary pt-6 pb-8 px-6 relative -mx-2 -mt-4 shadow-md z-10">
          <div className="flex items-center gap-3 mb-2"><button onClick={goBack} className="p-1 -ml-1 hover:bg-white/10 rounded-full text-white"><ChevronLeft className="w-6 h-6" /></button><h1 className="text-lg font-bold text-white">Destaques</h1></div><h2 className="text-2xl font-bold text-white leading-tight mb-2">Aumente as suas chances de vender mais rápido!</h2>
        </div>

        {/* VISUAL CONTADOR */}
        {isFreePlan && (
          <div className={`mx-4 -mt-6 mb-4 p-4 rounded-xl shadow-sm border relative z-20 flex items-center justify-between ${isLimitReached ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wide ${isLimitReached ? 'text-red-600' : 'text-gray-500'}`}>Limite Gratuito Mensal</p>
              <p className={`text-lg font-bold ${isLimitReached ? 'text-red-700' : 'text-gray-900'}`}>{usageCount} / 3 anúncios usados</p>
            </div>
            {isLimitReached && <div className="bg-red-100 text-red-700 p-2 rounded-full"><Lock className="w-5 h-5" /></div>}
          </div>
        )}

        <div className="flex-1 overflow-y-auto no-scrollbar px-2 space-y-4 pb-24 pt-1">
          {dbPlans.map((plan) => {
            const metadata = getPlanMetadata(plan.name);
            return (
              <div key={plan.id} onClick={() => setFormData(p => ({ ...p, boostPlan: plan.id }))} className={`relative bg-white rounded-2xl p-5 border-2 transition-all cursor-pointer shadow-sm ${formData.boostPlan === plan.id ? `${metadata.color || 'border-primary'} ring-1 ring-offset-2 ring-primary/20` : 'border-gray-100 hover:border-gray-200'}`}>
                {(metadata.recommended || plan.priority_level >= 3) && (<div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-400 to-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl rounded-tr-xl shadow-sm">RECOMENDADO</div>)}
                <div className="flex justify-between items-start mb-2"><div className={`p-2 rounded-full border-2 bg-white ${metadata.color ? metadata.color.replace('border-', 'text-') : 'text-primary'}`}>{metadata.icon}</div><div className="text-right"><p className="text-2xl font-bold text-gray-900 leading-none">R$ {Number(plan.price).toFixed(2).replace('.', ',')}</p><p className="text-xs text-gray-500 mt-1">Pagamento Único</p></div></div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">
                  {plan.name}
                </h3>

                <ul className="space-y-2 mb-4">{metadata.features.map((feat, idx) => (<li key={idx} className="flex items-start gap-2 text-sm text-gray-600"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /><span className="leading-tight">{feat}</span></li>))}</ul>
                <div className={`w-full py-3 rounded-xl font-bold text-center text-sm transition-colors flex items-center justify-center gap-2 ${formData.boostPlan === plan.id ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-600'}`}>{formData.boostPlan === plan.id ? <><CheckCircle className="w-4 h-4" /> Selecionado</> : 'Selecionar'}</div>
              </div>
            );
          })}

          <button
            onClick={() => !isLimitReached && setFormData(p => ({ ...p, boostPlan: 'gratis' }))}
            disabled={isLimitReached}
            className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${isLimitReached ? 'opacity-60 grayscale cursor-not-allowed bg-gray-50 border-gray-100' : (formData.boostPlan === 'gratis' ? 'border-gray-400 bg-gray-100' : 'border-gray-200 bg-white hover:border-gray-300')}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-full text-gray-500"><Minus className="w-5 h-5" /></div>
              <div className="text-left">
                <span className="block font-bold text-gray-700">Plano Grátis</span>
                <span className="text-xs text-gray-500">{isLimitReached ? 'Limite mensal atingido' : 'Visibilidade padrão, sem destaque.'}</span>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.boostPlan === 'gratis' ? 'border-gray-500' : 'border-gray-300'}`}>{formData.boostPlan === 'gratis' && <div className="w-2.5 h-2.5 bg-gray-500 rounded-full" />}</div>
          </button>
        </div>
        <div className="sticky bottom-0 bg-white p-4 border-t z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] -mx-2"><button onClick={nextStep} disabled={formData.boostPlan === ''} className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all ${formData.boostPlan === '' ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark active:scale-[0.98]'}`}>{formData.boostPlan === 'gratis' ? 'Publicar Grátis' : 'Continuar para Pagamento'}</button></div>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col h-full bg-white relative">
        {isCreating && (
          <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center flex-col gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-gray-900 font-bold text-lg">Criando seu anúncio...</p>
          </div>
        )}

        {step === CreateStep.CATEGORY && renderCategory()}
        {step === CreateStep.VEHICLE_TYPE && renderVehicleType()}
        {step === CreateStep.REAL_ESTATE_TYPE && renderRealEstateType()}
        {step === CreateStep.PARTS_TYPE && renderPartsType()}
        {step === CreateStep.PARTS_CONDITION && renderPartsCondition()}
        {step === CreateStep.PHOTOS && renderPhotos()}
        {step === CreateStep.PLATE && renderPlate()}
        {step === CreateStep.SPECS && renderSpecs()}
        {step === CreateStep.INFO && renderInfo()}
        {step === CreateStep.FEATURES && renderFeatures()}
        {step === CreateStep.REAL_ESTATE_SPECS && renderRealEstateSpecs()}
        {step === CreateStep.REAL_ESTATE_FEATURES && renderRealEstateFeatures()}
        {step === CreateStep.ADDITIONAL_INFO && renderAdditionalInfo()}
        {step === CreateStep.TITLE && renderTitle()}
        {step === CreateStep.DESCRIPTION && renderDescription()}
        {step === CreateStep.PRICE && renderPrice()}
        {step === CreateStep.CONTACT && renderContact()}
        {step === CreateStep.BOOST && renderBoost()}
        {(step === CreateStep.SUCCESS) && ( // Keeping success just in case fallback hits it
          <StepContainer title="Sucesso!" progress={1} onNext={() => onFinish({}, createdAd || undefined)} onBack={() => { }} hideHeader hideFooter>
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <CheckCircle className="w-24 h-24 text-green-500 mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Anúncio Criado!</h2>
              <p className="text-gray-500 mb-8 max-w-xs mx-auto">Seu anúncio foi publicado com sucesso e já está visível para milhares de compradores.</p>
              {/* QR Code logic optional here based on original code */}
              {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 mb-8" />}
              <button onClick={() => onFinish({}, createdAd || undefined)} className={ACTION_BTN_CLASS + " w-full"}>
                Ver meus anúncios
              </button>
            </div>
          </StepContainer>
        )}
      </div>

      {/* --- HIGHLIGHT MODAL FOR IMMEDIATE PAYMENT --- */}
      {showHighlightModal && createdAd && (
        <HighlightAdModal
          ad={createdAd}
          onClose={onHighlightClose}
          onSuccess={onHighlightSuccess}
          initialPlanId={formData.boostPlan}
        />
      )}
    </>
  );
};



