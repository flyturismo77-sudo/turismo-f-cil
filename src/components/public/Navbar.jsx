import React, { useState } from 'react';
import logoFly from '@/assets/logo-fly-turismo.jpg';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Menu, X, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const configs = await base44.entities.ConfiguracaoEmpresa.list();
      return configs[0];
    },
  });

  const navLinks = [
    { name: 'Início', path: createPageUrl('Home') },
    { name: 'Sobre Nós', path: createPageUrl('Sobre') },
    { name: 'Viagens', path: createPageUrl('ViagensPublico') },
    { name: 'Contato', path: createPageUrl('Contato') },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to={createPageUrl('Home')} className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg flex-shrink-0">
              <img src={config?.logo_url || logoFly} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">
                {config?.nome_empresa || 'Fly Turismo'}
              </h1>
              <p className="text-xs text-amber-600 font-medium">
                {config?.slogan || 'Seu próximo destino começa aqui'}
              </p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-gray-700 hover:text-sky-600 font-medium transition-colors duration-200"
              >
                {link.name}
              </Link>
            ))}
            <Link to={createPageUrl('Dashboard')}>
              <Button className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg">
                Área Admin
              </Button>
            </Link>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="block py-2 text-gray-700 hover:text-sky-600 font-medium"
              >
                {link.name}
              </Link>
            ))}
            <Link to={createPageUrl('Dashboard')} onClick={() => setIsOpen(false)}>
              <Button className="w-full bg-gradient-to-r from-sky-500 to-blue-600">
                Área Admin
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}