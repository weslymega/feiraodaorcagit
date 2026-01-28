import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface MercadoPagoBrickProps {
    adId: string;
    planId: string;
    amount: number;
    onSuccess: (payment: any) => void;
    onError: (error: any) => void;
}

declare global {
    interface Window {
        MercadoPago: any;
    }
}

const MercadoPagoBrick: React.FC<MercadoPagoBrickProps> = ({ adId, planId, amount, onSuccess, onError }) => {
    const [loading, setLoading] = useState(true);
    const publicKey = api.getMPPublicKey();

    useEffect(() => {
        const scriptId = 'mercadopago-sdk';
        let script = document.getElementById(scriptId) as HTMLScriptElement;

        const initBrick = async () => {
            if (!window.MercadoPago) return;

            const mp = new window.MercadoPago(publicKey, {
                locale: 'pt-BR'
            });

            const bricksBuilder = mp.bricks();

            const settings = {
                initialization: {
                    amount: amount, // Valor total a pagar
                },
                customization: {
                    paymentMethods: {
                        ticket: ["pix"],
                        creditCard: "all",
                    },
                    visual: {
                        style: {
                            theme: "default", // or 'dark'
                        },
                    },
                },
                callbacks: {
                    onReady: () => {
                        setLoading(false);
                    },
                    onSubmit: async ({ selectedPaymentMethod, formData }: any) => {
                        try {
                            // formData contains token, issuer_id, payment_method_id, installments, payer
                            const result = await api.processHighlightPayment(adId, planId, formData);
                            onSuccess(result);
                        } catch (error) {
                            console.error('Submission error:', error);
                            onError(error);
                        }
                    },
                    onError: (error: any) => {
                        console.error('Brick Error:', error);
                        onError(error);
                    },
                },
            };

            await bricksBuilder.create("payment", "paymentBrick_container", settings);
        };

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://sdk.mercadopago.com/js/v2';
            script.async = true;
            script.onload = () => initBrick();
            document.body.appendChild(script);
        } else if (window.MercadoPago) {
            initBrick();
        }

        return () => {
            // Clean up if necessary, though Bricks are usually managed by the SDK
            const container = document.getElementById('paymentBrick_container');
            if (container) container.innerHTML = '';
        };
    }, [adId, planId, amount, publicKey]);

    return (
        <div className="w-full">
            {loading && (
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium animate-pulse">Carregando Mercado Pago...</p>
                </div>
            )}
            <div id="paymentBrick_container" className={`${loading ? 'hidden' : 'block'}`}></div>
        </div>
    );
};

export default MercadoPagoBrick;
