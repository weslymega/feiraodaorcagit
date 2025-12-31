
import React from 'react';
import { MessageSquare, Clock, Check, Bell, X } from 'lucide-react';
import { Header } from '../components/Shared';
import { NotificationItem } from '../types';

interface NotificationsProps {
  onBack: () => void;
  onGoToChat: () => void;
  items: NotificationItem[];
}

export const Notifications: React.FC<NotificationsProps> = ({ onBack, onGoToChat, items }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-6 animate-in slide-in-from-right duration-300">
      <Header 
        title="Notificações" 
        onBack={onBack}
        rightElement={
          items.length > 0 ? (
            <button className="text-xs font-bold text-primary" onClick={() => alert("Todas marcadas como lidas")}>
              Limpar
            </button>
          ) : null
        } 
      />

      <div className="flex flex-col">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
               <Bell className="w-8 h-8 text-gray-300" />
             </div>
             <p className="font-medium">Nenhuma notificação nova.</p>
          </div>
        ) : (
          items.map((item) => (
            <div 
              key={item.id} 
              onClick={() => item.type === 'chat' ? onGoToChat() : null}
              className={`p-4 border-b border-gray-100 flex gap-4 cursor-pointer transition-colors ${
                item.unread ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-100'
              }`}
            >
              <div className="relative flex-shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    item.title.includes('Rejeitado') ? 'bg-red-100 text-red-500' : 'bg-accent/10 text-accent'
                  }`}>
                    {item.title.includes('Rejeitado') ? <X className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                  </div>
                )}
                
                {item.type === 'chat' && (
                  <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full">
                    <div className="bg-primary p-1 rounded-full">
                        <MessageSquare className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-semibold text-sm truncate ${item.unread ? 'text-gray-900' : 'text-gray-600'}`}>
                    {item.title}
                  </h3>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1 flex-shrink-0">
                    {item.time}
                  </span>
                </div>
                <p className={`text-sm line-clamp-2 ${item.unread ? 'text-gray-800' : 'text-gray-500'}`}>
                  {item.message}
                </p>
              </div>

              {item.unread && (
                <div className="flex items-center self-center">
                  <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
