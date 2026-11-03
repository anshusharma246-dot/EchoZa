$songsPath = Join-Path $PSScriptRoot "songs"
$outputPath = Join-Path $songsPath "library.json"
$coversPath = Join-Path $songsPath "covers"
$metadataPath = Join-Path $songsPath "song-metadata.json"

$overrides = @{}
if (Test-Path $metadataPath) {
    $metadata = Get-Content -Raw -Path $metadataPath | ConvertFrom-Json
    $metadata.PSObject.Properties | ForEach-Object {
        $overrides[$_.Name] = $_.Value
    }
}

function Convert-ToTitleCase([string]$value) {
    return ($value -split '-' | Where-Object { $_ -ne "" } | ForEach-Object {
        if ($_.Length -gt 1) {
            (Get-Culture).TextInfo.ToTitleCase($_)
        } else {
            $_.ToUpper()
        }
    }) -join ' '
}

function Get-CoverPath([string]$slug) {
    $extensions = @("jpg", "jpeg", "png", "webp")
    foreach ($extension in $extensions) {
        $coverFile = Join-Path $coversPath "$slug.$extension"
        if (Test-Path $coverFile) {
            return "./songs/covers/$slug.$extension"
        }
    }
    return $null
}

function Infer-Mood([string]$slug) {
    if ($slug -match '(love|lover|mil|ban|gale|night|soft|pehli|channa|kesariya|perfect|zara|tum|seoul|tu-hi-re|pyar)') {
        return "Soft"
    }
    if ($slug -match '(remix|goat|attention|summer|waves|bird|shape|shine|heat|dracula|starboy|zingaat)') {
        return "Pop"
    }
    return "Classic"
}

function Infer-Language([string]$slug) {
    if ($slug -match '(goat|born-to-shine|diljit|punjabi)') {
        return "Punjabi"
    }
    if ($slug -match '(sairat|zingaat|zaala|marathi)') {
        return "Marathi"
    }
    if ($slug -match '(attention|cruel-summer|heat-waves|lover|mockingbird|night-changes|perfect|shape-of-you|dracula-remix|seoul-city|starboy)') {
        return "English"
    }
    return "Hindi"
}

function Infer-Album([string]$mood, [string]$language) {
    if ($language -eq "Punjabi") {
        return "Punjabi Pulse"
    }
    if ($language -eq "Marathi") {
        return "M-Wood"
    }
    if ($language -eq "English" -and $mood -eq "Soft") {
        return "After Hours"
    }
    if ($language -eq "English") {
        return "Global Hits"
    }
    if ($mood -eq "Classic") {
        return "Old Is Gold"
    }
    if ($mood -eq "Soft") {
        return "Love Stories"
    }
    return "Fresh Uploads"
}

function Infer-Section([string]$mood, [string]$language) {
    if ($language -eq "Marathi") {
        return "M-Wood"
    }
    if ($mood -eq "Classic") {
        return "Old is gold"
    }
    if ($language -eq "English") {
        return "Global hits"
    }
    if ($mood -eq "Soft") {
        return "Late night soft"
    }
    return "Top picks"
}

$library = Get-ChildItem -Path $songsPath -Filter *.mp3 | Sort-Object Name | ForEach-Object {
    $slug = [System.IO.Path]::GetFileNameWithoutExtension($_.Name).ToLower()
    $override = $overrides[$slug]
    $cover = Get-CoverPath $slug
    $inferredMood = Infer-Mood $slug
    $inferredLanguage = Infer-Language $slug
    $inferredAlbum = Infer-Album $inferredMood $inferredLanguage
    $inferredSection = Infer-Section $inferredMood $inferredLanguage

    [PSCustomObject]@{
        id = $slug
        title = Convert-ToTitleCase $slug
        artist = if ($override) { $override.artist } else { "EchoZa Upload" }
        album = if ($override) { $override.album } else { $inferredAlbum }
        mood = if ($override) { $override.mood } else { $inferredMood }
        language = if ($override) { $override.language } else { $inferredLanguage }
        section = if ($override) { $override.section } else { $inferredSection }
        file = $_.Name
        src = "./songs/$($_.Name)"
        cover = $cover
    }
}

$library | ConvertTo-Json -Depth 3 | Set-Content -Path $outputPath -Encoding utf8
Write-Output "Generated $outputPath with $($library.Count) songs."
