import { useEffect, useRef, useState } from 'react';

type Mood = 'idle' | 'damage' | 'heal' | 'ko' | 'enter';

type Props = {
  image: string;
  name: string;
  currentLp: number;
  maxLp: number;
  defeated: boolean;
  compact?: boolean;
  active?: boolean;
  charging?: boolean;
  skipTurns?: number;
};

export function PaukemonPortrait({
  image,
  name,
  currentLp,
  maxLp,
  defeated,
  compact = false,
  active = false,
  charging = false,
  skipTurns = 0,
}: Props) {
  const [mood, setMood] = useState<Mood>('enter');
  const previousLp = useRef(currentLp);
  const previousDefeated = useRef(defeated);

  useEffect(() => {
    const timer = window.setTimeout(() => setMood('idle'), 520);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const oldLp = previousLp.current;
    const wasDefeated = previousDefeated.current;
    previousLp.current = currentLp;
    previousDefeated.current = defeated;

    if (!wasDefeated && defeated) {
      setMood('ko');
    } else if (currentLp < oldLp) {
      setMood('damage');
    } else if (currentLp > oldLp) {
      setMood('heal');
    } else {
      return;
    }

    const timer = window.setTimeout(() => setMood(defeated ? 'ko' : 'idle'), defeated ? 1400 : 580);
    return () => window.clearTimeout(timer);
  }, [currentLp, defeated]);

  const lpRatio = maxLp > 0 ? currentLp / maxLp : 0;
  const danger = lpRatio <= 0.25 && !defeated;

  return (
    <div
      className={`portrait-shell ${compact ? 'compact' : ''} ${active ? 'active' : ''} mood-${mood} ${defeated ? 'defeated' : ''} ${danger ? 'danger' : ''} ${charging ? 'charging' : ''} ${skipTurns > 0 ? 'sleepy' : ''}`}
      aria-label={`${name}, ${currentLp} von ${maxLp} LP`}
    >
      <div className="portrait-aura" />
      <img className="portrait-img" src={image} alt={name} />
      <div className="hit-spark spark-one" />
      <div className="hit-spark spark-two" />
      <div className="heal-spark heal-one" />
      <div className="heal-spark heal-two" />
      {charging && <div className="charge-ring" />}
      {skipTurns > 0 && <div className="sleep-bubbles"><span>Z</span><span>Z</span><span>Z</span></div>}
      {defeated && <div className="ko-stamp">K.O.</div>}
    </div>
  );
}
