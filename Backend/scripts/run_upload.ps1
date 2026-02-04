# Script de prueba E2E: sube los PDFs al backend y muestra respuestas
param(
  [string]$ApiBase = 'http://localhost:3000',
  [string]$ProgramPdf = '',
  [string]$ProjectPdf = ''
)

Write-Host 'API base:' $ApiBase

function Upload-PDF($url, $filePath) {
  Write-Host "\n--- Subiendo -> $url" -ForegroundColor Cyan
  Write-Host "Archivo: $filePath"

  if (!(Test-Path $filePath)) {
    Write-Host "ERROR: no existe el archivo $filePath" -ForegroundColor Red
    return $null
  }

  try {
    $form = @{ pdf = Get-Item $filePath }
    try {
      # Intentar método moderno (PowerShell 6+)
      $resp = Invoke-RestMethod -Uri $url -Method Post -Form $form -ErrorAction Stop
      Write-Host "Respuesta:" -ForegroundColor Green
      $resp | ConvertTo-Json -Depth 5 | Write-Host
      return $resp
    } catch {
      Write-Host "Invocación con -Form falló, intentando fallback con curl.exe..." -ForegroundColor Yellow
      # Fallback a curl.exe (Windows). Construir argumentos para -F
      $curl = 'curl.exe'
      if (-not (Get-Command $curl -ErrorAction SilentlyContinue)) {
        throw "curl.exe no encontrado en PATH y Invoke-RestMethod -Form falló. Actualiza PowerShell o instala curl. Error original: $_"
      }

      # Escapar comillas en la ruta
      $fileArg = "pdf=@`"$filePath`""
      $args = @('-sS','-X','POST',$url,'-F',$fileArg)
      $procInfo = & $curl @args 2>&1
      if ($LASTEXITCODE -ne 0) {
        throw "curl.exe falló: $procInfo"
      }
      Write-Host "Respuesta (curl):" -ForegroundColor Green
      $procInfo | Write-Host
      return $procInfo
    }
  } catch {
    Write-Host "ERROR al subir: $_" -ForegroundColor Red
    return $null
  }
}

# Endpoints
$uploadProgramUrl = "$ApiBase/api/pdf/upload"
$uploadProjectUrl = "$ApiBase/api/pdf/upload-project"

# 1) Subir programa
# Si no se pasó ruta, intentar localizar los PDFs en la carpeta python
if ([string]::IsNullOrWhiteSpace($ProgramPdf)) {
  $found = Get-ChildItem -Path (Join-Path $PSScriptRoot '..\python') -Filter 'Programa_*.pdf' -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($found) { $ProgramPdf = $found.FullName } else { Write-Host 'No se encontró PDF de programa en ../python; por favor pásalo como parámetro.' -ForegroundColor Yellow }
}

$resp1 = Upload-PDF -url $uploadProgramUrl -filePath $ProgramPdf

# Esperar un par de segundos para que el backend procese
Start-Sleep -Seconds 2

# 2) Subir proyecto
$resp2_path = $ProjectPdf
if ([string]::IsNullOrWhiteSpace($resp2_path)) {
  $foundP = Get-ChildItem -Path (Join-Path $PSScriptRoot '..\python') -Filter '*2537295*.pdf' -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $foundP) {
    # fallback por nombre parcial
    $foundP = Get-ChildItem -Path (Join-Path $PSScriptRoot '..\python') -Filter 'Proyecto Formativo*.pdf' -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
  }
  if ($foundP) { $resp2_path = $foundP.FullName } else { Write-Host 'No se encontró PDF de proyecto en ../python; por favor pásalo como parámetro.' -ForegroundColor Yellow }
}

$resp2 = Upload-PDF -url $uploadProjectUrl -filePath $resp2_path

Write-Host "`n--- FIN de la prueba E2E" -ForegroundColor Yellow

# Mostrar recomendaciones para verificar DB
Write-Host "`nDespués de ejecutar, comprueba la tabla 'extraction_raw' y las tablas relacionadas en la BD." -ForegroundColor White
Write-Host 'Ejemplo (mysql):' -ForegroundColor Gray
Write-Host "  mysql -u tu_usuario -p -e 'USE alistamiento; SELECT id_raw, tipo, source_file, created_at FROM extraction_raw ORDER BY id_raw DESC LIMIT 5;'" -ForegroundColor Gray
