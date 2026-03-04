#!/bin/bash
# Script generico para inicializar MVP (Windows Git Bash / Linux / Mac)

echo "🚀 Iniciando Entorno MVP BiteQuest..."

echo "1. Preparando base de datos mock..."
cd backend
npm install
npm run seed || node scripts/seed.js

echo "2. Iniciando Backend Server (Puerto 5000)..."
# Ejecutamos backend en background o subshell
node server.js &
BACKEND_PID=$!

echo "3. Iniciando Cliente React Native (Expo)..."
cd ../frontend
npm install
npx expo start

# Al cerrar expo, matar backend
kill $BACKEND_PID
echo "✅ MVP Apagado."
