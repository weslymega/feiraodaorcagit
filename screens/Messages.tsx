
import React from 'react';
import { MoreVertical, Search } from 'lucide-react';
import { MessageItem } from '../types';

interface MessagesProps {
  messages: MessageItem[];
  onBack: () => void; // Usually dashboard is back, but just in case
  onSelectChat: (chat: MessageItem) => void;
}

export const Messages: React.FC<MessagesProps> = ({ messages, onBack, onSelectChat }) => {
  return (
    <div className="min-h-screen bg-white pb-24 animate-in fade-in duration-300">
      <div className="sticky top-0 z-50 bg-white px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900 ml-2">Mensagens</h1>
        </div>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-full"><Search className="w-6 h-6 text-gray-800" /></button>
          <button className="p-2 hover:bg-gray-100 rounded-full"><MoreVertical className="w-6 h-6 text-gray-600" /></button>
        </div>
      </div>

      <div className="flex flex-col">
        {messages.map((msg) => (
          <button
            key={msg.id}
            onClick={() => onSelectChat(msg)}
            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 text-left active:bg-gray-100"
          >
            <div className="relative">
              <img src={msg.avatarUrl} alt={msg.senderName} className="w-14 h-14 rounded-full object-cover" />
              {msg.online && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-semibold text-gray-900 truncate">{msg.senderName}</h3>
                <span className={`text-xs ${msg.unreadCount > 0 ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                  {msg.time}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex flex-col min-w-0 pr-2">
                  {msg.adTitle && (
                    <span className="text-[10px] text-primary font-medium truncate mb-0.5">{msg.adTitle}</span>
                  )}
                  <p className={`text-sm truncate ${msg.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                    {msg.lastMessage}
                  </p>
                </div>
                {msg.unreadCount > 0 && (
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[10px] font-bold">{msg.unreadCount}</span>
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
