# Prompt de pivot — Proteus.AI pour le souscripteur risque de guerre

> À copier-coller dans une session Claude Code sur ce dépôt. Autonome : il nomme
> l'état actuel du produit et ne suppose aucun historique de conversation.

---

## Mission

Proteus.AI est aujourd'hui un tracker maritime généraliste (36 zones à risque scorées
0-10, tracking AIS, moteur de scoring horaire sur 7 sources ouvertes, identité « carte
marine »). Tu vas le resserrer sur **la fonction risk assessment d'un assureur maritime
français** — l'évaluation du risque en amont de la souscription — et adopter **son langage
métier**.

**Le risque de guerre est la tête de pont, pas la clôture.** C'est là que la douleur est la
plus vive (voir le constat) et que l'avantage de Proteus est le plus tranchant : veille
presse en direct + zones listées Joint War Committee. Mais on vise le **risk assessment au
sens large** — le risque de guerre en premier, puis les risques ordinaires (perte, vol,
casse) et le cyber en extension. On entre par le point aigu, on ne s'y enferme pas.

Ce n'est pas une reconstruction : le moteur, les sources et l'identité visuelle restent.
C'est un habillage métier qui transforme un outil de veille générique en **outil
d'accompagnement du risk assessment maritime, à commencer par le risque de guerre**.

## Le constat (d'où vient le pivot)

Ces notes viennent d'un échange avec le CESAM (Comité d'études et de services des
assureurs maritimes et transports, qui représente ~95 % des primes du marché français).
Le souscripteur risque de guerre vit une douleur précise :

- Le risque de guerre couvre un ensemble **multiforme** : guerre civile ou étrangère,
  émeute, terrorisme, piraterie, grève/lock-out, explosion de torpille. Il s'apprécie
  zone par zone via un **rating de zone**.
- Quand une zone bascule en **rating 7 ou 8**, la garantie est **suspendue**, puis
  rétablie **au cas par cas**. Comme les flux ne sont pas définis, « tout est impacté sur
  la couverture globale des flux ». Le taux de prime risque de guerre peut passer de
  **~0,01 % à 3 %**. Impact direct sur le business et les routes.
- Textuellement : *« On passerait notre temps à gérer des ratings, en termes de gestion
  ce serait effroyable, et pour les acteurs économiques ingérable. »*
- Et la question posée en marge du document, plusieurs fois : *« l'IA ne peut pas
  permettre d'assister et de fluidifier cela ? »*

**Proteus répond déjà à cette question sans le dire.** Trois atouts tombent pile :

| Le souscripteur a besoin de… | Proteus a déjà… |
|---|---|
| une veille presse en direct sur la potentialité de conflit | le moteur **GDELT** (presse mondiale, rafraîchie toutes les 15 min) |
| le référentiel des zones de guerre des assureurs | l'ingestion **Joint War Committee** (Lloyd's / LMA) + le drapeau JWC par zone |
| une donnée d'aide à la décision, pas une boîte noire | le **score explicable en 5 composantes**, sourcé et daté |
| voir son exposition et ses cumuls | le **classement des navires exposés** par zone |

Tu construis le pivot **sur ces briques**, tu n'en réinventes aucune.

## La cible : le souscripteur, par la porte du risque de guerre

Son métier est de prendre des risques pour en tirer une marge ; sa boussole est le
**ratio combiné** (indice 100 = équilibre, en dessous = bénéfice). Ce qu'il redoute le
plus : un **cumul non vu** sur une zone qui bascule — un engagement de plusieurs milliards
concentré sur une route qui passe en rating 7 du jour au lendemain, capté par LMA / Swiss
Re / Munich Re ou par un assessment du MICA Center *après* lui. Il ne veut pas un outil de
plus à gérer ; il veut **anticiper, justifier et fluidifier**.

Le risque de guerre est son point de douleur immédiat et notre porte d'entrée. Mais le même
besoin — **évaluer, sourcer, justifier** — vaut pour l'ensemble de son risk assessment : la
mécanique qu'on construit pour la guerre se réemploie pour les risques ordinaires et le cyber.

## Arbitrages tranchés (ne pas partir dans l'autre sens)

Deux décisions verrouillées. La session d'exécution s'y tient.

- **Risque de guerre en v1, risk assessment en vision — c'est une séquence, pas une
  restriction.** La v1 traite **le risque de guerre à fond** : c'est là qu'est la douleur
  aiguë et non résolue, et là que l'avantage de Proteus (veille presse en direct + zones JWC)
  est réel. Les risques ordinaires (perte, vol, casse) sont actuariels et historiques — la
  veille live n'y apporte presque rien. Le « risk assessment large » vit dans le **pitch et la
  vision**, pas dans les fonctions livrées. Ne pas diluer la v1 en voulant tout couvrir : ce
  serait la « solution miracle » qu'on veut précisément éviter.
- **Garder les 36 zones fines, les mapper vers le rating grossier — ne jamais collapser vers
  8.** Le rating 8-zones du marché est grossier et lent ; s'y réduire ferait de Proteus une
  redite de ce que LMA / Swiss Re / Munich Re publient déjà, donc **sans edge**. La valeur est
  de voir **un détroit précis chauffer avant que toute la zone-monde ne soit re-ratée** : la
  finesse **est** l'anticipation, c'est l'argument de vente. Afficher les 36 zones regroupées
  **sous** les paliers de rating de l'assureur pour parler sa langue, sans perdre le grain.

## Ce que tu changes

### 1. Repositionnement (discours)

- **Titre / tagline / à-propos / pitch** : passer de « tracker maritime × risque
  géopolitique » à **l'accompagnement du risk assessment maritime**, avec le **risque de
  guerre en accroche d'entrée** (« veille de souscription risque de guerre »). Le bénéfice
  mis en avant : anticiper une bascule de rating avant qu'elle ne touche le book, avec une
  justification **sourcée, corroborée et traçable**. Ton d'accompagnement, jamais de solution
  miracle.
- **Cadrage souveraineté** (à-propos et pitch, pas l'app quotidienne) : le marché français
  délivre des garanties risque de guerre étendues — jusqu'au *« war on land »*, une
  spécificité française. Proteus est une **IA française qui soutient la compétitivité des
  assureurs français** et inscrit cette spécificité dans le réel. Cet angle sert les
  affaires publiques (CESAM), il ne surcharge pas l'interface opérationnelle.
- Retirer des cibles affichées « logisticiens, traders » : on assume le focus assureur.

### 2. Le cadre de notation (pièce maîtresse)

- **Garder le score continu 0-10 en interne** (plus fin), et **afficher en regard un rating
  de zone 1-8** — le langage du souscripteur, où **7/8 est le seuil de suspension**. La
  correspondance 0-10 → 1-8 doit être explicite, documentée, et visible dans le design
  system.
- Afficher par zone une **bande de taux de prime risque de guerre indicative** (ordre de
  grandeur ~0,01 % en temps normal → jusqu'à 3 % en zone chaude). **Étiquetée « indicatif »
  sans ambiguïté** : Proteus ne cote pas, le marché cote.
- Nommer l'**ancrage institutionnel** : le **Joint War Committee (Lloyd's / LMA)** déjà
  ingéré, et le **MICA Center** (renseignement de la Marine nationale) comme référence de
  sécurité — en couche de référence citée, pas en source scrappée.

### 3. Les fonctions (v1)

Priorité, de la plus forte à la plus faible :

1. **Alerte de bascule de rating** *(la fonction phare)* — prévenir quand une zone
   approche ou franchit le seuil **rating 7**, avec la justification sourcée (titres de
   presse, incidents, tendance), **avant** que la bascule ne frappe la couverture de flux.
   C'est la réponse directe à « effroyable et ingérable ».
2. **Vue cumuls / exposition** — réemployer le classement « navires exposés » comme une
   **vue d'accumulation** : quels navires sont, en ce moment, dans ou à l'approche d'une
   zone en rating 7/8. C'est la préoccupation Optiflux (cumuls colossaux, engagements de
   plusieurs milliards par navire) rendue visible.
3. **Piste d'audit / fiche de justification** — chaque point de score reste sourcé et daté ;
   ajouter un **export** (fiche par zone) qui constitue le dossier de suspension ou de
   rétablissement de garantie. La traçabilité est une fonctionnalité de compliance, pas une
   décoration.
4. **Reframe du score en aide à la souscription** — vocabulaire des composantes et des
   fiches réorienté « décision de souscription », sans toucher au calcul.

### 4. Fiabilité de l'information et identification des navires (on sera challengés là-dessus)

Le premier reproche qu'on nous fera : *quelle fiabilité ? La presse suffit-elle ?* Il faut y
répondre **dans le produit**, pas seulement dans le discours.

- **La presse (GDELT) seule ne fait pas foi.** Un titre isolé et non confirmé n'est pas un
  fait. Proteus **corrobore** : un signal ne pèse que recoupé entre plusieurs sources — presse
  GDELT + listing Joint War Committee + événements GDACS / USGS / NOAA + incidents ASAM. Chaque
  point de score reste **sourcé et daté**.
- **Afficher un indice de confiance** par signal et par zone : *source unique non confirmée* →
  *corroboré multi-sources* → *confirmé institutionnel (JWC / MICA)*. Le souscripteur voit non
  seulement le score, mais **la solidité de ce qui le fonde**. C'est ce qui fait passer d'« une
  veille » à « une veille défendable » face à un contradicteur.
- **Identification des navires : l'AIS ne suffit pas, et il faut le dire.** L'AIS peut être
  éteint, usurpé ou falsifié (*dark shipping*). Proteus doit **signaler cette limite** et prévoir
  le **recoupement avec un tracker satellite** (AIS satellite ciblé sur les détroits, détection
  des navires qui coupent leur signal). En v1 : l'annoncer honnêtement comme limite connue ;
  en v2 : le brancher.
- **Posture : accompagnement, pas solution miracle.** Proteus **éclaire et documente** une
  décision, il ne la prend pas et ne prétend pas à la vérité. Bannir « certitude »,
  « prédiction », « garantie » au profit de « signal », « faisceau d'indices », « à confirmer ».

### 5. Roadmap (v2, à mentionner, pas à construire)

- **Recoupement satellite** de l'identification des navires + détection du *dark shipping*
  (réponse directe au point ci-dessus).
- **Ratio combiné** et indicateurs de portefeuille.
- **Risque cyber** maritime (garantie systémique, marché en plein essor — Marsh précurseur).
- **Raccordement MICA Center / Marine nationale** (l'écosystème s'appuie de plus en plus
  sur la Marine nationale — « IA pour rapprocher »).
- Branchement du **book réel du client** (voir garde-fous).

## Ce que tu ne changes pas

Le moteur de scoring (`risk/pipeline.mjs`, `risk/zones.mjs`, les connecteurs
`risk/sources/*`), les 7 sources, l'identité visuelle « carte marine » (tokens, thèmes,
polices embarquées), le système i18n FR/EN, la coquille en grille, le pont canvas↔CSS et
le test de fumée `proto/check.mjs`. Le pivot réutilise cette infrastructure ; il ne la
refait pas. Après chaque changement, `node proto/build.js && node proto/check.mjs` doit
rester au vert, et `node proto/sync-design-system.mjs --check` aligné.

## Garde-fous (non négociables)

- **L'IA assiste, elle ne décide pas.** Proteus **anticipe et justifie** un rating ; le
  souscripteur, le Joint War Committee et le marché **fixent**. C'est le *« assister et
  fluidifier »* du document — jamais remplacer. Toute formulation qui laisse croire que
  Proteus « décide le rating » est à proscrire : elle décrédibilise l'outil devant un vrai
  souscripteur.
- **On sera challengés sur la fiabilité — c'est anticipé, pas subi.** La corroboration
  multi-sources et l'indice de confiance (voir §4) sont la réponse produit. Ne jamais
  présenter un signal de presse isolé comme un fait établi, ni l'AIS comme une
  identification certaine.
- **Honnêteté sur le simulé.** Les positions des navires sont **simulées** (flotte
  fictive ; le flux AIS réel est optionnel). La vraie vue cumuls suppose le **portefeuille
  du client** (ses navires assurés). La v1 **démontre le concept sur la flotte simulée** et
  doit **dire clairement** que la valeur pleine vient du branchement du book — ne rien
  survendre.
- **Le taux de prime est indicatif**, jamais présenté comme une cotation.
- **Sous 4,0, le score reste neutre** (règle de la charte déjà en place) — un book en
  rating bas ne doit pas paraître en alerte.

## Vérification

1. `node proto/build.js && node proto/check.mjs` au vert, `sync-design-system.mjs --check`
   aligné.
2. Une zone chaude (ex. Ormuz) affiche : score 0-10 **et** rating 1-8, bande de taux
   indicative, drapeau JWC, **indice de confiance** du signal, et si elle est en rating ≥ 7,
   l'alerte de bascule avec sa justification sourcée et corroborée.
3. La vue cumuls liste les navires exposés d'une zone en rating 7/8, avec la mention
   honnête « flotte simulée — brancher le book pour l'exposition réelle » et le rappel que
   **l'identification AIS reste à recouper** (satellite en v2).
4. L'export d'une fiche de justification produit un document daté, sourcé et corroboré.
5. Relire l'à-propos et le pitch : la cible est le souscripteur (entrée risque de guerre,
   horizon risk assessment), l'angle souveraineté FR est présent, le ton est
   **accompagnement et non solution miracle**, et nulle part Proteus ne prétend fixer un
   rating, coter une prime, ni tenir un signal de presse isolé pour un fait.
