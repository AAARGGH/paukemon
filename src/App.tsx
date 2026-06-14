import { useMemo, useState } from 'react';
import './style.css';
import { CardView } from './components/CardView';
import { createNewGame, executeAttack, getActive, getCard, isAlive, playRandomEvent, switchActive } from './game/engine';
import type { Owner } from './game/types';

function ownerLabel(owner: Owner): string {
  return owner === 'player' ? 'Spieler 1' : 'Spieler 2';
}

type PlayerColumnProps = {
  owner: Owner;
  state: ReturnType<typeof createNewGame>;
  setState: React.Dispatch<React.SetStateAction<ReturnType<typeof createNewGame>>>;
};

function PlayerColumn({ owner, state, setState }: PlayerColumnProps) {
  const isPlayerOne = owner === 'player';
  const team = isPlayerOne ? state.playerTeam : state.enemyTeam;
  const activeUid = isPlayerOne ? state.activePlayerUid : state.activeEnemyUid;
  const active = getActive(state, owner);
  const activeCard = getCard(active);
  const isCurrentTurn = state.turn === owner && !state.winner;
  const canAct = isCurrentTurn && isAlive(active) && active.skipTurns === 0 && state.actionsLeft > 0;

  return (
    <section className={`player-column ${isCurrentTurn ? 'current-turn' : ''}`}>
      <header className="player-header">
        <h2>{ownerLabel(owner)}</h2>
        <span>{isCurrentTurn ? 'ist am Zug' : 'wartet'}</span>
      </header>

      <article className="active-panel">
        <h3>Aktives Paukémon</h3>
        <img className="big-card" src={activeCard.image} alt={activeCard.name} />

        <div className="active-info">
          <h4>{activeCard.name}</h4>
          <p>{active.currentLp}/{activeCard.maxLp} LP · {activeCard.iq} IQ</p>
          <p>{activeCard.kind} · {activeCard.subjects.join(' / ')}</p>
          {active.skipTurns > 0 && <p className="status-warning">Muss noch {active.skipTurns} Runde(n) aussetzen.</p>}
          {active.chargeTurns > 0 && <p className="status-info">Aufladung: {active.chargeTurns}/2</p>}
        </div>

        <div className="attack-list">
          {activeCard.attacks.map((attack) => (
            <button
              key={attack.id}
              disabled={!canAct}
              onClick={() => setState((current) => executeAttack(current, attack.id))}
            >
              <strong>{attack.name}</strong>
              <span>{attack.text}</span>
            </button>
          ))}
        </div>

        {activeCard.reactions.length > 0 && (
          <div className="reaction-box">
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
          {team.map((instance) => (
            <CardView
              key={instance.uid}
              instance={instance}
              owner={owner}
              active={instance.uid === activeUid}
              selectable={isCurrentTurn && instance.uid !== activeUid && !state.winner}
              onSelect={() => setState((current) => switchActive(current, owner, instance.uid))}
            />
          ))}
        </div>
      </article>
    </section>
  );
}

export default function App() {
  const [state, setState] = useState(() => createNewGame(5));

  const livingPlayerCount = useMemo(() => state.playerTeam.filter(isAlive).length, [state.playerTeam]);
  const livingEnemyCount = useMemo(() => state.enemyTeam.filter(isAlive).length, [state.enemyTeam]);

  const active = getActive(state, state.turn);
  const activeCanUseEvent = !state.winner && active.skipTurns === 0 && !state.eventPlayedThisTurn;

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <h1>Paukémon</h1>
          <p>Lokales 2-Spieler-Duell · v0.2</p>
        </div>
        <div className="hero-actions">
          <button onClick={() => setState(createNewGame(5))}>Neues Spiel</button>
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
        <PlayerColumn owner="player" state={state} setState={setState} />

        <section className="center-column">
          <article className="turn-panel">
            <h2>Rundenstatus</h2>
            <p>
              Aktiver Spieler: <strong>{ownerLabel(state.turn)}</strong>
            </p>
            <p>
              Aktionen übrig: <strong>{state.actionsLeft}</strong>
            </p>
            <button
              disabled={!activeCanUseEvent}
              onClick={() => setState((current) => playRandomEvent(current))}
            >
              Ereigniskarte ziehen
            </button>
            <p className="hint">
              Pro Runde eine Attacke. Wechseln verbraucht die Aktion. Sternchen-Reaktionen laufen automatisch.
            </p>
          </article>

          <article className="log-panel">
            <h2>Kampflog</h2>
            <ol>
              {state.log.map((entry, index) => (
                <li key={`${entry}-${index}`}>{entry}</li>
              ))}
            </ol>
          </article>
        </section>

        <PlayerColumn owner="enemy" state={state} setState={setState} />
      </section>
    </main>
  );
}
