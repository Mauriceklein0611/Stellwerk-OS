#!/usr/bin/env bash
# Doku-Qualitäts-Gate (zero-dependency): prüft Frontmatter und interne Links
# aller Markdown-Dateien unter docs/. Deterministisch, offline, ohne npm/pip.
#
# Prüfungen:
#   1. Frontmatter beginnt in Zeile 1 mit '---' und wird mit '---' geschlossen.
#   2. Pflichtfelder vorhanden: module, type, status, updated.
#   3. status ist ein erlaubter Wert.
#   4. Interne (relative) Markdown-Links zeigen auf existierende Dateien/Ordner.
#
# Externe Links (http/https/mailto) und reine Anker (#...) werden NICHT geprüft
# (offline-Gebot, ADR-006 sinngemäß).
#
# Nutzung:  bash scripts/docs-check.sh
# Exit 0 = alles ok, Exit 1 = mindestens ein Problem (Details auf stderr).

set -u

DOCS_DIR="${1:-docs}"
# Erlaubte status-Werte: allgemein + ADR-spezifisch (siehe documentation-policy.md).
ALLOWED_STATUS="proposed current superseded frozen accepted rejected"
REQUIRED_KEYS="module type status updated"

fail=0
err() { printf 'FEHLER: %s\n' "$1" >&2; fail=1; }

# --- Frontmatter-Block einer Datei extrahieren (Zeilen zwischen den --- Markern).
frontmatter() {
  awk '
    NR==1 && $0!="---" { exit 3 }   # keine Frontmatter in Zeile 1
    NR==1 { next }
    /^---[[:space:]]*$/ { found=1; exit 0 }
    { print }
    END { if (!found) exit 4 }      # nicht geschlossen
  ' "$1"
}

check_frontmatter() {
  local f="$1" fm
  fm="$(frontmatter "$f")"
  case $? in
    3) err "$f: kein Frontmatter (Zeile 1 ist nicht '---')"; return ;;
    4) err "$f: Frontmatter nicht mit '---' geschlossen"; return ;;
  esac
  local key
  for key in $REQUIRED_KEYS; do
    printf '%s\n' "$fm" | grep -qE "^${key}:" || err "$f: Frontmatter-Feld '${key}' fehlt"
  done
  local status
  status="$(printf '%s\n' "$fm" | sed -nE 's/^status:[[:space:]]*([A-Za-z_-]+).*/\1/p' | head -n1)"
  if [ -n "$status" ]; then
    case " $ALLOWED_STATUS " in
      *" $status "*) : ;;
      *) err "$f: ungültiger status '$status' (erlaubt: $ALLOWED_STATUS)" ;;
    esac
  fi
}

check_links() {
  local f="$1" dir link target
  dir="$(dirname "$f")"
  # Alle ](target) einsammeln, Anker abtrennen.
  grep -oE '\]\(([^)]+)\)' "$f" | sed -E 's/^\]\(//; s/\)$//' | while IFS= read -r link; do
    link="${link%%#*}"                       # Anker entfernen
    [ -z "$link" ] && continue               # reiner Anker
    case "$link" in
      http://*|https://*|mailto:*) continue ;;
    esac
    target="$(cd "$dir" 2>/dev/null && realpath -m "$link" 2>/dev/null)"
    if [ -z "$target" ] || [ ! -e "$target" ]; then
      err "$f: toter interner Link -> $link"
    fi
  done
}

count=0
while IFS= read -r f; do
  count=$((count + 1))
  check_frontmatter "$f"
  # check_links läuft in Subshell (Pipe); Fehler über Exit-Status einsammeln.
  if ! out="$(check_links "$f" 2>&1)"; then :; fi
  [ -n "${out:-}" ] && { printf '%s\n' "$out" >&2; fail=1; }
  out=""
done < <(find "$DOCS_DIR" -type f -name '*.md' | sort)

if [ "$fail" -ne 0 ]; then
  printf '\nDoku-Gate: FEHLGESCHLAGEN (geprüft: %s Dateien)\n' "$count" >&2
  exit 1
fi
printf 'Doku-Gate: OK (%s Dateien, Frontmatter + interne Links geprüft)\n' "$count"
