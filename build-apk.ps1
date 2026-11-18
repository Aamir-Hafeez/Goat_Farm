param(
  [switch]$SkipSync
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$toolchain = Join-Path $env:LOCALAPPDATA 'GoatFarmToolchain'
$sdk = Join-Path $toolchain 'android-sdk'

$jdk = Get-ChildItem (Join-Path $toolchain 'jdk') -Directory -ErrorAction SilentlyContinue |
  Where-Object { Test-Path (Join-Path $_.FullName 'bin\java.exe') } |
  Select-Object -First 1

if (-not $jdk) {
  throw "JDK not found. Expected it under $toolchain\jdk."
}
if (-not (Test-Path (Join-Path $sdk 'platforms\android-36'))) {
  throw "Android SDK not found. Expected it under $sdk."
}

$env:JAVA_HOME = $jdk.FullName
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:Path = "$($jdk.FullName)\bin;$sdk\platform-tools;$sdk\cmdline-tools\latest\bin;$env:Path"

Push-Location (Join-Path $root 'frontend')
try {
  if (-not $SkipSync) {
    npm run mobile:sync
    if ($LASTEXITCODE -ne 0) { throw "Web build/sync failed." }
  }

  Push-Location 'android'
  try {
    & .\gradlew.bat assembleDebug --no-daemon --console=plain
    if ($LASTEXITCODE -ne 0) { throw "Gradle build failed." }
  }
  finally {
    Pop-Location
  }
}
finally {
  Pop-Location
}

$apk = Join-Path $root 'frontend\android\app\build\outputs\apk\debug\app-debug.apk'
if (-not (Test-Path $apk)) {
  throw "APK was not produced at $apk."
}

$output = Join-Path $root 'MyGoat-debug.apk'
Copy-Item $apk $output -Force
Write-Host ""
Write-Host "APK ready: $output" -ForegroundColor Green
