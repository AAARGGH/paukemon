import type { CSSProperties } from 'react';
import type { Owner, PaukemonInstance } from '../game/types';
import { getCard, isAlive } from '../game/engine';
import { LpStatus } from './LpStatus';
import { PaukemonPortrait } from './PaukemonPortrait';

type Props = {
  instance: PaukemonInstance;
  owner: Owner;
  active: boolean;
  selectable?: boolean;
  onSelect?: () => void;
  dealIndex?: number;
};

export function CardView({ instance, active, selectable, onSelect, dealIndex = 0 }: Props) {
  const card = getCard(instance);
  const defeated = !isAlive(instance);
  const style = { '--deal-delay': `${Math.min(dealIndex, 8) * 70}ms` } as CSSProperties;

  return (
    <button
      className={`card-tile ${active ? 'active' : ''} ${defeated ? 'defeated' : ''}`}
      disabled={!selectable || defeated}
      onClick={onSelect}
      title={card.name}
      style={style}
    >
      <PaukemonPortrait
        image={card.image}
        name={card.name}
        currentLp={instance.currentLp}
        maxLp={card.maxLp}
        defeated={defeated}
        compact
        active={active}
        charging={instance.chargeTurns > 0}
        skipTurns={instance.skipTurns}
      />
      <div className="card-tile-meta">
        <strong>{card.name}</strong>
        <span>{card.iq} IQ</span>
        {instance.skipTurns > 0 && <span className="badge badge-status">setzt {instance.skipTurns} aus</span>}
        {instance.chargeTurns > 0 && <span className="badge badge-charge">Ladung {instance.chargeTurns}/2</span>}
        <LpStatus current={instance.currentLp} max={card.maxLp} compact />
      </div>
    </button>
  );
}
