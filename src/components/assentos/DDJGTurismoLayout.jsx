import React from "react";
import { Armchair } from "lucide-react";

export default function DDJGTurismoLayout({ 
  clientePorPoltrona, 
  searchTerm, 
  onSeatClick, 
  renderSeatInfo 
}) {
  
  const renderSeat = (seatNumber) => {
    if (!seatNumber) return <div className="w-16 h-16" />;
    
    const cliente = clientePorPoltrona[seatNumber];
    const isOccupied = !!cliente;
    const matchesSearch = !searchTerm || 
      (cliente && (
        cliente.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.cpf?.includes(searchTerm) ||
        (cliente.poltrona && cliente.poltrona.toString().includes(searchTerm))
      )) || 
      (!isOccupied && seatNumber.toString().includes(searchTerm));

    return (
      <div className="relative group">
        <button
          onClick={() => onSeatClick(seatNumber)}
          title={isOccupied ? cliente.nome_completo : `Poltrona ${seatNumber}`}
          className={`
            w-16 h-16 rounded-lg border-2 transition-all duration-200
            flex flex-col items-center justify-center p-1
            ${isOccupied 
              ? 'bg-green-100 border-green-500 hover:bg-green-200' 
              : 'bg-sky-500 border-sky-600 hover:bg-sky-600'
            }
            ${!matchesSearch && searchTerm ? 'opacity-30' : ''}
          `}
        >
          <Armchair className={`w-4 h-4 ${isOccupied ? 'text-green-700' : 'text-white'}`} />
          <span className={`text-sm font-bold ${isOccupied ? 'text-gray-700' : 'text-white'}`}>{seatNumber}</span>
        </button>
        {isOccupied && (
          <div className="hidden group-hover:block">
            {renderSeatInfo(cliente)}
          </div>
        )}
      </div>
    );
  };

  const renderLabel = (text, className = '') => (
    <div className={`w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 ${className}`}>
      {text}
    </div>
  );

  const renderEmpty = () => <div className="w-16 h-16" />;

  // PISO SUPERIOR layout based on the PDF map
  // Rows: 01,02 | 05,(gap) | ESCADA | 09,10 | 13,14 | 17,18 | 21,22 | 25,26 | 29,30 | 33,34 | 37,38 | 41,42 | 43,44
  const pisoSuperiorRows = [
    [1, 2],
    [5, null],       // seat 05, gap on right
    'ESCADA',
    [9, 10],
    [13, 14],
    [17, 18],
    [21, 22],
    [25, 26],
    [29, 30],
    [33, 34],
    [37, 38],
    [41, 42],
    [43, 44],
  ];

  // PISO INFERIOR layout based on the PDF map
  // Front: 04,03 | 06 | FRIGOBAR/WC/PORTA
  // Then: 07,08 + 46,45 | 12,11 + 47,48 + 50,49 | 16,15 + 51,52 + 54,53
  // Then: 20,19 | 24,23 | 28,27 | 32,31 | 36,35 | 40,39
  const pisoInferiorFront = [
    { left: [4, 3] },
    { left: [6, null] },
    'FRIGOBAR_WC',
  ];

  const pisoInferiorMiddle = [
    { left: [7, 8], right: [46, 45] },
    { left: [12, 11], right: [47, 48], extra: [50, 49] },
    { left: [16, 15], right: [51, 52], extra: [54, 53] },
  ];

  const pisoInferiorBack = [
    [20, 19],
    [24, 23],
    [28, 27],
    [32, 31],
    [36, 35],
    [40, 39],
  ];

  const occupiedCount = Object.keys(clientePorPoltrona).length;

  return (
    <div className="space-y-8">
      <div className="text-center text-sm text-gray-500">
        {occupiedCount} de 54 assentos ocupados
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PISO SUPERIOR */}
        <div className="bg-gradient-to-b from-blue-50 to-blue-100/50 p-6 rounded-2xl">
          <div className="text-center mb-4">
            <div className="inline-block bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold mb-2">
              PISO SUPERIOR
            </div>
          </div>

          {/* Motorista */}
          <div className="flex justify-center mb-4">
            <div className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold">
              MOT
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            {pisoSuperiorRows.map((row, idx) => {
              if (row === 'ESCADA') {
                return (
                  <div key={idx} className="flex gap-2 justify-center">
                    {renderLabel('ESCADA')}
                    {renderLabel('ESCADA')}
                  </div>
                );
              }
              return (
                <div key={idx} className="flex gap-2 justify-center">
                  {renderSeat(row[0])}
                  {row[1] ? renderSeat(row[1]) : renderEmpty()}
                </div>
              );
            })}
          </div>
        </div>

        {/* PISO INFERIOR */}
        <div className="bg-gradient-to-b from-amber-50 to-amber-100/50 p-6 rounded-2xl">
          <div className="text-center mb-4">
            <div className="inline-block bg-amber-800 text-white px-6 py-2 rounded-lg font-semibold mb-2">
              PISO INFERIOR
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            {/* Front section */}
            <div className="flex gap-2 justify-center">
              {renderSeat(4)}
              {renderSeat(3)}
            </div>
            <div className="flex gap-2 justify-center">
              {renderSeat(6)}
              {renderEmpty()}
            </div>

            {/* Frigobar / WC / Porta */}
            <div className="flex gap-2 justify-center">
              {renderLabel('FRIGO')}
              {renderLabel('WC')}
              {renderLabel('PORTA')}
            </div>

            {/* Middle section with extra seats */}
            <div className="flex gap-2 justify-center">
              {renderSeat(7)}
              {renderSeat(8)}
              <div className="w-4" />
              {renderSeat(46)}
              {renderSeat(45)}
            </div>
            <div className="flex gap-2 justify-center">
              {renderSeat(12)}
              {renderSeat(11)}
              <div className="w-4" />
              {renderSeat(47)}
              {renderSeat(48)}
              <div className="w-4" />
              {renderSeat(50)}
              {renderSeat(49)}
            </div>
            <div className="flex gap-2 justify-center">
              {renderSeat(16)}
              {renderSeat(15)}
              <div className="w-4" />
              {renderSeat(51)}
              {renderSeat(52)}
              <div className="w-4" />
              {renderSeat(54)}
              {renderSeat(53)}
            </div>

            {/* Back section - 2 columns */}
            {pisoInferiorBack.map((row, idx) => (
              <div key={`back-${idx}`} className="flex gap-2 justify-center">
                {renderSeat(row[0])}
                {renderSeat(row[1])}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-sky-500 rounded border-2 border-sky-600" />
          <span className="text-gray-600">Disponível</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-100 rounded border-2 border-green-500" />
          <span className="text-gray-600">Ocupado</span>
        </div>
      </div>
    </div>
  );
}
