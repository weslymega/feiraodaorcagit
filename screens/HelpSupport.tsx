
import React, { useState } from 'react';
import { Mail, MessageCircle, HelpCircle, Send, ChevronRight } from 'lucide-react';
import { Header } from '../components/Shared';

interface HelpSupportProps {
  onBack: () => void;
}

export const HelpSupport: React.FC<HelpSupportProps> = ({ onBack }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailTo = "Feirãodaorcadf@gmail.com";
    const emailSubject = encodeURIComponent(subject || "Suporte - Feirão da Orca");
    const emailBody = encodeURIComponent(message);
    
    // Open default mail client
    window.location.href = `mailto:${emailTo}?subject=${emailSubject}&body=${emailBody}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-6 animate-in slide-in-from-right duration-300">
      <Header title="Ajuda e Suporte" onBack={onBack} />

      <div className="p-6">
        
        {/* Intro Section */}
        <div className="flex flex-col items-center mb-8 text-center">
           <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-primary">
              <HelpCircle className="w-8 h-8" />
           </div>
           <h2 className="text-xl font-bold text-gray-900 mb-2">Como podemos ajudar?</h2>
           <p className="text-gray-500 text-sm max-w-xs">
             Tem alguma dúvida, sugestão ou encontrou um problema? Entre em contato com a nossa equipe.
           </p>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Enviar E-mail
          </h3>

          <form onSubmit={handleSendEmail} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assunto</label>
              <input 
                type="text" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Problema com anúncio"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
              <textarea 
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Descreva detalhadamente como podemos te ajudar..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-800 resize-none"
              ></textarea>
            </div>

            <button 
              type="submit"
              className="mt-2 bg-primary text-white py-3.5 rounded-xl font-bold shadow-lg shadow-purple-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Send className="w-4 h-4" />
              Enviar Mensagem
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              E-mail direto: <span className="text-primary font-medium">Feirãodaorcadf@gmail.com</span>
            </p>
          </div>
        </div>

        {/* FAQ Teaser */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="p-4 bg-gray-50 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">Perguntas Frequentes</h3>
           </div>
           
           <button className="w-full p-4 text-left border-b border-gray-100 flex justify-between items-center hover:bg-gray-50 transition-colors">
              <span className="text-sm text-gray-600">Como criar um anúncio?</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
           </button>
           <button className="w-full p-4 text-left border-b border-gray-100 flex justify-between items-center hover:bg-gray-50 transition-colors">
              <span className="text-sm text-gray-600">Dicas de segurança</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
           </button>
           <button className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors">
              <span className="text-sm text-gray-600">Política de reembolso</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
           </button>
        </div>

      </div>
    </div>
  );
};
