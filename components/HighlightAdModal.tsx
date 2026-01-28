import React, { useState, useEffect } from 'react';
import { X, Zap, Check, ShieldCheck, CreditCard, QrCode, TrendingUp, AlertCircle } from 'lucide-react';
import { AdItem, HighlightPlan } from '../types';
import { api } from '../services/api';
import MercadoPagoBrick from './MercadoPagoBrick';
import { supabase } from '../services/api';

interface HighlightAdModalProps {
    ad: AdItem;
    onClose: () => void;
    onSuccess?: () => void;
}

export const HighlightAdModal: React.FC<HighlightAdModalProps> = ({ ad, onClose, onSuccess }) => {
    const [plans, setPlans] = useState<HighlightPlan[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<HighlightPlan | null>(null);
    const [step, setStep] = useState<'plans' | 'payment' | 'success'>('plans');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [paymentResult, setPaymentResult] = useState<any>(null);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const data = await api.getHighlightPlans();
                setPlans(data);
                // Pre-select middle plan if available
                if (data.length > 0) {
                    setSelectedPlan(data[Math.floor(data.length / 2)]);
                }
            } catch (err) {
                console.error('Error fetching plans:', err);
                setError('Não foi possível carregar os planos. Tente novamente.');
            } finally {
                setLoading(false);
            }
        };

        fetchPlans();

        // Listen for Realtime updates to the highlight status
        const subscription = supabase
            .channel('highlight_updates')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'ad_highlights',
                filter: `ad_id=eq.${ad.id}`
            }, (payload) => {
                console.log('Highlight activated via Realtime!', payload);
                setStep('success');
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [ad.id]);

    const handleSelectPlan = (plan: HighlightPlan) => {
        setSelectedPlan(plan);
    };

    const handleContinueToPayment = () => {
        if (selectedPlan) {
            setStep('payment');
        }
    };

    const handlePaymentSuccess = (result: any) => {
        setPaymentResult(result);
        if (result.status === 'approved') {
            setStep('success');
            if (onSuccess) onSuccess();
        } else if (result.status === 'in_process') {
            // Probably PIX QR Code shown or card in analysis
            console.log('Payment in process...', result);
        }
    };

    const handlePaymentError = (err: any) => {
        setError('Ocorreu um erro ao processar o pagamento. Verifique os dados e tente novamente.');
    };

    const isPixPayment = paymentResult?.payment_method_id === 'pix';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <Zap className="w-6 h-6 text-accent fill-accent" />
                            {step === 'success' ? 'Parabéns!' : 'Destacar Anúncio'}
                        </h3>
                        <p className="text-sm text-gray-500 font-medium">{ad.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-500 font-medium text-sm">Preparando planos...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-red-800 text-sm font-bold">Erro</p>
                                <p className="text-red-600 text-xs mt-1">{error}</p>
                                <button onClick={() => window.location.reload()} className="mt-3 text-xs font-black uppercase tracking-wider text-red-700 underline decoration-2">
                                    Tentar novamente
                                </button>
                            </div>
                        </div>
                    ) : step === 'plans' ? (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-4 rounded-2xl border border-blue-100 leading-relaxed font-medium">
                                Escolha um plano para que seu anúncio apareça nas primeiras posições e venda até 10x mais rápido!
                            </p>

                            {plans.map((plan) => (
                                <button
                                    key={plan.id}
                                    onClick={() => handleSelectPlan(plan)}
                                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden flex justify-between items-center group ${selectedPlan?.id === plan.id
                                            ? 'border-primary bg-blue-50/30'
                                            : 'border-gray-100 hover:border-gray-200'
                                        }`}
                                >
                                    {selectedPlan?.id === plan.id && (
                                        <div className="absolute top-0 right-0">
                                            <div className="bg-primary text-white p-1 rounded-bl-xl shadow-md animate-in slide-in-from-top slide-in-from-right duration-300">
                                                <Check className="w-4 h-4" />
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-gray-900 uppercase tracking-tight text-lg">
                                                {plan.name}
                                            </span>
                                            {plan.priority_level >= 3 && (
                                                <span className="bg-accent/10 text-accent text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest">
                                                    Melhor Valor
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-sm text-gray-500 font-medium">
                                            Duração de {plan.duration_days} dias
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-black text-primary">
                                            R$ {Number(plan.price).toFixed(2).replace('.', ',')}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                            Pagamento Único
                                        </div>
                                    </div>
                                </button>
                            ))}

                            <div className="mt-8 space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-3 text-gray-600">
                                    <ShieldCheck className="w-5 h-5 text-green-500" />
                                    <span className="text-xs font-bold uppercase tracking-tight">Pagamento 100% Seguro</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-600">
                                    <CreditCard className="w-5 h-5 text-gray-400" />
                                    <span className="text-xs font-medium">Aceitamos Cartão de Crédito e PIX</span>
                                </div>
                            </div>
                        </div>
                    ) : step === 'payment' ? (
                        <div className="space-y-6">
                            <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-100 flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] uppercase font-black tracking-widest opacity-80 mb-0.5">Plano Selecionado</p>
                                    <p className="font-black text-lg uppercase tracking-tight flex items-center gap-2">
                                        <Zap className="w-4 h-4" /> {selectedPlan?.name}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-black tracking-widest opacity-80 mb-0.5">Total a Pagar</p>
                                    <p className="font-black text-xl">R$ {Number(selectedPlan?.price).toFixed(2).replace('.', ',')}</p>
                                </div>
                            </div>

                            <MercadoPagoBrick
                                adId={ad.id}
                                planId={selectedPlan!.id}
                                amount={Number(selectedPlan!.price)}
                                onSuccess={handlePaymentSuccess}
                                onError={handlePaymentError}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-8">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 relative shadow-lg shadow-green-100">
                                <Check className="w-12 h-12 text-green-600 stroke-[4px]" />
                                <div className="absolute -top-1 -right-1">
                                    <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></div>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                                </div>
                            </div>
                            <h4 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tighter">Destaque Ativado!</h4>
                            <p className="text-gray-500 font-medium text-center max-w-xs mb-8">
                                Seu anúncio já está brilhando nas primeiras posições. Prepare-se para novos contatos!
                            </p>

                            <div className="w-full space-y-3 bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200">
                                <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
                                    <span>Início</span>
                                    <span>Expira em</span>
                                </div>
                                <div className="flex justify-between font-black text-primary">
                                    <span>Hoje</span>
                                    <span>{selectedPlan?.duration_days} dias</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {step === 'plans' && !loading && (
                    <div className="p-6 bg-white border-t border-gray-100">
                        <button
                            disabled={!selectedPlan}
                            onClick={handleContinueToPayment}
                            className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                        >
                            Continuar para Pagamento
                        </button>
                    </div>
                )}

                {step === 'success' && (
                    <div className="p-6 bg-white border-t border-gray-100">
                        <button
                            onClick={onClose}
                            className="w-full py-5 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-green-100 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            Excelente!
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
