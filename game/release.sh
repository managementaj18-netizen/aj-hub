#!/bin/sh
# Release a held-back game:  sh game/release.sh sort   (or kids)
# It moves game/_unreleased/<name> into game/public/<name>; commit and push, and Cloudflare publishes it.
set -e
cd "$(dirname "$0")"
[ -d "_unreleased/$1" ] || { echo "no held-back game called '$1' (available: $(ls _unreleased | tr '\n' ' '))"; exit 1; }
git mv "_unreleased/$1" "public/$1"
echo "Released '$1'. Now commit and push."
