import type { Owner, PaukemonInstance } from '../game/types';
import { getCard, isAlive } from '../game/engine';
import { LpStatus } from './LpStatus';

type Props = {
  instance: PaukemonInstance;
  owner: Owner;
  active: boolean;
  selectable?: boolean;
  onSelect?: () => void;
};

export function CardView({ instance, active, selectable, onSelect }: Props) {
  const card = getCard(instance);
  const defeated = !isAlive(instance);

  return (
    <button
      className={`card-tile ${active ? 'active' : ''} ${defeated ? 'defeated' : ''}`}
      disabled={!selectable || defeated}
      onClick={onSelect}
      title={card.name}
    >
      <img src={card.image} alt={card.name} />
      <div className="card-tile-meta">
        <strong>{card.name}</strong>
        <span>{card.iq} IQ</span>
        {instance.skipTurns > 0 && <span className="badge">setzt {instance.skipTurns} aus</span>}
        {instance.chargeTurns > 0 && <span className="badge">Ladung {instance.chargeTurns}/2</span>}
        <LpStatus current={instance.currentLp} max={card.maxLp} compact />
      </div>
    </button>
  );
}
