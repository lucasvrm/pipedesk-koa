param(
  [string]$Message = "chore: apply AI changes"
)

Write-Host "== AI Commit Helper ==" -ForegroundColor Cyan

# 1) Checar se estamos na raiz do repositório (tem .git)
if (-not (Test-Path ".git")) {
  Write-Host "Erro: este script deve ser executado na raiz do repositório (onde existe a pasta .git)." -ForegroundColor Red
  exit 1
}

# 2) Mostrar status atual
Write-Host "`n--- git status ---" -ForegroundColor Yellow
git status

# 3) Confirmar que o usuário quer continuar
$confirm = Read-Host "`nContinuar com commit e push? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
  Write-Host "Operação cancelada." -ForegroundColor DarkYellow
  exit 0
}

# 4) Perguntar se roda testes antes
$runTests = Read-Host "Rodar 'npm test' antes do commit? (y/N)"
if ($runTests -eq "y" -or $runTests -eq "Y") {
  Write-Host "`nExecutando 'npm test'..." -ForegroundColor Cyan
  npm test

  if ($LASTEXITCODE -ne 0) {
    Write-Host "`n'npm test' falhou (exit code $LASTEXITCODE)." -ForegroundColor Red
    $continueAfterFail = Read-Host "Deseja continuar mesmo assim com commit e push? (y/N)"
    if ($continueAfterFail -ne "y" -and $continueAfterFail -ne "Y") {
      Write-Host "Operação cancelada por falha nos testes." -ForegroundColor DarkYellow
      exit 1
    }
  } else {
    Write-Host "'npm test' finalizado com sucesso." -ForegroundColor Green
  }
} else {
  Write-Host "Pulando etapa de testes." -ForegroundColor DarkYellow
}

# 5) Perguntar se quer customizar mensagem de commit
$customMsg = Read-Host "Deseja informar uma mensagem de commit customizada? (enter para usar padrão)"
if ($customMsg -ne "") {
  $Message = $customMsg
}

Write-Host "`nAdicionando arquivos modificados..." -ForegroundColor Cyan
git add -A

# 6) Verificar se há algo para commitar
$diffExitCode = 0
git diff --cached --quiet
$diffExitCode = $LASTEXITCODE

if ($diffExitCode -eq 0) {
  Write-Host "Nenhuma alteração staged para commit. Nada a fazer." -ForegroundColor DarkYellow
  exit 0
}

Write-Host "Realizando commit com mensagem: '$Message'" -ForegroundColor Cyan
git commit -m "$Message"

if ($LASTEXITCODE -ne 0) {
  Write-Host "Erro ao fazer commit. Abortando antes do push." -ForegroundColor Red
  exit 1
}

# 7) Determinar branch atual
$currentBranch = git rev-parse --abbrev-ref HEAD
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($currentBranch)) {
  Write-Host "Não foi possível determinar a branch atual. Não será feito push automático." -ForegroundColor Red
  exit 1
}

Write-Host "`nEnviando para o remoto (git push origin $currentBranch)..." -ForegroundColor Cyan
git push origin $currentBranch

if ($LASTEXITCODE -ne 0) {
  Write-Host "Erro ao enviar alterações para o remoto." -ForegroundColor Red
  exit 1
}

Write-Host "`nTudo certo! Alterações enviadas para o repositório remoto." -ForegroundColor Green
