#!/bin/bash
# run-routine.sh — local runner for the TY blog graph routines (installed in crontab).
# Usage: run-routine.sh <daily-truth-check|weekly-ctr-rewrites|production-run|monthly-link-sweep|monthly-depth-run>
# Runs headless Claude Code against this repo. Secrets come from .env (loaded by the
# node scripts themselves). Logs to logs/routines/, notifies via macOS notification.

set -u
export PATH="/Users/gbolahan/.npm-global/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
PROJECT="/Users/gbolahan/Documents/Active-2026/2026-projects/TY Blog Automation"
cd "$PROJECT" || exit 1

NAME="${1:-}"
[ -z "$NAME" ] && { echo "usage: run-routine.sh <routine-name>"; exit 1; }

mkdir -p logs/routines
LOG="logs/routines/$(date +%F-%H%M)-$NAME.log"

SHARED="You are the TradersYard blog automation running LOCALLY in this repo (the working tree at $PROJECT — no cloning, no npm install needed, .env secrets are available to the scripts). Read runbooks/ROUTINES.md and follow its SHARED PREAMBLE exactly (docs.tradersyard.com is the ONLY source of truth for TradersYard claims; never mention AgenaTrader; no em dashes; backup before every live write; fail loudly; commit and push every changed state file at end of run — git push is authenticated here)."

case "$NAME" in
  daily-truth-check)
    TASK="Follow section '1 - daily-truth-check' of runbooks/ROUTINES.md exactly (run scripts/facts-snapshot.mjs; on exit 2 execute playbook B from runbooks/graph-workflow.md with per-item backups; cap 20 patches)." ;;
  weekly-ctr-rewrites)
    TASK="Follow section '2 - weekly-ctr-rewrites' of runbooks/ROUTINES.md exactly (run scripts/monitor.mjs; report any new ctr_after results as a before/after table; max 10 rewrites via docs/LOOP1-REWRITE-PROMPT.md, gate them, then scripts/apply-rewrite.mjs)." ;;
  production-run)
    TASK="Follow section '3 - production-run' of runbooks/ROUTINES.md, PHASE 1 ONLY (write, gate, score >=85, thumbnails+CDN, then STOP — do NOT publish). Save the batch report to runbooks/routine-runs.md and data/staged-wave.json. Publishing happens only when the human says go in an interactive session." ;;
  monthly-link-sweep)
    TASK="Follow section '4 - monthly-link-sweep' of runbooks/ROUTINES.md exactly (scripts/link-sweep.mjs, build plan max 15 hosts excluding -xxxxx dedup slugs, dry-run then apply via scripts/apply-links.mjs)." ;;
  monthly-depth-run)
    TASK="Follow section '5 - monthly-depth-run' of runbooks/ROUTINES.md exactly (STAGING ONLY: diagnose, rewrite through gates, prepare merge proposals; NEVER execute merges or publishes)." ;;
  *) echo "unknown routine: $NAME"; exit 1 ;;
esac

FINISH="When finished, append your run report (date, routine, actions, receipts, failures) to runbooks/routine-runs.md, commit and push all changed state files with message 'routine: $NAME $(date +%F)'."

echo "=== routine $NAME started $(date) ===" >> "$LOG"
claude -p "$SHARED $TASK $FINISH" --dangerously-skip-permissions >> "$LOG" 2>&1
STATUS=$?
echo "=== routine $NAME finished status=$STATUS $(date) ===" >> "$LOG"

if [ $STATUS -eq 0 ]; then
  osascript -e "display notification \"$NAME completed — see runbooks/routine-runs.md\" with title \"TY Blog Routine\"" 2>/dev/null
else
  osascript -e "display notification \"$NAME FAILED (status $STATUS) — see $LOG\" with title \"TY Blog Routine ⚠️\"" 2>/dev/null
fi
exit $STATUS
