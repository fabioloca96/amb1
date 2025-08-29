#!/bin/bash

echo "========================================"
echo "INSTALLATORE AUTOMATICO ARTICOLO"
echo "Porcini"
echo "========================================"
echo

# Verifica se esiste la cartella data
if [ ! -d "data" ]; then
    echo "❌ ERRORE: Cartella 'data' non trovata!"
    echo "Assicurati di eseguire questo script nella root del tuo sito web."
    echo
    read -p "Premi ENTER per chiudere..."
    exit 1
fi

# Crea la directory dell'articolo se non esiste
if [ ! -d "data/porcini" ]; then
    echo "📁 Creazione directory: data/porcini"
    mkdir -p "data/porcini"
fi

# Copia i file dell'articolo
echo "📄 Copiando porcini.html..."
cp "data/porcini/porcini.html" "data/porcini/"
echo "📄 Copiando porcini.json..."
cp "data/porcini/porcini.json" "data/porcini/"

# Aggiorna l'indice degli articoli
echo "📋 Aggiornando articles.json..."
cp "data/articles.json" "data/"

echo
echo "✅ INSTALLAZIONE COMPLETATA!"
echo
echo "L'articolo 'Porcini' è stato installato con successo."
echo "Directory creata: data/porcini"
echo

read -p "Premi ENTER per chiudere..."