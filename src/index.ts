// src/index.ts
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { apiLimiter } from './middleware/rateLimiter';

// Importar nuestras nuevas rutas
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import bebidaRoutes from './routes/bebida.routes';
import registroRoutes from './routes/registro.routes';
import objetivoRoutes from './routes/objetivo.routes';
import resumenRoutes from './routes/resumen.routes';
import configuracionRoutes from './routes/configuracion.routes';
import socialRoutes from './routes/social.routes';


// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  // Si estamos en producción, solo permite el origen del frontend
  // Si estamos en desarrollo (FRONTEND_URL no está), permite cualquiera (para pruebas locales)
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL : '*',
};

// Middlewares de seguridad básicos
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "https://cdn.redoc.ly", "blob:"],
        "worker-src": ["'self'", "blob:"],
        "connect-src": ["'self'", "https://cdn.redoc.ly"],
        "img-src": ["'self'", "data:", "https://cdn.redoc.ly"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
      },
    },
  }),
);
app.use(cors(corsOptions));
app.use(express.json());

// --- Documentación (ReDoc) ---

// 1. Servir el archivo openapi.yaml
app.get('/api/docs/openapi.yaml', (req: Request, res: Response) => {
  const yamlPath = path.join(__dirname, '../openapi.yaml');
  
  // Debug para ver si el archivo existe
  if (!fs.existsSync(yamlPath)) {
    console.error('❌ openapi.yaml no encontrado en:', yamlPath);
    console.log('📁 Archivos en __dirname:', fs.readdirSync(__dirname));
    return res.status(404).send('openapi.yaml no encontrado');
  }
  
  res.sendFile(yamlPath);
});

// 2. Servir el HTML de ReDoc
app.get('/api/docs', (req: Request, res: Response) => {
  const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>GoH2 API Docs</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link
      href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700"
      rel="stylesheet"
    />
    <style>
      body {
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <redoc spec-url="/api/docs/openapi.yaml"></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  </body>
</html>
  `;
  res.send(html);
});

// --- Rutas de API ---
// Aplicamos el limitador general a TODAS las rutas /api
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes); // Rutas de autenticación
app.use('/api/perfil', userRoutes); // Rutas de perfil de usuario
app.use('/api/bebidas', bebidaRoutes); // Rutas de bebidas
app.use('/api/registros', registroRoutes); // Rutas de registros de consumo
app.use('/api/objetivo', objetivoRoutes); // Rutas de objetivo de hidratación
app.use('/api/resumen', resumenRoutes); // Rutas de resumen diario
app.use('/api/configuracion', configuracionRoutes); //Ruta de configuraciones
app.use('/api/social', socialRoutes); //Ruta de la pestaña social

// Ruta de bienvenida (la movemos para que /api/docs funcione primero)
app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Bienvenido a la API de GoH2',
    documentacion: `/api/docs`,
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Función principal para iniciar el servidor
async function main() {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    if (!process.env.FRONTEND_URL) {
        console.log(
          `📚 Documentación disponible en http://localhost:${PORT}/api/docs`,
        );
      }
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error);
    process.exit(1);
  }
}

main();