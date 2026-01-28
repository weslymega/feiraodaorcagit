
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Save, Lock, Mail, Phone, MapPin, User as UserIcon, Loader2, Home } from 'lucide-react';
import { Header } from '../components/Shared';
import { User } from '../types';

interface EditProfileProps {
  user: User;
  onSave: (updatedUser: User) => void;
  onBack: () => void;
  onChangePassword: () => void;
}

export const EditProfile: React.FC<EditProfileProps> = ({ user, onSave, onBack, onChangePassword }) => {
  const [formData, setFormData] = useState<User>(user);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  // Local state for address fields to manage inputs before composing location string
  const [addressData, setAddressData] = useState({
    cep: user.cep || '',
    bairro: '',
    cidade: user.location ? user.location.split(',')[0].trim() : '',
    uf: user.location && user.location.includes(',') ? user.location.split(',')[1].trim() : ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize address components if location exists but not split in state yet
  useEffect(() => {
    if (user.location && !addressData.bairro) {
      // Simple heuristic parsing if standard format "Bairro - Cidade, UF"
      if (user.location.includes(' - ')) {
        const [bairro, rest] = user.location.split(' - ');
        if (rest && rest.includes(',')) {
          const [cidade, uf] = rest.split(',');
          setAddressData(prev => ({ ...prev, bairro: bairro.trim(), cidade: cidade.trim(), uf: uf.trim() }));
        }
      } else if (user.location.includes(',')) {
        const [cidade, uf] = user.location.split(',');
        setAddressData(prev => ({ ...prev, cidade: cidade.trim(), uf: uf.trim() }));
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressData(prev => {
      const updated = { ...prev, [name]: value };
      // Update main location string automatically: "Bairro - Cidade, UF" or "Cidade, UF"
      const loc = updated.bairro
        ? `${updated.bairro} - ${updated.cidade}, ${updated.uf}`
        : `${updated.cidade}, ${updated.uf}`;

      setFormData(f => ({ ...f, location: loc }));
      return updated;
    });
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');

    // Masking 00000-000
    if (value.length > 5) {
      value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    }

    setAddressData(prev => ({ ...prev, cep: value }));
    setFormData(prev => ({ ...prev, cep: value })); // Update user.cep

    if (value.replace(/\D/g, '').length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${value.replace(/\D/g, '')}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setAddressData(prev => {
            const updated = {
              ...prev,
              cep: value,
              bairro: data.bairro,
              cidade: data.localidade,
              uf: data.uf
            };
            // Update main location string
            const loc = updated.bairro
              ? `${updated.bairro} - ${updated.cidade}, ${updated.uf}`
              : `${updated.cidade}, ${updated.uf}`;

            setFormData(f => ({ ...f, location: loc, cep: value }));
            return updated;
          });
        }
      } catch (error) {
        console.error("Erro ao buscar CEP", error);
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  // --- COMPRESSÃO DE IMAGEM ---
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300; // Avatar não precisa ser maior que 300px
          const scaleSize = MAX_WIDTH / img.width;

          if (scaleSize < 1) {
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
          } else {
            canvas.width = img.width;
            canvas.height = img.height;
          }

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Compress to JPEG quality 0.7
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      try {
        const compressedBase64 = await compressImage(file);
        setFormData(prev => ({ ...prev, avatarUrl: compressedBase64 }));
      } catch (error) {
        console.error("Erro ao processar imagem", error);
        alert("Erro ao carregar imagem. Tente uma menor.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const triggerFileInput = () => {
    if (!isProcessing) fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header
        title="Editar Perfil"
        onBack={onBack}
      />

      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 animate-in slide-in-from-right duration-300">

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />

        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative cursor-pointer group"
            onClick={triggerFileInput}
          >
            <div className="w-28 h-28 rounded-full bg-white p-1 shadow-md group-hover:shadow-lg transition-all relative overflow-hidden">
              <img
                src={formData.avatarUrl}
                alt="Profile"
                className={`w-full h-full rounded-full object-cover group-hover:opacity-90 transition-opacity ${isProcessing ? 'opacity-50 blur-sm' : ''}`}
              />
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              )}
            </div>
            <button
              type="button"
              className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full shadow-lg hover:bg-primary-light transition-colors pointer-events-none"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={triggerFileInput}
            className="text-sm text-primary font-medium hover:underline focus:outline-none"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processando...' : 'Alterar foto'}
          </button>
        </div>

        {/* Personal Info */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Informações Pessoais</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  maxLength={50}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-800"
                  placeholder="Seu nome completo"
                />
              </div>
              <div className="flex justify-end mt-1">
                <span className="text-[10px] text-gray-400 font-medium">{formData.name.length}/50</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  maxLength={100}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-800"
                  placeholder="seu@email.com"
                />
              </div>
              <div className="flex justify-end mt-1">
                <span className="text-[10px] text-gray-400 font-medium">{formData.email.length}/100</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  maxLength={20}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-800"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="flex justify-end mt-1">
                <span className="text-[10px] text-gray-400 font-medium">{(formData.phone || '').length}/20</span>
              </div>
            </div>

            {/* Endereço - Split into CEP, Neighborhood, City/UF */}
            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Endereço</h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="cep"
                    value={addressData.cep}
                    onChange={handleCepChange}
                    className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-800"
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  {isLoadingCep && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Home className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="bairro"
                    value={addressData.bairro}
                    onChange={handleAddressChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-800"
                    placeholder="Seu bairro"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    name="cidade"
                    value={addressData.cidade}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-800"
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                  <input
                    type="text"
                    name="uf"
                    value={addressData.uf}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-800 uppercase"
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sobre mim (Bio)</label>
              <textarea
                name="bio"
                value={formData.bio || ''}
                onChange={handleChange}
                rows={3}
                maxLength={300}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-800 resize-none"
                placeholder="Conte um pouco sobre você..."
              />
              <div className="flex justify-end mt-1">
                <span className="text-[10px] text-gray-400 font-medium">{(formData.bio || '').length}/300</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="flex flex-col gap-4 mt-2">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Segurança</h3>
          <button
            type="button"
            onClick={onChangePassword}
            className="w-full bg-white p-4 border border-gray-200 rounded-xl flex items-center justify-between group hover:border-primary transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-purple-50 transition-colors">
                <Lock className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors" />
              </div>
              <span className="text-gray-700 font-medium group-hover:text-primary transition-colors">Alterar Senha</span>
            </div>
            <span className="text-xs text-gray-400">Última alteração há 3 meses</span>
          </button>
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className={`mt-4 w-full text-white py-4 rounded-xl font-bold shadow-lg shadow-purple-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary'}`}
        >
          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Salvar Alterações
        </button>

      </form>
    </div>
  );
};
