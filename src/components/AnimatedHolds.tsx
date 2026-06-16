"use client";
import { useEffect, useState } from 'react';
import Hold1 from "../../public/images/hold-1.svg"
import Hold2 from "../../public/images/hold-2.svg"
import Hold3 from "../../public/images/hold-3.svg"
import Hold4 from "../../public/images/hold-4.svg"
import Hold5 from "../../public/images/hold-5.svg"

const holdSvgs = [Hold1, Hold2, Hold3, Hold4, Hold5];

interface HoldPosition {
    id: number;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    svg: React.ComponentType<{ className?: string }>;
}

export default function AnimatedHolds(){
    const [holds, setHolds] = useState<HoldPosition[]>([]);

    useEffect(() => {
        const createHold = (id: number, x: number, y: number, scale: number = 1, rotation: number = 0): HoldPosition => ({
            id,
            x,
            y,
            scale,
            rotation,
            svg: holdSvgs[id]
        });

        const positions = [
            createHold(0, 90, 10),  
            createHold(1, 10, 35),  
            createHold(2, 90, 55),   
            createHold(3, 10, 75),  
            createHold(4, 90, 90)   
        ];
        
        setHolds(positions);
    
        const interval = setInterval(() => {
            setHolds(prev => prev.map(hold => ({
              ...hold,
              rotation: Math.sin(Date.now() / 800 + hold.id) * 20
            })));
          }, 100);
    
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {holds.map(hold => {
            const HoldSvg = hold.svg;
            return (
              <div
                key={hold.id}
                className="absolute transition-all duration-1500 ease-in-out"
                style={{
                  left: `${hold.x}%`,
                  top: `${hold.y}%`,
                  transform: `translate(-50%, -50%) scale(${hold.scale}) rotate(${hold.rotation}deg)`,
                }}
              >
                <HoldSvg/>
              </div>
            );
          })}
        </div>
    );
};