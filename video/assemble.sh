#!/bin/bash
# Montage : 8 séquences d'images → fondus enchaînés → H.264 1080p + bande-son normalisée.
set -e
cd "$(dirname "$0")"
X=0.6
SHOTS=(intro world zone sat layers map2d ais outro)
DUR=(19 24 24 13 15 10 7 9)
IN=(); for s in "${SHOTS[@]}"; do IN+=(-framerate 25 -i "frames/$s/%05d.jpg"); done
# chaîne de fondus : décalage k = somme des durées précédentes - k × X
F=""; prev="[0:v]"; acc=0
for k in $(seq 1 7); do
  acc=$(echo "$acc + ${DUR[$((k-1))]}" | bc); off=$(echo "$acc - $k * $X" | bc)
  tr=fade; [ $k -eq 7 ] && tr=fadeblack
  out="[v$k]"; F+="${prev}[$k:v]xfade=transition=$tr:duration=$X:offset=$off${out};"; prev=$out
done
F+="${prev}format=yuv420p[vout]"
ffmpeg -y -hide_banner -loglevel warning "${IN[@]}" -i soundtrack.wav -filter_complex "$F;[8:a]loudnorm=I=-18:TP=-1.5:LRA=11[aout]" \
  -map "[vout]" -map "[aout]" -c:v libx264 -preset slow -crf 18 -profile:v high -r 25 -c:a aac -b:a 192k -movflags +faststart -shortest proteus-demo.mp4
ffmpeg -y -hide_banner -loglevel warning -i proteus-demo.mp4 -an -c:v copy proteus-demo-sans-son.mp4
# version légère (≈ 30 Mo) pour l'e-mail et LinkedIn
ffmpeg -y -hide_banner -loglevel warning -i proteus-demo.mp4 -c:v libx264 -preset slow -crf 25 -maxrate 3M -bufsize 6M -c:a aac -b:a 128k -movflags +faststart proteus-demo-leger.mp4
ffprobe -v error -show_entries format=duration,size -of default=nw=1 proteus-demo.mp4
