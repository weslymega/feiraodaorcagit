import React from 'react';
import { MarketPriceItem } from '../../types';
import { TrendingUp } from 'lucide-react';

interface MarketPriceCardProps {
  item: MarketPriceItem;
  onClick: (item: MarketPriceItem) => void;
}

export const MarketPriceCard: React.FC<MarketPriceCardProps> = ({ item, onClick }) => {
  return (
    <div
      onClick={() => onClick(item)}
      className="min-w-[150px] w-[150px] bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between snap-start active:scale-[0.98] transition-all hover:shadow-md cursor-pointer"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
          <span className="text-[10px] font-bold text-primary uppercase">FIPE</span>
        </div>
        <TrendingUp className="w-4 h-4 text-green-500" />
      </div>

      <div className="flex flex-col">
        <h3 className="text-xs font-bold text-gray-900 leading-tight mb-1 line-clamp-1">
          {item.brand} {item.model}
        </h3>
        <p className="text-[10px] text-gray-400 mb-2 truncate">
          Referência {item.year}
        </p>
        
        <p className="text-sm font-black text-primary">
          {item.price}
        </p>
      </div>

      <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between">
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Ver Ofertas</span>
        <div className="w-4 h-4 rounded-full bg-blue-50 flex items-center justify-center text-primary">
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
};
