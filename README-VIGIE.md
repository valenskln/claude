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

## Prochaines étapes envisagées
1. **Brancher un flux AIS réel** (WebSocket aisstream.io) → positions, IMO, cap, vitesse.
2. **Scoring dynamique** des zones : GDELT, ACLED, UKMTO, IMB, Joint War Committee.
3. **Backend** : stockage des trajectoires, calcul de proximité côté serveur,
   notifications push/e-mail, comptes utilisateurs → SaaS.
