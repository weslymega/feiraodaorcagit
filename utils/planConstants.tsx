import React from 'react';
import { Star, Trophy, Zap } from 'lucide-react';

export interface PlanMetadata {
    icon: React.ReactNode;
    color: string;
    recommended: boolean;
    features: string[];
}

export const PLAN_METADATA: Record<string, PlanMetadata> = {
    'basic': {
        icon: <Star className="w-6 h-6 text-gray-400" />,
        color: 'border-gray-200',
        recommended: false,
        features: ['O anúncio volta ao topo 3 vezes ao longo de 7 dias', 'Destaque-se na lista de carros']
    },
    'classic': { // Adaptando para nomes comuns do banco se houver variação
        icon: <Star className="w-6 h-6 text-gray-400" />,
        color: 'border-gray-200',
        recommended: false,
        features: ['O anúncio volta ao topo 3 vezes ao longo de 7 dias']
    },
    'premium': {
        icon: <Trophy className="w-6 h-6 text-yellow-500 fill-current" />,
        color: 'border-yellow-400',
        recommended: false,
        features: ['O anúncio volta ao topo 5 vezes ao longo de 15 dias', 'Permaneça no topo das recomendações']
    },
    'advanced': { // Mapeando 'advanced' do código antigo para algo visualmente similar ao Premium se necessário, ou definindo o seu próprio
        icon: <Trophy className="w-6 h-6 text-yellow-500 fill-current" />,
        color: 'border-gray-200',
        recommended: false,
        features: ['O anúncio volta ao topo 5 vezes ao longo de 15 dias']
    },
    'top': {
        icon: <Zap className="w-6 h-6 text-cyan-500 fill-current" />,
        color: 'border-primary',
        recommended: true,
        features: ['Volta ao topo 10 vezes em 30 dias', 'Visibilidade máxima', 'Mais de 10 mil acessos/dia']
    },
    'topo': { // Caso o nome no banco seja 'topo'
        icon: <Zap className="w-6 h-6 text-cyan-500 fill-current" />,
        color: 'border-primary',
        recommended: true,
        features: ['Volta ao topo 10 vezes em 30 dias', 'Visibilidade máxima']
    }
};

export const getPlanMetadata = (planName: string): PlanMetadata => {
    const normalized = planName.toLowerCase();
    return PLAN_METADATA[normalized] || {
        icon: <Star className="w-6 h-6 text-gray-300" />,
        color: 'border-gray-200',
        recommended: false,
        features: ['Destaque seu anúncio']
    };
};
