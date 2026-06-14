import type { AttackId, GameState } from './types';
import { executeAttack, getActive, getCard, isAlive, playRandomEvent, switchActive } from './engine';

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function playComputerTurn(state: GameState): GameState {
  if (state.winner || state.turn !== 'enemy') return state;

  let next = state;

  // Der Computer ist absichtlich nicht besonders schlau: gelegentlich Ereignis, sonst zufällige Attacke.
  if (Math.random() < 0.18) {
    next = playRandomEvent(next);
    if (next.winner || next.turn !== 'enemy') return next;
  }

  const active = getActive(next, 'enemy');
  if (!isAlive(active)) {
    const replacement = next.enemyTeam.find(isAlive);
    if (replacement) return switchActive(next, 'enemy', replacement.uid);
    return next;
  }

  const card = getCard(active);
  const attack = randomItem(card.attacks).id as AttackId;
  return executeAttack(next, attack);
}
