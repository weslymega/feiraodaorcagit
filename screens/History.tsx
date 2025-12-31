import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Header, PriceTag } from '../components/Shared';
import { AdItem, AdStatus, TransactionData } from '../types';

interface HistoryProps {
  history: AdItem[];
  chartData: TransactionData[];
  onBack: () => void;
  onAdClick?: (ad: AdItem) => void;
}

export const History: React.FC<HistoryProps> = ({ history, chartData, onBack, onAdClick }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <Header title="Histórico" onBack={onBack} />

      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button className="flex-1 py-4 text-sm font-medium text-slate-900 border-b-2 border-accent">
            Tudo
          </button>
          <button className="flex-1 py-4 text-sm font-medium text-gray-500 border-b-2 border-transparent">
            Compras
          </button>
          <button className="flex-1 py-4 text-sm font-medium text-gray-500 border-b-2 border-transparent">
            Vendas
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Analytics Chart */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Volume de Negociações (6 meses)</h3>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/>
                <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {history.map((item) => (
            <div 
              key={item.id} 
              onClick={() => onAdClick && onAdClick(item)}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer active:scale-[0.99] transition-transform"
            >
              <img src={item.image} alt={item.title} className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                   <h3 className="font-semibold text-gray-900 line-clamp-1">{item.title}</h3>
                   <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                     item.status === AdStatus.BOUGHT ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                   }`}>
                     {item.status}
                   </span>
                </div>
                <p className="text-xs text-gray-400 mb-1">{item.date}</p>
                <PriceTag value={item.price} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};