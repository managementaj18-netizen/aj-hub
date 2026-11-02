#!/bin/sh
# Release a held-back game:  sh game/release.sh sort   (or kids, abc)
# Held-back games live in a private folder (game/public/try-6d7b31c6ea/, not linked anywhere).
# This moves one of them to game/public/<name>; commit and push, and Cloudflare publishes it.
set -e
cd "$(dirname "$0")"
P=public/try-6d7b31c6ea
[ -d "$P/$1" ] || { echo "no held-back game called '$1' (available: $(ls -d $P/*/ | xargs -n1 basename | tr '\n' ' '))"; exit 1; }
git mv "$P/$1" "public/$1"
echo "Released '$1'. Now commit and push."
