#!/bin/bash
# Extraits LinkedIn tirés de proteus-demo.mp4 : un extrait par fonction, un teaser de 30 s,
# chacun en 16:9 et en carré 1080×1080 (cadre de frames-carre.mjs). Sortie : linkedin/
set -e
cd "$(dirname "$0")"
SRC=proteus-demo.mp4; OUT=linkedin; mkdir -p $OUT
V="-c:v libx264 -preset slow -profile:v main -level 4.0 -crf 21 -pix_fmt yuv420p -tag:v avc1 -c:a aac -b:a 128k -ar 44100 -movflags +faststart"
square() {   # $1 = fichier 16:9, $2 = cadre, $3 = sortie
  ffmpeg -y -v error -i "$1" -i carre/cadre-$2.png -filter_complex \
    "color=c=0x05090F:s=1080x1080:r=25[bg];[0:v]scale=1080:608:flags=lanczos[v];[bg][v]overlay=0:236:shortest=1[b];[b][1:v]overlay=0:0" \
    $V "$3"
}
clip() {     # $1 = nom, $2 = début (s), $3 = fin (s)
  d=$(echo "$3 - $2" | bc)
  ffmpeg -y -v error -ss $2 -t $d -i $SRC -vf "fade=in:0:d=0.4,fade=out:st=$(echo "$d - 0.5" | bc):d=0.5" \
    -af "afade=in:d=0.4,afade=out:st=$(echo "$d - 0.8" | bc):d=0.8" $V $OUT/clip-$1.mp4
  square $OUT/clip-$1.mp4 $1 $OUT/clip-$1-carre.mp4
}
clip ranking   18.7 41.5
clip cumuls-3d 42.1 65.0
clip satellite 65.5 77.4
clip preuve    77.9 91.8
clip carte-2d  92.3 101.2

# teaser 30 s : la question, la plongée 3D, la détection satellite, l'appel à démonstration
SEG=("5.0 13.6" "43.0 51.0" "67.6 74.0" "109.6 116.8")
IN=(); for s in "${SEG[@]}"; do set -- $s; IN+=(-ss $1 -t $(echo "$2 - $1" | bc) -i $SRC); done
X=0.5; F=""; A=""; pv="[0:v]"; pa="[0:a]"; acc=0
for k in 1 2 3; do
  set -- ${SEG[$((k-1))]}; acc=$(echo "$acc + $2 - $1" | bc); off=$(echo "$acc - $k * $X" | bc)
  F+="${pv}[$k:v]xfade=transition=fade:duration=$X:offset=$off[v$k];"; pv="[v$k]"
  A+="${pa}[$k:a]acrossfade=d=$X[a$k];"; pa="[a$k]"
done
ffmpeg -y -v error "${IN[@]}" -filter_complex "${F}${A}${pv}fade=in:0:d=0.4[vo];${pa}afade=in:d=0.4[ao]" -map "[vo]" -map "[ao]" $V $OUT/teaser-30s.mp4
square $OUT/teaser-30s.mp4 teaser $OUT/teaser-30s-carre.mp4

# film complet : 16:9 compatible + carré
cp proteus-demo-1080p.mp4 $OUT/proteus-film-1080p.mp4
square proteus-demo-1080p.mp4 film $OUT/proteus-film-carre.mp4
ls -la $OUT
