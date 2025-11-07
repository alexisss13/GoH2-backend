# GoH2 API Backend 💧

Backend oficial de la aplicación **GoH2**, una plataforma para el seguimiento de hidratación, cálculo inteligente de objetivos y funcionalidades sociales entre usuarios.

La API está construida con **Node.js**, **Express**, **TypeScript**, y utiliza **Prisma** como ORM conectado a una base de datos **PostgreSQL**.

**API en Producción:**  
https://goh2-backend.onrender.com/api

---

## 🚀 Características Principales

- **Autenticación JWT**: Registro, login y flujo completo de recuperación de contraseña.
- **Gestión de Perfil Biométrico**: Peso, altura, edad, género, cálculo de hidratación adaptativo.
- **Cálculo Inteligente de Objetivo Diario**  
  - Fórmula Mifflin-St Jeor si el perfil está completo.
  - Fallback basado en peso si faltan datos.
- **Registro de Consumos**: Creación y consulta por rango de fechas.
- **Dashboard Rápido**: `/resumen/hoy` devuelve objetivo + consumos en una sola llamada.
- **Sistema Social Completo**:
  - Seguir / dejar de seguir
  - Feed paginado
  - Ranking diario/semanal/mensual
  - Likes y comentarios en consumos
- **Seguridad**:
  - `helmet` para cabeceras seguras
  - `express-rate-limit` para frenar fuerza bruta en login

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología |
|-----------|------------|
| Backend | Node.js + Express + TypeScript |
| Base de Datos | PostgreSQL |
| ORM | Prisma |
| Autenticación | JWT + BcryptJS |
| Validación | Zod |
| Email Dev | Nodemailer (Ethereal) |
| Seguridad | Helmet + Rate Limit |

---

## 🏁 Cómo Empezar

### Prerrequisitos

- Node.js **v20+**
- NPM o Yarn
- PostgreSQL (local o nube)

### Instalación

```bash
git clone https://github.com/alexisss13/goh2-backend.git
cd goh2-backend
npm install
```

### Configurar variables de entorno

Crear archivo .env basado en .env.example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"

JWT_SECRET="tu_secreto_super_seguro_de_32_caracteres_o_mas"

FRONTEND_URL="http://localhost:5173"

MAIL_HOST="smtp.ethereal.email"
MAIL_PORT="587"
MAIL_USER="example.user@ethereal.email"
MAIL_PASS="supersecretpassword"
```

### Migrar base de datos

```bash
npx prisma migrate dev
```

### (Opcional) Poblar tabla de bebidas

```bash
npx prisma seed
```

## 📜 Scripts Disponibles

| Script                       | Acción                                               |
|-----------------------------|------------------------------------------------------|
| `npm run dev`               | Ejecuta el servidor en modo desarrollo               |
| `npm run build`             | Compila TypeScript → JavaScript                      |
| `npm run start`             | Ejecuta el servidor en producción                    |
| `npx prisma migrate dev`    | Crea y aplica migraciones en desarrollo              |
| `npx prisma migrate deploy` | Aplica migraciones pendientes en producción          |
| `npx prisma seed`           | Pobla la base de datos                               |
| `npx prisma studio`         | GUI para explorar datos                              |

---

## 🗺️ Resumen de Endpoints

> Todas las rutas están prefijadas con: **`/api`**  
> Las rutas marcadas como **(Protegido)** requieren:  
> `Authorization: Bearer <token>`

---

### 🔑 Autenticación

| Método | Ruta                         | Descripción                      |
|--------|------------------------------|----------------------------------|
| POST   | `/auth/registro`             | Registrar usuario                |
| POST   | `/auth/login`                | Iniciar sesión → devuelve JWT    |
| POST   | `/auth/olvide-password`      | Inicia restablecimiento          |
| POST   | `/auth/restablecer-password` | Completa restablecimiento        |

---

### 👤 Perfil y Resumen

| Método | Ruta                        | Descripción                                                 |
|--------|-----------------------------|-------------------------------------------------------------|
| GET    | `/resumen/hoy`              | Datos listos para el dashboard. **(Protegido)**             |
| GET    | `/objetivo/hoy`             | Obtiene o crea objetivo diario. **(Protegido)**             |
| GET    | `/perfil`                   | Obtiene perfil. **(Protegido)**                             |
| PUT    | `/perfil`                   | Actualiza perfil. **(Protegido)**                           |
| GET    | `/perfil/estado-calculo`    | Verifica si el cálculo avanzado es posible. **(Protegido)** |

---

### 💧 Registro de Consumos

| Método | Ruta           | Descripción                                            |
|--------|----------------|--------------------------------------------------------|
| GET    | `/bebidas`     | Lista de bebidas disponibles                           |
| POST   | `/registros`   | Crea un registro de consumo. **(Protegido)**           |
| GET    | `/registros`   | Historial (query `?fecha=YYYY-MM-DD`). **(Protegido)** |

---

### 👥 Social

| Método | Ruta                                   | Descripción                               |
|--------|----------------------------------------|-------------------------------------------|
| GET    | `/social/buscar?q=`                    | Buscar usuarios. **(Protegido)**          |
| POST   | `/social/seguir/:id`                   | Seguir usuario. **(Protegido)**           |
| DELETE | `/social/dejar-de-seguir/:id`          | Dejar de seguir. **(Protegido)**          |
| GET    | `/social/feed?page=&limit=`            | Feed de actividad. **(Protegido)**        |
| GET    | `/social/ranking?periodo=dia|semana|mes` | Ranking de hidratación. **(Protegido)** |
| POST   | `/social/registros/:id/like`           | Dar like a un registro. **(Protegido)**   |
| DELETE | `/social/registros/:id/like`           | Quitar like. **(Protegido)**              |
| POST   | `/social/registros/:id/comentar`       | Comentar registro. **(Protegido)**        |
| GET    | `/social/registros/:id/comentarios`    | Ver comentarios. **(Protegido)**          |
| DELETE | `/social/comentarios/:id`              | Borrar comentario propio. **(Protegido)** |

---

### ⚙️ Configuración

| Método | Ruta                              | Descripción                                |
|--------|-----------------------------------|--------------------------------------------|
| POST   | `/configuracion/cambiar-password` | Cambiar contraseña. **(Protegido)**        |
| DELETE | `/perfil`                         | Eliminar cuenta. **(Protegido)**           |

---

## 📚 Documentación Interactiva

```http
GET /api/docs
```
Servido con ReDoc, incluye:

- Modelos
- Códigos de respuesta
- Ejemplos listos para copiar