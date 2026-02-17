import React from 'react';
import logoFly from '@/assets/logo-fly-turismo.jpg';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Phone, Mail, MapPin, Facebook, Instagram, Plane } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function Footer() {
  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const configs = await base44.entities.ConfiguracaoEmpresa.list();
      return configs[0];
    },
  });

  return (
    <footer className="bg-gradient-to-br from-gray-900 to-blue-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg flex-shrink-0">
                <img src={config?.logo_url || logoFly} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{config?.nome_empresa || 'Fly Turismo'}</h3>
                <p className="text-amber-400 text-sm">{config?.slogan || 'Seu próximo destino começa aqui'}</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm">
              {config?.sobre_nos?.slice(0, 150) || 'Sua agência de viagens de confiança há anos proporcionando experiências inesquecíveis.'}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-4 text-amber-400">Links Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link to={createPageUrl('Home')} className="text-gray-300 hover:text-white transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link to={createPageUrl('Sobre')} className="text-gray-300 hover:text-white transition-colors">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link to={createPageUrl('ViagensPublico')} className="text-gray-300 hover:text-white transition-colors">
                  Viagens
                </Link>
              </li>
              <li>
                <Link to={createPageUrl('Contato')} className="text-gray-300 hover:text-white transition-colors">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-4 text-amber-400">Contato</h4>
            <ul className="space-y-3">
              {config?.telefone && (
                <li className="flex items-center gap-2 text-gray-300">
                  <Phone className="w-4 h-4 text-amber-400" />
                  <span className="text-sm">{config.telefone}</span>
                </li>
              )}
              {config?.email && (
                <li className="flex items-center gap-2 text-gray-300">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span className="text-sm">{config.email}</span>
                </li>
              )}
              {config?.endereco && (
                <li className="flex items-start gap-2 text-gray-300">
                  <MapPin className="w-4 h-4 text-amber-400 mt-1 flex-shrink-0" />
                  <span className="text-sm">{config.endereco}</span>
                </li>
              )}
            </ul>
            {(config?.instagram || config?.facebook) && (
              <div className="flex gap-3 mt-4">
                {config?.instagram && (
                  <a href={config.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {config?.facebook && (
                  <a href={config.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} {config?.nome_empresa || 'Fly Turismo'}. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}