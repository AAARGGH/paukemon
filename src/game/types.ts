export type Owner = 'player' | 'enemy';
export type Gender = 'female' | 'male' | 'unknown';

export type AttackId =
  | 'ABSORPTION'
  | 'KOPIERFLUT'
  | 'KUCHEN_BACKEN_LASSEN'
  | 'MEDITATIVER_PSYCHOENERGIESTOSS'
  | 'MEDITIEREN'
  | 'ESOTERISCHE_HEILUNG'
  | 'STINKENDE_FAULHEIT'
  | 'SEISMISCHER_SCHOCK'
  | 'KETTENSAEGE'
  | 'INTERVIEW_AN_DER_TAFEL'
  | 'BOMBE_LEGEN'
  | 'GAEHNENDE_LANGEWEILE'
  | 'ARBEIT_ABWAELZEN'
  | 'TANZEN'
  | 'GROSSDEUTSCHLAENDER_WUERSTCHENBESCHUSS'
  | 'SELTSAME_WEISHEITEN'
  | 'YING_UND_YANG'
  | 'ZWERGENAUFSTAND'
  | 'NASENATTACKE'
  | 'VERFUEHRUNG'
  | 'IM_SIMPEL_EINEN_TRINKEN_GEHEN'
  | 'PHASER_AUF_BETAEUBUNG';

export type ReactionId =
  | 'UNTERBRECHEN'
  | 'PIEPSER'
  | 'PAUSCHALISIERUNG'
  | 'WEISHEIT'
  | 'SARKASTISCHER_KONTER';

export type EventId =
  | 'ZWIEBELSUPPE'
  | 'BEFOERDERUNG'
  | 'FACHKONFERENZ'
  | 'ROHRBRUCH';

export type Attack = {
  id: AttackId;
  name: string;
  text: string;
  isStandard?: boolean;
};

export type Reaction = {
  id: ReactionId;
  name: string;
  text: string;
};

export type PaukemonCard = {
  id: string;
  name: string;
  maxLp: number;
  iq: number;
  kind: string;
  subjects: string[];
  gender: Gender;
  image: string;
  attacks: Attack[];
  reactions: Reaction[];
};

export type EventCard = {
  id: EventId;
  name: string;
  image: string;
  text: string;
};

export type PaukemonInstance = {
  uid: string;
  cardId: string;
  currentLp: number;
  skipTurns: number;
  chargeTurns: number;
  removed: boolean;
};

export type PendingChoice = {
  kind: 'KOPIERFLUT';
  chooser: Owner;
  attackerOwner: Owner;
  targetOwner: Owner;
  attackerUid: string;
  targetUid: string;
};

export type KopierflutChoice = 'DAMAGE' | 'SKIP';

export type GameState = {
  playerTeam: PaukemonInstance[];
  enemyTeam: PaukemonInstance[];
  activePlayerUid: string;
  activeEnemyUid: string;
  turn: Owner;
  actionsLeft: number;
  eventPlayedThisTurn: boolean;
  log: string[];
  winner?: Owner;
  pendingChoice?: PendingChoice;
  lastEventId?: EventId;
  eventRevealNonce: number;
};

export type Coin = 'Kopf' | 'Zahl';

export type AttackContext = {
  attackerOwner: Owner;
  targetOwner: Owner;
  attackerUid: string;
  targetUid: string;
  attackId: AttackId;
  suppressReactions?: boolean;
};
