
import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, description: string) => Promise<void> | void;
  adTitle: string;
}

const REPORT_REASONS = [
  'Fraude / Tentativa de Golpe',
  'Conteúdo Impróprio ou Ofensivo',
  'Produto já vendido',
  'Preço Falso / Abusivo',
  'Categoria Errada',
  'Fotos não correspondem ao produto',
  'Outro'
];

const MAX_CHARS = 500;

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, onSubmit, adTitle }) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [step, setStep] = useState<'reason' | 'details' | 'success' | 'error'>('reason');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleNext = () => {
    if (selectedReason) setStep('details');
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const result = onSubmit(selectedReason!, description);

      // Wait if it's a promise
      if (result instanceof Promise) {
        await result;
      }

      setStep('success');
      setTimeout(() => {
        handleClose();
      }, 2500);
    } catch (error) {
      console.error("Submission error:", error);
      setStep('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('reason');
    setSelectedReason(null);
    setDescription('');
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={handleClose} />

      <div className="bg-white w-full max-w-sm sm:rounded-2xl rounded-t-[30px] shadow-2xl relative animate-in slide-in-from-bottom duration-300 overflow-hidden flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Denunciar Anúncio
          </h2>
          <button onClick={handleClose} className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">

          {step === 'reason' && (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
              <p className="text-sm text-gray-600 mb-2">
                Qual o problema com o anúncio <span className="font-bold">"{adTitle}"</span>?
              </p>
              <div className="flex flex-col gap-2">
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setSelectedReason(reason)}
                    className={`p-4 rounded-xl text-left text-sm font-medium transition-all flex items-center justify-between group ${selectedReason === reason
                      ? 'bg-red-50 border-2 border-red-500 text-red-700'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    {reason}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedReason === reason ? 'border-red-500 bg-red-500' : 'border-gray-300'
                      }`}>
                      {selectedReason === reason && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={handleNext}
                disabled={!selectedReason}
                className={`w-full py-4 mt-4 rounded-xl font-bold transition-all ${selectedReason
                  ? 'bg-red-600 text-white shadow-lg shadow-red-200 active:scale-[0.98]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                Continuar
              </button>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Motivo Selecionado</p>
                <p className="font-bold text-gray-900 mb-4">{selectedReason}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Relate o problema com suas palavras
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={MAX_CHARS}
                  placeholder="Descreva detalhadamente o que você encontrou de errado neste anúncio..."
                  className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none text-sm text-gray-800"
                />
                <div className="flex justify-end mt-1">
                  <span className={`text-xs font-medium ${description.length >= MAX_CHARS ? 'text-red-500' : 'text-gray-400'
                    }`}>
                    {description.length}/{MAX_CHARS} caracteres
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep('reason')}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl"
                >
                  Voltar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Enviar Denúncia'}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Denúncia Enviada</h3>
              <p className="text-center text-gray-500 text-sm">
                Obrigado por ajudar a manter nossa comunidade segura. Vamos analisar o caso.
              </p>
            </div>
          )}

          {step === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Erro ao Enviar</h3>
              <p className="text-center text-gray-500 text-sm mb-6">
                Não foi possível enviar sua denúncia no momento. Por favor, tente novamente.
              </p>
              <button
                onClick={() => setStep('details')}
                className="px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg"
              >
                Tentar Novamente
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
