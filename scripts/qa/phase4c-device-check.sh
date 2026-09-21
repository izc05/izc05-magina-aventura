#!/usr/bin/env bash
set -euo pipefail

package_name="${1:-com.isivolt.maginaaventura.qa}"
apk_path="${2:-}"
timestamp="$(date +%Y%m%d-%H%M%S)"
evidence_root="${PHASE4C_EVIDENCE_DIR:-$PWD/phase4c-evidence-$timestamp}"

if ! command -v adb >/dev/null 2>&1; then
  echo "adb no está disponible. Instala Android Platform Tools y vuelve a ejecutar." >&2
  exit 1
fi

mkdir -p "$evidence_root"
mapfile -t devices < <(adb devices | awk 'NR > 1 && $2 == "device" { print $1 }')
if [[ ${#devices[@]} -eq 0 ]]; then
  echo "No hay un dispositivo Android autorizado. Comprueba cable, depuración USB y adb devices." >&2
  exit 1
fi

serial="${ANDROID_SERIAL:-${devices[0]}}"
adb_cmd=(adb -s "$serial")

{
  echo "captured_at=$(date -Iseconds)"
  echo "serial=$serial"
  echo "manufacturer=$(${adb_cmd[@]} shell getprop ro.product.manufacturer | tr -d '\r')"
  echo "model=$(${adb_cmd[@]} shell getprop ro.product.model | tr -d '\r')"
  echo "android=$(${adb_cmd[@]} shell getprop ro.build.version.release | tr -d '\r')"
  echo "security_patch=$(${adb_cmd[@]} shell getprop ro.build.version.security_patch | tr -d '\r')"
  echo "battery=$(${adb_cmd[@]} shell dumpsys battery | tr -d '\r' | grep -E 'level:|status:' | tr '\n' ';')"
  echo "package=$package_name"
  if [[ -n "$apk_path" ]]; then
    echo "apk=$apk_path"
    sha256sum "$apk_path"
  fi
} > "$evidence_root/device-and-build-info.txt"

"${adb_cmd[@]}" shell dumpsys package "$package_name" > "$evidence_root/package-info.txt" 2>&1 || true
"${adb_cmd[@]}" logcat -c
"${adb_cmd[@]}" logcat -v threadtime > "$evidence_root/phase4c-logcat-full.txt" 2>&1 &
logcat_pid=$!

cleanup() {
  if kill -0 "$logcat_pid" >/dev/null 2>&1; then
    kill "$logcat_pid" >/dev/null 2>&1 || true
    wait "$logcat_pid" 2>/dev/null || true
  fi
  "${adb_cmd[@]}" shell dumpsys activity activities > "$evidence_root/activity-dump.txt" 2>&1 || true
  echo "Evidencias guardadas en: $evidence_root"
}
trap cleanup EXIT INT TERM

"${adb_cmd[@]}" shell monkey -p "$package_name" 1 > "$evidence_root/launch.txt" 2>&1 || true
printf 'Capturando logcat. Ejecuta el protocolo Phase 4C; pulsa Ctrl+C cuando termines.\n'
while true; do sleep 60; done
