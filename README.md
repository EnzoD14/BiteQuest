# BiteQuest 🚀 (Prototipo Piloto)

Aplicación MVP desarrollada para validación experimental (Proyecto Final de Ingeniería Informática).
El sistema evalúa el cumplimiento nutricional mediante gamificación basada en el modelo MERN.

## 📋 Stack Tecnológico
- **Frontend**: React Native, Expo, React Navigation, Axios.
- **Backend**: Node.js, Express, Bcrypt, JWT.
- **Base de Datos**: MongoDB.
- **Fundamentación Teórica**: SDT (Teoría de la Autodeterminación), Theory of Flow, FBM (Modelo de Fogg).

## 🔒 Privacidad y Ética (Ley 25.326 Argentina)
El proyecto usa bases de telemetría pasiva desconectadas de las credenciales de identificación personal. Las contraseñas están resguardadas mediante algoritmos Hash de un solo sentido (Bcrypt) y las métricas se envían bajo IDs ofuscados generados criptográficamente.

## ⚙️ Instrucciones para Defensa (Local)
Para ejecutar el experimento en una red local / máquina de evaluación:

1. Asegúrate de tener instalado `Node.js` y `MongoDB` ejecutándose en el puerto base (27017).
2. Ejecuta el script base desde la raíz del proyecto para importar datos mock y levantar ambos servicios:

```bash
bash start.sh
```

*(Alternativamente, puede iniciar `node server.js` en la carpeta `backend/` y `npx expo start` en `frontend/` en paneles separados).*

> [!NOTE]  
> En el emulador, asegúrate que las variables de API_URL dentro del Frontend (`api/client.js`) apunten a `http://10.0.2.2:5000/api` si usas Android Studio, o la IP local de tu máquina `http://<TU_IP>:5000/api` si usas Expo Go en teléfono físico.
