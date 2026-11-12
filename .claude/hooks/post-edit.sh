#!/usr/bin/env bash
# PostToolUse(Edit|Write): typecheck the project and eslint --fix the edited file; print errors only.
f=$(node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{process.stdout.write(JSON.parse(d).tool_input?.file_path??"")}catch{}})')
case "$f" in *.ts|*.tsx) ;; *) exit 0 ;; esac
cd "$CLAUDE_PROJECT_DIR" || exit 0
out=$(pnpm exec tsc -b --noEmit 2>&1 | grep -E 'error TS' | head -15)
lint=$(pnpm exec eslint --fix "$f" 2>&1 | grep -E 'error' | head -15)
if [ -n "$out$lint" ]; then printf '%s\n%s\n' "$out" "$lint" >&2; exit 2; fi
exit 0
