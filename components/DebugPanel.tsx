import React, { useEffect, useState, useRef } from 'react';
import { debugLogger } from '../utils/DebugLogger';

export default function DebugPanel() {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const listener = (newLogs: string[]) => {
      setLogs(newLogs);
    };

    debugLogger.subscribe(listener);

    return () => {
      debugLogger.unsubscribe(listener);
    };
  }, []);

  // Auto-scroll para o final quando novos logs chegam
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Comentado para garantir que o painel apareça assim que for ativado, mesmo sem logs
  // if (logs.length === 0) return null;

  return (
    <div 
      id="global-debug-panel"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        pointerEvents: 'none', // Não bloqueia cliques no app por padrão
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        maxHeight: '40%' // Limita a altura a 40% da tela
      }}
    >
      <div 
        ref={scrollRef}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          padding: '8px',
          overflowY: 'auto',
          pointerEvents: 'auto', // Permite scroll e interação apenas aqui
          borderTop: '1px solid #00FF00',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '4px',
          borderBottom: '1px solid rgba(0, 255, 0, 0.2)',
          paddingBottom: '2px'
        }}>
          <span style={{ color: '#00FF00', fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace' }}>
            DEBUG LOGS ({logs.length}/50)
          </span>
          <button 
            onClick={() => debugLogger.clear()}
            style={{ 
              color: '#FF4444', 
              fontSize: '9px', 
              background: 'transparent', 
              border: '1px solid #FF4444',
              borderRadius: '3px',
              padding: '0 4px',
              cursor: 'pointer'
            }}
          >
            LIMPAR
          </button>
        </div>
        
        {logs.map((log, index) => (
          <div 
            key={index} 
            style={{ 
              color: '#00FF00', 
              fontSize: '10px', 
              fontFamily: 'monospace',
              lineHeight: '1.2',
              marginBottom: '2px',
              wordBreak: 'break-all',
              borderLeft: log.includes('ERROR') ? '2px solid red' : 'none',
              paddingLeft: log.includes('ERROR') ? '4px' : '0'
            }}
          >
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
