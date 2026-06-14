import { useEffect, useRef, useState } from 'react';

type Props = {
  current: number;
  max: number;
  compact?: boolean;
};

type Direction = 'up' | 'down' | 'same';

export function LpStatus({ current, max, compact = false }: Props) {
  const [displayedLp, setDisplayedLp] = useState(current);
  const [direction, setDirection] = useState<Direction>('same');
  const displayedRef = useRef(current);

  useEffect(() => {
    const start = displayedRef.current;
    if (start === current) return;

    const delta = current - start;
    setDirection(delta > 0 ? 'up' : 'down');

    const duration = 420;
    const startTime = performance.now();
    let frame = 0;
    let resetTimer = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(start + delta * eased);
      displayedRef.current = value;
      setDisplayedLp(value);

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        displayedRef.current = current;
        setDisplayedLp(current);
        resetTimer = window.setTimeout(() => setDirection('same'), 260);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(resetTimer);
    };
  }, [current]);

  const lpPercent = Math.max(0, Math.min(100, Math.round((current / max) * 100)));

  return (
    <div className={`lp-status ${compact ? 'compact' : ''} lp-change-${direction}`}>
      <div className="lp-readout">
        <span>LP</span>
        <strong>{displayedLp}/{max}</strong>
      </div>
      <div className="lpbar" aria-label={`${current} von ${max} LP`}>
        <div style={{ width: `${lpPercent}%` }} />
      </div>
    </div>
  );
}
