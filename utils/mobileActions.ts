import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

/**
 * Abre uma URL externa de forma segura.
 * - No APK (Capacitor nativo): usa `window.open(url, '_system')` para garantir
 *   abertura no browser externo ou app externo, evitando ERR_UNKNOWN_URL_SCHEME.
 * - No browser/desktop: usa `window.open(url, '_blank')` padrão.
 */
export const openExternalUrl = (url: string): void => {
  if (Capacitor.isNativePlatform()) {
    window.open(url, '_system');
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

/**
 * Abre o WhatsApp com o número e mensagem fornecidos.
 * Usa sempre https://wa.me/ (nunca whatsapp:// para evitar ERR_UNKNOWN_URL_SCHEME).
 * Fallback automático para web.whatsapp.com em desktop.
 *
 * @param phone - Número com DDI, sem símbolos. Ex: "5561999992842"
 * @param message - Mensagem pré-preenchida (opcional)
 */
export const openWhatsApp = (phone: string, message?: string): void => {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMessage = message ? encodeURIComponent(message) : '';
  const waUrl = encodedMessage
    ? `https://wa.me/${cleanPhone}?text=${encodedMessage}`
    : `https://wa.me/${cleanPhone}`;
  openExternalUrl(waUrl);
};

export interface ShareOptions {
  title: string;
  text: string;
  url: string;
}

/**
 * Funções utilitárias para lidar com ações nativas no mobile (Capacitor) 
 * com fallback para Web (Browser).
 */

export const shareAd = async (options: ShareOptions, onToast?: (msg: string, type: 'success' | 'informative' | 'error') => void) => {
  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({
        title: options.title,
        text: options.text,
        url: options.url,
        dialogTitle: 'Compartilhar Anúncio',
      });
    } else if (navigator.share) {
      await navigator.share(options);
    } else {
      if (onToast) onToast("Compartilhamento não suportado neste dispositivo.", 'error');
      else alert("Compartilhamento não suportado neste dispositivo.");
    }
  } catch (error: any) {
    // Não logar como erro se for apenas cancelamento pelo usuário
    if (error.message !== 'Share canceled' && error.name !== 'AbortError') {
      console.error('[Share Error]: Falha ao tentar compartilhar conteúdo.', {
        error: error.message || error,
        stack: error.stack,
        options
      });
      if (onToast) onToast("Erro ao compartilhar conteúdo. Verifique as permissões.", 'error');
    }
  }
};

export const downloadQR = async (url: string, fileName: string, onToast?: (msg: string, type: 'success' | 'informative' | 'error') => void) => {
  try {
    if (onToast) onToast("Preparando QR Code...", 'informative');
    
    // Garantir que a extensão seja .png para compatibilidade total
    const fileNameWithPng = fileName.toLowerCase().endsWith('.png') ? fileName : `${fileName}.png`;

    const response = await fetch(url);
    const blob = await response.blob();

    // Gerar um nome de arquivo único para o cache
    const baseName = fileNameWithPng.substring(0, fileNameWithPng.lastIndexOf('.'));
    const uniqueFileName = `${baseName}-${Date.now()}.png`;

    if (Capacitor.isNativePlatform()) {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64 = base64data.split(',')[1];
        
        let tempUri = '';
        try {
          // Gravar no Cache Temporário
          const fileResult = await Filesystem.writeFile({
            path: uniqueFileName,
            data: base64,
            directory: Directory.Cache,
          });
          
          tempUri = fileResult.uri;

          // Compartilhar como ARQUIVO (files) e não como URL string
          // Isso ativa as opções de "Salvar Imagem" e compartilhamento em apps
          await Share.share({
            title: 'QR Code do Anúncio',
            text: 'Confira o QR Code para este anúncio.',
            files: [tempUri],
            dialogTitle: 'Salvar ou Compartilhar QR Code',
          });
          
          if (onToast) onToast("Opções de salvamento abertas!", 'success');
        } catch (fsError: any) {
          console.error('[Native File Error]: Falha ao gravar ou compartilhar arquivo.', {
            error: fsError.message || fsError,
            fileName: uniqueFileName,
            directory: 'Cache'
          });
          if (onToast) onToast("Erro ao processar arquivo nativo. Verifique o espaço disponível.", 'error');
        } finally {
          // Limpeza de Cache: Remover o arquivo temporário após o compartilhamento
          if (tempUri) {
            try {
              await Filesystem.deleteFile({
                path: uniqueFileName,
                directory: Directory.Cache
              });
              console.log('[Cache Cleanup]: Arquivo removido com sucesso:', uniqueFileName);
            } catch (cleanupError: any) {
              console.warn('[Cache Cleanup Failed]: Falha ao remover arquivo temporário.', {
                error: cleanupError.message || cleanupError,
                fileName: uniqueFileName
              });
            }
          }
        }
      };
    } else {
      // Fallback Web robusto via Blob
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = uniqueFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      if (onToast) onToast("Download iniciado com sucesso!", 'success');
    }
  } catch (error) {
    console.error('Erro no processamento do QR:', error);
    if (onToast) onToast("Falha ao preparar o QR Code.", 'error');
  }
};
