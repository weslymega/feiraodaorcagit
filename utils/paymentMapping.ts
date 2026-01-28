export interface PaymentStatusMessage {
    title: string;
    message: string;
}

export type PaymentStatusDetail =
    | 'cc_rejected_insufficient_amount'
    | 'cc_rejected_bad_filled_card_number'
    | 'cc_rejected_bad_filled_date'
    | 'cc_rejected_bad_filled_security_code'
    | 'cc_rejected_high_risk'
    | 'cc_rejected_blacklist'
    | 'cc_rejected_other_reason'
    | 'cc_rejected_call_for_authorize'
    | 'cc_rejected_card_disabled'
    | 'cc_rejected_card_error'
    | 'cc_rejected_duplicated_payment'
    | 'cc_rejected_invalid_installments'
    | 'cc_rejected_max_attempts'
    | 'pending_contingency'
    | 'pending_review_manual'
    | 'pending_waiting_payment'
    | 'pending_waiting_transfer'
    | 'in_process'
    | string; // Allow fallback for unknown statuses

export const statusDetailMessages: Record<string, PaymentStatusMessage> = {
    // 💳 Cartão recusado
    cc_rejected_insufficient_amount: {
        title: "Saldo insuficiente",
        message: "Seu cartão não possui limite suficiente para esta transação. Por favor, tente outro cartão ou entre em contato com seu banco."
    },
    cc_rejected_bad_filled_card_number: {
        title: "Número do cartão inválido",
        message: "Verifique o número do cartão digitado e tente novamente."
    },
    cc_rejected_bad_filled_date: {
        title: "Data de validade incorreta",
        message: "Verifique a data de validade do cartão e tente novamente."
    },
    cc_rejected_bad_filled_security_code: {
        title: "Código de segurança inválido",
        message: "Verifique o código de segurança (CVV) no verso do cartão e tente novamente."
    },
    cc_rejected_high_risk: {
        title: "Pagamento não autorizado",
        message: "O pagamento foi recusado por motivos de segurança do emissor do cartão. Recomendamos tentar outro cartão ou forma de pagamento."
    },
    cc_rejected_blacklist: {
        title: "Pagamento recusado",
        message: "Não foi possível processar seu pagamento. Por favor, tente outra forma de pagamento."
    },
    cc_rejected_other_reason: {
        title: "Pagamento não processado",
        message: "O emissor do cartão não autorizou o pagamento. Entre em contato com seu banco ou tente outro cartão."
    },
    cc_rejected_call_for_authorize: {
        title: "Autorização necessária",
        message: "O pagamento requer autorização prévia. Entre em contato com o banco emissor do cartão para liberar a transação."
    },
    cc_rejected_card_disabled: {
        title: "Cartão inativo",
        message: "O cartão utilizado não está ativo. Entre em contato com seu banco para ativá-lo ou use outro cartão."
    },
    cc_rejected_card_error: {
        title: "Erro no processamento",
        message: "Não foi possível processar o pagamento. Verifique os dados do cartão e tente novamente."
    },
    cc_rejected_duplicated_payment: {
        title: "Pagamento duplicado",
        message: "Identificamos uma tentativa de pagamento duplicada. Verifique se a cobrança já foi realizada ou aguarde alguns instantes."
    },
    cc_rejected_invalid_installments: {
        title: "Parcelamento inválido",
        message: "A quantidade de parcelas selecionada não é válida para este cartão. Tente outra opção de parcelamento."
    },
    cc_rejected_max_attempts: {
        title: "Limite de tentativas excedido",
        message: "Você atingiu o limite de tentativas. Por favor, tente novamente mais tarde ou use outro cartão."
    },

    // ⏳ Pendentes
    pending_contingency: {
        title: "Pagamento em processamento",
        message: "Estamos processando seu pagamento. Não se preocupe, em breve você receberá a confirmação por e-mail."
    },
    pending_review_manual: {
        title: "Pagamento em análise",
        message: "Seu pagamento está passando por uma revisão de segurança padrão. Isso pode levar algumas horas, avisaremos assim que for concluído."
    },
    pending_waiting_payment: {
        title: "Aguardando pagamento",
        message: "Aguardando a confirmação do pagamento. Assim que identificado, seu destaque será ativado automaticamente."
    },
    pending_waiting_transfer: {
        title: "Aguardando transferência",
        message: "Aguardando a confirmação da transferência bancária. O destaque será ativado assim que o valor for recebido."
    },

    // 🔁 Em processo
    in_process: {
        title: "Pagamento em análise",
        message: "Estamos validando o pagamento. Isso geralmente leva apenas alguns instantes."
    }
};

export const getPaymentFeedback = (status: string, statusDetail: string | null) => {
    // 1. Tenta mensagem específica pelo status_detail
    if (statusDetail && statusDetailMessages[statusDetail]) {
        return statusDetailMessages[statusDetail];
    }

    // 2. Fallback genérico pelo status
    switch (status) {
        case 'approved':
            return {
                title: "Pagamento Aprovado!",
                message: "Seu destaque está sendo ativado e logo aparecerá nas buscas para todos os usuários."
            };
        case 'in_process':
        case 'pending':
            return {
                title: "Pagamento em Análise",
                message: "Estamos processando seu pagamento. Assim que confirmado, seu destaque será ativado automaticamente."
            };
        case 'rejected':
            return {
                title: "Pagamento Recusado",
                message: "Não foi possível processar seu pagamento. Verifique os dados e tente novamente ou use outro meio de pagamento."
            };
        case 'cancelled':
            return {
                title: "Pagamento Cancelado",
                message: "A operação de pagamento foi cancelada. Nenhum valor foi cobrado."
            };
        default:
            return {
                title: "Status do Pagamento",
                message: `Status recebido: ${status}. Aguarde a confirmação.`
            };
    }
};
