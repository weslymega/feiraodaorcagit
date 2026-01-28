import React, { useEffect } from 'react';
import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    Info,
    X
} from 'lucide-react';
import { usePaymentReturn } from '../hooks/usePaymentReturn';

export const PaymentStatusFeedback: React.FC = () => {
    const { statusData, clearStatus } = usePaymentReturn();

    // If no status data, don't render anything
    if (!statusData) return null;

    const { title, message, type, details } = statusData;

    // Icon mapping based on type
    const iconMap = {
        success: <CheckCircle className="w-16 h-16 text-green-500 mb-4" />,
        error: <XCircle className="w-16 h-16 text-red-500 mb-4" />,
        warning: <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />,
        info: <Info className="w-16 h-16 text-blue-500 mb-4" />
    };

    // Button style mapping
    const buttonStyleMap = {
        success: 'bg-green-600 hover:bg-green-700 shadow-green-200',
        error: 'bg-red-600 hover:bg-red-700 shadow-red-200',
        warning: 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-200 text-white',
        info: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
    };

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col relative">

                {/* Close Button (Top Right) */}
                <button
                    onClick={clearStatus}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <X className="w-6 h-6 text-gray-400" />
                </button>

                <div className="p-8 flex flex-col items-center text-center">
                    {/* Animated Icon Container */}
                    <div className="mb-2 relative">
                        <div className="absolute inset-0 bg-current opacity-10 blur-xl rounded-full scale-150 animate-pulse"></div>
                        {iconMap[type]}
                    </div>

                    <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                        {title}
                    </h3>

                    <p className="text-gray-600 font-medium mb-6 leading-relaxed">
                        {message}
                    </p>

                    {details && (
                        <div className={`w-full p-4 rounded-xl mb-6 text-sm ${type === 'error' ? 'bg-red-50 text-red-800 border border-red-100' :
                            type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-100' :
                                'bg-gray-50 text-gray-700'
                            }`}>
                            <p className="font-bold mb-1 opacity-80 uppercase text-[10px] tracking-wider">Detalhes</p>
                            {details}
                        </div>
                    )}

                    <button
                        onClick={clearStatus}
                        className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95 ${buttonStyleMap[type]}`}
                    >
                        Entendi
                    </button>
                </div>
            </div>
        </div>
    );
};
