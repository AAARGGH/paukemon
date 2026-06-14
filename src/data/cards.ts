import type { EventCard, PaukemonCard } from '../game/types';
const cardImage = (fileName: string) => `${import.meta.env.BASE_URL}cards/${fileName}`;

export const paukemonCards: PaukemonCard[] = [
  {
    id: 'amoebia',
    name: 'Amöbia',
    maxLp: 100,
    iq: 57,
    kind: 'Monster-Paukémon',
    subjects: ['Englisch', 'Chemie'],
    gender: 'female',
    image: cardImage('amoebia.jpg'),
    attacks: [
      {
        id: 'ABSORPTION',
        name: 'Absorption',
        isStandard: true,
        text: 'Schaden beim Gegner: 40 LP. Bei dieser Attacke bekommt Amöbia 20 LP.',
      },
    ],
    reactions: [],
  },
  {
    id: 'copymon',
    name: 'Copymon',
    maxLp: 60,
    iq: 133,
    kind: 'Wissens-Paukémon',
    subjects: ['Geschichte', 'Deutsch', 'Ethik'],
    gender: 'female',
    image: cardImage('copymon.jpg'),
    attacks: [
      {
        id: 'KOPIERFLUT',
        name: 'Kopierflut',
        isStandard: true,
        text: 'Der Gegner wählt: 20 LP Schaden oder 1 Runde wegen Verwirrung aussetzen.',
      },
      {
        id: 'KUCHEN_BACKEN_LASSEN',
        name: 'Kuchen backen lassen',
        text: 'Ein eigenes Paukémon wird geheilt und behält nur noch 10 Schaden.',
      },
    ],
    reactions: [],
  },
  {
    id: 'esoteriko',
    name: 'Esoteriko',
    maxLp: 60,
    iq: 91,
    kind: 'Glaubens-Paukémon',
    subjects: ['Kunst'],
    gender: 'male',
    image: cardImage('esoteriko.jpg'),
    attacks: [
      {
        id: 'MEDITATIVER_PSYCHOENERGIESTOSS',
        name: 'Meditativer Psychoenergiestoß',
        isStandard: true,
        text: '10 Schaden. Nach einmal Meditieren 30 Schaden, nach zweimal Meditieren 90 Schaden.',
      },
      {
        id: 'MEDITIEREN',
        name: 'Meditieren',
        text: 'Setzt freiwillig aus und lädt den Psychoenergiestoß auf. Maximal 2 Ladungen.',
      },
      {
        id: 'ESOTERISCHE_HEILUNG',
        name: 'Esoterische Heilung',
        text: 'Ein beliebiges Paukémon mit IQ unter 91 erhält 30 LP.',
      },
    ],
    reactions: [],
  },
  {
    id: 'faulon',
    name: 'Faulon',
    maxLp: 110,
    iq: 60,
    kind: 'Monster-Paukémon',
    subjects: ['Erdkunde', 'Sozi', 'Geschichte'],
    gender: 'male',
    image: cardImage('faulon.jpg'),
    attacks: [
      {
        id: 'STINKENDE_FAULHEIT',
        name: 'Stinkende Faulheit',
        isStandard: true,
        text: 'Geruchsattacke. Schaden beim Gegner: 30 LP.',
      },
      {
        id: 'SEISMISCHER_SCHOCK',
        name: 'Seismischer Schock',
        text: 'Alle Paukémon im gesamten Spiel außer Faulon verlieren 10 LP.',
      },
    ],
    reactions: [],
  },
  {
    id: 'galaktor',
    name: 'Galaktor',
    maxLp: 80,
    iq: 61,
    kind: 'Monster-Paukémon',
    subjects: ['Mathe', 'Physik'],
    gender: 'male',
    image: cardImage('galaktor.jpg'),
    attacks: [
      {
        id: 'KETTENSAEGE',
        name: 'Kettensäge',
        isStandard: true,
        text: 'Schaden beim Gegner: 30 LP.',
      },
      {
        id: 'INTERVIEW_AN_DER_TAFEL',
        name: 'Interview an der Tafel',
        text: 'Nur bei Gegnern, deren IQ kleiner als Galaktors ist. Schaden 50 LP.',
      },
    ],
    reactions: [],
  },
  {
    id: 'germon',
    name: 'Germon',
    maxLp: 60,
    iq: 98,
    kind: 'alt-68er-Paukémon',
    subjects: ['Deutsch', 'Geschichte'],
    gender: 'male',
    image: cardImage('germon.jpg'),
    attacks: [
      {
        id: 'BOMBE_LEGEN',
        name: 'Bombe legen',
        isStandard: true,
        text: 'Schaden beim Gegner: 30 LP.',
      },
      {
        id: 'GAEHNENDE_LANGEWEILE',
        name: 'Gähnende Langeweile',
        text: 'Nur wenn der IQ des gegnerischen Paukémon kleiner als 98 ist. Gegner setzt 2 Runden aus.',
      },
    ],
    reactions: [],
  },
  {
    id: 'karl-heinthi',
    name: 'Karl-Heinthi',
    maxLp: 30,
    iq: 111,
    kind: 'Spuck-Paukémon',
    subjects: ['Mathe', 'Physik'],
    gender: 'male',
    image: cardImage('karl-heinthi.jpg'),
    attacks: [
      {
        id: 'ARBEIT_ABWAELZEN',
        name: 'Arbeit abwälzen',
        isStandard: true,
        text: 'Führe mit einem anderen deiner Paukémon eine Standardattacke durch.',
      },
      {
        id: 'TANZEN',
        name: 'Tanzen',
        text: 'Karl-Heinthi erhält 20 LP. Münzwurf: Bei Kopf setzt der Gegner nächste Runde aus.',
      },
    ],
    reactions: [
      {
        id: 'UNTERBRECHEN',
        name: 'Unterbrechen*',
        text: 'Wenn Karl-Heinthi angegriffen wird: Münzwurf. Bei Zahl wird der Gegner unterbrochen und die Attacke ist wirkungslos.',
      },
    ],
  },
  {
    id: 'kommunischdefresser',
    name: 'Kommunischdefresser',
    maxLp: 80,
    iq: 88,
    kind: 'Unions-Paukémon',
    subjects: ['Sozi', 'Geschichte'],
    gender: 'male',
    image: cardImage('kommunischdefresser.jpg'),
    attacks: [
      {
        id: 'GROSSDEUTSCHLAENDER_WUERSTCHENBESCHUSS',
        name: 'Großdeutschländer-Würstchenbeschuss',
        isStandard: true,
        text: 'Schaden beim Gegner: 20 LP.',
      },
    ],
    reactions: [
      {
        id: 'PAUSCHALISIERUNG',
        name: 'Pauschalisierung*',
        text: 'Alle Attacken von Paukémon, deren IQ höher ist als 88, können ihm nichts anhaben.',
      },
    ],
  },
  {
    id: 'konfurzius',
    name: 'Konfurzius',
    maxLp: 10,
    iq: 198,
    kind: 'Wissens-Paukémon',
    subjects: ['Deutsch', 'Geschichte', 'Ethik'],
    gender: 'male',
    image: cardImage('konfurzius.jpg'),
    attacks: [
      {
        id: 'SELTSAME_WEISHEITEN',
        name: 'Seltsame Weisheiten',
        isStandard: true,
        text: 'Der Gegner setzt durch Verwirrung 2 Runden aus.',
      },
      {
        id: 'YING_UND_YANG',
        name: 'Ying & Yang',
        text: 'Nur wenn Copymon lebend im Spiel ist: Konfurzius und Copymon werden aus dem Spiel genommen. Alle Paukémon werden geheilt.',
      },
    ],
    reactions: [
      {
        id: 'WEISHEIT',
        name: 'Weisheit*',
        text: 'Nur Paukémon, deren IQ größer als 100 ist, können Konfurzius Schaden zufügen.',
      },
    ],
  },
  {
    id: 'murus-parvus',
    name: 'Murus Parvus',
    maxLp: 60,
    iq: 92,
    kind: 'Feuerwehr-Paukémon',
    subjects: ['Geschichte', 'Religion'],
    gender: 'male',
    image: cardImage('murus-parvus.jpg'),
    attacks: [
      {
        id: 'ZWERGENAUFSTAND',
        name: 'Zwergenaufstand',
        isStandard: true,
        text: 'Schaden beim Gegner: 20 LP. Wenn du noch Konfurzius besitzt: 50 LP.',
      },
    ],
    reactions: [
      {
        id: 'PIEPSER',
        name: 'Piepser*',
        text: 'Wenn Murus Parvus angegriffen wird: Münzwurf. Bei Zahl wechselt er sofort aus und trägt keinen Schaden davon.',
      },
    ],
  },
  {
    id: 'nasenmann',
    name: 'Nasenmann',
    maxLp: 50,
    iq: 115,
    kind: 'Nasen-Paukémon',
    subjects: ['Deutsch', 'Französisch'],
    gender: 'male',
    image: cardImage('nasenmann.jpg'),
    attacks: [
      {
        id: 'NASENATTACKE',
        name: 'Nasenattacke',
        isStandard: true,
        text: '30 Schaden beim Gegner.',
      },
      {
        id: 'VERFUEHRUNG',
        name: 'Verführung',
        text: 'Nur bei weiblichen Paukémon. Münzwurf: Bei Kopf läuft das gegnerische Paukémon zu dir über.',
      },
      {
        id: 'IM_SIMPEL_EINEN_TRINKEN_GEHEN',
        name: 'Im Simpel einen Trinken gehen',
        text: 'Nasenmann und ein beliebiges anderes Paukémon setzen 2 Runden aus und bekommen beide 20 LP.',
      },
    ],
    reactions: [],
  },
  {
    id: 'platton',
    name: 'Platton',
    maxLp: 50,
    iq: 122,
    kind: 'Wissens-Paukémon',
    subjects: ['Englisch', 'Sport'],
    gender: 'male',
    image: cardImage('platton.jpg'),
    attacks: [
      {
        id: 'PHASER_AUF_BETAEUBUNG',
        name: 'Phaser auf Betäubung',
        isStandard: true,
        text: 'Münzwurf: Bei Kopf ist der Gegner betäubt und setzt 1 Runde aus, bei Zahl 20 Schaden.',
      },
    ],
    reactions: [
      {
        id: 'SARKASTISCHER_KONTER',
        name: 'Sarkastischer Konter*',
        text: 'Wenn ein Paukémon mit kleinerem IQ als Platton angreift: Münzwurf. Bei Kopf wird die Attacke auf das gegnerische Paukémon zurückgeworfen.',
      },
    ],
  },
];

export const eventCards: EventCard[] = [
  {
    id: 'ZWIEBELSUPPE',
    name: 'Cafeteria – Zwiebelsuppe',
    image: cardImage('cafeteria-zwiebelsuppe.jpg'),
    text: 'Alle Paukémon im Spiel bekommen 10 LP abgezogen.',
  },
  {
    id: 'BEFOERDERUNG',
    name: 'Direktion – Beförderung',
    image: cardImage('direktion-befoerderung.jpg'),
    text: 'Ein Paukémon deiner Wahl darf in dieser Runde 2 Attacken/Fähigkeiten ausführen.',
  },
  {
    id: 'FACHKONFERENZ',
    name: 'Direktion – Fachkonferenz',
    image: cardImage('direktion-fachkonferenz.jpg'),
    text: 'Wähle ein Fach. Alle Paukémon, die dieses Fach unterrichten, setzen 3 Runden aus.',
  },
  {
    id: 'ROHRBRUCH',
    name: 'Hausmeister – Rohrbruch',
    image: cardImage('hausmeister-rohrbruch.jpg'),
    text: 'Alle Paukémon mit naturwissenschaftlichem Fach setzen 1 Runde aus und bekommen 10 LP Schaden.',
  },
];

export const cardById = new Map(paukemonCards.map((card) => [card.id, card]));
