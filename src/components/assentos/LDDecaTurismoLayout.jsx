import React from "react";
import { Armchair } from "lucide-react";

// LD G7 - 48 LUGARES - PISO SUPERIOR - SEMI LEITO (DECA TURISMO)
// Seats: 1-22, 25-48 (no seats 23, 24 — frigobar/escada area)
// Left side: odd=Janela, even=Corredor
// Right side: odd=Janela, even=Corredor (reversed seat order per row)

export default function LDDecaTurismoLayout({
  clientePorPoltrona,
  searchTerm,
  onSeatClick,
  renderSeatInfo
}) {

  const renderSeat = (seatNumber) => {
    if (!seatNumber) return <div className="w-14 h-14" />;

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
          title={isOccupied ? cliente.nome_completo : `Poltrona ${seatNumber} disponível`}
          className={`
            w-14 h-14 rounded-lg border-2 transition-all duration-200
            flex flex-col items-center justify-center p-1
            ${isOccupied
              ? 'bg-green-100 border-green-500 hover:bg-green-200'
              : 'bg-sky-500 border-sky-600 hover:bg-sky-600'
            }
            ${!matchesSearch && searchTerm ? 'opacity-30' : ''}
          `}
        >
          <Armchair className={`w-3.5 h-3.5 ${isOccupied ? 'text-green-700' : 'text-white'}`} />
          <span className={`text-xs font-bold ${isOccupied ? 'text-gray-700' : 'text-white'}`}>
            {String(seatNumber).padStart(2, '0')}
          </span>
        </button>
        {isOccupied && (
          <div className="hidden group-hover:block">
            {renderSeatInfo(cliente)}
          </div>
        )}
      </div>
    );
  };

  // Rows: [leftSeat1, leftSeat2, rightSeat1, rightSeat2]
  const seatRowsBlock1 = [
    [1, 2, 4, 3],
    [5, 6, 8, 7],
    [9, 10, 12, 11],
    [13, 14, 16, 15],
    [17, 18, 20, 19],
    [21, 22, 24, 23],
  ];

  const seatRowsBlock2 = [
    [25, 26, 28, 27],
    [29, 30, 32, 31],
    [33, 34, 36, 35],
    [37, 38, 40, 39],
    [41, 42, 44, 43],
    [45, 46, 48, 47],
  ];

  const renderRow = (left1, left2, right1, right2) => (
    <div className="flex gap-3 justify-center" key={`${left1}-${left2}`}>
      <div className="flex gap-1">
        {renderSeat(left1)}
        {renderSeat(left2)}
      </div>
      <div className="w-6 border-x-2 border-dashed border-sky-300" />
      <div className="flex gap-1">
        {renderSeat(right1)}
        {renderSeat(right2)}
      </div>
    </div>
  );

  return (
    <div className="flex justify-center">
      <div className="max-w-md w-full">
        <div className="bg-gradient-to-b from-sky-100 to-sky-50 p-6 rounded-t-[80px] rounded-b-3xl border-4 border-sky-400">
          <h3 className="text-center font-bold text-sky-900 mb-2 text-lg">
            🚌 LD G7 - SEMI LEITO
          </h3>
          <p className="text-center text-xs text-sky-700 mb-4 font-semibold">
            PISO SUPERIOR — DECA TURISMO — 48 LUGARES
          </p>

          {/* Frigobar top */}
          <div className="bg-cyan-100 border-2 border-cyan-400 rounded-lg py-2 text-center mb-4">
            <p className="text-[10px] font-bold text-cyan-900">🧊 FRIGOBAR</p>
          </div>

          <div className="space-y-2">
            {/* First block: seats 1-24 */}
            {seatRowsBlock1.map(([l1, l2, r1, r2]) => renderRow(l1, l2, r1, r2))}

            {/* Frigobar / Escada divider */}
            <div className="flex gap-3 justify-center items-center">
              <div className="w-[120px] bg-cyan-100 border-2 border-cyan-400 rounded-lg py-1 text-center">
                <p className="text-[9px] font-bold text-cyan-900">🧊 Frigobar</p>
              </div>
              <div className="w-6" />
              <div className="w-[120px] bg-purple-100 border-2 border-purple-400 rounded-lg py-1 text-center">
                <p className="text-[9px] font-bold text-purple-900">🪜 Escada</p>
              </div>
            </div>

            {/* Second block: seats 25-48 */}
            {seatRowsBlock2.map(([l1, l2, r1, r2]) => renderRow(l1, l2, r1, r2))}
          </div>

          {/* Frigobar bottom */}
          <div className="bg-cyan-100 border-2 border-cyan-400 rounded-lg py-2 text-center mt-4">
            <p className="text-[10px] font-bold text-cyan-900">🧊 FRIGOBAR</p>
          </div>

          {/* Deca Turismo branding */}
          <p className="text-center text-xs text-sky-700 mt-3 font-bold tracking-wide">
            DECA TURISMO
          </p>
        </div>
      </div>
    </div>
  );
}
