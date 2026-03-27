import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

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
    if (error.message !== 'Share canceled' && error.name !== 'AbortError') {
      console.error('Erro ao compartilhar:', error);
      if (onToast) onToast("Erro ao compartilhar conteúdo.", 'error');
    }
  }
};

export const downloadQR = async (url: string, fileName: string, onToast?: (msg: string, type: 'success' | 'informative' | 'error') => void) => {
  try {
    if (onToast) onToast("Preparando download...", 'informative');
    
    const response = await fetch(url);
    const blob = await response.blob();

    if (Capacitor.isNativePlatform()) {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        // Extrair apenas o conteúdo base64 (sem o cabeçalho data:image/png;base64,...)
        const base64 = base64data.split(',')[1];
        
        try {
          await Filesystem.writeFile({
            path: `feiraodaorca/${fileName}`,
            data: base64,
            directory: Directory.Documents,
            recursive: true
          });
          
          if (onToast) onToast("QR Code salvo em Documentos/feiraodaorca", 'success');
        } catch (fsError: any) {
          console.error('Filesystem Error:', fsError);
          // Fallback para Cache se Documents falhar (ex: permissões)
          await Filesystem.writeFile({
            path: fileName,
            data: base64,
            directory: Directory.Cache,
          });
          if (onToast) onToast("Salvo temporariamente (Cache).", 'informative');
        }
      };
    } else {
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      if (onToast) onToast("QR Code baixado com sucesso!", 'success');
    }
  } catch (error) {
    console.error('Erro no download:', error);
    if (onToast) onToast("Falha ao baixar o QR Code.", 'error');
  }
};
