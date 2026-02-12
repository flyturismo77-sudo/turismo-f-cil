import React from "react";
import { Armchair } from "lucide-react";

export default function JGTurismo44Layout({ 
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
    <div className="flex justify-center">
      <div className="max-w-md">
        <div className="bg-gradient-to-b from-sky-100 to-sky-50 p-6 rounded-t-[80px] rounded-b-3xl border-4 border-sky-400">
          {/* MOTORISTA / PORTA */}
          <div className="flex justify-between mb-4">
            <div className="bg-gray-800 text-white rounded-lg py-2 px-4 text-center font-bold text-sm">
              🚗 MOTORISTA
            </div>
            <div className="bg-gray-600 text-white rounded-lg py-2 px-4 text-center font-bold text-sm">
              🚪 PORTA
            </div>
          </div>

          <h3 className="text-center font-bold text-sky-900 mb-4 text-lg">
            🚌 JG TURISMO 44
          </h3>
          
          <div className="space-y-2">
            {renderRow(1, 2, 4, 3)}
            {renderRow(5, 6, 8, 7)}
            {renderRow(9, 10, 12, 11)}
            {renderRow(13, 14, 16, 15)}
            {renderRow(17, 18, 20, 19)}
            {renderRow(21, 22, 24, 23)}
            {renderRow(25, 26, 28, 27)}
            {renderRow(29, 30, 32, 31)}
            {renderRow(33, 34, 36, 35)}
            {renderRow(37, 38, 40, 39)}

            {/* 41, 42 | empty */}
            <div className="flex gap-3 justify-center">
              <div className="flex gap-1">
                {renderSeat(41)}
                {renderSeat(42)}
              </div>
              <div className="w-8 border-x-2 border-dashed border-sky-300" />
              <div className="w-[136px]" />
            </div>

            {/* 43, 44 | TOILLETE */}
            <div className="flex gap-3 justify-center">
              <div className="flex gap-1">
                {renderSeat(43)}
                {renderSeat(44)}
              </div>
              <div className="w-8" />
              <div className="w-[136px] bg-gray-200 border-2 border-gray-400 rounded-lg py-4 text-center">
                <p className="text-[10px] font-bold text-gray-700">🚻 TOILLETE</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
