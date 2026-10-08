# Proteus.AI — Tracker maritime × risque géopolitique

Prototype d'un SaaS croisant le **tracking des porte-conteneurs** avec l'**analyse du
risque géopolitique** des zones traversées.

## Le prototype (`proteus-prototype.html`)

Fichier HTML 100 % autonome : double-cliquer dessus l'ouvre dans n'importe quel navigateur,
sans installation ni connexion à un serveur.

L'interface reprend le vocabulaire des **cartes marines de l'Amirauté** : papier crème, encre
noire, terres en bistre, mer en bleu pâle — et le **magenta** réservé à l'information critique,
comme sur une vraie carte. Ni ombres, ni arrondis, ni dégradés : des filets d'encre.
Typographie : Spectral pour le titrage, IBM Plex Sans pour l'interface, IBM Plex Mono pour
toute valeur mesurée. Les icônes sont dessinées, jamais des emojis.

- **Coquille** en grille : en-tête · rail des zones · carte · rail des navires · barre d'état.
- **Barre d'état permanente** : santé des 6 sources de données, fraîcheur des scores, mode.
  Une source en panne se voit en permanence.
- **Thèmes** : carte de jour, **carte de nuit** (la même carte lue à la lampe), et thèmes client
  (white-label) via `?theme=client-nord`. Densité compacte / confortable.
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

## La salle d'opérations (`proteus-ops.html`) — prototype

Identité propre, volontairement en rupture avec la carte 2D : fond nuit, maillage, lueur,
polices Chakra Petch / Barlow / JetBrains Mono. Deux niveaux :

- **Globe** : les 36 zones (couleur = niveau, hauteur de la balise = score), les corridors réels
  animés, la flotte, le fil de veille mondial (vrais titres de presse de toutes les zones),
  la liste des zones triée par score. Clic sur une zone → plongée dans sa maquette.
- **Vue focus 3D de chaque zone**, construite à l'ouverture (< 0,5 s) : trait de côte mondial
  découpé au cadre, relief procédural (une maquette, pas une carte d'altitude), couloirs
  calculés par plus court chemin **sur l'eau** à partir des corridors réels (jamais sur la
  terre), ports / pays / mers, passages satellite et calques de sources, dossier de souscription.

Chaque effet 3D porte une information : les emprises satellite montrent ce qui est recoupé AIS ↔
image ; un **contact sans AIS** n'apparaît qu'une fois détecté (« à qualifier », jamais « menace ») ;
le navire sélectionné projette une colonne à travers les calques AIS · satellite · presse/JWC.

### AIS réel
Bouton **AIS DIRECT** → clé gratuite aisstream.io (même clé que la carte 2D, gardée dans le
navigateur). Les vrais navires remplacent la flotte simulée, sur le globe et dans chaque zone
(type, longueur, MMSI/IMO, destination ; exposition estimée selon type et longueur).
En direct, le recoupement satellite et le contact sans AIS sont **coupés** : aucune source
satellite n'est branchée, on n'invente rien sur des navires réels. À ouvrir en local (un aperçu
en ligne peut bloquer les connexions externes). Couverture côtière seulement.

Commandes : glisser = tourner, clic droit ou Maj + glisser = déplacer, molette = zoom, `/` =
chercher, Échap = désélectionner. `?zone=hormuz` ouvre une zone, `?theme=clair`, `?still=1`
(sans intro). Scores rafraîchis depuis `risk.json` en ligne, instantané embarqué sinon.
`focus-zone-3d.html` redirige vers `proteus-ops.html?zone=bab-el-mandeb`.

## Le dossier `proto/` (sources de fabrication)

| Fichier | Rôle |
|---|---|
| `proteus-proto.html` | **la source unique** — contient les marqueurs `//WORLD_DATA`, `__MANROPE_B64__` et `__RISK_SNAPSHOT__`, ainsi que tous les tokens de design |
| `world_compact.js` | fond de carte mondial compacté (généré par `compact.js`) |
| `fonts.css` + `*.woff2` | polices embarquées (Spectral, IBM Plex Sans, IBM Plex Mono), régénérées par `make-fonts.mjs` |
| `risk-snapshot.json` | scores embarqués, utilisés hors ligne en secours |
| `build.js` | assemble le tout et produit `proto/proteus.html` |
| `check.mjs` | test de fumée dans un navigateur (contrat DOM, erreurs JS, captures) |
| `sync-design-system.mjs` | recopie les tokens de l'app dans `design-system.html` |
| `ops.html` + `build-ops.js` | source et assemblage de la salle d'opérations → `proteus-ops.html` (corridors repris de `proteus-proto.html`, trait de côte de `world_compact.js`) |
| `fonts-ops/` | polices de la salle d'opérations (Chakra Petch, Barlow, JetBrains Mono — licences OFL incluses) |
| `vendor/three-0.159.0.min.js` | Three.js embarqué (MIT, voir `vendor/three-LICENSE`) |

### Commandes

```bash
node proto/build.js                       # reconstruire le prototype
node proto/check.mjs                       # tester (sort en 1 si régression)
node proto/make-fonts.mjs                  # ré-embarquer les polices
node proto/sync-design-system.mjs          # mettre à jour le design system
node proto/sync-design-system.mjs --check  # échouer si le design system a dérivé
node proto/build-ops.js                   # reconstruire la salle d'opérations (globe + zones)
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
