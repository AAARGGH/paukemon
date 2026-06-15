import { useEffect, useRef, useState } from 'react';
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
  resolvePendingKo,
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

const EVENT_REVEAL_DURATION_MS = 6000;

function classifyLog(entry: string): Pick<BattleCue, 'kind' | 'title' | 'text'> | undefined {
  if (!entry) return undefined;
  if (entry.includes('Münzwurf')) return { kind: 'coin', title: 'Münzwurf', text: entry };
  if (entry.includes('ist besiegt')) return { kind: 'ko', title: 'K.O.!', text: entry };
  if (entry.includes('*') || entry.includes('Pauschalisierung') || entry.includes('Weisheit') || entry.includes('entkommt') || entry.includes('wirft die Attacke zurück') || entry.includes('wirkungslos')) {
    return { kind: 'reaction', title: 'Reaktion!', text: entry };
  }
  if (entry.includes('verliert')) return { kind: 'damage', title: 'Treffer!', text: entry };
  if (entry.includes('erhält') || entry.includes('geheilt')) return { kind: 'heal', title: 'Heilung!', text: entry };
  if (entry.includes('Ereigniskarte')) return { kind: 'event', title: 'Ereignis!', text: entry };
  if (entry.includes('passiert nichts')) return { kind: 'status', title: 'Nichts passiert!', text: entry };
  if (entry.includes('muss') && entry.includes('aussetzen')) return { kind: 'status', title: 'Status!', text: entry };
  if (entry.includes('wechselt') || entry.includes('eingewechselt')) return { kind: 'switch', title: 'Wechsel!', text: entry };
  return undefined;
}

function cueDuration(cue: BattleCue): number {
  switch (cue.kind) {
    case 'coin':
      return 3400;
    case 'attack':
      return 1900;
    case 'ko':
      return 2800;
    case 'reaction':
      return 2600;
    default:
      return 2300;
  }
}

function newLogEntries(current: string[], previous: string[]): string[] {
  if (previous.length === 0) return current;

  for (let start = 0; start <= current.length; start += 1) {
    const overlap = Math.min(previous.length, current.length - start);
    if (overlap <= 0) continue;

    let matches = true;
    for (let index = 0; index < overlap; index += 1) {
      if (current[start + index] !== previous[index]) {
        matches = false;
        break;
      }
    }

    if (matches) return current.slice(0, start);
  }

  return current.length > previous.length ? current.slice(0, current.length - previous.length) : [];
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
  uiLocked?: boolean;
};

function PlayerColumn({ owner, state, setState, onAttack, attackFlash, dealNonce, uiLocked = false }: PlayerColumnProps) {
  const isPlayerOne = owner === 'player';
  const team = isPlayerOne ? state.playerTeam : state.enemyTeam;
  const activeUid = isPlayerOne ? state.activePlayerUid : state.activeEnemyUid;
  const active = getActive(state, owner);
  const activeCard = getCard(active);
  const isCurrentTurn = state.turn === owner && !state.winner;
  const pendingKoActive = state.pendingKo?.owner === owner && state.pendingKo.uid === active.uid;
  const canAct = isCurrentTurn && !uiLocked && !state.pendingChoice && !state.pendingKo && isAlive(active) && active.skipTurns === 0 && state.actionsLeft > 0;
  const activeAttacking = attackFlash?.owner === owner;
  const latestLog = state.log[0] ?? '';
  const reactionHot = latestLog.includes('*') && latestLog.includes(activeCard.name);

  return (
    <section className={`player-column ${isCurrentTurn ? 'current-turn' : ''} ${activeAttacking ? 'column-attacking' : ''} ${pendingKoActive ? 'column-pending-ko' : ''}`}>
      <header className="player-header">
        <h2>{ownerLabel(owner)}</h2>
        <span className="turn-badge">{isCurrentTurn ? 'JETZT AM ZUG' : 'wartet'}</span>
      </header>

      <article className={`active-panel ${activeAttacking ? 'attacking' : ''} ${pendingKoActive ? 'pending-ko' : ''}`} key={`${dealNonce}-${owner}-${active.uid}`}>
        {pendingKoActive && <div className="ko-removal-ribbon">wird aus dem Spiel genommen…</div>}
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
              selectable={isCurrentTurn && !uiLocked && !state.pendingChoice && !state.pendingKo && instance.uid !== activeUid && !state.winner}
              onSelect={() => setState((current) => switchActive(current, owner, instance.uid))}
              dealIndex={index + (owner === 'enemy' ? 5 : 0)}
            />
          ))}
        </div>
      </article>
    </section>
  );
}

type TargetChoiceDialogProps = {
  state: GameState;
  title: string;
  eyebrow: string;
  description: string;
  targets: { owner: Owner; uid: string }[];
  onSelect: (owner: Owner, uid: string) => void;
};

function TargetChoiceDialog({ state, title, eyebrow, description, targets, onSelect }: TargetChoiceDialogProps) {
  return (
    <div className="choice-backdrop" role="dialog" aria-modal="true">
      <section className="choice-dialog choice-dialog-wide">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="helper-choice-grid target-choice-grid">
          {targets.map((targetRef) => {
            const instance = findInstance(state, targetRef.owner, targetRef.uid);
            if (!instance || !isAlive(instance)) return null;
            const card = getCard(instance);
            return (
              <button
                key={`${targetRef.owner}-${targetRef.uid}`}
                className="helper-choice-card target-choice-card"
                onClick={() => onSelect(targetRef.owner, targetRef.uid)}
              >
                <img src={card.image} alt={card.name} />
                <strong>{card.name}</strong>
                <span>{ownerLabel(targetRef.owner)}</span>
                <small>{instance.currentLp}/{card.maxLp} LP · {card.iq} IQ</small>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function PendingChoiceDialog({ state, setState }: { state: GameState; setState: Dispatch<SetStateAction<GameState>> }) {
  const pending = state.pendingChoice;
  if (!pending) return null;

  if (pending.kind === 'FACHKONFERENZ') {
    return (
      <div className="choice-backdrop choice-backdrop-fachkonferenz" role="dialog" aria-modal="true">
        <section className="choice-dialog choice-dialog-wide fachkonferenz-dialog">
          <p className="eyebrow">Auswahl für {ownerLabel(pending.chooser)}</p>
          <h2>Fachkonferenz!</h2>
          <p>
            {ownerLabel(pending.chooser)} darf das Fach auswählen. Alle Paukémon mit diesem Fach müssen 3 Runden aussetzen.
          </p>
          <div className="subject-choice-grid">
            {pending.subjects.map((subject) => (
              <button
                key={subject}
                className="subject-choice-button"
                onClick={() => setState((current) => resolvePendingChoice(current, { kind: 'SUBJECT', subject }))}
              >
                {subject}
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (pending.kind === 'KUCHEN_BACKEN_LASSEN') {
    const attacker = findInstance(state, pending.attackerOwner, pending.attackerUid);
    const attackerName = attacker ? getCard(attacker).name : 'Copymon';
    return (
      <TargetChoiceDialog
        state={state}
        title="Kuchen backen lassen!"
        eyebrow={`Auswahl für ${ownerLabel(pending.chooser)}`}
        description={`${attackerName} fragt: Wer bekommt den Kuchen?`}
        targets={pending.candidateTargets}
        onSelect={(targetOwner, targetUid) => setState((current) => resolvePendingChoice(current, { kind: 'TARGET', targetOwner, targetUid }))}
      />
    );
  }

  if (pending.kind === 'ESOTERISCHE_HEILUNG') {
    const attacker = findInstance(state, pending.attackerOwner, pending.attackerUid);
    const attackerName = attacker ? getCard(attacker).name : 'Esoteriko';
    return (
      <TargetChoiceDialog
        state={state}
        title="Esoterische Heilung!"
        eyebrow={`Auswahl für ${ownerLabel(pending.chooser)}`}
        description={`${attackerName} darf ein verletztes Paukémon mit IQ unter 91 heilen. Wer wird geheilt?`}
        targets={pending.candidateTargets}
        onSelect={(targetOwner, targetUid) => setState((current) => resolvePendingChoice(current, { kind: 'TARGET', targetOwner, targetUid }))}
      />
    );
  }

  if (pending.kind === 'IM_SIMPEL_EINEN_TRINKEN_GEHEN') {
    const attacker = findInstance(state, pending.attackerOwner, pending.attackerUid);
    const attackerName = attacker ? getCard(attacker).name : 'Nasenmann';
    return (
      <TargetChoiceDialog
        state={state}
        title="Im Simpel einen Trinken gehen!"
        eyebrow={`Auswahl für ${ownerLabel(pending.chooser)}`}
        description={`${attackerName} sucht Gesellschaft. Mit wem geht er trinken? Eigene und gegnerische Paukémon sind auswählbar.`}
        targets={pending.candidateTargets}
        onSelect={(targetOwner, targetUid) => setState((current) => resolvePendingChoice(current, { kind: 'TARGET', targetOwner, targetUid }))}
      />
    );
  }

  const attacker = findInstance(state, pending.attackerOwner, pending.attackerUid);
  const target = findInstance(state, pending.targetOwner, pending.targetUid);
  const attackerName = attacker ? getCard(attacker).name : 'Copymon';
  const targetName = target ? getCard(target).name : 'das Ziel';

  if (pending.kind === 'ARBEIT_ABWAELZEN') {
    const helpers = pending.helperUids
      .map((uid) => findInstance(state, pending.attackerOwner, uid))
      .filter((instance): instance is PaukemonInstance => {
        if (!instance) return false;
        return isAlive(instance);
      });

    return (
      <div className="choice-backdrop" role="dialog" aria-modal="true">
        <section className="choice-dialog choice-dialog-wide">
          <p className="eyebrow">Auswahl für {ownerLabel(pending.chooser)}</p>
          <h2>Arbeit abwälzen!</h2>
          <p>
            {attackerName} will nicht selbst ran. Wer soll seine Standardattacke gegen {targetName} ausführen?
          </p>
          <div className="helper-choice-grid">
            {helpers.map((helper) => {
              const card = getCard(helper);
              const standard = card.attacks.find((attack) => attack.isStandard) ?? card.attacks[0];
              return (
                <button
                  key={helper.uid}
                  className="helper-choice-card"
                  onClick={() => setState((current) => resolvePendingChoice(current, { kind: 'HELPER', helperUid: helper.uid }))}
                >
                  <img src={card.image} alt={card.name} />
                  <strong>{card.name}</strong>
                  <span>{standard.name}</span>
                  <small>{helper.currentLp}/{card.maxLp} LP · {card.iq} IQ</small>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

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

  const coinResult = cue.kind === 'coin'
    ? cue.text.includes('Kopf')
      ? 'Kopf'
      : cue.text.includes('Zahl')
        ? 'Zahl'
        : '?'
    : undefined;

  return (
    <div className={`battle-cue battle-cue-${cue.kind} ${cue.owner ? `from-${cue.owner}` : ''}`} key={cue.nonce}>
      {cue.kind === 'coin' && (
        <div className={`coin-flight ${coinResult === 'Zahl' ? 'coin-zahl' : 'coin-kopf'}`}>
          <div className="coin-disc">
            <span>{coinResult}</span>
          </div>
        </div>
      )}
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
  const [battleCueQueue, setBattleCueQueue] = useState<BattleCue[]>([]);
  const [eventRevealActive, setEventRevealActive] = useState(false);
  const previousLogRef = useRef<string[]>(state.log);

  const queueBattleCue = (cue: BattleCue | BattleCue[]) => {
    const cues = Array.isArray(cue) ? cue : [cue];
    if (cues.length === 0) return;
    setBattleCueQueue((current) => [...current, ...cues]);
  };

  const active = getActive(state, state.turn);
  const activeEventCharge = state.eventCharge?.[state.turn] ?? 0;
  const activeCanUseEvent = !eventRevealActive && !state.winner && !state.pendingChoice && !state.pendingKo && active.skipTurns === 0 && !state.eventPlayedThisTurn && activeEventCharge >= EVENT_CHARGE_MAX;
  const revealedEvent = state.lastEventId ? eventCards.find((event) => event.id === state.lastEventId) : undefined;

  useEffect(() => {
    const additions = newLogEntries(state.log, previousLogRef.current);
    previousLogRef.current = state.log;
    if (additions.length === 0) return;

    const now = Date.now();
    const cues = additions
      .slice()
      .reverse()
      .map((entry, index) => {
        const classified = classifyLog(entry);
        if (!classified) return undefined;
        return {
          ...classified,
          nonce: now + index,
        } satisfies BattleCue;
      })
      .filter((cue): cue is BattleCue => Boolean(cue));

    if (cues.length > 0) queueBattleCue(cues);
  }, [state.log]);

  useEffect(() => {
    if (eventRevealActive || state.pendingChoice || battleCue || battleCueQueue.length === 0) return;

    const [nextCue, ...remainingCues] = battleCueQueue;
    setBattleCue(nextCue);
    setBattleCueQueue(remainingCues);
  }, [battleCue, battleCueQueue, eventRevealActive, state.pendingChoice]);

  useEffect(() => {
    if (!battleCue) return;

    const timer = window.setTimeout(() => setBattleCue(null), cueDuration(battleCue));
    return () => window.clearTimeout(timer);
  }, [battleCue]);

  useEffect(() => {
    if (!state.eventRevealNonce || !revealedEvent) return;

    setBattleCue(null);
    setEventRevealActive(true);
    const timer = window.setTimeout(() => setEventRevealActive(false), EVENT_REVEAL_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [state.eventRevealNonce, revealedEvent?.id]);

  useEffect(() => {
    const pending = state.pendingKo;
    if (!pending) return;

    const instance = findInstance(state, pending.owner, pending.uid);
    const cardName = instance ? getCard(instance).name : 'Paukémon';
    const nonce = Date.now();
    queueBattleCue({
      kind: 'ko',
      title: 'K.O.!',
      text: `${cardName} wird aus dem Spiel genommen.`,
      owner: pending.owner,
      nonce,
    });

    const timer = window.setTimeout(() => {
      setState((current) => resolvePendingKo(current));
    }, 2100);

    return () => window.clearTimeout(timer);
  }, [state.pendingKo?.owner, state.pendingKo?.uid]);

  const startNewGame = () => {
    const nextGame = createNewGame(5);
    previousLogRef.current = nextGame.log;
    setBattleCue(null);
    setEventRevealActive(false);
    setBattleCueQueue([{ kind: 'event', title: 'Austeilen!', text: 'Die Paukémon-Karten werden neu gemischt.', nonce: Date.now() }]);
    setDealNonce((current) => current + 1);
    setState(nextGame);
  };

  const handleAttack = (owner: Owner, attackId: AttackId, attackName: string) => {
    const nonce = Date.now();
    setAttackFlash({ owner, attackId, nonce });
    queueBattleCue({ kind: 'attack', title: 'Attacke!', text: `${ownerLabel(owner)} nutzt ${attackName}.`, owner, nonce });
    window.setTimeout(() => setAttackFlash((current) => (current?.nonce === nonce ? null : current)), 900);
    setState((current) => executeAttack(current, attackId));
  };

  return (
    <main className={`app-shell ${battleCue ? `cue-${battleCue.kind}` : ''} active-${state.turn} ${state.pendingKo ? 'ko-resolution-active' : ''} ${eventRevealActive ? 'event-reveal-active' : ''}`}>
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
        <div className="turn-indicator turn-flash" key={state.turn}>{state.winner ? 'Spiel beendet' : `${ownerLabel(state.turn)} ist am Zug`}</div>
      </section>

      <section className="game-layout">
        <PlayerColumn owner="player" state={state} setState={setState} onAttack={handleAttack} attackFlash={attackFlash} dealNonce={dealNonce} uiLocked={eventRevealActive} />

        <section className="center-column">
          <article className="turn-panel">
            <h2>Rundenstatus</h2>
            <p>
              Aktiver Spieler: <strong>{ownerLabel(state.turn)}</strong>
            </p>
            <p>
              Aktionen übrig: <strong>{state.actionsLeft}</strong>
            </p>
            <div className="event-slot">
              <button
                className={`event-draw-button ${activeCanUseEvent ? 'ready' : 'charging'}`}
                disabled={!activeCanUseEvent}
                title={activeCanUseEvent ? 'Ereigniskarte ziehen' : `Noch nicht bereit: ${eventReadyLabel(activeEventCharge)}`}
                onClick={() => setState((current) => playRandomEvent(current))}
              >
                <img src="/event-button.jpg" alt="Ereigniskarte" />
                <span className="event-button-caption">
                  {activeCanUseEvent ? 'Ereigniskarte ziehen' : `Ereignis lädt (${eventReadyLabel(activeEventCharge)})`}
                </span>
              </button>
              <div className="event-charge-board">
                <EventChargeMeter owner="player" charge={state.eventCharge?.player ?? 0} active={state.turn === 'player'} />
                <EventChargeMeter owner="enemy" charge={state.eventCharge?.enemy ?? 0} active={state.turn === 'enemy'} />
              </div>
              {eventRevealActive && revealedEvent && (
                <div className="event-pop event-pop-large" key={`${revealedEvent.id}-${state.eventRevealNonce}`}>
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

        <PlayerColumn owner="enemy" state={state} setState={setState} onAttack={handleAttack} attackFlash={attackFlash} dealNonce={dealNonce} uiLocked={eventRevealActive} />
      </section>

      {!eventRevealActive && !state.pendingChoice && <BattleCueView cue={battleCue} />}
      {!eventRevealActive && <PendingChoiceDialog state={state} setState={setState} />}
    </main>
  );
}
