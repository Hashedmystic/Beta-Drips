#!/usr/bin/env bash
# Builds a standalone signed APK locally; never installs, publishes or deletes data.
set -euo pipefail
_beta_release_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
source "$_beta_release_root/mobile/android-env.sh"
_beta_signing_env="${BETADRIPS_SIGNING_ENV:-${XDG_DATA_HOME:-$HOME/.local/share}/beta-drips/signing/signing.env}"
if [[ ! -f "$_beta_signing_env" ]]; then
  echo 'Private signing.env is missing. See mobile/RELEASE.md.' >&2
  exit 1
fi
# This is a trusted private local file, containing only signing exports.
source "$_beta_signing_env"
cd "$_beta_release_root/mobile"
node scripts/build-release.mjs
