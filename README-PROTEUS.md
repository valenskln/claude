# Proteus.AI — Tracker maritime × risque géopolitique

Prototype d'un SaaS croisant le **tracking des porte-conteneurs** avec l'**analyse du
risque géopolitique** des zones traversées.

## Le prototype (`proteus-prototype.html`)

Fichier HTML 100 % autonome : double-cliquer dessus l'ouvre dans n'importe quel navigateur,
sans installation ni connexion à un serveur.

L'interface est un **terminal d'opérations** : tableaux serrés, chiffres monospace alignés,
hiérarchie portée par la graisse et la densité plutôt que par la couleur.

- **Coquille** en grille : en-tête · rail des zones · carte · rail des navires · barre d'état.
- **Barre d'état permanente** : santé des 6 sources de données, fraîcheur des scores, mode.
  Une source en panne se voit en permanence.
- **Thèmes** : sombre, clair, et thèmes client (white-label). Bouton `☀`, ou `?theme=client-nord`
  dans l'URL. Densité compacte / confortable.
- **Bilingue** FR/EN, bascule instantanée.

### Ce qui est réel
- Les **36 zones à risque**, leur type (détroit / conflit / piraterie / mixte), leur contexte
  et leur score /10 recalculé **toutes les heures** par un robot GitHub Actions à partir de
  7 sources ouvertes (GDELT, NGA ASAM, GDACS, USGS, NOAA, Open-Meteo, Joint War Committee).
- Les **routes maritimes** : corridors réels, y compris le déroutement par le cap de
  Bonne-Espérance pour éviter la mer Rouge.
- Le **moteur d'alerte** : détection d'approche/entrée en zone, classement d'exposition
  des navires — c'est la vraie logique du produit.

### Ce qui est simulé
- Les **positions des navires** par défaut (flotte fictive de 43 porte-conteneurs animée le
  long des corridors, temps accéléré). Le bouton **AIS direct** bascule sur un vrai flux
  temps réel (aisstream.io, clé gratuite) — à ouvrir en local, l'aperçu en ligne bloque les
  connexions externes.

## Le dossier `proto/` (sources de fabrication)

| Fichier | Rôle |
|---|---|
| `proteus-proto.html` | **la source unique** — contient les marqueurs `//WORLD_DATA`, `__MANROPE_B64__` et `__RISK_SNAPSHOT__`, ainsi que tous les tokens de design |
| `world_compact.js` | fond de carte mondial compacté (généré par `compact.js`) |
| `manrope.b64` | police Manrope encodée en base64 |
| `risk-snapshot.json` | scores embarqués, utilisés hors ligne en secours |
| `build.js` | assemble le tout et produit `proto/proteus.html` |
| `check.mjs` | test de fumée dans un navigateur (contrat DOM, erreurs JS, captures) |
| `sync-design-system.mjs` | recopie les tokens de l'app dans `design-system.html` |

### Commandes

```bash
node proto/build.js                       # reconstruire le prototype
node proto/check.mjs                       # tester (sort en 1 si régression)
node proto/sync-design-system.mjs          # mettre à jour le design system
node proto/sync-design-system.mjs --check  # échouer si le design system a dérivé
```

Les captures de `check.mjs` vont dans un dossier temporaire ; utiliser `PROTEUS_SHOTS=/chemin`
pour les diriger ailleurs, et `PROTEUS_SKIP_AIS=1` pour sauter l'essai de connexion réseau.

## Design

- **`design-system.html`** — la référence technique : tokens, composants, états, avec les
  sélecteurs de thème et de densité en direct. **Généré depuis le code**, jamais à la main.
- **`charte-graphique.html`** — la référence de marque : positionnement, logo, ton de voix.

Les tokens sont organisés en trois étages : primitives → sémantique → layout. Un composant
ne lit jamais une primitive, et seul l'étage sémantique est redéfini par un thème. C'est ce
qui permet de changer couleurs et typographie sans toucher à la structure.

## Prochaines étapes envisagées
1. **Réparer la source ASAM** (l'endpoint NGA ne répond plus), visible en rouge dans la barre d'état.
2. **Alertes push / e-mail** et comptes utilisateurs.
3. **AIS satellite** ciblé sur les détroits, détection du « dark shipping ».
4. **API B2B** et scoring par navire et par route planifiée.
