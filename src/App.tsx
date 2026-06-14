import { useEffect, useMemo, useState } from 'react';
import './style.css';
import { CardView } from './components/CardView';
import { createNewGame, executeAttack, getActive, getCard, isAlive, playRandomEvent, switchActive } from './game/engine';
import { playComputerTurn } from './game/ai';

export default function App() {
  const [state, setState] = useState(() => createNewGame(5));

  const playerActive = getActive(state, 'player');
  const enemyActive = getActive(state, 'enemy');
  const playerCard = getCard(playerActive);
  const enemyCard = getCard(enemyActive);

  const canAct = state.turn === 'player' && !state.winner && isAlive(playerActive) && playerActive.skipTurns === 0;

  useEffect(() => {
    if (state.turn !== 'enemy' || state.winner) return;
    const timeout = window.setTimeout(() => {
      setState((current) => playComputerTurn(current));
    }, 650);
    return () => window.clearTimeout(timeout);
  }, [state.turn, state.winner, state.log.length]);

  const livingPlayerCount = useMemo(() => state.playerTeam.filter(isAlive).length, [state.playerTeam]);
  const livingEnemyCount = useMemo(() => state.enemyTeam.filter(isAlive).length, [state.enemyTeam]);

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <h1>Paukémon</h1>
          <p>Rekonstruierter Nostalgie-Prototyp · v0.1</p>
        </div>
        <div className="hero-actions">
          <button onClick={() => setState(createNewGame(5))}>Neues Spiel</button>
          <button disabled={!canAct || state.eventPlayedThisTurn} onClick={() => setState((current) => playRandomEvent(current))}>Ereigniskarte</button>
        </div>
      </header>

      {state.winner && (
        <section className="winner">
          {state.winner === 'player' ? 'Du hast gewonnen!' : 'Der Computer hat gewonnen!'}
        </section>
      )}

      <section className="score-row">
        <div>Du: {livingPlayerCount} Paukémon übrig</div>
        <div className={state.turn === 'player' ? 'turn-active' : ''}>{state.turn === 'player' ? 'Dein Zug' : 'Computerzug'}</div>
        <div>Computer: {livingEnemyCount} Paukémon übrig</div>
      </section>

      <section className="battlefield">
        <article className="active-panel">
          <h2>Dein aktives Paukémon</h2>
          <img className="big-card" src={playerCard.image} alt={playerCard.name} />
          <div className="active-info">
            <h3>{playerCard.name}</h3>
            <p>{playerActive.currentLp}/{playerCard.maxLp} LP · {playerCard.iq} IQ</p>
            <p>{playerCard.kind} · {playerCard.subjects.join(' / ')}</p>
          </div>
        </article>

        <article className="actions-panel">
          <h2>Aktionen</h2>
          <p className="hint">Pro Runde eine Attacke. Sternchen-Reaktionen laufen automatisch.</p>
          <div className="attack-list">
            {playerCard.attacks.map((attack) => (
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
          {playerCard.reactions.length > 0 && (
            <div className="reaction-box">
              <strong>Reaktionen:</strong>
              {playerCard.reactions.map((reaction) => (
                <span key={reaction.id}>{reaction.name}: {reaction.text}</span>
              ))}
            </div>
          )}
        </article>

        <article className="active-panel enemy-panel">
          <h2>Gegnerisches Paukémon</h2>
          <img className="big-card" src={enemyCard.image} alt={enemyCard.name} />
          <div className="active-info">
            <h3>{enemyCard.name}</h3>
            <p>{enemyActive.currentLp}/{enemyCard.maxLp} LP · {enemyCard.iq} IQ</p>
            <p>{enemyCard.kind} · {enemyCard.subjects.join(' / ')}</p>
          </div>
        </article>
      </section>

      <section className="teams-and-log">
        <article>
          <h2>Dein Team</h2>
          <div className="team-grid">
            {state.playerTeam.map((instance) => (
              <CardView
                key={instance.uid}
                instance={instance}
                owner="player"
                active={instance.uid === state.activePlayerUid}
                selectable={state.turn === 'player' && instance.uid !== state.activePlayerUid}
                onSelect={() => setState((current) => switchActive(current, 'player', instance.uid))}
              />
            ))}
          </div>
        </article>

        <article>
          <h2>Computerteam</h2>
          <div className="team-grid">
            {state.enemyTeam.map((instance) => (
              <CardView
                key={instance.uid}
                instance={instance}
                owner="enemy"
                active={instance.uid === state.activeEnemyUid}
              />
            ))}
          </div>
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
    </main>
  );
}
