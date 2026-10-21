# Vidéo de démonstration — chaîne de production

La vidéo est **tournée dans l'outil lui-même**, image par image, sans logiciel de montage :
une horloge virtuelle fait avancer la page de 40 ms entre deux captures, ce qui donne une 3D fluide
à 25 i/s même sur une machine sans carte graphique.

| Fichier | Rôle |
|---|---|
| `vclock.js` | horloge virtuelle : remplace `performance.now`, `requestAnimationFrame`, `setTimeout`/`setInterval` |
| `dir.js` | surcouche de réalisation : sous-titres, cartons, zoom sur l'interface, curseur, cadre de mise en valeur |
| `shots.js` | le scénario, plan par plan (8 plans : accroche, carte mondiale, zone 3D, satellite, calques, carte 2D, AIS, conclusion) |
| `shoot.mjs` | tourne un plan : `node shoot.mjs <plan> [preview]` → `frames/<plan>/*.jpg` |
| `render.sh` | tourne tous les plans à la suite (≈ 75 min sans GPU, quelques minutes avec) |
| `music.py` | bande-son synthétisée, calée sur le découpage (aucun échantillon externe) |
| `assemble.sh` | fondus enchaînés, encodage H.264, son normalisé à −18 LUFS → `proteus-demo.mp4` |
| `VOIX-OFF.md` | texte de voix off minuté |

Prérequis : Node + Playwright (Chromium), ffmpeg, Python 3 + numpy. Construire d'abord les pages :
`node proto/build.js && cp proto/proteus.html proteus-prototype.html && node proto/build-ops.js`.

```bash
cd video
node shoot.mjs zone preview      # aperçu rapide d'un plan (une image toutes les 2 s)
./render.sh                      # rendu complet
python3 music.py soundtrack.wav  # bande-son
./assemble.sh                    # montage final
```

Les chemins de Chromium et de playwright-core sont ceux de l'environnement de développement :
les adapter en tête de `shoot.mjs` sur une autre machine.
