
import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Check, CheckCheck, ArrowLeft, Loader2, ChevronRight } from 'lucide-react';
import { MessageItem, ChatMessage } from '../types';

interface ChatDetailProps {
  chat: MessageItem;
  messages: ChatMessage[];
  onBack: () => void;
  onAdClick?: () => void;
  onViewProfile?: () => void;
  onSendMessage: (text: string, imageUrl?: string) => void;
}

export const ChatDetail: React.FC<ChatDetailProps> = ({
  chat,
  messages,
  onBack,
  onAdClick,
  onViewProfile,
  onSendMessage
}) => {
  const [inputText, setInputText] = useState('');
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

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText);
    setInputText('');
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  // --- IMAGE COMPRESSION LOGIC ---
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // Chat images max width 800
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

          // Compress to JPEG quality 0.6
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Regra: Máximo de 10 fotos
    if (files.length > 10) {
      alert("Você pode enviar no máximo 10 fotos por vez.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true); // Inicia o loading
    setUploadProgress(0);

    try {
      const fileArray = Array.from(files) as File[];
      const validFiles: File[] = [];

      // Validação de tipo
      fileArray.forEach((file) => {
        const validTypes = ['image/jpeg', 'image/png'];
        if (validTypes.includes(file.type)) {
          validFiles.push(file);
        } else {
          alert(`O arquivo "${file.name}" foi ignorado. Apenas JPG e PNG.`);
        }
      });

      if (validFiles.length === 0) {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      let processedCount = 0;
      // Processa todas as imagens em paralelo com compressão
      const imagePromises = validFiles.map(async (file) => {
        // Simula delay para visualização do progresso
        await new Promise(r => setTimeout(r, 400 + Math.random() * 600));

        const data = await compressImage(file);

        processedCount++;
        setUploadProgress(Math.round((processedCount / validFiles.length) * 100));

        return data;
      });

      const imagesBase64 = await Promise.all(imagePromises);

      // Envia as mensagens uma por uma
      imagesBase64.forEach(imgData => {
        onSendMessage('', imgData);
      });

    } catch (error) {
      console.error("Erro ao processar imagens", error);
      alert("Ocorreu um erro ao processar as imagens.");
    } finally {
      setIsUploading(false); // Para o loading
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#e5ddd5] animate-in slide-in-from-right duration-300 relative">

      {/* Loading Overlay with Progress Bar */}
      {isUploading && (
        <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
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
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-20">
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
              <img src={chat.avatarUrl} alt={chat.senderName} className="w-10 h-10 rounded-full object-cover group-hover:opacity-90" />
              {chat.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-sm group-hover:text-primary transition-colors">{chat.senderName}</h1>
              {chat.online && <p className="text-xs text-green-600 font-medium">Online agora</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Ad Context Header (Clickable) */}
      {chat.adTitle && (
        <button
          onClick={() => onAdClick && onAdClick()}
          disabled={!onAdClick}
          className="bg-white/90 backdrop-blur-sm border-b border-gray-200 p-3 flex items-center gap-3 sticky top-[64px] z-10 shadow-sm w-full text-left active:bg-gray-50 transition-colors"
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
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[80%] rounded-xl p-3 relative shadow-sm text-sm ${msg.isMine
              ? 'bg-[#dcf8c6] self-end rounded-tr-none'
              : 'bg-white self-start rounded-tl-none'
              }`}
          >
            {msg.imageUrl ? (
              <div className="mb-1">
                <img
                  src={msg.imageUrl}
                  alt="Imagem enviada"
                  className="rounded-lg max-h-64 object-cover w-full"
                />
              </div>
            ) : (
              <p className="text-gray-800 leading-relaxed pr-6">{msg.text}</p>
            )}

            <div className={`flex items-center gap-1 mt-1 ${msg.imageUrl ? 'justify-end absolute bottom-2 right-2 bg-black/30 px-1.5 py-0.5 rounded-full backdrop-blur-sm' : 'justify-end'}`}>
              <span className={`text-[10px] ${msg.imageUrl ? 'text-white' : 'text-gray-500'}`}>{msg.time}</span>
              {msg.isMine && (
                <>
                  {msg.isRead && chat.readReceipts !== false ? (
                    <CheckCheck className={`w-3 h-3 ${msg.imageUrl ? 'text-white' : 'text-blue-500'}`} />
                  ) : (
                    <Check className={`w-3 h-3 ${msg.imageUrl ? 'text-white' : 'text-gray-400'}`} />
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSend}
        className="bg-white p-3 flex items-center gap-2 sticky bottom-0 border-t border-gray-200"
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg"
          multiple
          className="hidden"
        />

        <button
          type="button"
          onClick={handleAttachClick}
          disabled={isUploading}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          title="Anexar imagens"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Digite uma mensagem"
          disabled={isUploading}
          className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary text-gray-800 disabled:bg-gray-50"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isUploading}
          className={`p-3 rounded-full transition-colors flex items-center justify-center ${inputText.trim() ? 'bg-primary text-white shadow-md' : 'bg-gray-200 text-gray-400'
            }`}
        >
          <Send className="w-5 h-5 ml-0.5" />
        </button>
      </form>
    </div>
  );
};
