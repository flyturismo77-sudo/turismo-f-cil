import React from 'react';
import { Loader2 } from 'lucide-react';
import logoFly from '@/assets/logo-fly-turismo.jpg';

export default function LoadingFallback({ message = "Carregando..." }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="text-center">
        <div className="relative">
          {/* Logo animado */}
          <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-2xl mb-6 mx-auto animate-pulse">
            <img src={logoFly} alt="Fly Turismo" className="w-full h-full object-cover" />
          </div>

          {/* Spinner */}
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
        </div>

        {/* Mensagem */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Fly Turismo</h2>
        <p className="text-gray-600">{message}</p>
        
        {/* Indicador de progresso */}
        <div className="mt-6 w-64 mx-auto">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-sky-400 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}