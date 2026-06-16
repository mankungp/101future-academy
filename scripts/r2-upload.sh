#!/usr/bin/env bash
# Upload a local dir to R2 (S3-compatible) preserving filenames.
# usage: scripts/r2-upload.sh <local_dir> <r2_prefix> [glob]
# reads R2_* from project .env. content-type by extension. no deps (curl --aws-sigv4).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENVF="$ROOT/.env"
AK=$(grep '^R2_ACCESS_KEY_ID=' "$ENVF" | cut -d= -f2)
SK=$(grep '^R2_SECRET_ACCESS_KEY=' "$ENVF" | cut -d= -f2)
EP=$(grep '^R2_ENDPOINT=' "$ENVF" | cut -d= -f2)
B=$(grep '^R2_BUCKET=' "$ENVF" | cut -d= -f2)
SIG="aws:amz:auto:s3"

DIR="$1"; PREFIX="$2"; GLOB="${3:-*}"
ct_for(){ case "${1##*.}" in png) echo image/png;; jpg|jpeg) echo image/jpeg;; webp) echo image/webp;; svg) echo image/svg+xml;; mp3) echo audio/mpeg;; mp4) echo video/mp4;; glb) echo model/gltf-binary;; json) echo application/json;; *) echo application/octet-stream;; esac; }

ok=0; bad=0
shopt -s nullglob
for f in "$DIR"/$GLOB; do
  [ -f "$f" ] || continue
  n="$(basename "$f")"; ct="$(ct_for "$n")"
  code=$(curl -s -o /dev/null -w "%{http_code}" --aws-sigv4 "$SIG" --user "$AK:$SK" \
    -H "Content-Type: $ct" -X PUT --upload-file "$f" "$EP/$B/$PREFIX/$n")
  if [ "$code" = "200" ]; then ok=$((ok+1)); else bad=$((bad+1)); echo "FAIL $n ($code)"; fi
done
echo "uploaded: $ok ok / $bad fail -> r2://$B/$PREFIX/"
