import React from "react";
import { Armchair } from "lucide-react";

export default function DDJGTurismoLayout({ 
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
          title={isOccupied ? cliente.nome_completo : `Poltrona ${seatNumber}`}
          className={`
            w-14 h-14 rounded-lg border-2 transition-all duration-200
            flex flex-col items-center justify-center p-1
            ${isOccupied 
              ? 'bg-green-100 border-green-500 hover:bg-green-200' 
              : 'bg-gray-200 border-gray-300 hover:bg-gray-300'
            }
            ${!matchesSearch && searchTerm ? 'opacity-30' : ''}
          `}
        >
          <Armchair className={`w-3.5 h-3.5 ${isOccupied ? 'text-green-700' : 'text-gray-500'}`} />
          <span className={`text-xs font-bold ${isOccupied ? 'text-green-800' : 'text-gray-600'}`}>
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

  const renderLabel = (text, className = '') => (
    <div className={`w-14 h-14 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 ${className}`}>
      {text}
    </div>
  );

  const renderLabelWide = (text, cols = 2) => (
    <div className={`h-14 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400`}
      style={{ width: cols === 2 ? '7.5rem' : '3.5rem' }}>
      {text}
    </div>
  );

  const gap = () => <div className="w-6" />;
  const empty = () => <div className="w-14 h-14" />;

  const occupiedCount = Object.keys(clientePorPoltrona).length;

  return (
    <div className="space-y-6">
      <div className="text-center text-sm text-gray-500">
        {occupiedCount} de 54 assentos ocupados
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ═══ PISO SUPERIOR ═══ */}
        <div className="bg-gradient-to-b from-sky-50 to-sky-100/30 p-5 rounded-2xl border border-sky-200">
          <div className="text-center mb-4">
            <span className="inline-block bg-sky-600 text-white px-5 py-1.5 rounded-lg font-bold text-sm tracking-wide">
              PISO SUPERIOR
            </span>
          </div>

          {/* Bus shape top */}
          <div className="relative mx-auto" style={{ maxWidth: '340px' }}>
            <div className="border-2 border-gray-300 rounded-t-[60px] rounded-b-xl p-4 pt-8 bg-white/60">
              
              {/* Rows: Left pair | corridor | Right pair */}
              <div className="flex flex-col gap-2 items-center">
                {/* Row 1: 01,02 | 04,03 */}
                <div className="flex items-center gap-1">
                  {renderSeat(1)}{renderSeat(2)}{gap()}{renderSeat(4)}{renderSeat(3)}
                </div>
                {/* Row 2: 05,06 | ESCADA */}
                <div className="flex items-center gap-1">
                  {renderSeat(5)}{renderSeat(6)}{gap()}{renderLabelWide('ESCADA')}
                </div>
                {/* Row 3: 09,10 | FRIGOBAR */}
                <div className="flex items-center gap-1">
                  {renderSeat(9)}{renderSeat(10)}{gap()}{renderLabelWide('FRIGOBAR')}
                </div>
                {/* Row 4: 13,14 | 07,08 */}
                <div className="flex items-center gap-1">
                  {renderSeat(13)}{renderSeat(14)}{gap()}{renderSeat(7)}{renderSeat(8)}
                </div>
                {/* Row 5: 17,18 | 12,11 */}
                <div className="flex items-center gap-1">
                  {renderSeat(17)}{renderSeat(18)}{gap()}{renderSeat(12)}{renderSeat(11)}
                </div>
                {/* Row 6: 21,22 | 16,15 */}
                <div className="flex items-center gap-1">
                  {renderSeat(21)}{renderSeat(22)}{gap()}{renderSeat(16)}{renderSeat(15)}
                </div>
                {/* Row 7: 25,26 | 20,19 */}
                <div className="flex items-center gap-1">
                  {renderSeat(25)}{renderSeat(26)}{gap()}{renderSeat(20)}{renderSeat(19)}
                </div>
                {/* Row 8: 29,30 | 24,23 */}
                <div className="flex items-center gap-1">
                  {renderSeat(29)}{renderSeat(30)}{gap()}{renderSeat(24)}{renderSeat(23)}
                </div>
                {/* Row 9: 33,34 | 28,27 */}
                <div className="flex items-center gap-1">
                  {renderSeat(33)}{renderSeat(34)}{gap()}{renderSeat(28)}{renderSeat(27)}
                </div>
                {/* Row 10: 37,38 | 32,31 */}
                <div className="flex items-center gap-1">
                  {renderSeat(37)}{renderSeat(38)}{gap()}{renderSeat(32)}{renderSeat(31)}
                </div>
                {/* Row 11: 41,42 | 36,35 */}
                <div className="flex items-center gap-1">
                  {renderSeat(41)}{renderSeat(42)}{gap()}{renderSeat(36)}{renderSeat(35)}
                </div>
                {/* Row 12: 43,44 | 40,39 */}
                <div className="flex items-center gap-1">
                  {renderSeat(43)}{renderSeat(44)}{gap()}{renderSeat(40)}{renderSeat(39)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ PISO INFERIOR ═══ */}
        <div className="bg-gradient-to-b from-amber-50 to-amber-100/30 p-5 rounded-2xl border border-amber-200">
          <div className="text-center mb-4">
            <span className="inline-block bg-amber-600 text-white px-5 py-1.5 rounded-lg font-bold text-sm tracking-wide">
              PISO INFERIOR
            </span>
          </div>

          <div className="relative mx-auto" style={{ maxWidth: '340px' }}>
            <div className="border-2 border-gray-300 rounded-t-[60px] rounded-b-xl p-4 pt-8 bg-white/60">
              
              <div className="flex flex-col gap-2 items-center">
                {/* MOT */}
                <div className="flex items-center gap-1">
                  {empty()}{empty()}{gap()}{renderLabel('MOT')}{renderLabel('MOT')}
                </div>

                {/* Large baggage/empty area + ESCADA */}
                <div className="flex items-center gap-1">
                  <div className="w-[7.25rem] h-14 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50" />
                  {gap()}
                  {empty()}
                  {renderLabel('ESCADA')}
                </div>

                {/* WC + PORTA */}
                <div className="flex items-center gap-1">
                  {renderLabelWide('WC')}
                  {gap()}
                  {empty()}
                  {renderLabel('PORTA')}
                </div>

                {/* FRIGOBAR + 46,45 */}
                <div className="flex items-center gap-1">
                  {renderLabelWide('FRIGOBAR')}
                  {gap()}
                  {renderSeat(46)}{renderSeat(45)}
                </div>

                {/* 47,48 | 50,49 */}
                <div className="flex items-center gap-1">
                  {renderSeat(47)}{renderSeat(48)}{gap()}{renderSeat(50)}{renderSeat(49)}
                </div>

                {/* 51,52 | 54,53 */}
                <div className="flex items-center gap-1">
                  {renderSeat(51)}{renderSeat(52)}{gap()}{renderSeat(54)}{renderSeat(53)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-6 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-200 rounded border-2 border-gray-300" />
          <span className="text-gray-600">Disponível</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-green-100 rounded border-2 border-green-500" />
          <span className="text-gray-600">Ocupado</span>
        </div>
      </div>
    </div>
  );
}
