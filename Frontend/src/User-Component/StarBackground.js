import React, { useMemo } from 'react';

const COLORS = ['#25D366', '#6CFFB0', '#FFFFFF', '#F3E5AB'];

export default function StarBackground() {
  const stars = useMemo(() => {
    const starArray = [];
    // 32 beautifully scattered stars across an 8x4 grid covering the entire screen
    // Guarantees no crowding/clumping, evenly distributed across ALL pages!
    const cols = 8;
    const rows = 4;
    let id = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const left = ((c / cols) * 94 + 3 + (Math.random() * (94 / cols) * 0.7)).toFixed(2);
        const top = ((r / rows) * 94 + 3 + (Math.random() * (94 / rows) * 0.7)).toFixed(2);
        const isSparkle = (r + c) % 3 === 0;
        const size = isSparkle 
          ? Math.floor(Math.random() * 5) + 7   // 7px to 12px for 4-point sparkle stars
          : Math.floor(Math.random() * 3) + 3;  // 3px to 5px for round glitters

        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const duration = (Math.random() * 3 + 2.5).toFixed(2); // 2.5s to 5.5s
        const floatDuration = (Math.random() * 4 + 4).toFixed(2); // 4s to 8s
        const delay = (Math.random() * 4).toFixed(2);
        const floatDistance = `${Math.floor(Math.random() * 16) - 8}px`;

        starArray.push({
          id: id++,
          isSparkle,
          size,
          color,
          top: `${top}%`,
          left: `${left}%`,
          duration: `${duration}s`,
          floatDuration: `${floatDuration}s`,
          delay: `${delay}s`,
          floatDistance
        });
      }
    }
    return starArray;
  }, []);

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[15] overflow-hidden select-none" 
      aria-hidden="true"
    >
      <style>{`
        @keyframes gyTwinkle {
          0%, 100% {
            opacity: 0.2;
            transform: scale(0.7);
          }
          50% {
            opacity: 0.95;
            transform: scale(1.2);
          }
        }
        @keyframes gyStarFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(var(--gy-float-dist, -8px));
          }
        }
      `}</style>

      {stars.map((star) => (
        <div
          key={star.id}
          style={{
            position: 'absolute',
            top: star.top,
            left: star.left,
            animation: `gyStarFloat ${star.floatDuration} ease-in-out infinite ${star.delay}`,
            '--gy-float-dist': star.floatDistance,
            willChange: 'transform',
            pointerEvents: 'none'
          }}
        >
          {star.isSparkle ? (
            <svg
              viewBox="0 0 24 24"
              fill={star.color}
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                filter: `drop-shadow(0 0 ${star.size / 2}px ${star.color}) drop-shadow(0 0 ${star.size}px ${star.color})`,
                animation: `gyTwinkle ${star.duration} ease-in-out infinite ${star.delay}`,
                willChange: 'opacity, transform'
              }}
            >
              <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
            </svg>
          ) : (
            <div
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                borderRadius: '9999px',
                backgroundColor: star.color,
                boxShadow: `0 0 ${star.size * 2}px ${star.color}, 0 0 ${star.size * 4}px ${star.color}`,
                animation: `gyTwinkle ${star.duration} ease-in-out infinite ${star.delay}`,
                willChange: 'opacity, transform'
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
