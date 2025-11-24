// src/index.ts
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { apiLimiter } from './middleware/rateLimiter';

// Importar rutas
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import bebidaRoutes from './routes/bebida.routes';
import registroRoutes from './routes/registro.routes';
import objetivoRoutes from './routes/objetivo.routes';
import resumenRoutes from './routes/resumen.routes';
import configuracionRoutes from './routes/configuracion.routes';
import socialRoutes from './routes/social.routes';
import orderRoutes from './routes/order.routes'; // Importado correctamente

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);


const corsOptions = {
  // Permite el frontend definido en .env o todos (*) si es desarrollo
  origin: '*',
};

// --- 1. Middlewares Globales ---
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

// --- 2. Documentación (ReDoc) ---
app.get('/api/docs/openapi.yaml', (req: Request, res: Response) => {
  const yamlPath = path.join(__dirname, '../openapi.yaml');
  
  if (!fs.existsSync(yamlPath)) {
    console.error('❌ openapi.yaml no encontrado en:', yamlPath);
    return res.status(404).send('openapi.yaml no encontrado');
  }
  
  res.sendFile(yamlPath);
});

app.get('/api/docs', (req: Request, res: Response) => {
  const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>GoH2 API Docs</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet" />
    <style> body { margin: 0; padding: 0; } </style>
  </head>
  <body>
    <redoc spec-url="/api/docs/openapi.yaml"></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  </body>
</html>`;
  res.send(html);
});

// --- 3. Rutas de API ---
app.use('/api', apiLimiter); // Rate limiting global para /api

// Rutas de Usuario/Dashboard
app.use('/api/auth', authRoutes);
app.use('/api/perfil', userRoutes);
app.use('/api/bebidas', bebidaRoutes);
app.use('/api/registros', registroRoutes);
app.use('/api/objetivo', objetivoRoutes);
app.use('/api/resumen', resumenRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/social', socialRoutes);

// Ruta de E-commerce
app.use('/api/orders', orderRoutes); // La nueva ruta de pedidos

// Ruta base de bienvenida
app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Bienvenido a la API de GoH2',
    documentacion: `/api/docs`,
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// --- 4. Iniciar Servidor ---
async function main() {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      if (!process.env.FRONTEND_URL) {
        console.log(`📚 Documentación disponible en http://localhost:${PORT}/api/docs`);
      }
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error);
    process.exit(1);
  }
}

main();