
export interface AvatarLibraryItem {
  id: string;
  name: string;
  frameCount: number;
  fps: number;
  description: string;
  personality: string;
  isGrid?: boolean; // Regra 5: Identifica se o sprite é grid (não suportado para animação)
}


const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://xkkjjvrucnlilegwnoey.supabase.co').trim();
export const AVATAR_BUCKET_URL = `${SUPABASE_URL}/storage/v1/object/public/avatars`;

export const AVATAR_LIBRARY: AvatarLibraryItem[] = [
  { 
    id: 'orca_buyer', 
    name: 'Comprador Confiante', 
    frameCount: 6, 
    fps: 8,
    description: 'Focado em fechar bons negócios com segurança.',
    personality: 'Seguro, decidido e atento.'
  },
  { 
    id: 'orca_seller', 
    name: 'Vendedor Amigável', 
    frameCount: 6, 
    fps: 10,
    description: 'Sempre pronto para uma boa conversa e negociação.',
    personality: 'Carismático, solícito e ágil.'
  },
  { 
    id: 'orca_detective', 
    name: 'Detetive de Ofertas', 
    frameCount: 6, 
    fps: 12,
    description: 'Encontra detalhes que ninguém mais vê nas negociações.',
    personality: 'Analítico, atento e persistente.'
  },
  { 
    id: 'orca_sweet', 
    name: 'Orca Gentil', 
    frameCount: 6, 
    fps: 8,
    description: 'Uma presença amigável que facilita qualquer acordo.',
    personality: 'Calma, educada e empática.'
  },
  { 
    id: 'orca_explorer', 
    name: 'Exploradora de Mercados', 
    frameCount: 6, 
    fps: 10,
    description: 'Sempre buscando novas regiões e oportunidades.',
    personality: 'Curiosa, aventureira e informada.'
  },
  { 
    id: 'orca_millionaire', 
    name: 'Magnata das Ofertas', 
    frameCount: 6, 
    fps: 10,
    description: 'Experiente e focado em investimentos de alto valor.',
    personality: 'Ambicioso, estratégico e seguro.'
  },
  { 
    id: 'orca_astronaut', 
    name: 'Orca das Estrelas', 
    frameCount: 6, 
    fps: 12,
    description: 'Seu anúncio vai chegar onde ninguém mais alcança.',
    personality: 'Visionário, futurista e ousado.'
  },
  { 
    id: 'orca_mafia', 
    name: 'Orca Influente', 
    frameCount: 6, 
    fps: 8,
    description: 'Conhece todos os atalhos para um negócio de sucesso.',
    personality: 'Elegante, respeitado e firme.'
  },
  { 
    id: 'orca_family', 
    name: 'Família Orca', 
    frameCount: 6, 
    fps: 8,
    description: 'Segurança e confiança para toda a família.',
    personality: 'Protetor, alegre e unido.'
  },
  { 
    id: 'orca_investor', 
    name: 'Orca Investidora', 
    frameCount: 6, 
    fps: 10,
    description: 'Sempre de olho no melhor retorno sobre o investimento.',
    personality: 'Séria, analítica e visionária.'
  },
  { 
    id: 'orca_premium', 
    name: 'Orca Premium', 
    frameCount: 6, 
    fps: 12,
    description: 'Exclusividade e sofisticação em cada detalhe.',
    personality: 'Refinada, seleta e exigente.'
  },
  { 
    id: 'orca_sport', 
    name: 'Orca Esportista', 
    frameCount: 6, 
    fps: 10,
    description: 'Agilidade e potência para quem vive em movimento.',
    personality: 'Energética, rápida e competitiva.'
  },

];

export const getAvatarSpriteUrl = (id: string) => `/avatars/${id}/sprite.png`;
export const getAvatarStaticUrl = (id: string) => `/avatars/${id}/static.png`;
