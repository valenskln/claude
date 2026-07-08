# VIGIE — Tracker maritime × risque géopolitique

Prototype de faisabilité d'un SaaS croisant le **tracking des porte-conteneurs** avec
l'**analyse du risque géopolitique** des zones traversées.

## Le prototype (`vigie-prototype.html`)

Fichier HTML 100 % autonome : double-cliquer dessus l'ouvre dans n'importe quel navigateur,
sans installation ni connexion à un serveur.

### Ce qui est réel
- Les **8 zones à risque** et leur contexte (mer Rouge/Houthis, mer Noire, Ormuz,
  golfe de Guinée, Taïwan, mer de Chine méridionale, Malacca, Panama), avec un score /10.
- Les **routes maritimes** : corridors réels, y compris le déroutement par le cap de
  Bonne-Espérance pour éviter la mer Rouge.
- Le **moteur d'alerte** : détection d'approche/entrée en zone, classement d'exposition
  des navires — c'est la vraie logique du futur produit.

### Ce qui est simulé
- Les **positions des navires** (flotte fictive de 43 porte-conteneurs, animée le long
  des corridors, temps accéléré). En production, elles viendront d'un flux **AIS**
  temps réel (aisstream.io pour tester gratuitement, puis Spire / MarineTraffic à l'échelle).

## Le dossier `proto/` (sources de fabrication)

- `vigie-proto.html` — le code source du prototype (avec les marqueurs `//WORLD_DATA` et `__MANROPE_B64__`)
- `world_compact.js` — le fond de carte mondial compacté (généré par `compact.js`)
- `manrope.b64` — la police Manrope encodée en base64
- `build.js` — assemble le tout : `node build.js` produit le fichier final `vigie.html`
- `check.mjs` — test automatique dans un navigateur (captures d'écran, erreurs JS)

Pour reconstruire le prototype après une modification de `vigie-proto.html` :
```bash
cd proto && node build.js
```

## Prochaines étapes envisagées
1. **Brancher un flux AIS réel** (WebSocket aisstream.io) → positions, IMO, cap, vitesse.
2. **Scoring dynamique** des zones : GDELT, ACLED, UKMTO, IMB, Joint War Committee.
3. **Backend** : stockage des trajectoires, calcul de proximité côté serveur,
   notifications push/e-mail, comptes utilisateurs → SaaS.
