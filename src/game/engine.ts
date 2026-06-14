import { cardById, eventCards, paukemonCards } from '../data/cards';
import type { AttackContext, AttackId, Coin, EventId, GameState, Owner, PaukemonCard, PaukemonInstance } from './types';

const NATURAL_SCIENCES = ['Mathe', 'Physik', 'Chemie'];

function coin(): Coin {
  return Math.random() < 0.5 ? 'Kopf' : 'Zahl';
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function cloneState(state: GameState): GameState {
  return structuredClone(state) as GameState;
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export function getCard(instance: PaukemonInstance): PaukemonCard {
  const card = cardById.get(instance.cardId);
  if (!card) throw new Error(`Unknown card: ${instance.cardId}`);
  return card;
}

export function isAlive(instance: PaukemonInstance): boolean {
  return !instance.removed && instance.currentLp > 0;
}

export function getTeam(state: GameState, owner: Owner): PaukemonInstance[] {
  return owner === 'player' ? state.playerTeam : state.enemyTeam;
}

function activeUidKey(owner: Owner): 'activePlayerUid' | 'activeEnemyUid' {
  return owner === 'player' ? 'activePlayerUid' : 'activeEnemyUid';
}

export function getActive(state: GameState, owner: Owner): PaukemonInstance {
  const team = getTeam(state, owner);
  const active = team.find((item) => item.uid === state[activeUidKey(owner)]);
  if (!active) throw new Error(`No active Paukémon for ${owner}`);
  return active;
}

function findInstance(state: GameState, owner: Owner, instanceUid: string): PaukemonInstance | undefined {
  return getTeam(state, owner).find((item) => item.uid === instanceUid);
}

function opponent(owner: Owner): Owner {
  return owner === 'player' ? 'enemy' : 'player';
}

function ownerLabel(owner: Owner): string {
  return owner === 'player' ? 'Du' : 'Computer';
}

function log(state: GameState, message: string): void {
  state.log.unshift(message);
  state.log = state.log.slice(0, 80);
}

function heal(state: GameState, owner: Owner, instanceUid: string, amount: number): void {
  const instance = findInstance(state, owner, instanceUid);
  if (!instance || !isAlive(instance)) return;
  const card = getCard(instance);
  const before = instance.currentLp;
  instance.currentLp = Math.min(card.maxLp, instance.currentLp + amount);
  log(state, `${card.name} erhält ${instance.currentLp - before} LP zurück.`);
}

function setToOnlyTenDamage(state: GameState, owner: Owner, instanceUid: string): void {
  const instance = findInstance(state, owner, instanceUid);
  if (!instance || !isAlive(instance)) return;
  const card = getCard(instance);
  instance.currentLp = Math.max(1, card.maxLp - 10);
  log(state, `${card.name} wird geheilt und behält nur noch 10 Schaden.`);
}

function damage(state: GameState, owner: Owner, instanceUid: string, amount: number): void {
  const instance = findInstance(state, owner, instanceUid);
  if (!instance || !isAlive(instance)) return;
  const card = getCard(instance);
  instance.currentLp = Math.max(0, instance.currentLp - amount);
  log(state, `${card.name} verliert ${amount} LP.`);
  if (instance.currentLp <= 0) {
    log(state, `${card.name} ist besiegt.`);
  }
}

function addSkip(state: GameState, owner: Owner, instanceUid: string, turns: number): void {
  const instance = findInstance(state, owner, instanceUid);
  if (!instance || !isAlive(instance)) return;
  const card = getCard(instance);
  instance.skipTurns += turns;
  log(state, `${card.name} muss ${turns} Runde(n) aussetzen.`);
}

function livingTeam(state: GameState, owner: Owner): PaukemonInstance[] {
  return getTeam(state, owner).filter(isAlive);
}

function chooseMostDamagedOwn(state: GameState, owner: Owner): PaukemonInstance | undefined {
  return livingTeam(state, owner)
    .map((instance) => ({ instance, missing: getCard(instance).maxLp - instance.currentLp }))
    .filter((entry) => entry.missing > 0)
    .sort((a, b) => b.missing - a.missing)[0]?.instance;
}

function chooseMostDamagedWithIqBelow(state: GameState, iq: number): { owner: Owner; instance: PaukemonInstance } | undefined {
  const candidates: { owner: Owner; instance: PaukemonInstance; missing: number }[] = [];
  for (const owner of ['player', 'enemy'] as const) {
    for (const instance of livingTeam(state, owner)) {
      const card = getCard(instance);
      const missing = card.maxLp - instance.currentLp;
      if (card.iq < iq && missing > 0) candidates.push({ owner, instance, missing });
    }
  }
  return candidates.sort((a, b) => b.missing - a.missing)[0];
}

function directDamageEstimate(state: GameState, context: AttackContext): number {
  const attacker = findInstance(state, context.attackerOwner, context.attackerUid);
  const target = findInstance(state, context.targetOwner, context.targetUid);
  if (!attacker || !target) return 0;
  const attackerCard = getCard(attacker);
  const targetCard = getCard(target);
  switch (context.attackId) {
    case 'ABSORPTION':
      return 40;
    case 'KOPIERFLUT':
      return 20;
    case 'MEDITATIVER_PSYCHOENERGIESTOSS':
      return 10 * Math.pow(3, Math.min(2, attacker.chargeTurns));
    case 'STINKENDE_FAULHEIT':
    case 'KETTENSAEGE':
    case 'BOMBE_LEGEN':
    case 'NASENATTACKE':
      return 30;
    case 'INTERVIEW_AN_DER_TAFEL':
      return targetCard.iq < attackerCard.iq ? 50 : 0;
    case 'GROSSDEUTSCHLAENDER_WUERSTCHENBESCHUSS':
      return 20;
    case 'ZWERGENAUFSTAND': {
      const hasKonfurzius = livingTeam(state, context.attackerOwner).some((item) => item.cardId === 'konfurzius');
      return hasKonfurzius ? 50 : 20;
    }
    case 'PHASER_AUF_BETAEUBUNG':
      return 20;
    default:
      return 0;
  }
}

function switchToFirstLivingOther(state: GameState, owner: Owner, currentUid: string): boolean {
  const replacement = livingTeam(state, owner).find((item) => item.uid !== currentUid);
  if (!replacement) return false;
  state[activeUidKey(owner)] = replacement.uid;
  log(state, `${getCard(replacement).name} wird eingewechselt.`);
  return true;
}

function resolveDefenderReactions(state: GameState, context: AttackContext): boolean {
  if (context.suppressReactions) return false;
  const attacker = findInstance(state, context.attackerOwner, context.attackerUid);
  const target = findInstance(state, context.targetOwner, context.targetUid);
  if (!attacker || !target || !isAlive(attacker) || !isAlive(target)) return true;

  const attackerCard = getCard(attacker);
  const targetCard = getCard(target);

  for (const reaction of targetCard.reactions) {
    if (reaction.id === 'PAUSCHALISIERUNG' && attackerCard.iq > targetCard.iq) {
      log(state, `${targetCard.name}s Pauschalisierung* wirkt: Die Attacke kann ihm nichts anhaben.`);
      return true;
    }

    if (reaction.id === 'WEISHEIT' && directDamageEstimate(state, context) > 0 && attackerCard.iq <= 100) {
      log(state, `${targetCard.name}s Weisheit* wirkt: ${attackerCard.name} ist nicht klug genug, um Schaden zuzufügen.`);
      return true;
    }

    if (reaction.id === 'UNTERBRECHEN') {
      const result = coin();
      log(state, `${targetCard.name} nutzt Unterbrechen*: Münzwurf = ${result}.`);
      if (result === 'Zahl') {
        log(state, `Die Attacke von ${attackerCard.name} ist wirkungslos.`);
        return true;
      }
    }

    if (reaction.id === 'PIEPSER') {
      const result = coin();
      log(state, `${targetCard.name} nutzt Piepser*: Münzwurf = ${result}.`);
      if (result === 'Zahl' && switchToFirstLivingOther(state, context.targetOwner, target.uid)) {
        log(state, `${targetCard.name} entkommt der Attacke.`);
        return true;
      }
    }

    if (reaction.id === 'SARKASTISCHER_KONTER' && attackerCard.iq < targetCard.iq) {
      const result = coin();
      log(state, `${targetCard.name} nutzt Sarkastischer Konter*: Münzwurf = ${result}.`);
      if (result === 'Kopf') {
        const reflectedDamage = directDamageEstimate(state, context);
        if (reflectedDamage > 0) {
          log(state, `${targetCard.name} wirft die Attacke zurück.`);
          damage(state, context.attackerOwner, attacker.uid, reflectedDamage);
        } else {
          log(state, `${targetCard.name} kontert und verhindert die Attacke.`);
        }
        return true;
      }
    }
  }

  return false;
}

function applyAttackEffect(state: GameState, context: AttackContext): void {
  const attacker = findInstance(state, context.attackerOwner, context.attackerUid);
  const target = findInstance(state, context.targetOwner, context.targetUid);
  if (!attacker || !target || !isAlive(attacker)) return;

  const attackerCard = getCard(attacker);
  const targetCard = getCard(target);

  log(state, `${ownerLabel(context.attackerOwner)}: ${attackerCard.name} nutzt ${attackerCard.attacks.find((a) => a.id === context.attackId)?.name ?? context.attackId}.`);

  if (resolveDefenderReactions(state, context)) return;

  switch (context.attackId) {
    case 'ABSORPTION':
      damage(state, context.targetOwner, target.uid, 40);
      heal(state, context.attackerOwner, attacker.uid, 20);
      break;

    case 'KOPIERFLUT': {
      const takesDamage = Math.random() < 0.5;
      if (takesDamage) {
        log(state, `${targetCard.name} wählt den Kopierflut-Schaden.`);
        damage(state, context.targetOwner, target.uid, 20);
      } else {
        log(state, `${targetCard.name} wählt die Verwirrung.`);
        addSkip(state, context.targetOwner, target.uid, 1);
      }
      break;
    }

    case 'KUCHEN_BACKEN_LASSEN': {
      const ownTarget = chooseMostDamagedOwn(state, context.attackerOwner);
      if (!ownTarget) log(state, `Niemand braucht gerade Kuchen.`);
      else setToOnlyTenDamage(state, context.attackerOwner, ownTarget.uid);
      break;
    }

    case 'MEDITIEREN':
      attacker.chargeTurns = Math.min(2, attacker.chargeTurns + 1);
      addSkip(state, context.attackerOwner, attacker.uid, 1);
      log(state, `${attackerCard.name} lädt seinen Psychoenergiestoß auf (${attacker.chargeTurns}/2).`);
      break;

    case 'MEDITATIVER_PSYCHOENERGIESTOSS': {
      const amount = 10 * Math.pow(3, Math.min(2, attacker.chargeTurns));
      damage(state, context.targetOwner, target.uid, amount);
      attacker.chargeTurns = 0;
      break;
    }

    case 'ESOTERISCHE_HEILUNG': {
      const healTarget = chooseMostDamagedWithIqBelow(state, 91);
      if (!healTarget) log(state, `Esoterische Heilung findet kein verletztes Paukémon mit IQ unter 91.`);
      else heal(state, healTarget.owner, healTarget.instance.uid, 30);
      break;
    }

    case 'STINKENDE_FAULHEIT':
      damage(state, context.targetOwner, target.uid, 30);
      break;

    case 'SEISMISCHER_SCHOCK':
      for (const owner of ['player', 'enemy'] as const) {
        for (const instance of livingTeam(state, owner)) {
          if (instance.uid !== attacker.uid) damage(state, owner, instance.uid, 10);
        }
      }
      break;

    case 'KETTENSAEGE':
      damage(state, context.targetOwner, target.uid, 30);
      break;

    case 'INTERVIEW_AN_DER_TAFEL':
      if (targetCard.iq < attackerCard.iq) damage(state, context.targetOwner, target.uid, 50);
      else log(state, `${targetCard.name} ist nicht beeindruckt: Sein IQ ist nicht kleiner als ${attackerCard.name}s IQ.`);
      break;

    case 'BOMBE_LEGEN':
      damage(state, context.targetOwner, target.uid, 30);
      break;

    case 'GAEHNENDE_LANGEWEILE':
      if (targetCard.iq < 98) addSkip(state, context.targetOwner, target.uid, 2);
      else log(state, `${targetCard.name} ist nicht gelangweilt genug: IQ nicht kleiner als 98.`);
      break;

    case 'ARBEIT_ABWAELZEN': {
      const helper = livingTeam(state, context.attackerOwner).find((item) => item.uid !== attacker.uid && getCard(item).attacks[0]?.id !== 'ARBEIT_ABWAELZEN');
      if (!helper) {
        log(state, `${attackerCard.name} findet niemanden, auf den er die Arbeit abwälzen kann.`);
        break;
      }
      const helperCard = getCard(helper);
      const standard = helperCard.attacks.find((attack) => attack.isStandard) ?? helperCard.attacks[0];
      log(state, `${attackerCard.name} wälzt die Arbeit auf ${helperCard.name} ab.`);
      applyAttackEffect(state, {
        attackerOwner: context.attackerOwner,
        targetOwner: context.targetOwner,
        attackerUid: helper.uid,
        targetUid: target.uid,
        attackId: standard.id,
      });
      break;
    }

    case 'TANZEN': {
      heal(state, context.attackerOwner, attacker.uid, 20);
      const result = coin();
      log(state, `Tanzen-Münzwurf = ${result}.`);
      if (result === 'Kopf') addSkip(state, context.targetOwner, target.uid, 1);
      break;
    }

    case 'GROSSDEUTSCHLAENDER_WUERSTCHENBESCHUSS':
      damage(state, context.targetOwner, target.uid, 20);
      break;

    case 'SELTSAME_WEISHEITEN':
      addSkip(state, context.targetOwner, target.uid, 2);
      break;

    case 'YING_UND_YANG': {
      const copymonLocations = (['player', 'enemy'] as const)
        .flatMap((owner) => livingTeam(state, owner).map((instance) => ({ owner, instance })))
        .filter(({ instance }) => instance.cardId === 'copymon');
      if (copymonLocations.length === 0) {
        log(state, `Copymon ist nicht lebend im Spiel. Ying & Yang scheitert.`);
        break;
      }
      attacker.removed = true;
      attacker.currentLp = 0;
      for (const location of copymonLocations) {
        location.instance.removed = true;
        location.instance.currentLp = 0;
      }
      for (const owner of ['player', 'enemy'] as const) {
        for (const instance of livingTeam(state, owner)) {
          instance.currentLp = getCard(instance).maxLp;
          instance.skipTurns = 0;
          instance.chargeTurns = 0;
        }
      }
      log(state, `Ying & Yang: Konfurzius und Copymon verlassen das Spiel. Alle übrigen Paukémon werden geheilt.`);
      break;
    }

    case 'ZWERGENAUFSTAND': {
      const hasKonfurzius = livingTeam(state, context.attackerOwner).some((item) => item.cardId === 'konfurzius');
      damage(state, context.targetOwner, target.uid, hasKonfurzius ? 50 : 20);
      break;
    }

    case 'NASENATTACKE':
      damage(state, context.targetOwner, target.uid, 30);
      break;

    case 'VERFUEHRUNG': {
      if (targetCard.gender !== 'female') {
        log(state, `${targetCard.name} ist nicht weiblich. Verführung scheitert.`);
        break;
      }
      const result = coin();
      log(state, `Verführung-Münzwurf = ${result}.`);
      if (result === 'Kopf') {
        const fromTeam = getTeam(state, context.targetOwner);
        const toTeam = getTeam(state, context.attackerOwner);
        const targetIndex = fromTeam.findIndex((item) => item.uid === target.uid);
        if (targetIndex >= 0) {
          const [converted] = fromTeam.splice(targetIndex, 1);
          toTeam.push(converted);
          log(state, `${targetCard.name} läuft zu ${ownerLabel(context.attackerOwner)} über.`);
        }
      }
      break;
    }

    case 'IM_SIMPEL_EINEN_TRINKEN_GEHEN': {
      const other = livingTeam(state, context.attackerOwner).find((item) => item.uid !== attacker.uid);
      if (!other) {
        log(state, `${attackerCard.name} findet niemanden für den Simpel.`);
        break;
      }
      addSkip(state, context.attackerOwner, attacker.uid, 2);
      addSkip(state, context.attackerOwner, other.uid, 2);
      heal(state, context.attackerOwner, attacker.uid, 20);
      heal(state, context.attackerOwner, other.uid, 20);
      break;
    }

    case 'PHASER_AUF_BETAEUBUNG': {
      const result = coin();
      log(state, `Phaser-Münzwurf = ${result}.`);
      if (result === 'Kopf') addSkip(state, context.targetOwner, target.uid, 1);
      else damage(state, context.targetOwner, target.uid, 20);
      break;
    }
  }
}

function ensureActiveAlive(state: GameState, owner: Owner): void {
  const active = getTeam(state, owner).find((item) => item.uid === state[activeUidKey(owner)]);
  if (active && isAlive(active)) return;
  const replacement = livingTeam(state, owner)[0];
  if (replacement) {
    state[activeUidKey(owner)] = replacement.uid;
    log(state, `${ownerLabel(owner)} wechselt ${getCard(replacement).name} ein.`);
  }
}

function checkWinner(state: GameState): void {
  const playerAlive = livingTeam(state, 'player').length > 0;
  const enemyAlive = livingTeam(state, 'enemy').length > 0;
  if (!playerAlive && !enemyAlive) state.winner = 'enemy';
  else if (!playerAlive) state.winner = 'enemy';
  else if (!enemyAlive) state.winner = 'player';
}

function advanceTurn(state: GameState): void {
  ensureActiveAlive(state, 'player');
  ensureActiveAlive(state, 'enemy');
  checkWinner(state);
  if (state.winner) return;

  state.turn = opponent(state.turn);
  state.actionsLeft = 1;
  state.eventPlayedThisTurn = false;

  let safety = 0;
  while (!state.winner && safety < 20) {
    safety += 1;
    const active = getActive(state, state.turn);
    const card = getCard(active);
    if (active.skipTurns <= 0) break;
    active.skipTurns -= 1;
    log(state, `${ownerLabel(state.turn)}: ${card.name} setzt aus. Verbleibend: ${active.skipTurns}.`);
    state.turn = opponent(state.turn);
    state.actionsLeft = 1;
    state.eventPlayedThisTurn = false;
    ensureActiveAlive(state, 'player');
    ensureActiveAlive(state, 'enemy');
    checkWinner(state);
  }
}

export function executeAttack(state: GameState, attackId: AttackId): GameState {
  const next = cloneState(state);
  if (next.winner) return next;
  const attackerOwner = next.turn;
  const targetOwner = opponent(attackerOwner);
  const attacker = getActive(next, attackerOwner);
  const target = getActive(next, targetOwner);

  if (!isAlive(attacker) || attacker.skipTurns > 0 || next.actionsLeft <= 0) return next;

  applyAttackEffect(next, {
    attackerOwner,
    targetOwner,
    attackerUid: attacker.uid,
    targetUid: target.uid,
    attackId,
  });

  ensureActiveAlive(next, 'player');
  ensureActiveAlive(next, 'enemy');
  checkWinner(next);
  if (!next.winner) {
    next.actionsLeft -= 1;
    if (next.actionsLeft <= 0) advanceTurn(next);
  }
  return next;
}

export function switchActive(state: GameState, owner: Owner, instanceUid: string): GameState {
  const next = cloneState(state);
  const candidate = findInstance(next, owner, instanceUid);
  if (!candidate || !isAlive(candidate)) return next;
  next[activeUidKey(owner)] = instanceUid;
  log(next, `${ownerLabel(owner)} wechselt ${getCard(candidate).name} ein.`);
  if (owner === next.turn) advanceTurn(next);
  return next;
}

export function playRandomEvent(state: GameState): GameState {
  const next = cloneState(state);
  if (next.winner || next.eventPlayedThisTurn) return next;
  next.eventPlayedThisTurn = true;
  const event = eventCards[Math.floor(Math.random() * eventCards.length)];
  log(next, `Ereigniskarte: ${event.name}.`);

  switch (event.id as EventId) {
    case 'ZWIEBELSUPPE':
      for (const owner of ['player', 'enemy'] as const) {
        for (const instance of livingTeam(next, owner)) damage(next, owner, instance.uid, 10);
      }
      break;

    case 'BEFOERDERUNG':
      next.actionsLeft += 1;
      log(next, `${ownerLabel(next.turn)} erhält eine zusätzliche Aktion in dieser Runde.`);
      break;

    case 'FACHKONFERENZ': {
      const subjects = Array.from(new Set(paukemonCards.flatMap((card) => card.subjects)));
      const subject = subjects[Math.floor(Math.random() * subjects.length)];
      log(next, `Fachkonferenz wählt: ${subject}.`);
      for (const owner of ['player', 'enemy'] as const) {
        for (const instance of livingTeam(next, owner)) {
          if (getCard(instance).subjects.includes(subject)) addSkip(next, owner, instance.uid, 3);
        }
      }
      break;
    }

    case 'ROHRBRUCH':
      for (const owner of ['player', 'enemy'] as const) {
        for (const instance of livingTeam(next, owner)) {
          const card = getCard(instance);
          if (card.subjects.some((subject) => NATURAL_SCIENCES.includes(subject))) {
            addSkip(next, owner, instance.uid, 1);
            damage(next, owner, instance.uid, 10);
          }
        }
      }
      break;
  }

  ensureActiveAlive(next, 'player');
  ensureActiveAlive(next, 'enemy');
  checkWinner(next);
  return next;
}

export function createNewGame(teamSize = 5): GameState {
  const playerCards = shuffle(paukemonCards).slice(0, teamSize);
  const enemyCards = shuffle(paukemonCards).slice(0, teamSize);

  const playerTeam = playerCards.map((card) => ({
    uid: uid('p'),
    cardId: card.id,
    currentLp: card.maxLp,
    skipTurns: 0,
    chargeTurns: 0,
    removed: false,
  }));

  const enemyTeam = enemyCards.map((card) => ({
    uid: uid('e'),
    cardId: card.id,
    currentLp: card.maxLp,
    skipTurns: 0,
    chargeTurns: 0,
    removed: false,
  }));

  return {
    playerTeam,
    enemyTeam,
    activePlayerUid: playerTeam[0].uid,
    activeEnemyUid: enemyTeam[0].uid,
    turn: 'player',
    actionsLeft: 1,
    eventPlayedThisTurn: false,
    log: ['Spiel gestartet. Pro Runde ist eine Attacke erlaubt. Sternchen-Fähigkeiten reagieren automatisch.'],
  };
}
