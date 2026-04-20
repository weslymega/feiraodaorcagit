import React, { memo } from 'react';

interface AnimatedAvatarProps {
  avatarId?: string; // Mantido para compatibilidade, mas ignorado visualmente
  avatarUrl?: string; // Foto real do usuário (Prioridade 1)
  name?: string; // Nome para o fallback de iniciais
  mode?: 'static' | 'hover' | 'loop' | 'once'; // Mantido para compatibilidade
  size?: number;
  className?: string;
}

/**
 * AnimatedAvatar - Rollback para Sistema de Foto de Perfil
 * 
 * Regras:
 * 1. Prioridade absoluta para avatarUrl (Image Upload).
 * 2. Fallback para iniciais se não houver imagem.
 * 3. Ignora avatarId visualmente.
 */
export const AnimatedAvatar: React.FC<AnimatedAvatarProps> = memo(({
  avatarUrl,
  name = "User",
  size = 40,
  className = ""
}) => {
  
  // Fallback para Iniciais (se não houver avatarUrl)
  if (!avatarUrl) {
    return (
      <div 
        style={{ width: size, height: size }}
        className={`rounded-full overflow-hidden flex-shrink-0 border border-gray-200 flex items-center justify-center bg-gray-50 ${className}`}
      >
        <span className="text-gray-400 font-bold uppercase select-none" style={{ fontSize: size * 0.4 }}>
          {name.charAt(0)}
        </span>
      </div>
    );
  }

  return (
    <div 
      style={{ width: size, height: size }}
      className={`rounded-full flex-shrink-0 border border-gray-100 overflow-hidden shadow-sm relative ${className}`}
    >
      <img 
        src={avatarUrl} 
        alt={name}
        loading="lazy"
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback em caso de erro no carregamento da URL
          e.currentTarget.style.display = 'none';
          const parent = e.currentTarget.parentElement;
          if (parent) {
            parent.classList.add('bg-gray-50', 'flex', 'items-center', 'justify-center');
            const span = document.createElement('span');
            span.className = "text-gray-400 font-bold uppercase select-none";
            span.style.fontSize = `${size * 0.4}px`;
            span.innerText = name.charAt(0);
            parent.appendChild(span);
          }
        }}
      />
    </div>
  );
});

AnimatedAvatar.displayName = 'AnimatedAvatar';
