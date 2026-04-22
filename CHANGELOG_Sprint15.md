# Sprint 15 — Clean F2P (finalisation)

**Pivot produit** : CasiClicker devient un **F2P 100 % gratuit sans paiement ni pub**. Les diamants sont désormais gagnables **uniquement via le prestige** (source principale) + drip léger achievements/challenges/chest.

Date : 22 avril 2026
Version : **v1.15.0**
Backup pré-cleanup : `_backup_sprint15_pre_cleanup_20260422_181305.html`

---

## Contexte du pivot

Décision prise par Raphael après review de la stratégie :
- Annulation de la piste Solana dApp Store (pour l'instant)
- Suppression de toute monétisation (plus d'IAP RevenueCat)
- Suppression de toute pub (plus de rewarded ads hooks)
- Suppression des incitations artificielles (LTO, Boost Shop consommables)
- Focus : **finir un jeu propre, gratuit, addictif via la boucle prestige**

---

## Ce qui a été supprimé

### JavaScript (334 lignes)
| Bloc | Lignes avant | Fonction |
|---|---|---|
| `CCMonetization` module complet | 6091-6168 | Infrastructure IAP RevenueCat-ready |
| `openIAPStore`, `purchaseIAPPack`, `watchAdForDiamonds` | 6170-6227 | Store IAP + rewarded ads |
| `BOOSTS_POOL` + `buyBoost`, `renderBoostShop`, `boostActive`, `boostTimeLeft`, `fmtBoostTime` | 5973-6083 | Diamond Boost Shop |
| `LTO_OFFERS` + `ltoCheck`, `ltoApply`, `ltoShowBanner`, `ltoEnd`, `ltoUpdateCountdown`, `ltoRestorePrices` | 6602-6681 | Limited-Time Offers |

### HTML (5 blocs)
- LTO banner inline dans reveal-games
- Bouton "💎 Acheter" + "🎥 Pub +2💎" dans profile-modal
- Section Diamond Boost Shop dans profile-modal
- IAP Store modal complet (`#iap-modal`)
- Texte "or get more below" remplacé par "Gagne des diamants via prestige, achievements et challenges."

### CSS (17 classes)
- `@keyframes ltoShine` + 2 règles `#lto-banner`
- 11 classes `.iap-*` (pack, hover, amount, body, label, price, reco, bonus)
- 12 classes `.boost-item*` (base, hover, active, ico, body, name, desc, left, price)

### i18n (38 clés × 4 langues = 152 traductions)
- 12 clés IAP : `iapTitle`, `iapSub`, `iapModeDev`, `iapBtnBuy`, `iapBtnAd`, `iapFreeAd`, `iapFooter`, `iapPackBonus`, `iapPackBest`, `iapSimulated`, `iapAdPending`, `iapAdReward`
- 20 clés Boost Shop : `boostShopTitle`, `boostShopSub`, `boostActive`, `boostRemaining`, `boost_cps_2x_n/d`, `boost_click_3x_n/d`, `boost_offline_n/d`, `boost_lucky_n/d`, `boost_daily_n/d`, `boost_prestige_n/d`, `boostBought`, `boostNoDaily`, `boostCDCleared`, `boostNotEnough`
- 4 clés LTO : `ltoEndsIn`, `ltoMega30`, `ltoPro20`, `ltoWhale15`
- 2 clés dead : `boostTitle`, `boostSub` (jamais appelées)

### Analytics & Feature Flags
- 4 PostHog events : `iap_simulated`, `rewarded_ad_watched`, `iap_store_opened`, `lto_shown`
- 2 Feature flags : `iap_mega_price_eur`, `rewarded_ad_reward`

---

## Ce qui a changé (non supprimé)

### Diamond Premium Shop → **Prestige Vault**
- Rename cosmétique pour insister sur la cohérence "diamants = prestige"
- HTML titre : "💎💎 Premium Vault" → "💎💎 Prestige Vault"
- i18n `premiumTitle` mis à jour en FR/EN/ES/ZH
- Items (500-3000💎) inchangés, SEUL shop du jeu

### Mécaniques de boost consommables → supprimées
Choix user : pas de migration vers talents ni vers Premium Shop. Simplification radicale.

Impacts :
- `click_3x` (x3 click 30 min) → supprimé
- `cps_2x` (x2 CPS 1h) → supprimé
- `offline` (cap 8h au lieu de 2h) → supprimé
- `lucky` (Lucky x2 10 min) → supprimé
- `daily` (complete daily instantly) → supprimé
- `prestige_cd` (skip prestige cooldown) → supprimé

Toutes les sources de multiplicateurs temporaires sont désormais liées au :
- Système Lucky/Boost/Jackpot aléatoire natif (conservé)
- Talents prestige permanents (conservés)
- Items Prestige Vault permanents (conservés)

### 6 références JS simplifiées
```diff
- const boostClick = (typeof boostActive === 'function' && boostActive('click_3x')) ? 3 : 1;
+ const boostClick = 1;

- const boostCPS = (typeof boostActive === 'function' && boostActive('cps_2x')) ? 2 : 1;
+ const boostCPS = 1;

- const _isLucky = G.luck || (typeof boostActive === 'function' && boostActive('lucky'));  (×2 occurrences)
+ const _isLucky = G.luck;

- const _cap = _hasInf ? Infinity : ((typeof boostActive === 'function' && boostActive('offline')) ? OFFLINE_CAP_SECS * 4 : OFFLINE_CAP_SECS);
+ const _cap = _hasInf ? Infinity : OFFLINE_CAP_SECS;

- if (typeof renderBoostShop === 'function') renderBoostShop();
+ (supprimé)
```

---

## Ce qui a été AJOUTÉ

### 💎 Diamond reward sur prestige (CORE FIX)
Formule : `Math.min(200, 50 + (PRESTIGE_COUNT - 1) * 10)`
- Prestige 1 = 50💎
- Prestige 5 = 90💎
- Prestige 10 = 140💎
- Prestige 15 = 190💎
- Prestige 16+ = 200💎 (cap)

Ajouté dans `doPrestige()` avant le reset de l'état, avec toast 1,2 s après le recap pour UX satisfaisante. Track PostHog `prestige_diamonds_granted`.

**C'est la source principale de diamants du jeu.**

### 🎯 Weekly Challenge rewards bumpés
- 20💎 → 30💎 (standard)
- 20💎 → 50💎 pour `wc_prestige_1` (reward cohérente avec la difficulté)

---

## Bugs fixés au passage

1. **Premium Shop crashait** avec `t('boostNotEnough')` (clé supprimée) → remplacée par `t('respecNotEnough')` (même format)
2. **Loot Box** avait 10 % de chance de donner un "boost" dead → reshape en 60 % coins / 40 % diamants (tier system common/rare/epic)

---

## Métriques

| Metric | Avant | Après | Delta |
|---|---|---|---|
| Taille index.html | 1408 KB | 1309 KB | -99 KB (-7 %) |
| Lignes totales | 7521 | 7088 | -433 lignes |
| Strings i18n | ~365 | ~325 | -40 strings |
| Classes CSS | ~X | ~X-17 | -17 classes mortes |
| PostHog events actifs | 31 | 28 | -3 events dead |
| Feature flags actifs | 5 | 3 | -2 flags dead |

---

## Migration sauvegardes legacy (auto-silencieuse)

Les joueurs existants ayant des sauvegardes v1.14.x avec les champs `G.lto`, `G.ltoSeen`, `G.activeBoosts` en localStorage **ne subiront aucun crash** : le code `checkOfflineEarnings()` n'essaie jamais de restaurer ces champs, ils sont donc ignorés silencieusement au prochain chargement. Les coins/diamants/prestige/upgrades/milestones sont tous préservés.

---

## Audit post-cleanup (sub-agent thorough)

Verdict : **ZÉRO bug critique détecté**.
- Aucune référence zombie aux fonctions supprimées
- 675 `<div>` ouvertes = 675 `</div>` fermées (HTML balanced)
- 310 IDs HTML uniques (aucun doublon)
- `addDiamonds` appelé 14 fois, tous OK
- Timing prestige cohérent (recap → diamants → reset)
- Chest (loot box) cohérent, strings i18n OK
- Rename Premium→Prestige Vault cohérent

---

## Ce qui reste en backlog Sprint 15

- [ ] **S15.10** Polish UX/visual final (animations, transitions, feedbacks)
- [ ] **S15.11** Tutorial / onboarding nouveau joueur (spotlight + hints)
- [ ] **S15.12** Tests manuels + regression (4 langues, offline PWA, mobile + desktop)

Ces items peuvent se faire dans un Sprint 16 de polish, ou incorporés à v1.15.x patch releases.

---

## Commandes déploiement

```bash
# GitHub web UI — upload ces 3 fichiers :
#   - index.html (cleanup)
#   - sw.js (v1.15.0)
#   - docs/sprints/CHANGELOG_Sprint15.md

# Commit message
hotfix: Sprint 15 — clean F2P (no IAP/ads/LTO), diamonds = prestige

# Netlify auto-déploie dans les 30 sec.
# Post-deploy smoke test :
#   - https://casiclicker.netlify.app/sw.js → vérifier 'v1.15.0'
#   - Hard reload du jeu → tap 10x → prestige → voir +50💎 toast
#   - Ouvrir profile modal → plus de boutons Acheter/Pub, plus de Boost Shop
#   - Ouvrir Prestige Vault → items 500-3000💎 achetables
```

---

**Raphael, tu es prêt pour Meta Ads avec un jeu propre et 100 % F2P.** 🎯
