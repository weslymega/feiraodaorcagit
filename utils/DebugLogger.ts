type LogListener = (logs: string[]) => void;

class DebugLogger {
  private logs: string[] = [];
  private listeners: LogListener[] = [];

  log(message: string) {
    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    const logMsg = `[${timestamp}] ${message}`;

    // Também enviamos para o console para não perder logs no Logcat se necessário
    console.log(logMsg);

    this.logs.push(logMsg);

    // Limite de logs para evitar travamento (50 conforme solicitado)
    if (this.logs.length > 50) {
      this.logs.shift();
    }

    this.notify();
  }

  getLogs() {
    return this.logs;
  }

  subscribe(listener: LogListener) {
    this.listeners.push(listener);
    // Notifica imediatamente o novo assinante com os logs atuais
    listener(this.logs);
  }

  unsubscribe(listener: LogListener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notify() {
    this.listeners.forEach(l => l([...this.logs]));
  }

  clear() {
    this.logs = [];
    this.notify();
  }
}

// Instância privada interna para garantir que o Singleton sobreviva a reloads de HMR
let instance: DebugLogger | null = null;

if (!(window as any).__debugLogger) {
  instance = new DebugLogger();
  (window as any).__debugLogger = instance;
} else {
  instance = (window as any).__debugLogger;
}

export const debugLogger = instance as DebugLogger;
