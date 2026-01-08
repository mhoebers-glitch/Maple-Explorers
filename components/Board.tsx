
import React from 'react';
import { Player, REGIONS } from '../types';

interface BoardProps {
  players: Player[];
  totalSteps: number;
}

const Board: React.FC<BoardProps> = ({ players, totalSteps }) => {
  const steps = Array.from({ length: totalSteps + 1 });

  return (
    <div className="relative w-full overflow-x-auto py-12 px-8 bg-white/50 rounded-3xl shadow-inner border-2 border-dashed border-red-200 min-h-[400px]">
      <div className="flex items-center gap-4 min-w-[1200px]">
        {steps.map((_, index) => {
          const region = REGIONS.find(r => index >= r.start && index <= r.end);
          const isEndpoint = index === 0 || index === totalSteps;
          
          return (
            <div
              key={index}
              className={`relative flex-shrink-0 w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-4 transition-all duration-500
                ${region?.color || 'bg-white'} 
                ${isEndpoint ? 'scale-110 border-red-600 bg-red-50 shadow-lg' : 'border-white/50 shadow-md'}
              `}
            >
              <span className="text-xs font-bold opacity-30 select-none">{index}</span>
              {index === 0 && <span className="text-lg">🚩</span>}
              {index === totalSteps && <span className="text-2xl">🏆</span>}
              
              {/* Render Players */}
              <div className="absolute -top-6 flex flex-wrap justify-center gap-1 w-full">
                {players.filter(p => p.position === index).map(p => (
                  <div
                    key={p.id}
                    className="text-3xl animate-bounce"
                    title={p.name}
                    style={{ animationDuration: `${1 + Math.random()}s` }}
                  >
                    {p.avatar}
                  </div>
                ))}
              </div>

              {/* Region Labels */}
              {index === region?.start && (
                <div className="absolute -bottom-8 left-0 whitespace-nowrap text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  {region.name}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-4 left-4 text-4xl opacity-10">🍁</div>
      <div className="absolute bottom-4 right-4 text-4xl opacity-10">🍁</div>
    </div>
  );
};

export default Board;
