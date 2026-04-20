
import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Check, CheckCheck, ArrowLeft, Loader2, ChevronRight, UserX, ShieldAlert } from 'lucide-react';
import { MessageItem, ChatMessage } from '../types';
import { imageService } from '../services/imageService';
import { AnimatedAvatar } from '../components/AnimatedAvatar';

interface ChatDetailProps {
  chat: MessageItem;
  messages: ChatMessage[];
  onBack: () => void;
  onAdClick?: () => void;
  onViewProfile?: () => void;
  onSendMessage: (text: string, images?: string[]) => void;
  onBlockUser?: (userId: string) => void;
  isBlocked?: boolean;
}

export const ChatDetail: React.FC<ChatDetailProps> = ({
  chat,
  messages,
  onBack,
  onAdClick,
  onViewProfile,
  onSendMessage,
  onBlockUser,
  isBlocked = false
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedImages, setSelectedImages] = useState<{ file: File; preview: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isUploading]);

  // --- VALIDAÇÃO DE TEXTO ---
  const textWords = inputText.trim() ? inputText.trim().split(/\s+/) : [];
  const wordCount = textWords.length;
  const charCount = inputText.length;
  const hasLongWord = textWords.some(w => w.length > 30);
  const isTextInvalid = wordCount > 50 || charCount > 500 || hasLongWord;

  // --- VALIDAÇÃO DE IMAGENS ---
  const isImagesInvalid = selectedImages.length > 3;

  const isFormInvalid = (inputText.trim() === '' && selectedImages.length === 0) || isTextInvalid || isImagesInvalid;

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isFormInvalid || isUploading || isBlocked) return;

    let uploadedUrls: string[] = [];

    if (selectedImages.length > 0) {
      setIsUploading(true);
      setUploadProgress(0);
      try {
        let processedCount = 0;
        const uploadPromises = selectedImages.map(async ({ file }) => {
          const compressed = await imageService.compress(file, 'chat');
          const publicUrl = await imageService.upload(compressed, 'chat-images', chat.adId);
          processedCount++;
          setUploadProgress(Math.round((processedCount / selectedImages.length) * 100));
          return publicUrl;
        });
        uploadedUrls = await Promise.all(uploadPromises);
      } catch (error) {
        console.error("Erro no upload:", error);
        alert("Falha ao enviar imagens.");
        setIsUploading(false);
        return;
      }
    }

    // Envia mensagem única (Texto + Imagens)
    onSendMessage(inputText.trim(), uploadedUrls.length > 0 ? uploadedUrls : undefined);
    
    // Limpa estado
    setInputText('');
    setSelectedImages([]);
    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files) as File[];
    const newSelected = [...selectedImages];

    for (const file of fileArray) {
      if (newSelected.length >= 3) {
        alert("Máximo de 3 imagens permitido.");
        break;
      }

      // Validação de formato
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert(`Arquivo "${file.name}" inválido. Use JPG, PNG ou WEBP.`);
        continue;
      }

      // Validação de tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`Arquivo "${file.name}" é muito grande (Máximo 5MB).`);
        continue;
      }

      newSelected.push({
        file,
        preview: URL.createObjectURL(file)
      });
    }

    setSelectedImages(newSelected);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    const newImages = [...selectedImages];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setSelectedImages(newImages);
  };

  return (
    <div className="flex flex-col h-screen bg-[#e5ddd5] animate-in slide-in-from-right duration-300 relative">

      {/* Loading Overlay with Progress Bar */}
      {isUploading && (
        <div className="absolute inset-0 z-[1000] bg-black/20 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3 w-64">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-gray-800 font-bold text-sm">Comprimindo e enviando...</p>

            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 font-medium">{uploadProgress}% concluído</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-[100]">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 -ml-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>

          {/* User Info - Clickable to View Profile */}
          <div
            className="flex items-center gap-3 cursor-pointer group active:opacity-70 transition-opacity"
            onClick={onViewProfile}
          >
            <div className="relative">
              <AnimatedAvatar 
                avatarId={chat.avatar_id} 
                avatarUrl={chat.avatarUrl} 
                name={chat.senderName}
                mode="loop" 
                size={40}
                className="group-hover:opacity-90 transition-opacity"
              />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-sm group-hover:text-primary transition-colors">
                {chat.senderName && chat.senderName !== "Usuário" ? chat.senderName : "Usuário indisponível"}
              </h1>
              {isBlocked && <p className="text-xs text-red-500 font-medium">Usuário Bloqueado</p>}
            </div>
          </div>
        </div>

        {onBlockUser && !isBlocked && (
          <button
            onClick={() => onBlockUser(chat.otherUserId)}
            className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            title="Bloquear Usuário"
          >
            <UserX className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Ad Context Header (Clickable) */}
      {chat.adTitle && (
        <button
          onClick={() => onAdClick && onAdClick()}
          disabled={!onAdClick}
          className="bg-white/90 backdrop-blur-sm border-b border-gray-200 p-3 flex items-center gap-3 sticky top-[64px] z-[90] shadow-sm w-full text-left active:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
            <img src={chat.adImage || 'https://placehold.co/100x100?text=Orca'} className="w-full h-full object-cover" alt="Product" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">Negociando:</p>
            <p className="font-bold text-gray-800 text-sm truncate">{chat.adTitle}</p>
            <p className="text-green-600 font-bold text-xs">
              {chat.adPrice ? chat.adPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Consulte'}
            </p>
          </div>
          {onAdClick && (
            <div className="p-1 text-gray-400">
              <ChevronRight className="w-5 h-5" />
            </div>
          )}
        </button>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {isBlocked && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700 leading-relaxed">
              Este usuário está bloqueado. Você não verá novos anúncios dele e não podem trocar mensagens.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[80%] rounded-xl p-3 relative shadow-sm text-sm transition-opacity ${msg.isMine
              ? 'bg-[#dcf8c6] self-end rounded-tr-none'
              : 'bg-white self-start rounded-tl-none'
              } ${msg.sending ? 'opacity-70' : 'opacity-100'} ${msg.error ? 'border border-red-300' : ''}`}
          >
            {/* Novas Imagens (Múltiplas) */}
            {msg.images && msg.images.length > 0 && (
              <div className={`flex flex-wrap gap-1 mb-2 ${msg.images.length > 1 ? 'grid grid-cols-2' : ''}`}>
                {msg.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt="Imagem enviada"
                    className={`rounded-lg object-cover w-full ${msg.images!.length === 1 ? 'max-h-64' : 'aspect-square'}`}
                  />
                ))}
              </div>
            )}

            {/* Imagem Legada (Singular) */}
            {msg.imageUrl && (!msg.images || msg.images.length === 0) && (
              <div className="mb-1">
                <img
                  src={msg.imageUrl}
                  alt="Imagem enviada"
                  className="rounded-lg max-h-64 object-cover w-full"
                />
              </div>
            )}

            {msg.text && (
              <p className="text-gray-800 leading-relaxed pr-6 whitespace-pre-wrap">{msg.text}</p>
            )}

            <div className={`flex items-center gap-1 mt-1 justify-end`}>
              {msg.error && (
                <span className="text-[10px] text-red-500 font-bold mr-1">Falhou</span>
              )}
              <span className={`text-[10px] text-gray-500`}>{msg.time}</span>
              {msg.isMine && !msg.error && (
                <>
                  {msg.sending ? (
                    <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                  ) : (
                    <>
                      {msg.isRead && chat.readReceipts !== false ? (
                        <CheckCheck className={`w-3 h-3 text-blue-500`} />
                      ) : (
                        <Check className={`w-3 h-3 text-gray-400`} />
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Preview de Imagens Selecionadas */}
      {selectedImages.length > 0 && (
        <div className="bg-white p-3 border-t border-gray-200 flex gap-2 overflow-x-auto">
          {selectedImages.map((img, idx) => (
            <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
              <img src={img.preview} className="w-full h-full object-cover" alt="Preview" />
              <button
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70"
              >
                <ArrowLeft className="w-3 h-3 rotate-45" /> {/* Use X icon if available, but ArrowLeft rotated is a hack or I can import X */}
              </button>
            </div>
          ))}
          <div className="flex flex-col justify-center px-2">
            <span className={`text-[10px] font-bold ${selectedImages.length > 3 ? 'text-red-500' : 'text-gray-400'}`}>
              {selectedImages.length}/3 fotos
            </span>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-2">
        {/* Contadores */}
        <div className="flex justify-between px-3 mb-1">
          <div className="flex gap-3">
            <span className={`text-[10px] font-medium ${wordCount > 50 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
              {wordCount}/50 palavras
            </span>
            <span className={`text-[10px] font-medium ${charCount > 500 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
              {charCount}/500 caracteres
            </span>
          </div>
          {hasLongWord && <span className="text-[10px] text-red-500 font-bold">Palavra muito longa!</span>}
        </div>

        <form
          onSubmit={handleSend}
          className="flex items-center gap-2"
        >
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp"
            multiple
            className="hidden"
          />

          <button
            type="button"
            onClick={handleAttachClick}
            disabled={isUploading || selectedImages.length >= 3}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            title="Anexar imagens"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isBlocked ? "Usuário bloqueado" : (selectedImages.length > 0 ? "Adicione uma legenda..." : "Digite uma mensagem")}
            disabled={isUploading || isBlocked}
            className={`flex-1 bg-gray-100 border-none rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary text-gray-800 disabled:bg-gray-50 ${isTextInvalid ? 'ring-1 ring-red-300 bg-red-50' : ''
              }`}
          />

          <button
            type="submit"
            disabled={isFormInvalid || isUploading || isBlocked}
            className={`p-3 rounded-full transition-colors flex items-center justify-center ${(!isFormInvalid && !isBlocked) ? 'bg-primary text-white shadow-md' : 'bg-gray-200 text-gray-400'
              }`}
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
          </button>
        </form>
      </div>
    </div>
  );
};
