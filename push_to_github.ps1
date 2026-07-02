# ============================================================
# Mindoct GitHub Push Script (uses GitHub REST API - no git needed)
# ============================================================
# INSTRUCTIONS:
# 1. Go to https://github.com/settings/tokens/new
# 2. Create a token with "repo" scope checked
# 3. Paste your token below between the quotes
# 4. Run this script in PowerShell
# ============================================================

$GITHUB_TOKEN = "YOUR_GITHUB_PAT_HERE"   # <-- Replace with your token
$REPO_OWNER   = "contactpartha96"
$REPO_NAME    = "Mindoct"
$BRANCH       = "main"

# Base API URL
$API_BASE = "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/contents"

# Headers
$headers = @{
    "Authorization" = "Bearer $GITHUB_TOKEN"
    "Accept"        = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

function Push-File {
    param(
        [string]$localPath,
        [string]$repoPath,
        [string]$commitMessage
    )

    Write-Host "`n📤 Uploading: $repoPath" -ForegroundColor Cyan

    # Read file bytes and encode to Base64
    $fileBytes   = [System.IO.File]::ReadAllBytes($localPath)
    $fileContent = [Convert]::ToBase64String($fileBytes)

    # Get current SHA (needed to update existing file)
    $url = "$API_BASE/$repoPath`?ref=$BRANCH"
    try {
        $existing = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
        $sha = $existing.sha
        Write-Host "   Found existing file (SHA: $($sha.Substring(0,7))...)" -ForegroundColor Yellow
    } catch {
        $sha = $null
        Write-Host "   File not found on GitHub - will create new." -ForegroundColor Yellow
    }

    # Build request body
    $body = @{
        message = $commitMessage
        content = $fileContent
        branch  = $BRANCH
    }
    if ($sha) { $body.sha = $sha }

    $bodyJson = $body | ConvertTo-Json -Depth 3

    # Push file via PUT
    try {
        $result = Invoke-RestMethod -Uri "$API_BASE/$repoPath" -Headers $headers -Method Put -Body $bodyJson -ContentType "application/json"
        Write-Host "   ✅ SUCCESS: $repoPath committed!" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ ERROR pushing $repoPath`: $_" -ForegroundColor Red
    }
}

# ============================================================
# Push all 4 files
# ============================================================

if ($GITHUB_TOKEN -eq "YOUR_GITHUB_PAT_HERE") {
    Write-Host "`n❌ ERROR: Please set your GitHub Personal Access Token in the script!" -ForegroundColor Red
    Write-Host "   Go to: https://github.com/settings/tokens/new" -ForegroundColor Yellow
    Write-Host "   Create token with 'repo' scope, then paste it into the script." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n🚀 Mindoct GitHub Push Script" -ForegroundColor Magenta
Write-Host "   Repository: $REPO_OWNER/$REPO_NAME ($BRANCH)" -ForegroundColor Gray
Write-Host "   Pushing 4 updated source files..." -ForegroundColor Gray

Push-File `
    -localPath "C:\Users\Learner\Mindoct\src\store\index.js" `
    -repoPath  "src/store/index.js" `
    -commitMessage "feat: Add AI doctor selection and updated store with doctors state"

Push-File `
    -localPath "C:\Users\Learner\Mindoct\src\screens\HomeScreen.js" `
    -repoPath  "src/screens/HomeScreen.js" `
    -commitMessage "feat: Add AI Doctor Portal selector, consultation room, and live webinar buttons"

Push-File `
    -localPath "C:\Users\Learner\Mindoct\src\screens\ConsultationScreen.js" `
    -repoPath  "src/screens/ConsultationScreen.js" `
    -commitMessage "feat: Multi-mode consultation room (Video/Voice/Chat) with live webinar support"

Push-File `
    -localPath "C:\Users\Learner\Mindoct\src\screens\ChatScreen.js" `
    -repoPath  "src/screens/ChatScreen.js" `
    -commitMessage "fix: Chat screen layout with flex FlatList and keyboard avoidance fix"

Write-Host "`n🎉 Done! Check your Netlify site in 1-2 minutes for the updated deployment." -ForegroundColor Green
Write-Host "   Netlify URL: https://resilient-cassata-88bc17.netlify.app/" -ForegroundColor Cyan
