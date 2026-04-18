
$src = "C:\Users\machine3\.gemini\antigravity\brain\b2a46b3f-999e-4632-8b09-08f21abe8ec5\ponte_jk_white_clean_1776464141510.png"
$dest = "c:\Users\machine3\feiraodaorcagit\public\assets\ponte_jk.png"
if (Test-Path $src) {
    Copy-Item $src $dest -Force
    Write-Host "Success: Bridge asset copied to $dest"
} else {
    Write-Error "Source file not found: $src"
}
