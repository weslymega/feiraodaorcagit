import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-gray-50 text-center rounded-3xl border border-gray-100 m-4 shadow-sm animate-in fade-in duration-500">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Ops! Ocorreu um erro</h2>
                    <p className="text-gray-600 mb-8 max-w-xs mx-auto">
                        Não foi possível carregar esta tela. Já notificamos nossa equipe técnica.
                    </p>
                    <button
                        onClick={() => this.handleReset()}
                        className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <RefreshCw className="w-5 h-5" />
                        <span>Voltar e Tentar Novamente</span>
                    </button>

                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-8 p-4 bg-gray-100 rounded-xl w-full text-left overflow-auto max-h-40">
                            <p className="text-xs font-mono text-red-700 break-all">
                                {this.state.error?.toString()}
                            </p>
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
