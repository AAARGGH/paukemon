import type { Owner, PaukemonInstance } from '../game/types';
import { getCard, isAlive } from '../game/engine';

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
  const lpPercent = Math.max(0, Math.round((instance.currentLp / card.maxLp) * 100));

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
        <span>{instance.currentLp}/{card.maxLp} LP · {card.iq} IQ</span>
        {instance.skipTurns > 0 && <span className="badge">setzt {instance.skipTurns} aus</span>}
        {instance.chargeTurns > 0 && <span className="badge">Ladung {instance.chargeTurns}/2</span>}
        <div className="lpbar"><div style={{ width: `${lpPercent}%` }} /></div>
      </div>
    </button>
  );
}
