# ============================================================
#  deploy.ps1 — Publica o site Fisioatual em www.fisioatual.com.br
#  Uso: clique direito → "Executar com PowerShell"
#       ou no terminal:  .\deploy.ps1
# ============================================================

$FTP_HOST = "ftp.fisioatual.com.br"
$FTP_USER = "fisioatual"
$FTP_PASS = "Sucesso`$2026"
$LOCAL_ROOT = $PSScriptRoot   # pasta onde este script está salvo

$cred = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)

# ── Helpers ──────────────────────────────────────────────────

function Ftp-MkDir($path) {
    try {
        $r = [System.Net.FtpWebRequest]::Create("ftp://$FTP_HOST/$path")
        $r.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $r.Credentials = $cred; $r.UsePassive = $true
        $r.GetResponse().Close()
    } catch {}   # ignora se pasta já existe
}

function Ftp-Upload($localPath, $remotePath) {
    # codifica espaços e acentos na URL
    $encoded = ($remotePath -replace ' ','%20') `
                            -replace 'ç','%C3%A7' `
                            -replace 'é','%C3%A9' `
                            -replace 'ã','%C3%A3' `
                            -replace 'â','%C3%A2' `
                            -replace 'ô','%C3%B4' `
                            -replace 'á','%C3%A1' `
                            -replace 'í','%C3%AD' `
                            -replace 'ó','%C3%B3' `
                            -replace 'ú','%C3%BA' `
                            -replace 'ê','%C3%AA' `
                            -replace 'à','%C3%A0'
    $uri = New-Object System.Uri("ftp://$FTP_HOST/$encoded")
    $r = [System.Net.FtpWebRequest]::Create($uri)
    $r.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $r.Credentials = $cred; $r.UsePassive = $true
    $r.UseBinary = $true; $r.KeepAlive = $false
    $fs = [System.IO.File]::OpenRead($localPath)
    $r.ContentLength = $fs.Length
    $ws = $r.GetRequestStream()
    $buf = New-Object byte[] 65536
    while (($n = $fs.Read($buf, 0, $buf.Length)) -gt 0) { $ws.Write($buf, 0, $n) }
    $fs.Close(); $ws.Close()
    $r.GetResponse().Close()
}

# ── Arquivos a publicar ───────────────────────────────────────
# Para adicionar um arquivo novo: copie uma linha e ajuste o caminho.

$FILES = @(
    "index.html",
    "og-image.jpg",
    # Fotos produto
    "_knowledge/fotos/produto/20230824_125510.jpg",
    "_knowledge/fotos/produto/2patente2_t.png",
    "_knowledge/fotos/produto/3patente1_t.png",
    "_knowledge/fotos/produto/APAE37 - Copia.jpg",
    "_knowledge/fotos/produto/cabeçalho_semi.jpg",
    "_knowledge/fotos/produto/CP_11.jpg",
    "_knowledge/fotos/produto/Emerson_APAE.png",
    "_knowledge/fotos/produto/Equo_LETEFE.png",
    "_knowledge/fotos/produto/Globonews.png",
    "_knowledge/fotos/produto/matéria_record.jpg",
    "_knowledge/fotos/produto/reab_MMSS.png",
    "_knowledge/fotos/produto/RecordTV.jpeg",
    "_knowledge/fotos/produto/SESC RP12.jpg",
    "_knowledge/fotos/produto/Tokyo_2025.png",
    # Identidade visual
    "_knowledge/identidade-visual/FisioAtual1.png",
    "_knowledge/identidade-visual/FisioAtual2.png",
    # Logos
    "_knowledge/logos/abstartup.png",
    "_knowledge/logos/auspin.png",
    "_knowledge/logos/banner-evento.png",
    "_knowledge/logos/botreab1.png",
    "_knowledge/logos/campuspartybrasil2014logo.png",
    "_knowledge/logos/cobrafin.jpeg",
    "_knowledge/logos/conference_regional.png",
    "_knowledge/logos/Congress_USP.png",
    "_knowledge/logos/DNAUSP).png",
    "_knowledge/logos/dubai.png",
    "_knowledge/logos/Globonews_logo.png",
    "_knowledge/logos/health.png",
    "_knowledge/logos/i-corps.png",
    "_knowledge/logos/INPI.png",
    "_knowledge/logos/LIETEC UFSCar.png",
    "_knowledge/logos/logo fapesp.png",
    "_knowledge/logos/logo folha.png",
    "_knowledge/logos/Logo HB.png",
    "_knowledge/logos/logo HC.png",
    "_knowledge/logos/logo_APAE.png",
    "_knowledge/logos/logo_famerp_2016_3__3_-removebg-preview.png",
    "_knowledge/logos/logo_harena.png",
    "_knowledge/logos/logo_ISVR.png",
    "_knowledge/logos/logo_LEFIGE-removebg-preview.png",
    "_knowledge/logos/LOGO_medusp.png",
    "_knowledge/logos/logo_record.png",
    "_knowledge/logos/logomakerday.jpg",
    "_knowledge/logos/logo-pipe-m23_u7_16112020180056.png",
    "_knowledge/logos/LogoUFSCar.png",
    "_knowledge/logos/Logo-USP-300x161-removebg-preview.png",
    "_knowledge/logos/logo-vertical-300x213.png",
    "_knowledge/logos/mackenzie.png",
    "_knowledge/logos/NTT).png",
    "_knowledge/logos/ODS_10.png",
    "_knowledge/logos/ODS_3.png",
    "_knowledge/logos/ODS11.png",
    "_knowledge/logos/physio-logo.png",
    "_knowledge/logos/RV_logo.png",
    "_knowledge/logos/semanainclusiva.jfif",
    "_knowledge/logos/Semec.jpeg",
    "_knowledge/logos/tokyo_2025.png",
    "_knowledge/logos/unisinos.png",
    "_knowledge/logos/VR week.png",
    "_knowledge/logos/WIPO-Logo-470x189.png",
    "_knowledge/logos/X-reality.png",
    "_knowledge/logos/XXV Cong. Bras. Med. Fisica banner.jpg",
    "_knowledge/logos/XXVII_CBMFR1.jpg",
    # Vídeo
    "_knowledge/videos/globe-slow.mp4",
    "_knowledge/videos/globe-slow.webm"
)

# ── Execução ──────────────────────────────────────────────────

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Deploy Fisioatual → www.fisioatual.com.br" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Criar pastas remotas
$DIRS = @(
    "_knowledge",
    "_knowledge/fotos",
    "_knowledge/fotos/produto",
    "_knowledge/identidade-visual",
    "_knowledge/logos",
    "_knowledge/videos"
)
Write-Host "Criando pastas remotas..." -ForegroundColor Gray
foreach ($d in $DIRS) { Ftp-MkDir $d }

# Upload dos arquivos
$ok = 0; $skip = 0; $fail = 0; $total = $FILES.Count
Write-Host "Enviando $total arquivos...`n" -ForegroundColor Gray

foreach ($f in $FILES) {
    $localPath = Join-Path $LOCAL_ROOT ($f -replace '/','\\')
    if (-not (Test-Path $localPath)) {
        Write-Host "  SKIP  $f" -ForegroundColor DarkYellow
        $skip++
        continue
    }
    try {
        $size = [math]::Round((Get-Item $localPath).Length / 1KB, 0)
        Write-Host "  UP    $f  (${size} KB)" -ForegroundColor Gray
        Ftp-Upload $localPath $f
        $ok++
    } catch {
        Write-Host "  ERRO  $f`n         $_" -ForegroundColor Red
        $fail++
    }
}

# Resultado
Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
if ($fail -eq 0) {
    Write-Host "  OK: $ok enviados  |  $skip ignorados" -ForegroundColor Green
    Write-Host "  Site no ar: https://www.fisioatual.com.br" -ForegroundColor Green
} else {
    Write-Host "  OK: $ok  |  SKIP: $skip  |  ERRO: $fail" -ForegroundColor Yellow
    Write-Host "  Verifique os erros acima." -ForegroundColor Yellow
}
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pressione Enter para fechar..."
Read-Host
