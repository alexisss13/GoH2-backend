// src/index.ts
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';

// Importar nuestras nuevas rutas
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import bebidaRoutes from './routes/bebida.routes';
import registroRoutes from './routes/registro.routes';
import objetivoRoutes from './routes/objetivo.routes';


// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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


app.use(cors());
app.use(express.json());

// --- Documentación (ReDoc) ---

// 1. Servir el archivo openapi.yaml
app.get('/api/docs/openapi.yaml', (req: Request, res: Response) => {
  res.sendFile(path.resolve(__dirname, '../openapi.yaml'));
});

// 2. Servir el HTML de ReDoc
app.get('/api/docs', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, './docs/redoc.html'));
});

// --- Rutas de API ---
app.use('/api/auth', authRoutes); // Rutas de autenticación
app.use('/api/perfil', userRoutes); // Rutas de perfil de usuario
app.use('/api/bebidas', bebidaRoutes); // Rutas de bebidas
app.use('/api/registros', registroRoutes); // Rutas de registros de consumo
app.use('/api/objetivo', objetivoRoutes); // Rutas de objetivo de hidratación

// Ruta de bienvenida (la movemos para que /api/docs funcione primero)
app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Bienvenido a la API de GoH2',
    documentacion: `http://localhost:${PORT}/api/docs`,
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Función principal para iniciar el servidor
async function main() {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(
        `📚 Documentación disponible en http://localhost:${PORT}/api/docs`,
      );
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error);
    process.exit(1);
  }
}

main();