
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X, Car, Package, Home, Briefcase, Minus,
  Plus, Camera, ChevronLeft, MapPin, Phone, CheckCircle, Search, Trash2, AlignLeft,
  Truck, Bike, Settings, Wrench, Smartphone, Bed, Bath, Maximize, Warehouse, Building,
  Loader2, Speaker, Hammer, Sparkles, Disc, QrCode, Download, Printer, Share2, AlertCircle, Star,
  Trophy, Clock, Copy, Check, ShieldCheck, Lock, TrendingUp,
  ArrowDown, ArrowUp, Zap, ClipboardCheck, Info
} from 'lucide-react';
import { AdItem, AdStatus, User } from '../types';
import { imageService } from '../services/imageService';
import { fipeApi, FipeItem, FipeDetail, FipeVehicleType } from '../services/fipeApi';
import { api } from '../services/api';
import { APP_URL } from '../constants';


interface CreateAdProps {
  onBack: () => void;
  onFinish: (adData: Partial<AdItem>, createdAd?: AdItem) => void;
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
  DESCRIPTION = 15,
  PRICE = 12,
  CONTACT = 13,
  SUCCESS = 25
}

const ACTION_BTN_CLASS = "bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98]";

const CAR_FEATURES = ["Airbag", "Ar condicionado", "Alarme", "Bancos de couro", "Câmera de ré", "Sensor de ré", "Som", "Teto solar", "Vidro elétrico", "Trava elétrica"];
const MOTO_FEATURES = ["ABS", "Computador de bordo", "Escapamento esportivo", "Bolsa / Baú / Bauleto", "Contra peso no guidon", "Alarme", "Amortecedor de direção", "Faróis de neblina", "GPS", "Som"];

interface StepContainerProps {
  title: string;
  progress: number;
  children: React.ReactNode;
  onNext?: () => void;
  nextDisabled?: boolean;
  onBack: () => void;
  hideHeader?: boolean;
  hideFooter?: boolean;
  nextLabel?: string;
}

const StepContainer: React.FC<StepContainerProps> = ({ title, progress, children, onNext, nextDisabled, onBack, hideHeader = false, hideFooter = false, nextLabel = "Continuar" }) => (
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
      <div className="sticky bottom-0 bg-white p-4 border-t z-[150] shadow-[0_-2px_10px_rgba(0,0,0,0.05)] -mx-2 flex gap-4">
        <button onClick={onBack} className="flex-1 py-4 border-2 border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">
          Voltar
        </button>
        {onNext && (
          <button
            onClick={onNext}
            disabled={nextDisabled}
            className={`flex-1 ${ACTION_BTN_CLASS} ${nextDisabled ? 'opacity-50 cursor-not-allowed bg-gray-400' : ''}`}
          >
            {nextLabel}
          </button>
        )}
      </div>
    )}
  </div>
);

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
  const [adTitle, setAdTitle] = useState('');

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

  const [createdAd, setCreatedAd] = useState<AdItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

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
    cep: editingAd?.cep || (user.cep || ''),
    location: editingAd?.location || user.location || '',
    phone: editingAd?.contactPhone || user.phone || '',
    boostPlan: 'gratis',
    fipeCategory: '' as FipeVehicleType | ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (formData.category === 'veiculos' && step === CreateStep.SPECS) {
      loadBrands();
    }
  }, [formData.category, step]);

  const getFipeType = (): FipeVehicleType => {
    if (formData.fipeCategory) return formData.fipeCategory;
    const type = formData.vehicleType.toLowerCase();
    if (type === 'passeio') return 'carros';
    if (type === 'moto') return 'motos';
    if (type === 'caminhão' || type === 'caminhao') return 'caminhoes';
    return 'carros';
  };

  const loadBrands = async () => {
    setIsLoadingBrands(true);
    const brands = await fipeApi.getBrands(getFipeType());
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
      const models = await fipeApi.getModels(getFipeType(), brandId);
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
      const years = await fipeApi.getYears(getFipeType(), selectedBrandId, modelId);
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
      const detail = await fipeApi.getDetail(getFipeType(), selectedBrandId, selectedModelId, yearId);
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

  const handleCreateAd = async () => {
    let title = (formData.title || editingAd?.title || '').trim();
    if (!title) {
      if (formData.category === 'veiculos') { title = `${formData.brandName} ${formData.modelName} ${formData.year || ''}`.trim() || formData.vehicleType; }
      else if (formData.category === 'imoveis') { title = `${formData.realEstateType || 'Imóvel'} - ${formData.area}m²`; }
      else if (formData.category === 'servicos') { title = `${formData.partType || 'Peça/Serviço'} ${formData.condition ? `(${formData.condition})` : ''}`; }
    }
    if (!title || title.trim() === '') title = 'Anúncio sem título';

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
      boostPlan: 'gratis',
      isFeatured: false,
      boostConfig: null,
      contactPhone: formData.phone
    };

    if (editingAd) {
      onFinish(adData);
      return;
    }

    setIsCreating(true);
    try {
      const newAd = await api.createAd({
        ...adData,
        status: AdStatus.PENDING,
        isFeatured: false,
        boostPlan: 'gratis'
      } as any);
      setCreatedAd(newAd);
      goToStep(CreateStep.SUCCESS);
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

  const nextStep = () => {
    let next: CreateStep;
    switch (step) {
      case CreateStep.CATEGORY:
        if (formData.category === 'veiculos') next = CreateStep.VEHICLE_TYPE;
        else if (formData.category === 'imoveis') next = CreateStep.REAL_ESTATE_TYPE;
        else if (formData.category === 'servicos') next = CreateStep.PARTS_TYPE;
        else return;
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
        else next = CreateStep.TITLE;
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
        handleCreateAd();
        break;
      case CreateStep.SUCCESS: return;
      default: next = CreateStep.CATEGORY;
    }
    goToStep(next);
  };

  // --- REMOVED LOCAL COMPRESSION IN FAVOR OF imageService ---


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const currentCount = formData.images.length;
      const remainingSlots = 20 - currentCount;
      if (remainingSlots <= 0) { alert("Limite máximo de fotos atingido."); return; }
      
      setIsUploading(true);
      const filesToProcess = [...files]
        .filter(file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
        .slice(0, remainingSlots);

      try {
        const uploadPromises = filesToProcess.map(async (file) => {
          // 1. Comprimir
          const compressed = await imageService.compress(file, 'ad');
          // 2. Upload para Storage (organizado por userId)
          return await imageService.upload(compressed, 'ads-images', user.id);
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        setFormData(prev => ({ 
          ...prev, 
          images: [...prev.images, ...uploadedUrls] 
        }));
      } catch (error) { 
        console.error("Error uploading images", error); 
        alert("Erro ao enviar imagens para o servidor."); 
      }
      finally { 
        setIsUploading(false); 
        if (fileInputRef.current) fileInputRef.current.value = ''; 
      }
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
    return parseFloat(val.toString().replace(/\./g, '').replace(',', '.'));
  };

  const renderCategory = () => (
    <StepContainer title="Categoria" progress={0.05} onNext={nextStep} nextDisabled={!formData.category} onBack={goBack}>
      <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-6">O que você vai anunciar?</h1>
      <div className="flex flex-col gap-4">
        {[{ id: 'veiculos', label: 'Veículos', icon: <Car className="w-6 h-6" />, desc: 'Carros, motos e caminhões' },
        { id: 'imoveis', label: 'Imóveis', icon: <Home className="w-6 h-6" />, desc: 'Casas, apartamentos, terrenos' },
        { id: 'servicos', label: 'Peças e Serviços', icon: <Wrench className="w-6 h-6" />, desc: 'Peças, som e serviços automotivos' }]
          .map((cat) => (
            <button key={cat.id} onClick={() => setFormData(p => ({ ...p, category: cat.id }))} className={`flex items-center gap-4 p-5 border-2 rounded-2xl transition-all text-left group active:scale-[0.99] ${formData.category === cat.id ? 'border-primary bg-blue-50/50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'}`}>
              <div className={`p-3 rounded-xl transition-colors ${formData.category === cat.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-primary'}`}>{cat.icon}</div>
              <div className="flex-1">
                <span className={`font-bold text-lg block ${formData.category === cat.id ? 'text-gray-900' : 'text-gray-700'}`}>{cat.label}</span>
                <span className="text-sm text-gray-400 font-medium">{cat.desc}</span>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.category === cat.id ? 'border-primary' : 'border-gray-200'}`}>{formData.category === cat.id && <div className="w-3 h-3 bg-primary rounded-full" />}</div>
            </button>
          ))}
      </div>
    </StepContainer>
  );

  const renderVehicleType = () => (
    <StepContainer title="Tipo de Veículo" progress={0.1} onNext={nextStep} onBack={goBack}>
      <div className="flex flex-col gap-4">
        {[{ id: 'Passeio', label: 'Carro de Passeio', icon: <Car className="w-6 h-6" /> },
        { id: 'Moto', label: 'Motocicleta', icon: <Bike className="w-6 h-6" /> },
        { id: 'Caminhão', label: 'Caminhão / Ônibus', icon: <Truck className="w-6 h-6" /> }]
          .map((type) => (
            <button key={type.id} onClick={() => { 
                const fipeCat: FipeVehicleType = type.id === 'Moto' ? 'motos' : (type.id === 'Caminhão' ? 'caminhoes' : 'carros');
                setFormData(p => ({ ...p, vehicleType: type.id, fipeCategory: fipeCat })); 
                nextStep(); 
            }} className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-primary hover:shadow-md transition-all active:scale-[0.99]">
              <div className="p-3 bg-blue-50 text-primary rounded-xl">{type.icon}</div>
              <span className="font-bold text-gray-800 text-lg flex-1 text-left">{type.label}</span>
              <ChevronLeft className="w-5 h-5 text-gray-300 rotate-180" />
            </button>
          ))}
      </div>
    </StepContainer>
  );

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
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide flex justify-between">
              Área Total (m²)
              <span className={`text-[10px] ${formData.area.length >= 7 ? 'text-red-500' : 'text-gray-400'}`}>
                {formData.area.length}/7
              </span>
            </label>
            <div className="relative">
              <input 
                type="text" 
                inputMode="numeric" 
                value={formatMileageInput(formData.area)} 
                onChange={(e) => { 
                  const raw = e.target.value.replace(/\D/g, ''); 
                  if (raw.length > 7) return; 
                  setFormData(p => ({ ...p, area: raw })); 
                }} 
                className={`w-full border-2 rounded-2xl p-4 focus:ring-4 outline-none transition-all ${formData.area.length >= 7 ? 'border-orange-500 bg-orange-50/10' : 'border-gray-100 bg-gray-50 focus:border-primary'}`}
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
      
      <div className="mt-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3 animate-in fade-in">
        <div className="bg-white p-2 text-primary rounded-xl shadow-sm flex-shrink-0 mt-0.5">
          <Camera className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 leading-tight">Anúncios com fotos têm mais chances de venda!</p>
          <p className="text-xs text-gray-600 mt-1 font-medium">Você pode carregar até <span className="font-bold text-gray-900">20 fotos</span> e escolher qual será a capa do anúncio.</p>
        </div>
      </div>

      <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" multiple accept="image/jpeg, image/png, image/webp" />
    </StepContainer>
  );

  const renderPlate = () => (
    <StepContainer title="Placa (Opcional)" progress={0.4} onNext={nextStep} onBack={goBack} nextDisabled={formData.plate.length > 0 && formData.plate.length < 7}>
      <div className="relative mb-8"><input type="text" value={formData.plate} onChange={(e) => setFormData(p => ({ ...p, plate: e.target.value.toUpperCase() }))} placeholder="ABC1D23" className="w-full border-2 border-gray-200 rounded-2xl px-4 py-6 text-center text-4xl font-bold tracking-widest uppercase focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" maxLength={7} /></div><div className="flex items-center gap-3 mb-8 cursor-pointer p-4 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all" onClick={() => setFormData(p => ({ ...p, isZeroKm: !p.isZeroKm }))}><div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${formData.isZeroKm ? 'bg-primary border-primary' : 'border-gray-300'}`}>{formData.isZeroKm && <div className="w-2.5 h-2.5 bg-white rounded-full" />}</div><span className="text-gray-900 font-medium">Veículo 0km (Sem placa)</span></div>
      {!formData.plate && !formData.isZeroKm && (<p className="text-center text-gray-500 text-sm animate-pulse">Você pode pular esta etapa clicando em Continuar</p>)}
    </StepContainer>
  );

  const renderSpecs = () => {
    const isFipeSelected = (!!selectedYearId || !!editingAd);
    const areDetailsSelected = !!formData.color && !!formData.gearbox;
    return (
      <StepContainer title="Dados do Veículo" progress={0.5} onNext={nextStep} nextDisabled={!isFipeSelected || !areDetailsSelected} onBack={goBack}>
        <div className="space-y-6">
          <div><label className="block text-sm font-bold text-gray-700 mb-2">Marca</label><div className="relative"><select value={selectedBrandId} onChange={handleBrandChange} disabled={isLoadingBrands} className="w-full border border-gray-200 bg-gray-50 rounded-2xl p-4 focus:border-primary focus:bg-white outline-none transition-all appearance-none disabled:opacity-50"><option value="">{editingAd ? formData.brandName || "Marca Original" : "Selecione a marca"}</option>{fipeBrands.map(b => (<option key={b.codigo} value={b.codigo}>{b.nome}</option>))}</select></div></div>
          <div><label className="block text-sm font-bold text-gray-700 mb-2">Família do Carro</label><div className="relative"><select value={selectedBaseModel} onChange={handleBaseModelChange} disabled={!selectedBrandId || isLoadingModels} className="w-full border border-gray-200 bg-gray-50 rounded-2xl p-4 focus:border-primary focus:bg-white outline-none transition-all appearance-none disabled:opacity-50"><option value="">{editingAd ? "Modelo Original" : "Selecione a família"}</option>{uniqueBaseModels.map(name => (<option key={name} value={name}>{name}</option>))}</select></div></div>
          {selectedBaseModel && (<div><label className="block text-sm font-bold text-gray-700 mb-2">Versão Específica</label><div className="relative"><select value={selectedModelId} onChange={handleVersionChange} disabled={!selectedBaseModel} className="w-full border border-gray-200 bg-gray-50 rounded-2xl p-4 focus:border-primary focus:bg-white outline-none transition-all appearance-none disabled:opacity-50"><option value="">Selecione a versão</option>{availableVersions.map(m => (<option key={m.codigo} value={m.codigo}>{m.nome}</option>))}</select></div></div>)}
          {selectedModelId && (<div><label className="block text-sm font-bold text-gray-700 mb-2">Ano</label><div className="relative"><select value={selectedYearId} onChange={handleYearChange} disabled={!selectedModelId || isLoadingYears} className="w-full border border-gray-200 bg-gray-50 rounded-2xl p-4 focus:border-primary focus:bg-white outline-none transition-all appearance-none disabled:opacity-50"><option value="">Selecione o ano</option>{fipeYears.map(y => (<option key={y.codigo} value={y.codigo}>{y.nome}</option>))}</select></div></div>)}
          {(formData.fipePrice > 0 || editingAd) && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 animate-in fade-in">
              <div className="col-span-1"><label className="block text-sm font-bold text-gray-700 mb-2">Cor *</label><select value={formData.color} onChange={(e) => setFormData(p => ({ ...p, color: e.target.value }))} className="w-full border border-gray-200 bg-gray-50 rounded-2xl p-4 focus:border-primary focus:bg-white outline-none transition-all appearance-none"><option value="">Selecione</option><option value="Branco">Branco</option><option value="Preto">Preto</option><option value="Prata">Prata</option><option value="Cinza">Cinza</option><option value="Vermelho">Vermelho</option><option value="Azul">Azul</option><option value="Verde">Verde</option><option value="Amarelo">Amarelo</option><option value="Marrom">Marrom</option><option value="Bege">Bege</option><option value="Outros">Outros</option></select></div>
              <div className="col-span-1"><label className="block text-sm font-bold text-gray-700 mb-2">Câmbio *</label><select value={formData.gearbox} onChange={(e) => setFormData(p => ({ ...p, gearbox: e.target.value }))} className="w-full border border-gray-200 bg-gray-50 rounded-2xl p-4 focus:border-primary focus:bg-white outline-none transition-all"><option value="">Selecione</option><option value="Manual">Manual</option><option value="Automático">Automático</option></select></div>
            </div>
          )}
        </div>
      </StepContainer>
    );
  };

  const renderInfo = () => (
    <StepContainer title="Quilometragem" progress={0.6} onNext={nextStep} onBack={goBack} nextDisabled={!formData.mileage || formData.mileage === ''}>
      <div className="bg-gray-50 p-6 rounded-3xl mb-6 text-center border border-gray-100"><h2 className="text-xl font-bold text-gray-900 mb-4">Qual a KM atual?</h2><div className="relative inline-block w-full"><input type="text" inputMode="numeric" value={formatMileageInput(formData.mileage.toString())} onChange={(e) => { const raw = e.target.value.replace(/\D/g, ''); if (raw.length > 7) return; setFormData(p => ({ ...p, mileage: raw })); }} className="w-full text-center text-4xl font-bold bg-transparent border-b-2 border-gray-300 focus:border-primary outline-none py-2 text-gray-900 placeholder-gray-300" placeholder="0" /><span className="block text-sm font-bold text-gray-400 mt-2">KM</span></div></div>
    </StepContainer>
  );

  const renderFeatures = () => {
    const isMoto = formData.fipeCategory === 'motos' || formData.vehicleType === 'Moto';
    const featuresList = isMoto ? MOTO_FEATURES : CAR_FEATURES;

    return (
      <StepContainer title="Opcionais" progress={0.7} onNext={nextStep} onBack={goBack}>
        <p className="text-gray-500 mb-6">Selecione o que seu veículo tem de bom.</p>
        <div className="flex flex-wrap gap-2">
          {featuresList.map(feature => (
            <button
              key={feature}
              onClick={() => toggleFeature(feature)}
              className={`px-4 py-2.5 rounded-2xl border text-sm font-medium transition-all duration-200 ${formData.features.includes(feature) ? 'bg-primary text-white border-primary shadow-lg shadow-blue-100 transform scale-105' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {feature}
            </button>
          ))}
        </div>
      </StepContainer>
    );
  };

  const renderAdditionalInfo = () => (
    <StepContainer title="Infos Adicionais" progress={0.8} onNext={nextStep} onBack={goBack}>
      <div className="flex flex-col gap-3">{["Único dono", "IPVA pago", "Licenciado", "Todas as revisões feitas", "Na garantia de fábrica", "Aceita troca"].map(item => (<button key={item} onClick={() => toggleAdditionalInfo(item)} className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${formData.additionalInfo.includes(item) ? 'bg-blue-50 border-primary shadow-sm' : 'bg-white border-gray-100 hover:border-gray-300'}`}><span className={`font-medium ${formData.additionalInfo.includes(item) ? 'text-primary font-bold' : 'text-gray-700'}`}>{item}</span>{formData.additionalInfo.includes(item) && <CheckCircle className="w-5 h-5 text-primary" />}</button>))}</div>
    </StepContainer>
  );

  const renderTitle = () => {
    let titlePlaceholder = "Ex: Produto excelente...";
    if (formData.category === 'veiculos') {
      titlePlaceholder = "Ex: Honda Civic LXR 2.0 Flex 16V Aut. 2014";
    } else if (formData.category === 'imoveis') {
      titlePlaceholder = "Ex: Lindo Apartamento 2 Quartos em Águas Claras";
    } else if (formData.category === 'servicos' || formData.category === 'pecas') {
      titlePlaceholder = "Ex: Jogo de Pneus Novos Aro 17";
    }

    return (
      <StepContainer title="Título do Anúncio" progress={0.82} onNext={nextStep} nextDisabled={!formData.title || formData.title.length > 40} onBack={goBack}>
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 leading-tight">Dê um nome para o seu anúncio</h2>
          <p className="text-sm text-gray-500 font-medium">Um bom título ajuda compradores a encontrarem seu anúncio mais rápido.</p>
          <div className="relative">
            <input type="text" placeholder={titlePlaceholder} value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} className={`w-full border-2 rounded-2xl px-5 py-4 text-xl font-bold focus:ring-4 outline-none transition-all ${formData.title.length > 40 ? 'border-red-500' : 'border-gray-200 focus:border-primary'}`} />
            <div className="flex justify-between mt-2 px-1"><span className={`text-[10px] font-bold uppercase ${formData.title.length > 40 ? 'text-red-500' : 'text-gray-400'}`}>{formData.title.length}/40 caracteres</span></div>
          </div>
        </div>
      </StepContainer>
    );
  };

  const renderDescription = () => (
    <StepContainer title="Descrição" progress={0.88} onNext={nextStep} nextDisabled={!formData.description || formData.description.length > 500} onBack={goBack}>
      <div className="space-y-4">
        <textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} className={`w-full h-64 border-2 bg-gray-50 rounded-2xl p-5 focus:bg-white focus:ring-4 outline-none resize-none text-gray-800 text-lg leading-relaxed shadow-inner transition-all ${formData.description.length > 500 ? 'border-red-500' : 'border-gray-200 focus:border-primary'}`} placeholder="Conte mais detalhes sobre o seu anúncio..." />
        <div className="flex justify-between items-center px-1"><span className={`text-[10px] font-bold uppercase ${formData.description.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>{formData.description.length}/500 caracteres</span></div>
      </div>
    </StepContainer>
  );

  const renderPrice = () => {
    const fipePercentage = formData.fipePrice > 0 ? (formData.price / formData.fipePrice) * 100 : 0;
    const isAboveFipe = formData.price > formData.fipePrice;

    const diffFipe = formData.fipePrice > 0 ? ((formData.price - formData.fipePrice) / formData.fipePrice) * 100 : 0;
    
    // Validate if the price is effectively 0 for critical categories
    const isPriceInvalid = (formData.category === 'veiculos' || formData.category === 'imoveis') && (!formData.price || formData.price <= 0);

    return (
      <StepContainer title="Preço" progress={0.92} onNext={nextStep} onBack={goBack} nextDisabled={isPriceInvalid}>
        <div className="bg-gray-50 p-8 rounded-3xl mb-6 text-center border border-gray-100 animate-in zoom-in">
          <h2 className="text-xl font-bold text-gray-900 mb-6 uppercase tracking-wider">Qual o valor pedido?</h2>
          <div className="relative inline-flex items-center">
            <span className="text-2xl font-black text-primary mr-2">R$</span>
            <input 
              type="text" 
              inputMode="numeric" 
              value={formData.price > 0 ? formData.price.toLocaleString('pt-BR') : ''} 
              onChange={(e) => { 
                const raw = e.target.value.replace(/\D/g, ''); 
                if (raw.length > 10) return; 
                setFormData(p => ({ ...p, price: raw ? parseInt(raw) : 0 })); 
              }} 
              className="w-full max-w-[200px] text-center text-5xl font-black bg-transparent border-b-4 border-gray-200 focus:border-primary transition-all outline-none py-2 text-gray-900 placeholder-gray-200" 
              placeholder="0" 
              maxLength={13} 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {formData.fipePrice > 0 && (
            <div className="p-5 bg-blue-50 border border-blue-100 rounded-3xl flex flex-col gap-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-blue-800 font-bold uppercase mb-1 tracking-wider flex items-center gap-1"><Info className="w-3.5 h-3.5" /> Tabela FIPE</p>
                  <p className="font-black text-xl text-gray-900">R$ {formData.fipePrice.toLocaleString('pt-BR')}</p>
                </div>
                {formData.price > 0 && (
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${diffFipe <= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {Math.abs(diffFipe).toFixed(1)}% {diffFipe <= 0 ? 'Abaixo' : 'Acima'}
                  </div>
                )}
              </div>
              <div className="w-full">
                <div className="h-2 bg-blue-200 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full absolute left-0 top-0 transition-all duration-500 ease-out rounded-full ${isAboveFipe ? 'bg-orange-500' : 'bg-primary'}`}
                    style={{ width: `${Math.min(100, fipePercentage)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        <p className="text-[10px] text-gray-400 font-medium mt-4 text-center">Valores servem apenas como referência de mercado.</p>
      </StepContainer>
    );
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.length > 8) raw = raw.substring(0, 8);
    let formatted = raw;
    if (raw.length > 5) formatted = raw.substring(0, 5) + '-' + raw.substring(5);
    setFormData(p => ({ ...p, cep: formatted }));
    if (raw.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
        const data = await response.json();
        if (!data.erro) {
          const loc = `${data.bairro ? `${data.bairro} - ` : ''}${data.localidade}, ${data.uf}`;
          setFormData(p => ({ ...p, location: loc }));
          setAddressDetails({ logradouro: data.logradouro || '', bairro: data.bairro || '', localidade: data.localidade || '', uf: data.uf || '' });
        }
      } catch (err) { console.error("CEP fetch error", err); }
      finally { setIsLoadingCep(false); }
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11);

    let formatted = value;
    if (value.length > 2) {
      formatted = `(${value.substring(0, 2)}) `;
      if (value.length > 7) {
        formatted += `${value.substring(2, 7)}-${value.substring(7)}`;
      } else {
        formatted += value.substring(2);
      }
    }
    setFormData(p => ({ ...p, phone: formatted }));
  };

  const renderContact = () => {
    const isCepValid = formData.cep && formData.cep.replace(/\D/g, '').length === 8;
    const isPhoneValid = formData.phone && formData.phone.replace(/\D/g, '').length >= 10;

    return (
      <StepContainer title="Localização" progress={0.95} onNext={nextStep} onBack={goBack} nextDisabled={!isCepValid || !formData.location || !isPhoneValid} nextLabel="Confirmar">
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 relative"><label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">CEP</label><div className="relative"><input type="text" value={formData.cep} onChange={handleCepChange} placeholder="00000-000" className="w-full bg-white border border-gray-200 rounded-xl p-3 font-medium text-gray-900" inputMode="numeric" maxLength={9} />{isLoadingCep && <div className="absolute right-3 top-3"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>}</div></div>
          {formData.location && (<div className="p-4 bg-green-50 rounded-2xl border border-green-100"><div className="flex items-start gap-3"><div className="bg-white p-2 rounded-full shadow-sm text-green-600"><MapPin className="w-5 h-5" /></div><div><p className="text-xs text-green-700 font-bold uppercase mb-0.5">Endereço Identificado</p><p className="font-bold text-gray-900 leading-tight mb-1">{addressDetails.logradouro || formData.location}</p>{addressDetails.bairro && <p className="text-sm text-gray-700">{addressDetails.bairro} - {addressDetails.localidade}, {addressDetails.uf}</p>}</div></div></div>)}
          <div className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm"><div className="bg-green-50 p-2 rounded-full"><Phone className="w-5 h-5 text-green-600" /></div><div className="flex-1"><p className="text-xs text-gray-400 font-bold uppercase mb-1">Celular / WhatsApp *</p><input type="tel" placeholder="(11) 99999-9999" value={formData.phone} onChange={handlePhoneChange} className="w-full font-bold text-gray-800 outline-none text-xl" maxLength={15} /></div></div>
        </div>
      </StepContainer>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {isCreating && (
        <div className="absolute inset-0 z-[1000] bg-white/80 backdrop-blur-sm flex items-center justify-center flex-col gap-4">
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
      {step === CreateStep.SUCCESS && (
        <StepContainer title="Sucesso!" progress={1} onBack={() => { }} hideHeader hideFooter>
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"><CheckCircle className="w-16 h-16 text-green-500" /></div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Anúncio Enviado!</h2>
            <p className="text-gray-500 mb-8 max-w-xs mx-auto">Seu anúncio foi registrado e agora aguarda a aprovação da equipe de moderação. Isso garante a qualidade e segurança da nossa plataforma.</p>
            <button onClick={() => onFinish({}, createdAd || undefined)} className={ACTION_BTN_CLASS + " w-full flex items-center justify-center gap-2"}>Ver meus anúncios</button>
          </div>
        </StepContainer>
      )}
    </div>
  );
};
