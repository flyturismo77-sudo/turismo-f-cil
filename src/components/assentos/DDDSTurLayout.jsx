import React from "react";
import { Armchair } from "lucide-react";

export default function DDDSTurLayout({ 
  clientePorPoltrona, 
  searchTerm, 
  onSeatClick, 
  renderSeatInfo 
}) {
  
  const renderSeat = (seatNumber, isWide = false) => {
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

    const isWindow = seatNumber % 2 === 1;

    return (
      <div className="relative group">
        <button
          onClick={() => onSeatClick(seatNumber)}
          title={isOccupied ? cliente.nome_completo : `Poltrona ${seatNumber} - ${isWindow ? 'Janela' : 'Corredor'}`}
          className={`
            ${isWide ? 'w-36' : 'w-16'} h-16 rounded-lg border-2 transition-all duration-200
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

  const renderRow = (left1, left2, right1, right2) => (
    <div className="flex gap-3 justify-center">
      <div className="flex gap-1">
        {renderSeat(left1)}
        {renderSeat(left2)}
      </div>
      <div className="w-8 border-x-2 border-dashed border-sky-300" />
      <div className="flex gap-1">
        {renderSeat(right1)}
        {renderSeat(right2)}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
      {/* PISO SUPERIOR (1-44) */}
      <div className="flex-1 max-w-md">
        <div className="bg-gradient-to-b from-sky-100 to-sky-50 p-6 rounded-t-[80px] rounded-b-3xl border-4 border-sky-400">
          <h3 className="text-center font-bold text-sky-900 mb-4 text-lg">
            🔼 PISO SUPERIOR
          </h3>
          
          <div className="space-y-2">
            {/* 1, 2 | 4, 3 */}
            {renderRow(1, 2, 4, 3)}

            {/* 5, 6 | ESCADA */}
            <div className="flex gap-3 justify-center">
              <div className="flex gap-1">
                {renderSeat(5)}
                {renderSeat(6)}
              </div>
              <div className="w-8" />
              <div className="w-[136px] bg-purple-100 border-2 border-purple-400 rounded-lg py-4 text-center">
                <p className="text-[10px] font-bold text-purple-900">🪜 ESCADA</p>
              </div>
            </div>

            {/* 9, 10 | GELADEIRA */}
            <div className="flex gap-3 justify-center">
              <div className="flex gap-1">
                {renderSeat(9)}
                {renderSeat(10)}
              </div>
              <div className="w-8" />
              <div className="w-[136px] bg-cyan-100 border-2 border-cyan-400 rounded-lg py-4 text-center">
                <p className="text-[10px] font-bold text-cyan-900">🧊 GELADEIRA</p>
              </div>
            </div>

            {/* 13, 14 | 8, 7 */}
            {renderRow(13, 14, 8, 7)}
            {/* 17, 18 | 12, 11 */}
            {renderRow(17, 18, 12, 11)}
            {/* 21, 22 | 16, 15 */}
            {renderRow(21, 22, 16, 15)}
            {/* 25, 26 | 20, 19 */}
            {renderRow(25, 26, 20, 19)}
            {/* 29, 30 | 24, 23 */}
            {renderRow(29, 30, 24, 23)}
            {/* 33, 34 | 28, 27 */}
            {renderRow(33, 34, 28, 27)}
            {/* 37, 38 | 32, 31 */}
            {renderRow(37, 38, 32, 31)}
            {/* 41, 42 | 36, 35 */}
            {renderRow(41, 42, 36, 35)}

            {/* 44, 43 | 40, 39 */}
            {renderRow(44, 43, 40, 39)}

            {/* BEBEDOURO / GELADEIRA */}
            <div className="bg-cyan-100 border-2 border-cyan-400 rounded-lg py-2 text-center mt-2">
              <p className="text-xs font-bold text-cyan-900">🧊 BEBEDOURO / GELADEIRA</p>
            </div>
          </div>
        </div>
      </div>

      {/* PISO INFERIOR (45-56) */}
      <div className="flex-1 max-w-md">
        <div className="bg-gradient-to-b from-orange-100 to-orange-50 p-6 rounded-t-[80px] rounded-b-3xl border-4 border-orange-400">
          <h3 className="text-center font-bold text-orange-900 mb-4 text-lg">
            🔽 PISO INFERIOR
          </h3>
          
          <div className="space-y-3">
            {/* MOTORISTA */}
            <div className="bg-gray-800 text-white rounded-lg py-3 text-center font-bold">
              🚗 MOTORISTA
            </div>

            <div className="h-4" />

            {/* GELADEIRA */}
            <div className="bg-cyan-100 border-2 border-cyan-400 rounded-lg py-2 text-center">
              <p className="text-xs font-bold text-cyan-900">🧊 GELADEIRA</p>
            </div>

            {/* 45, 46 | 47 */}
            <div className="flex gap-3 justify-center items-center">
              <div className="flex gap-1">
                {renderSeat(45)}
                {renderSeat(46)}
              </div>
              <div className="w-8 border-x-2 border-dashed border-orange-300" />
              <div className="flex gap-1">
                {renderSeat(47)}
                <div className="w-16" />
              </div>
            </div>

            {/* 49, 50 | 48 */}
            <div className="flex gap-3 justify-center items-center">
              <div className="flex gap-1">
                {renderSeat(49)}
                {renderSeat(50)}
              </div>
              <div className="w-8 border-x-2 border-dashed border-orange-300" />
              <div className="flex gap-1">
                {renderSeat(48)}
                <div className="w-16" />
              </div>
            </div>

            {/* 51, 52 | 54 */}
            <div className="flex gap-3 justify-center items-center">
              <div className="flex gap-1">
                {renderSeat(51)}
                {renderSeat(52)}
              </div>
              <div className="w-8 border-x-2 border-dashed border-orange-300" />
              <div className="flex gap-1">
                {renderSeat(54)}
                <div className="w-16" />
              </div>
            </div>

            {/* 55, 56 | 53 */}
            <div className="flex gap-3 justify-center">
              <div className="flex gap-1">
                {renderSeat(55)}
                {renderSeat(56)}
              </div>
              <div className="w-8 border-x-2 border-dashed border-orange-300" />
              <div className="flex gap-1">
                <div className="w-16" />
                {renderSeat(53)}
              </div>
            </div>

            {/* GELADEIRA */}
            <div className="bg-cyan-100 border-2 border-cyan-400 rounded-lg py-2 text-center">
              <p className="text-xs font-bold text-cyan-900">🧊 GELADEIRA</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}