import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import './style.css';
import { eventCards } from './data/cards';
import { CardView } from './components/CardView';
import { LpStatus } from './components/LpStatus';
import { PaukemonPortrait } from './components/PaukemonPortrait';
import {
  createNewGame,
  EVENT_CHARGE_MAX,
  executeAttack,
  getActive,
  getCard,
  getTeam,
  isAlive,
  playRandomEvent,
  resolvePendingChoice,
  switchActive,
} from './game/engine';
import type { AttackId, GameState, Owner, PaukemonInstance } from './game/types';

function ownerLabel(owner: Owner): string {
  return owner === 'player' ? 'Spieler 1' : 'Spieler 2';
}

function findInstance(state: GameState, owner: Owner, uid: string): PaukemonInstance | undefined {
  return getTeam(state, owner).find((instance) => instance.uid === uid);
}

type AttackFlash = {
  owner: Owner;
  attackId: AttackId;
  nonce: number;
};

type CueKind = 'attack' | 'reaction' | 'damage' | 'heal' | 'ko' | 'event' | 'status' | 'switch' | 'coin';

type BattleCue = {
  kind: CueKind;
  title: string;
  text: string;
  nonce: number;
  owner?: Owner;
};

function classifyLog(entry: string): Pick<BattleCue, 'kind' | 'title' | 'text'> | undefined {
  if (!entry) return undefined;
  if (entry.includes('ist besiegt')) return { kind: 'ko', title: 'K.O.!', text: entry };
  if (entry.includes('*') || entry.includes('Pauschalisierung') || entry.includes('Weisheit') || entry.includes('entkommt') || entry.includes('wirft die Attacke zurück') || entry.includes('wirkungs­los')) {
    return { kind: 'reaction', title: 'Reaktion!', text: entry };
  }
  if (entry.includes('Münzwurf')) return { kind: 'coin', title: 'Münzwurf', text: entry };
  if (entry.includes('verliert')) return { kind: 'damage', title: 'Treffer!', text: entry };
  if (entry.includes('erhält') || entry.includes('geheilt')) return { kind: 'heal', title: 'Heilung!', text: entry };
  if (entry.includes('Ereigniskarte')) return { kind: 'event', title: 'Ereignis!', text: entry };
  if (entry.includes('muss') && entry.includes('aussetzen')) return { kind: 'status', title: 'Status!', text: entry };
  if (entry.includes('wechselt') || entry.includes('eingewechselt')) return { kind: 'switch', title: 'Wechsel!', text: entry };
  return undefined;
}


function eventReadyLabel(charge: number): string {
  return charge >= EVENT_CHARGE_MAX ? 'bereit' : `${charge}/${EVENT_CHARGE_MAX}`;
}

type EventChargeMeterProps = {
  owner: Owner;
  charge: number;
  active: boolean;
};

function EventChargeMeter({ owner, charge, active }: EventChargeMeterProps) {
  const safeCharge = Math.max(0, Math.min(EVENT_CHARGE_MAX, charge ?? 0));
  const ready = safeCharge >= EVENT_CHARGE_MAX;

  return (
    <div className={`event-charge-meter ${active ? 'active' : ''} ${ready ? 'ready' : ''}`}>
      <div className="event-charge-label">
        <span>{ownerLabel(owner)}</span>
        <strong>{ready ? 'Ereignis bereit!' : `Ereignis lädt: ${eventReadyLabel(safeCharge)}`}</strong>
      </div>
      <div className="event-charge-pips" aria-label={`${ownerLabel(owner)} Ereignis-Aufladung ${safeCharge} von ${EVENT_CHARGE_MAX}`}>
        {Array.from({ length: EVENT_CHARGE_MAX }).map((_, index) => (
          <span key={index} className={index < safeCharge ? 'filled' : ''} />
        ))}
      </div>
    </div>
  );
}

type PlayerColumnProps = {
  owner: Owner;
  state: GameState;
  setState: Dispatch<SetStateAction<GameState>>;
  onAttack: (owner: Owner, attackId: AttackId, attackName: string) => void;
  attackFlash?: AttackFlash | null;
  dealNonce: number;
};

function PlayerColumn({ owner, state, setState, onAttack, attackFlash, dealNonce }: PlayerColumnProps) {
  const isPlayerOne = owner === 'player';
  const team = isPlayerOne ? state.playerTeam : state.enemyTeam;
  const activeUid = isPlayerOne ? state.activePlayerUid : state.activeEnemyUid;
  const active = getActive(state, owner);
  const activeCard = getCard(active);
  const isCurrentTurn = state.turn === owner && !state.winner;
  const canAct = isCurrentTurn && !state.pendingChoice && isAlive(active) && active.skipTurns === 0 && state.actionsLeft > 0;
  const activeAttacking = attackFlash?.owner === owner;
  const latestLog = state.log[0] ?? '';
  const reactionHot = latestLog.includes('*') && latestLog.includes(activeCard.name);

  return (
    <section className={`player-column ${isCurrentTurn ? 'current-turn' : ''} ${activeAttacking ? 'column-attacking' : ''}`}>
      <header className="player-header">
        <h2>{ownerLabel(owner)}</h2>
        <span>{isCurrentTurn ? 'ist am Zug' : 'wartet'}</span>
      </header>

      <article className={`active-panel ${activeAttacking ? 'attacking' : ''}`} key={`${dealNonce}-${owner}-${active.uid}`}>
        <h3>Aktives Paukémon</h3>
        <PaukemonPortrait
          image={activeCard.image}
          name={activeCard.name}
          currentLp={active.currentLp}
          maxLp={activeCard.maxLp}
          defeated={!isAlive(active)}
          active
          charging={active.chargeTurns > 0}
          skipTurns={active.skipTurns}
        />

        <div className="active-info">
          <h4>{activeCard.name}</h4>
          <LpStatus current={active.currentLp} max={activeCard.maxLp} />
          <p>{activeCard.iq} IQ · {activeCard.kind}</p>
          <p>{activeCard.subjects.join(' / ')}</p>
          {active.skipTurns > 0 && <p className="status-warning">Muss noch {active.skipTurns} Runde(n) aussetzen.</p>}
          {active.chargeTurns > 0 && <p className="status-info">Aufladung: {active.chargeTurns}/2</p>}
        </div>

        <div className="attack-list">
          {activeCard.attacks.map((attack) => {
            const isFlashing = attackFlash?.owner === owner && attackFlash.attackId === attack.id;
            return (
              <button
                key={attack.id}
                className={isFlashing ? 'attack-fired' : ''}
                disabled={!canAct}
                onClick={() => onAttack(owner, attack.id, attack.name)}
              >
                <strong>{attack.name}</strong>
                <span>{attack.text}</span>
              </button>
            );
          })}
        </div>

        {activeCard.reactions.length > 0 && (
          <div className={`reaction-box ${reactionHot ? 'reaction-hot' : ''}`}>
            <strong>Reaktionen:</strong>
            {activeCard.reactions.map((reaction) => (
              <span key={reaction.id}>{reaction.name}: {reaction.text}</span>
            ))}
          </div>
        )}
      </article>

      <article className="team-panel">
        <h3>{ownerLabel(owner)} Team</h3>
        <div className="team-grid">
          {team.map((instance, index) => (
            <CardView
              key={`${dealNonce}-${instance.uid}`}
              instance={instance}
              owner={owner}
              active={instance.uid === activeUid}
              selectable={isCurrentTurn && !state.pendingChoice && instance.uid !== activeUid && !state.winner}
              onSelect={() => setState((current) => switchActive(current, owner, instance.uid))}
              dealIndex={index + (owner === 'enemy' ? 5 : 0)}
            />
          ))}
        </div>
      </article>
    </section>
  );
}

function PendingChoiceDialog({ state, setState }: { state: GameState; setState: Dispatch<SetStateAction<GameState>> }) {
  const pending = state.pendingChoice;
  if (!pending) return null;

  const attacker = findInstance(state, pending.attackerOwner, pending.attackerUid);
  const target = findInstance(state, pending.targetOwner, pending.targetUid);
  const attackerName = attacker ? getCard(attacker).name : 'Copymon';
  const targetName = target ? getCard(target).name : 'das Ziel';

  return (
    <div className="choice-backdrop" role="dialog" aria-modal="true">
      <section className="choice-dialog">
        <p className="eyebrow">Rückfrage an {ownerLabel(pending.chooser)}</p>
        <h2>Kopierflut!</h2>
        <p>
          {attackerName} trifft {targetName}. {ownerLabel(pending.chooser)} muss entscheiden:
        </p>
        <div className="choice-actions">
          <button onClick={() => setState((current) => resolvePendingChoice(current, 'DAMAGE'))}>
            20 LP Schaden nehmen
          </button>
          <button onClick={() => setState((current) => resolvePendingChoice(current, 'SKIP'))}>
            1 Runde aussetzen
          </button>
        </div>
      </section>
    </div>
  );
}

function BattleCueView({ cue }: { cue?: BattleCue | null }) {
  if (!cue) return null;

  return (
    <div className={`battle-cue battle-cue-${cue.kind} ${cue.owner ? `from-${cue.owner}` : ''}`} key={cue.nonce}>
      <div className="battle-cue-card">
        <span>{cue.title}</span>
        <strong>{cue.text}</strong>
      </div>
      <div className="battle-beam" />
    </div>
  );
}

export default function App() {
  const [state, setState] = useState<GameState>(() => createNewGame(5));
  const [dealNonce, setDealNonce] = useState(1);
  const [attackFlash, setAttackFlash] = useState<AttackFlash | null>(null);
  const [battleCue, setBattleCue] = useState<BattleCue | null>(null);

  const livingPlayerCount = useMemo(() => state.playerTeam.filter(isAlive).length, [state.playerTeam]);
  const livingEnemyCount = useMemo(() => state.enemyTeam.filter(isAlive).length, [state.enemyTeam]);

  const active = getActive(state, state.turn);
  const activeEventCharge = state.eventCharge?.[state.turn] ?? 0;
  const activeCanUseEvent = !state.winner && !state.pendingChoice && active.skipTurns === 0 && !state.eventPlayedThisTurn && activeEventCharge >= EVENT_CHARGE_MAX;
  const revealedEvent = state.lastEventId ? eventCards.find((event) => event.id === state.lastEventId) : undefined;

  useEffect(() => {
    const entry = state.log[0] ?? '';
    const classified = classifyLog(entry);
    if (!classified) return;

    const cue: BattleCue = {
      ...classified,
      nonce: Date.now(),
    };

    setBattleCue(cue);
    const timer = window.setTimeout(() => setBattleCue(null), 1150);
    return () => window.clearTimeout(timer);
  }, [state.log]);

  const startNewGame = () => {
    setBattleCue({ kind: 'event', title: 'Austeilen!', text: 'Die Paukémon-Karten werden neu gemischt.', nonce: Date.now() });
    setDealNonce((current) => current + 1);
    setState(createNewGame(5));
  };

  const handleAttack = (owner: Owner, attackId: AttackId, attackName: string) => {
    const nonce = Date.now();
    setAttackFlash({ owner, attackId, nonce });
    setBattleCue({ kind: 'attack', title: 'Attacke!', text: `${ownerLabel(owner)} nutzt ${attackName}.`, owner, nonce });
    window.setTimeout(() => setAttackFlash((current) => (current?.nonce === nonce ? null : current)), 720);
    setState((current) => executeAttack(current, attackId));
  };

  return (
    <main className={`app-shell ${battleCue ? `cue-${battleCue.kind}` : ''}`}>
      <div className="rotate-device-overlay" role="status" aria-live="polite">
        <div className="rotate-device-card">
          <div className="rotate-phone" aria-hidden="true">↻</div>
          <h2>Bitte Bildschirm drehen</h2>
          <p>Für Paukémon ist Querformat gedacht: Spieler 1 links, Kampflog in der Mitte, Spieler 2 rechts.</p>
        </div>
      </div>

      <header className="hero">
        <div>
          <h1>Paukémon</h1>
          <p>Lokales 2-Spieler-Duell · v0.6 Ereignis-Aufladung</p>
        </div>
        <div className="hero-actions">
          <button onClick={startNewGame}>Neues Spiel</button>
        </div>
      </header>

      {state.winner && (
        <section className="winner">
          {ownerLabel(state.winner)} hat gewonnen!
        </section>
      )}

      <section className="score-row">
        <div>Spieler 1: {livingPlayerCount} Paukémon übrig</div>
        <div className="turn-indicator">{state.winner ? 'Spiel beendet' : `${ownerLabel(state.turn)} ist am Zug`}</div>
        <div>Spieler 2: {livingEnemyCount} Paukémon übrig</div>
      </section>

      <section className="game-layout">
        <PlayerColumn owner="player" state={state} setState={setState} onAttack={handleAttack} attackFlash={attackFlash} dealNonce={dealNonce} />

        <section className="center-column">
          <article className="turn-panel">
            <h2>Rundenstatus</h2>
            <p>
              Aktiver Spieler: <strong>{ownerLabel(state.turn)}</strong>
            </p>
            <p>
              Aktionen übrig: <strong>{state.actionsLeft}</strong>
            </p>
            <div className="event-charge-board">
              <EventChargeMeter owner="player" charge={state.eventCharge?.player ?? 0} active={state.turn === 'player'} />
              <EventChargeMeter owner="enemy" charge={state.eventCharge?.enemy ?? 0} active={state.turn === 'enemy'} />
            </div>
            <div className="event-slot">
              <button
                disabled={!activeCanUseEvent}
                title={activeCanUseEvent ? 'Ereigniskarte ziehen' : `Noch nicht bereit: ${eventReadyLabel(activeEventCharge)}`}
                onClick={() => setState((current) => playRandomEvent(current))}
              >
                {activeCanUseEvent ? 'Ereigniskarte ziehen' : `Ereignis lädt (${eventReadyLabel(activeEventCharge)})`}
              </button>
              {revealedEvent && (
                <div className="event-pop" key={`${revealedEvent.id}-${state.eventRevealNonce}`}>
                  <img src={revealedEvent.image} alt={revealedEvent.name} />
                  <strong>{revealedEvent.name}</strong>
                  <span>{revealedEvent.text}</span>
                </div>
              )}
            </div>
            <p className="hint">
              Pro Runde eine Attacke. Wechseln verbraucht die Aktion. Ereigniskarten laden für beide Spieler getrennt über 3 eigene Züge.
            </p>
          </article>

          <article className="log-panel">
            <h2>Kampflog</h2>
            <ol>
              {state.log.map((entry, index) => (
                <li
                  key={`${entry}-${index}`}
                  className={`${index === 0 ? 'latest-log' : ''} ${classifyLog(entry)?.kind ? `log-${classifyLog(entry)?.kind}` : ''}`}
                >
                  {entry}
                </li>
              ))}
            </ol>
          </article>
        </section>

        <PlayerColumn owner="enemy" state={state} setState={setState} onAttack={handleAttack} attackFlash={attackFlash} dealNonce={dealNonce} />
      </section>

      <BattleCueView cue={battleCue} />
      <PendingChoiceDialog state={state} setState={setState} />
    </main>
  );
}
