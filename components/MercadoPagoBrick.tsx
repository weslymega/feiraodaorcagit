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
    const initializerRef = React.useRef(false);
    const publicKey = api.getMPPublicKey();

    useEffect(() => {
        const scriptId = 'mercadopago-sdk';
        let script = document.getElementById(scriptId) as HTMLScriptElement;

        const initBrick = async () => {
            if (!window.MercadoPago || initializerRef.current) return;

            try {
                initializerRef.current = true;
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
                                console.log('[MercadoPagoBrick] Submitting payment...', {
                                    adId,
                                    planId,
                                    paymentMethod: selectedPaymentMethod,
                                    hasDeviceId: !!formData.device_id,
                                    formDataKeys: Object.keys(formData)
                                });

                                const result = await api.processHighlightPayment(adId, planId, formData);

                                console.log('[MercadoPagoBrick] Payment successful:', result);
                                onSuccess(result);
                            } catch (error: any) {
                                console.error('[MercadoPagoBrick] Payment failed - RAW ERROR:', error);

                                let details = error;
                                let responseBody = null;

                                // Try to extract response body from Supabase error
                                try {
                                    if (error.context instanceof Response) {
                                        const responseText = await error.context.clone().text();
                                        console.error('[MercadoPagoBrick] Response text:', responseText);
                                        try {
                                            responseBody = JSON.parse(responseText);
                                        } catch (e) {
                                            responseBody = responseText;
                                        }
                                    }
                                } catch (e) {
                                    console.error('[MercadoPagoBrick] Could not parse error body', e);
                                }

                                console.error('[MercadoPagoBrick] Detailed error:', {
                                    message: error.message,
                                    status: error.status,
                                    name: error.name,
                                    responseBody,
                                    details,
                                    fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
                                });

                                onError(error);
                            }
                        },
                        onError: (error: any) => {
                            console.error('Brick Error:', error);
                            setLoading(false);
                            onError(error);
                        },
                    },
                };

                // Clear previous instances
                const container = document.getElementById('paymentBrick_container');
                if (container) container.innerHTML = '';

                await bricksBuilder.create("payment", "paymentBrick_container", settings);
            } catch (error) {
                console.error('Failed to initialize Mercado Pago Brick:', error);
                setLoading(false);
                initializerRef.current = false;
                onError(error);
            }
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
            initializerRef.current = false;
            const container = document.getElementById('paymentBrick_container');
            if (container) container.innerHTML = '';
        };
    }, [adId, planId, amount, publicKey, onError, onSuccess]);

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
