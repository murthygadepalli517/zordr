Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   Building Zordr Mobile APK" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$ProjectDir = "d:\PROJECTS\Zorder_project\zordr_Mobile_app"
$AndroidDir = "$ProjectDir\android"

# Check if android folder exists
if (-not (Test-Path $AndroidDir)) {
    Write-Host "Android folder not found. Running prebuild..." -ForegroundColor Yellow
    Set-Location $ProjectDir
    npx expo prebuild --platform android
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Prebuild failed!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Building APK..." -ForegroundColor Green
Set-Location $AndroidDir

# Clean previous builds
Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
.\gradlew.bat clean

# Build debug APK (faster, no signing required)
Write-Host "Building debug APK..." -ForegroundColor Yellow
.\gradlew.bat assembleDebug

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "   BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    
    $ApkPath = "$AndroidDir\app\build\outputs\apk\debug\app-debug.apk"
    if (Test-Path $ApkPath) {
        Write-Host "APK Location:" -ForegroundColor Cyan
        Write-Host $ApkPath -ForegroundColor White
        Write-Host ""
        
        # Get APK size
        $ApkSize = (Get-Item $ApkPath).Length / 1MB
        Write-Host "APK Size: $([math]::Round($ApkSize, 2)) MB" -ForegroundColor Yellow
        Write-Host ""
        
        # Open folder containing APK
        Write-Host "Opening APK folder..." -ForegroundColor Green
        explorer.exe (Split-Path $ApkPath)
    } else {
        Write-Host "APK file not found at expected location!" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Red
    Write-Host "   BUILD FAILED!" -ForegroundColor Red
    Write-Host "=====================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check the error messages above for details." -ForegroundColor Yellow
    exit 1
}
