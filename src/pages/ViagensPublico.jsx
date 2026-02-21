import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Calendar, Users, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import Navbar from '../components/public/Navbar';
import Footer from '../components/public/Footer';

export default function ViagensPublico() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: viagens = [] } = useQuery({
    queryKey: ['viagens-publico'],
    queryFn: () => base44.entities.Viagem.list('-data_saida'),
  });

  const viagensDisponiveis = viagens.filter(v => 
    v.status === 'Aberta' || v.status === 'Planejamento'
  );

  const filteredViagens = viagensDisponiveis.filter(v =>
    v.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.destino?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="relative h-80 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-600 to-blue-800" />
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Nossas Viagens</h1>
          <p className="text-xl md:text-2xl text-amber-300">Escolha seu próximo destino</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Buscar por destino ou nome da viagem..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 text-lg"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredViagens.map((viagem) => (
              <Card key={viagem.id} className="overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className="relative h-64 bg-gradient-to-br from-sky-400 to-blue-600 overflow-hidden">
                  {viagem.imagem_url ? (
                    <img src={viagem.imagem_url} alt={viagem.destino} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MapPin className="w-24 h-24 text-white opacity-50" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-amber-500 text-white px-4 py-2 rounded-full font-bold shadow-xl">
                    R$ {viagem.valor_total?.toLocaleString('pt-BR')}
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{viagem.nome}</h3>
                  <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <MapPin className="w-5 h-5 text-sky-600" />
                    <span className="font-medium">{viagem.destino}</span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <span className="font-medium">
                        Saída: {format(new Date(viagem.data_saida), "dd/MM/yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <span className="font-medium">
                        Retorno: {format(new Date(viagem.data_retorno), "dd/MM/yyyy")}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Hotel</span>
                      <span className="font-semibold">R$ {viagem.valor_hotel?.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Transporte</span>
                      <span className="font-semibold">R$ {viagem.valor_onibus?.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>

                  <Link to={createPageUrl('Contato')}>
                    <Button className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg h-12 text-base font-semibold">
                      Reservar Agora
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredViagens.length === 0 && (
            <div className="text-center py-16">
              <Filter className="w-20 h-20 mx-auto mb-4 text-gray-300" />
              <p className="text-xl text-gray-500">Nenhuma viagem encontrada</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}