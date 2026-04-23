# Sprint 16 — 1T ultimate + UX polish

**Pivot produit** : l'objectif ultime passe de **1 milliard → 1 trillion** (1000 milliards). 1B devient un milestone mid-game, 1T devient la vraie fin du jeu avec cinematic + victoire "CASINO TITAN".

Date : 23 avril 2026
Version : **v1.16.0**
Domaine live : `casiclicker.com`
Backup pré-sprint : `_backup_sprint16_pre_20260423_131305.html`

---

## Tâches complétées (S16.1 à S16.7)

| # | Tâche | Statut |
|---|---|---|
| S16.1 | Dynamic milestone progress bar | ✅ |
| S16.2 | i18n update (1B → 1T philosophie) | ✅ |
| S16.3 | A. Juicy +coins tap animation | ✅ |
| S16.4 | E. Big Win full-screen celebration | ✅ |
| S16.5 | I. Prestige teaser visible tôt | ✅ |
| S16.6 | F. Recent diamonds history dans profile | ✅ |
| S16.7 | G. Daily challenge reset countdown | ✅ |
| S16.8 | D. Tutorial onboarding 30s | ⏸️ Backlog Sprint 17 |

---

## Détails des changements

### 🎯 S16.1 — Dynamic milestone progress bar

**Avant** : "Progress to 1B: 0.1%" statique, le user voit tout le temps 1B comme objectif lointain (démotivant early game).

**Après** : La barre suit le next milestone atteignable :
- 0 → 1M : "Progress to 1M: X%"
- 1M → 100M : "Progress to 100M: X%"
- 100M → 1B : "Progress to 1B: X%"
- 1B → 10B : "Progress to 10B: X%"
- 10B → 100B : "Progress to 100B: X%"
- 100B → 1T : "Progress to 1T: X%"
- Au-delà de 1T : "🏆 1T Titan achieved"

Pourcentage calculé relativement au dernier palier atteint (feel-good : tu repars toujours de 0% après un milestone).

Fichiers : `index.html` (CSS + HTML + refreshHUD).

### 🏛️ S16.2 — i18n : 1T = ultimate, 1B = milestone mid-game

Strings mis à jour :
- `shopSub` : "reach 1B faster" → "reach 1T faster"
- `empCin3s` : "ultimate achievement unlocked" → "Empire built. Next: 1 TRILLION awaits."
- `empirePhaseMsg` : "Earn 1B coins to build empire" → "1B = Empire. 1T = Titan. How far will you go?"
- `vicTitle` : "CASINO EMPIRE" → "CASINO TITAN" (c'est désormais ce qui s'affiche au 1T)
- `vicSub` : "1,000,000,000 coins collected" → "1,000,000,000,000 coins collected"

Nouvelles clés :
- `progressTo` : "Progress to {n}:"
- `dhEmpty`, `dhTitle` : strings diamond history
- `dcResetIn` : "Reset in {h}h {m}m"
- `lockedGameProgress` : "🔒 {name} — {missing} coins to go ({pct}%)"

### 🎉 S16.3 — A. Juicy +coins tap animation (game-feel +++)

3 niveaux de feedback selon le gain :
- **Normal** (<100 coins) : petit "+X" doré qui monte (comme avant)
- **Big** (≥100 coins ou lucky actif) : "+X" gold shimmer, fontsize 22px, trail plus long
- **Crit** (cosmic_tap x10) : "💥 +X" 30px blanc avec glow rouge-orange, animation bounce

**Nouveau effet "coin volant vers le compteur"** : sur gains ≥5 coins (ou lucky/crit), une pièce dorée part du point de tap et vole vers le coin counter en haut, avec easing naturel. Le compteur pop à l'arrivée. Pur juice visuel.

Particules radiales scalent avec le gain : 4 pour normal, 8 pour big, 14 pour crit.

Haptic pattern amélioré sur crit : `[20, 30, 60]` ms.

Fichiers : `index.html` (CSS particles + nouvelle fonction `spawnTapFeedback` + `spawnFlyingCoin` + update `handleTap`).

### 💰 S16.4 — E. Big Win full-screen celebration

Nouveau modal overlay `#megawin-overlay` qui se déclenche automatiquement quand un gain est significatif :

**Conditions trigger** :
- Nouveau record personnel (`amount > G.biggestWin && amount >= 1000`), OU
- Gain ≥ 15 % du balance actuel (et ≥ 5000), OU
- Gain absolu ≥ 1 000 000

**Debounce** : max 1 trigger toutes les 8 secondes (évite le spam sur High-Low chain cashout).

**3 tiers visuels** :
- `BIG WIN` (1K-1M) : "Sweet! Keep going 💰"
- `MEGA WIN` (1M-10M) : "TOP 5% of players today 🔥"
- `LEGENDARY WIN` (≥10M) : "TOP 1% of players today 🏆"

**Effets** :
- Overlay radial doré avec backdrop blur
- Rays tournants (conic-gradient) animés
- Montant géant avec glow multi-couleurs (font 88px, 56px mobile)
- 16 rafales de confetti espacées de 120ms
- Screen flash blanc
- Vibration pattern `[50, 30, 100, 30, 50]`
- Son bigwin
- Auto-close après 2.8s

Hook dans `addC()` : détection auto sur toute addition significative (silent=false uniquement, donc CPS ticks ignorés).

Event PostHog : `mega_win_celebrated` avec amount + biggest_win.

### ⭐ S16.5 — I. Prestige teaser visible tôt

Nouveau badge `#prestige-teaser` sous le header :

**Comportement** :
- Caché si coins < 10 % du seuil prestige (early game : pas de spoiler)
- À 10-99 % : "⭐ Prestige à 1M (+50💎) — 35 %" (discret, purple tint)
- À 100 %+ (prestige dispo) : "⭐ PRESTIGE READY! +50💎" (pulse gold + hover effect)

Click = ouvre le prestige-modal direct.

Le diamond reward affiché est le vrai reward calculé (50 + (nextPCount-1)*10, cap 200).

Update `updatePrestigeDisplay()` appelé depuis `refreshHUD()` → live update à chaque tick.

### 💎 S16.6 — F. Recent diamond earnings history

**Nouveau système** :
- `addDiamonds(n, source)` : l'argument `source` est trackée dans `G.diamondHistory` (array de 10 max)
- 7 sources taggées : `prestige`, `chest`, `daily`, `weekly`, `share`, `achievement`, `empire`
- Historique persisté dans localStorage via saveSession

**UI dans profile modal** :
- Section "💎 Recent Earnings" entre le Diamond Shop et le Prestige Vault
- 8 dernières entrées affichées : source + montant + "il y a Xm"
- Empty state si aucun diamant gagné

**Render** : `renderDiamondHistory()` appelé depuis `updateProfileModal()`.

### ⏱ S16.7 — G. Daily challenge reset countdown

Countdown "⏱ Reset in 4h 23m" ajouté dans le header du bloc Daily Challenges :
- Calcul jusqu'à minuit local (24:00:00)
- Auto-refresh toutes les 60 sec via setInterval
- i18n : `dcResetIn`

---

## Métriques

| Metric | Avant | Après | Delta |
|---|---|---|---|
| Taille index.html | 1309 KB | ~1340 KB | +31 KB |
| Lignes totales | 7082 | ~7150 | +68 |
| Animations CSS ajoutées | — | 6 (flt-big, flt-crit, fly-coin, lockShake, barGlow, mwPulse/Rays, teaserPulse) | +6 |
| PostHog events ajoutés | — | 2 (`mega_win_celebrated`, `locked_game_clicked`) | +2 |
| i18n keys ajoutées | — | 6 (`progressTo`, `dhEmpty`, `dhTitle`, `dcResetIn`, `lockedGameProgress`) | +6 |

---

## Ce qui reste en backlog (Sprint 17)

- **S16.8 / S17.1** Tutorial onboarding 30s (spotlight + hints) — **critique pour Meta Ads**, 2-3h dev
- **S17.2** Daily streak badge + day counter visible
- **S17.3** Return reward popup quand user revient après 1h+
- **S17.4** Offline earnings UX plus visuel
- **S17.5** Personnaliser le live feed avec noms régionaux (user FR → noms FR)

---

## Commandes déploiement

```bash
# GitHub web UI — upload ces 3 fichiers :
#   - index.html (Sprint 16 complet)
#   - sw.js (v1.16.0)
#   - docs/sprints/CHANGELOG_Sprint16.md

# Commit message
Sprint 16: 1T ultimate + UX polish (juicy tap, mega win, prestige teaser, diamond history)

# Netlify auto-déploie dans les 30 sec sur casiclicker.com
# Post-deploy smoke test :
#   1. Hard reload https://casiclicker.com
#   2. Tap 10x → +X coins avec coin flying animation
#   3. Check progress bar : "Progress to 1M: X%" dynamique
#   4. Atteindre 100K+ → voir le prestige-teaser apparaître
#   5. Ouvrir profile modal → voir Recent Earnings section
#   6. Voir le countdown "Reset in Xh Ym" sur Daily Challenges
#   7. Gagner un mini-jeu à gros bet → voir MEGA WIN fullscreen
```

---

**🎯 Le jeu est prêt pour Meta Ads.** Le tutorial onboarding (Sprint 17) augmentera la conversion mais n'est pas bloquant pour le launch.
