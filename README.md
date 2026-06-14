# Paukémon – Browsergame-Prototyp

Ein simples, nostalgisches Browsergame im Stil eines sehr vereinfachten Pokémon-Kartenspiels.

## Stand v0.1

Enthalten:

- Vite + React + TypeScript
- Alle bisher rekonstruierten Paukémon-Karten als strukturierte Daten
- Kartenbilder als lokale Assets
- Simple Kampf-Engine
- Zufälliger Computergegner
- Sternchen-Reaktionen als automatische Reaktionen
- Erste Ereigniskarten-Implementierung
- GitHub-Pages-Deployment per GitHub Actions

Bewusst noch simpel:

- Keine Deckbau-Regeln
- Keine Energie- oder Kostenkarten
- Kein Multiplayer
- Keine Accounts
- Computergegner wählt zufällig
- Einige unklare Karten werden pragmatisch ausgelegt

## Lokal starten

```bash
npm install
npm run dev
```

Danach die angezeigte lokale URL im Browser öffnen.

## Produktionsbuild

```bash
npm run build
npm run preview
```

## Deployment auf GitHub Pages

1. Neues GitHub-Repository anlegen, z. B. `paukemon`.
2. Projektdateien committen und pushen.
3. In GitHub unter **Settings → Pages** als Source **GitHub Actions** wählen.
4. Beim Push auf `main` baut und deployed GitHub Actions automatisch.

Die `vite.config.ts` setzt den korrekten `base`-Pfad automatisch auf den Repository-Namen, wenn das Projekt über GitHub Actions gebaut wird.

## Rekonstruierte Sonderregeln

- Pro Runde genau eine Attacke/Fähigkeit.
- Sternchen-Fähigkeiten sind Reaktionen und kosten keine Aktion.
- Standardattacke ist die erste aktive Attacke auf der Karte.
- Copymon ist Konfurzius’ Frau.
- Herri ist vorläufig als Konfurzius rekonstruiert.
- Weibliche Paukémon: Copymon und Amöbia.
- Heilung kann nicht über den Maximalwert hinausgehen.
- Aussetzen entfernt Aktionen, aber nicht Sternchen-Reaktionen.

## Offene Designfragen

- Sollen Ereigniskarten als Handkarten, Zufallsereignisse oder eigene Karten im Deck laufen?
- Soll es Team-Auswahl statt Zufallsteams geben?
- Soll ein Spiel mit 3, 5 oder allen Paukémon pro Seite gespielt werden?
- Soll Wechseln eine Aktion kosten? Aktuell ja.
- Gehört Erdkunde bei „Rohrbruch“ zu den naturwissenschaftlichen Fächern? Aktuell: Mathe, Physik, Chemie.
