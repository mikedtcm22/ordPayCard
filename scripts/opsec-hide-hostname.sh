#!/usr/bin/env bash

# opsec-hide-hostname.sh
# Purpose: Hide or remove the hostname from your zsh prompt for screen sharing / recording.
# Supports: installing a persistent zsh prompt override and starship config tweak; or applying to current session when sourced.
# Usage:
#   Persistent (recommended):
#     bash /Users/michaelchristopher/repos/ordPayCard/scripts/opsec-hide-hostname.sh --install
#     # open a new terminal (or exec zsh -l) to see effect
#
#   Apply only to current shell (must be sourced):
#     source /Users/michaelchristopher/repos/ordPayCard/scripts/opsec-hide-hostname.sh --session
#
#   Remove persistent changes:
#     bash /Users/michaelchristopher/repos/ordPayCard/scripts/opsec-hide-hostname.sh --uninstall
#
#   Check status:
#     bash /Users/michaelchristopher/repos/ordPayCard/scripts/opsec-hide-hostname.sh --status

set -euo pipefail

ZSHRC_FILE="$HOME/.zshrc"
STARSHIP_FILE="$HOME/.config/starship.toml"
ZSH_MARK_START="# >>> opsec-hostname-hide start"
ZSH_MARK_END="# <<< opsec-hostname-hide end"
STARSHIP_MARK_START="# >>> opsec-hostname-hide start"
STARSHIP_MARK_END="# <<< opsec-hostname-hide end"

PROMPT_OVERRIDE="PROMPT='%F{cyan}%n%f %F{green}%1~%f %# '"

function ensure_parent_dir() {
  local target_file="$1"
  local parent_dir
  parent_dir="$(dirname "$target_file")"
  mkdir -p "$parent_dir"
}

function block_exists() {
  local file="$1"; shift
  local start_marker="$1"; shift
  local end_marker="$1"; shift
  [[ -f "$file" ]] && grep -qF "$start_marker" "$file" && grep -qF "$end_marker" "$file"
}

function add_block() {
  local file="$1"; shift
  local start_marker="$1"; shift
  local end_marker="$1"; shift
  local content="$1"; shift
  ensure_parent_dir "$file"
  if block_exists "$file" "$start_marker" "$end_marker"; then
    echo "[opsec] Block already present in $file"
  else
    {
      echo "$start_marker"
      echo "$content"
      echo "$end_marker"
      echo
    } >> "$file"
    echo "[opsec] Added block to $file"
  fi
}

function remove_block() {
  local file="$1"; shift
  local start_marker="$1"; shift
  local end_marker="$1"; shift
  if [[ ! -f "$file" ]]; then
    echo "[opsec] $file not found; nothing to remove"
    return 0
  fi
  if ! block_exists "$file" "$start_marker" "$end_marker"; then
    echo "[opsec] No managed block found in $file"
    return 0
  fi
  local tmp
  tmp="${file}.opsec.$$"
  awk -v start="$start_marker" -v end="$end_marker" '
    BEGIN {skip=0}
    index($0, start) {skip=1; next}
    index($0, end) {skip=0; next}
    skip==0 {print}
  ' "$file" > "$tmp"
  mv "$tmp" "$file"
  echo "[opsec] Removed block from $file"
}

function install_persistent() {
  # 1) zsh prompt override (placed at end of ~/.zshrc to win over p10k/starship init)
  local zsh_block
  read -r -d '' zsh_block <<'EOF'
# Hide hostname in zsh prompt for OpSec (Cursor/recording)
if [ -n "$ZSH_VERSION" ]; then
  PROMPT='%F{cyan}%n%f %F{green}%1~%f %# '
fi
EOF
  add_block "$ZSHRC_FILE" "$ZSH_MARK_START" "$ZSH_MARK_END" "$zsh_block"

  # 2) starship: disable hostname module via managed block (safe even if starship not used)
  ensure_parent_dir "$STARSHIP_FILE"
  local starship_block
  read -r -d '' starship_block <<'EOF'
[hostname]
disabled = true
EOF
  add_block "$STARSHIP_FILE" "$STARSHIP_MARK_START" "$STARSHIP_MARK_END" "$starship_block"

  echo "[opsec] Install complete. Open a new terminal or run: exec zsh -l"
}

function uninstall_persistent() {
  remove_block "$ZSHRC_FILE" "$ZSH_MARK_START" "$ZSH_MARK_END"
  remove_block "$STARSHIP_FILE" "$STARSHIP_MARK_START" "$STARSHIP_MARK_END"
  echo "[opsec] Uninstall complete. Open a new terminal or run: exec zsh -l"
}

function apply_session() {
  # This only works if the script is sourced in zsh; otherwise we cannot change parent shell prompt
  if [ -n "${ZSH_VERSION-}" ]; then
    eval "$PROMPT_OVERRIDE"
    echo "[opsec] Prompt updated for current zsh session (hostname hidden)."
  else
    echo "[opsec] Not in zsh or not sourced. To apply to current shell, run:"
    echo "  source /Users/michaelchristopher/repos/ordPayCard/scripts/opsec-hide-hostname.sh --session"
    return 1
  fi
}

function status_report() {
  echo "[opsec] Shell: ${SHELL-unknown}"
  if command -v starship >/dev/null 2>&1; then echo "[opsec] starship: installed"; else echo "[opsec] starship: not found"; fi
  if [[ -d "$HOME/.oh-my-zsh" ]]; then echo "[opsec] oh-my-zsh: present"; else echo "[opsec] oh-my-zsh: not present"; fi
  if [[ -f "$HOME/.p10k.zsh" ]]; then echo "[opsec] powerlevel10k: present"; else echo "[opsec] powerlevel10k: not present"; fi
  if block_exists "$ZSHRC_FILE" "$ZSH_MARK_START" "$ZSH_MARK_END"; then echo "[opsec] ~/.zshrc block: present"; else echo "[opsec] ~/.zshrc block: absent"; fi
  if block_exists "$STARSHIP_FILE" "$STARSHIP_MARK_START" "$STARSHIP_MARK_END"; then echo "[opsec] starship block: present"; else echo "[opsec] starship block: absent"; fi
  echo "[opsec] Current hostname: $(hostname)"
}

case "${1-}" in
  --install)
    install_persistent
    ;;
  --uninstall)
    uninstall_persistent
    ;;
  --session)
    apply_session
    ;;
  --status)
    status_report
    ;;
  *)
    cat <<USAGE
Usage:
  --install    Add a persistent zsh prompt override and starship config to hide hostname
  --uninstall  Remove the persistent changes
  --session    Apply in the current zsh session (must be sourced)
  --status     Print detection/status info

Examples:
  bash /Users/michaelchristopher/repos/ordPayCard/scripts/opsec-hide-hostname.sh --install
  source /Users/michaelchristopher/repos/ordPayCard/scripts/opsec-hide-hostname.sh --session
  bash /Users/michaelchristopher/repos/ordPayCard/scripts/opsec-hide-hostname.sh --status
USAGE
    ;;
esac


