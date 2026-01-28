import { useState, useEffect } from 'react';
import { getPaymentFeedback } from '../utils/paymentMapping';

export interface PaymentStatusData {
    status: 'approved' | 'rejected' | 'in_process' | 'pending' | 'cancelled' | null;
    paymentId: string | null;
    externalReference: string | null;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    details?: string;
}

export const usePaymentReturn = () => {
    const [statusData, setStatusData] = useState<PaymentStatusData | null>(null);

    useEffect(() => {
        // Check if we are in a browser environment
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams(window.location.search);
        const status = params.get('status');
        const paymentId = params.get('payment_id'); // Mercado Pago standard
        const externalReference = params.get('external_reference');
        const statusDetail = params.get('status_detail');

        if (status && paymentId) {
            // Get specific feedback based on status and status_detail
            const feedback = getPaymentFeedback(status, statusDetail);

            // Determine the type based on status
            let type: PaymentStatusData['type'] = 'info';
            if (status === 'approved') type = 'success';
            else if (status === 'rejected') type = 'error';
            else if (status === 'in_process' || status === 'pending') type = 'warning';

            // Add payment_id to details if available, or keep status_detail if useful
            const details = statusDetail ? `Código: ${statusDetail}` : undefined;

            const data: PaymentStatusData = {
                status: status as any,
                paymentId,
                externalReference,
                title: feedback.title,
                message: feedback.message,
                type,
                details
            };

            setStatusData(data);

            // 2. Clean URL to prevent showing the message again on refresh
            const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({ path: newUrl }, '', newUrl);
        }
    }, []);

    const clearStatus = () => {
        setStatusData(null);
    };

    return {
        statusData,
        clearStatus
    };
};
