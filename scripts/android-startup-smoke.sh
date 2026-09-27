#!/usr/bin/env bash
# Real-device-style smoke test for the QA standalone APK.
# The script intentionally fails on startup crashes; it does not mask them.
set -euo pipefail

apk_path="${1:?APK path is required}"
evidence_dir="${2:-artifacts/startup-smoke}"
package_name="${3:-com.isivolt.maginaaventura.qa}"
timeout_seconds="${STARTUP_TIMEOUT_SECONDS:-90}"
logcat_file="$evidence_dir/startup-smoke-logcat.txt"
result_file="$evidence_dir/startup-smoke-result.txt"
screenshot_file="$evidence_dir/startup-smoke-first-screen.png"
launch_file="$evidence_dir/startup-smoke-launch.txt"

mkdir -p "$evidence_dir"
: > "$logcat_file"
: > "$result_file"

status=1
last_phase="none"
activity="unknown"
logcat_pid=""

write_result() {
  local final_status="$1"
  {
    echo "status=$final_status"
    echo "package=$package_name"
    echo "activity=$activity"
    echo "apk=$apk_path"
    echo "last_phase=$last_phase"
    echo "timestamp_utc=$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
  } > "$result_file"
}

cleanup() {
  local exit_status=$?
  if [[ -n "$logcat_pid" ]]; then
    kill "$logcat_pid" >/dev/null 2>&1 || true
    wait "$logcat_pid" >/dev/null 2>&1 || true
  fi
  adb logcat -d -v threadtime > "$logcat_file" 2>/dev/null || true
  adb exec-out screencap -p > "$screenshot_file" 2>/dev/null || true
  last_phase="$(grep -oE '\[STARTUP\]\[[^]]+\]' "$logcat_file" | tail -1 | sed -E 's/.*\[([^]]+)\]$/\1/' || true)"
  [[ -n "$last_phase" ]] || last_phase="none"
  write_result "$exit_status"
  exit "$exit_status"
}
trap cleanup EXIT

if [[ ! -s "$apk_path" ]]; then
  echo "APK missing or empty: $apk_path" >&2
  exit 1
fi

adb wait-for-device
adb install -r -t "$apk_path"
adb shell am force-stop "$package_name" >/dev/null 2>&1 || true
adb logcat -c
adb logcat -v threadtime > "$logcat_file" 2>&1 &
logcat_pid=$!

# native-start is emitted by the deterministic launch harness before Android
# starts the activity. All app breadcrumbs are emitted by QA/dev JS only.
adb shell log -t MaginaAventuraQA '[STARTUP][native-start]' >/dev/null 2>&1 || true
activity="$(adb shell cmd package resolve-activity --brief "$package_name" | tr -d '\r' | tail -1)"
if [[ -z "$activity" || "$activity" == "No activity found" ]]; then
  echo "Unable to resolve launch activity for $package_name" >&2
  exit 1
fi

adb shell am force-stop "$package_name"
adb shell am start -W -n "$activity" | tee "$launch_file"

for second in $(seq 1 "$timeout_seconds"); do
  sleep 1
  current_log="$(adb logcat -d -v threadtime 2>/dev/null || true)"

  if grep -Eqi 'FATAL EXCEPTION|AndroidRuntime:.*(FATAL EXCEPTION|Process:)|ReactNativeJS:.*(Fatal|TypeError|ReferenceError|Invariant Violation|Unhandled|Cannot find native module)|Hermes:.*(Fatal|Error)|SIGABRT|SIGSEGV|UnsatisfiedLinkError|NoClassDefFoundError|ClassNotFoundException' <<<"$current_log"; then
    echo "Fatal startup signature detected at ${second}s." >&2
    exit 1
  fi

  if ! adb shell pidof "$package_name" >/dev/null 2>&1; then
    echo "Application process exited before leaving splash at ${second}s." >&2
    exit 1
  fi

  if grep -Eq '\[STARTUP\]\[(home-mounted|onboarding-mounted)\]' <<<"$current_log"; then
    adb exec-out screencap -p > "$screenshot_file" 2>/dev/null || true
    echo "Startup smoke passed: process alive and first screen mounted at ${second}s."
    status=0
    exit 0
  fi
done

echo "Startup timed out after ${timeout_seconds}s without home-mounted or onboarding-mounted." >&2
exit 1
