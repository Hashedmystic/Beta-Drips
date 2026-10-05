# Source this file from Bash: source mobile/android-env.sh
# Changes apply only to the current terminal; existing shell settings stay intact.
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  echo 'Source this script instead of executing it: source mobile/android-env.sh' >&2
  exit 1
fi

_beta_drips_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
if ! command -v nvm >/dev/null 2>&1; then
  if [[ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]]; then
    source "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
  else
    echo 'nvm is missing; install or configure it before sourcing this file.' >&2
    unset _beta_drips_root
    return 1
  fi
fi
nvm use "$(cat "$_beta_drips_root/.nvmrc")" || { unset _beta_drips_root; return 1; }
# Honour configured installations; these user-relative defaults match our CLI setup.
export JAVA_HOME="${JAVA_HOME:-$HOME/.local/share/beta-drips/jdk-17}"
export ANDROID_HOME="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}}"
# Keep the deprecated alias consistent for tools that still read it.
export ANDROID_SDK_ROOT="$ANDROID_HOME"
for _beta_drips_bin in "$JAVA_HOME/bin" "$ANDROID_HOME/cmdline-tools/latest/bin" "$ANDROID_HOME/platform-tools"; do
  case ":$PATH:" in
    *":$_beta_drips_bin:"*) ;;
    *) export PATH="$_beta_drips_bin:$PATH" ;;
  esac
done
unset _beta_drips_bin _beta_drips_root
