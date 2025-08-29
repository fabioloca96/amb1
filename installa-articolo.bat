@echo off
echo ========================================
echo INSTALLATORE AUTOMATICO ARTICOLO
echo "Porcini"
echo ========================================
echo.

REM Verifica se esiste la cartella data
if not exist "data" (
    echo ERRORE: Cartella 'data' non trovata!
    echo Assicurati di eseguire questo script nella root del tuo sito web.
    echo.
    pause
    exit /b 1
)

REM Crea la directory dell'articolo se non esiste
if not exist "data\porcini" (
    echo Creazione directory: data\porcini
    mkdir "data\porcini"
)

REM Copia i file dell'articolo
echo Copiando porcini.html...
copy "data\porcini\porcini.html" "data\porcini\" >nul
echo Copiando porcini.json...
copy "data\porcini\porcini.json" "data\porcini\" >nul

REM Aggiorna l'indice degli articoli
echo Aggiornando articles.json...
copy "data\articles.json" "data\" >nul

echo.
echo ✅ INSTALLAZIONE COMPLETATA!
echo.
echo L'articolo "Porcini" è stato installato con successo.
echo Directory creata: data\porcini
echo.

echo Premi un tasto per chiudere...
pause >nul