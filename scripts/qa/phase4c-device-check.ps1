param(
  [string]$PackageName = 'com.isivolt.maginaaventura.qa',
  [string]$ApkPath = '',
  [string]$Serial = '',
  [string]$EvidenceRoot = ''
)

$ErrorActionPreference = 'Stop'
$adb = (Get-Command adb -ErrorAction Stop).Source

$devices = & $adb devices | Select-String "\tdevice$" | ForEach-Object { ($_ -split "\s+")[0] }
if ([string]::IsNullOrWhiteSpace($Serial)) {
  if ($devices.Count -eq 0) {
    throw 'No hay un dispositivo Android autorizado. Comprueba cable, depuración USB y adb devices.'
  }
  $Serial = $devices[0]
}

if ([string]::IsNullOrWhiteSpace($EvidenceRoot)) {
  $EvidenceRoot = Join-Path (Get-Location) ('phase4c-evidence-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
}
New-Item -ItemType Directory -Path $EvidenceRoot -Force | Out-Null

$adbArgs = @('-s', $Serial)
function Invoke-AdbText([string[]]$Arguments) {
  return (& $adb @adbArgs @Arguments | Out-String).Trim()
}

$infoPath = Join-Path $EvidenceRoot 'device-and-build-info.txt'
$info = @(
  "captured_at=$(Get-Date -Format o)",
  "serial=$Serial",
  "manufacturer=$(Invoke-AdbText @('shell', 'getprop', 'ro.product.manufacturer'))",
  "model=$(Invoke-AdbText @('shell', 'getprop', 'ro.product.model'))",
  "android=$(Invoke-AdbText @('shell', 'getprop', 'ro.build.version.release'))",
  "security_patch=$(Invoke-AdbText @('shell', 'getprop', 'ro.build.version.security_patch'))",
  "battery=$(Invoke-AdbText @('shell', 'dumpsys', 'battery') -replace "`r?`n", ';')",
  "package=$PackageName"
)
if (-not [string]::IsNullOrWhiteSpace($ApkPath)) {
  $info += "apk=$ApkPath"
  $info += (Get-FileHash -Path $ApkPath -Algorithm SHA256 | Format-List | Out-String).Trim()
}
$info | Set-Content -Path $infoPath -Encoding utf8

& $adb @adbArgs shell dumpsys package $PackageName *> (Join-Path $EvidenceRoot 'package-info.txt')
& $adb @adbArgs logcat -c
$logPath = Join-Path $EvidenceRoot 'phase4c-logcat-full.txt'
$logErrPath = Join-Path $EvidenceRoot 'phase4c-logcat-stderr.txt'
$logProcess = Start-Process -FilePath $adb -ArgumentList @('-s', $Serial, 'logcat', '-v', 'threadtime') -RedirectStandardOutput $logPath -RedirectStandardError $logErrPath -PassThru -NoNewWindow

try {
  & $adb @adbArgs shell monkey -p $PackageName 1 *> (Join-Path $EvidenceRoot 'launch.txt')
  Write-Host "Capturando logcat en $logPath"
  Read-Host 'Ejecuta el protocolo Phase 4C y pulsa Enter al terminar'
}
finally {
  if (-not $logProcess.HasExited) { Stop-Process -Id $logProcess.Id -Force }
  & $adb @adbArgs shell dumpsys activity activities *> (Join-Path $EvidenceRoot 'activity-dump.txt')
  Write-Host "Evidencias guardadas en: $EvidenceRoot"
}
