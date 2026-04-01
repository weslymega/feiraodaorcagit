
import React from 'react';
import { MessageItem } from '../types';

interface MessagesProps {
  messages: MessageItem[];
  onBack: () => void; // Usually dashboard is back, but just in case
  onSelectChat: (chat: MessageItem) => void;
}

export const Messages: React.FC<MessagesProps> = ({ messages, onBack, onSelectChat }) => {
  return (
    <div className="min-h-screen bg-white pb-24 animate-in fade-in duration-300">
      <div className="sticky top-0 z-[100] bg-white px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900 ml-2">Mensagens</h1>
        </div>
      </div>

      <div className="flex flex-col">
        {messages.map((msg) => (
          <button
            key={msg.id}
            onClick={() => onSelectChat(msg)}
            className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 text-left active:bg-gray-100 ${
              msg.unreadCount > 0 ? 'bg-blue-50/30' : ''
            }`}
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gray-200 overflow-hidden shadow-sm">
                <img
                  src={msg.avatarUrl}
                  alt={msg.senderName}
                  className="w-full h-full object-cover"
                />
              </div>
              {msg.unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {msg.unreadCount}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-gray-900 truncate pr-2">{msg.senderName}</h3>
                <span className="text-[10px] text-gray-400 whitespace-nowrap">{msg.time}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex flex-col min-w-0 pr-2">
                  <p className={`text-sm truncate ${msg.unreadCount > 0 ? 'text-gray-950 font-medium' : 'text-gray-500'}`}>
                    {msg.lastMessage}
                  </p>
                  {msg.adTitle && (
                    <span className="text-[10px] text-primary font-bold mt-1 inline-block truncate">
                      Sobre: {msg.adTitle}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 px-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100 shadow-inner">
              <div className="w-10 h-10 text-gray-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Sem mensagens ainda</h3>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Quando você começar a conversar com vendedores ou compradores, suas mensagens aparecerão aqui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
