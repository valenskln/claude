#!/bin/bash
# rendu complet, un plan après l'autre (le rendu WebGL logiciel sature déjà la machine)
cd "$(dirname "$0")"
for s in ${@:-intro world zone sat layers map2d ais outro}; do node shoot.mjs $s > log-$s.txt 2>&1; echo "$s: $(tail -1 log-$s.txt)"; done
echo RENDU-TERMINE
