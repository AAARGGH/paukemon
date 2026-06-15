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

export type ChoiceTargetRef = {
  owner: Owner;
  uid: string;
};

export type KopierflutPendingChoice = {
  kind: 'KOPIERFLUT';
  chooser: Owner;
  attackerOwner: Owner;
  targetOwner: Owner;
  attackerUid: string;
  targetUid: string;
};

export type ArbeitAbwaelzenPendingChoice = {
  kind: 'ARBEIT_ABWAELZEN';
  chooser: Owner;
  attackerOwner: Owner;
  targetOwner: Owner;
  attackerUid: string;
  targetUid: string;
  helperUids: string[];
};

export type FachkonferenzPendingChoice = {
  kind: 'FACHKONFERENZ';
  chooser: Owner;
  subjects: string[];
};

export type KuchenPendingChoice = {
  kind: 'KUCHEN_BACKEN_LASSEN';
  chooser: Owner;
  attackerOwner: Owner;
  attackerUid: string;
  candidateTargets: ChoiceTargetRef[];
};

export type EsoterischeHeilungPendingChoice = {
  kind: 'ESOTERISCHE_HEILUNG';
  chooser: Owner;
  attackerOwner: Owner;
  attackerUid: string;
  candidateTargets: ChoiceTargetRef[];
};

export type SimpelPendingChoice = {
  kind: 'IM_SIMPEL_EINEN_TRINKEN_GEHEN';
  chooser: Owner;
  attackerOwner: Owner;
  attackerUid: string;
  candidateTargets: ChoiceTargetRef[];
};

export type PendingChoice =
  | KopierflutPendingChoice
  | ArbeitAbwaelzenPendingChoice
  | FachkonferenzPendingChoice
  | KuchenPendingChoice
  | EsoterischeHeilungPendingChoice
  | SimpelPendingChoice;

export type KopierflutChoice = 'DAMAGE' | 'SKIP';
export type ArbeitAbwaelzenChoice = { kind: 'HELPER'; helperUid: string };
export type FachkonferenzChoice = { kind: 'SUBJECT'; subject: string };
export type TargetChoice = { kind: 'TARGET'; targetOwner: Owner; targetUid: string };
export type PendingChoiceResolution = KopierflutChoice | ArbeitAbwaelzenChoice | FachkonferenzChoice | TargetChoice;

export type PendingKo = {
  owner: Owner;
  uid: string;
};

export type CoinCue = {
  result: Coin;
  label: string;
  nonce: number;
};

export type GameState = {
  playerTeam: PaukemonInstance[];
  enemyTeam: PaukemonInstance[];
  activePlayerUid: string;
  activeEnemyUid: string;
  turn: Owner;
  actionsLeft: number;
  eventPlayedThisTurn: boolean;
  eventCharge: Record<Owner, number>;
  log: string[];
  winner?: Owner;
  pendingChoice?: PendingChoice;
  pendingKo?: PendingKo;
  lastEventId?: EventId;
  lastCoinCue?: CoinCue;
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
