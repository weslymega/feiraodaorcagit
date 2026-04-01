import React from 'react';
import { MarketPriceItem } from '../../types';
import { MarketPriceCard } from '../ui/MarketPriceCard';
import { ChevronRight, BarChart2 } from 'lucide-react';

interface MarketPriceSectionProps {
  items: MarketPriceItem[];
  onItemClick: (item: MarketPriceItem) => void;
  isLoading?: boolean;
}

export const MarketPriceSection: React.FC<MarketPriceSectionProps> = ({ 
  items, onItemClick, isLoading 
}) => {
  if (!isLoading && items.length === 0) return null;

  return (
    <div className="mb-10 animate-in slide-in-from-right duration-500">
      <div className="px-5 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-100 rounded-xl border border-blue-200">
            <BarChart2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-lg leading-tight flex items-center gap-1.5">
              📊 Preço médio do mercado
            </h2>
            <p className="text-[10px] text-gray-500 font-medium">Valores reais baseados na Tabela FIPE</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto px-5 pb-6 no-scrollbar snap-x snap-mandatory">
        {isLoading ? (
          // Skeleton loader
          [1, 2, 3].map((i) => (
            <div key={`market-skeleton-${i}`} className="min-w-[150px] w-[150px] h-36 bg-gray-100 animate-pulse rounded-2xl" />
          ))
        ) : (
          items.map((item) => (
            <MarketPriceCard key={item.id} item={item} onClick={onItemClick} />
          ))
        )}
      </div>

      {/* Play Store Compliance / Disclaimer */}
      <div className="px-6 mb-2">
        <div className="bg-gray-100/50 rounded-xl p-3 border border-gray-100">
          <p className="text-[10px] text-gray-500 leading-tight italic font-medium">
            "Valores baseados na Tabela FIPE. Podem variar conforme o estado do veículo."
          </p>
        </div>
      </div>
    </div>
  );
};
