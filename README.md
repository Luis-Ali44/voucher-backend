# VauCher — Backend API

Backend de la app de planificación financiera **VauCher**, construido con **NestJS**, **Prisma** y **PostgreSQL**.

---

## Stack

| Tecnología | Versión |
| ---------- | ------- |
| NestJS     | 10      |
| Prisma ORM | 5       |
| PostgreSQL | 16      |
| Node.js    | 20      |
| Docker     | -       |

---

## Levantar con Docker (recomendado)

```bash
# 1. Clonar y entrar al directorio
cd backend-voucher

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Levantar base de datos y API
docker compose up --build
```

Servicios disponibles:

| Servicio               | URL                        |
| ---------------------- | -------------------------- |
| API                    | http://localhost:3000/api  |
| Documentación (Scalar) | http://localhost:3000/docs |
| PostgreSQL             | localhost:5432             |

---

## Desarrollo local (sin Docker)

### Prerequisitos

- Node.js 20+
- PostgreSQL corriendo localmente

```bash
# Instalar dependencias
npm install

# Generar cliente de Prisma
npm run prisma:generate

# Aplicar migraciones
npm run prisma:migrate

# Iniciar en modo desarrollo
npm run start:dev
```

---

## Estructura del proyecto

```
src/
├── auth/                  # Registro e inicio de sesión (JWT)
│   ├── dto/
│   ├── guards/
│   ├── strategies/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
│
├── configuracion/         # Configuración financiera inicial del usuario
│   ├── dto/
│   ├── configuracion.controller.ts
│   ├── configuracion.service.ts
│   └── configuracion.module.ts
│
├── gastos/                # CRUD de gastos recurrentes y vitales
│   ├── dto/
│   ├── gastos.controller.ts
│   ├── gastos.service.ts
│   └── gastos.module.ts
│
├── dashboard/             # Resumen financiero + registro de gastos/ingresos extra
│   ├── dto/
│   ├── dashboard.controller.ts
│   ├── dashboard.service.ts
│   └── dashboard.module.ts
│
├── prisma/                # PrismaService global
│   ├── prisma.service.ts
│   └── prisma.module.ts
│
├── app.module.ts
└── main.ts                # Bootstrap + Scalar docs
```

---

## Endpoints principales

### Auth

| Método | Ruta                 | Descripción                  |
| ------ | -------------------- | ---------------------------- |
| POST   | `/api/auth/register` | Registrar usuario            |
| POST   | `/api/auth/login`    | Iniciar sesión → retorna JWT |

### Configuración

| Método | Ruta                 | Descripción                |
| ------ | -------------------- | -------------------------- |
| POST   | `/api/configuracion` | Guardar config inicial     |
| GET    | `/api/configuracion` | Obtener config del usuario |

### Gastos

| Método | Ruta                     | Descripción                         |
| ------ | ------------------------ | ----------------------------------- |
| POST   | `/api/gastos`            | Crear un gasto                      |
| POST   | `/api/gastos/lote`       | Crear múltiples gastos (onboarding) |
| GET    | `/api/gastos`            | Listar gastos del usuario           |
| PATCH  | `/api/gastos/:id/pagado` | Marcar/desmarcar como pagado        |
| DELETE | `/api/gastos/:id`        | Eliminar un gasto                   |

### Dashboard

| Método | Ruta                           | Descripción                        |
| ------ | ------------------------------ | ---------------------------------- |
| GET    | `/api/dashboard/resumen`       | Resumen financiero completo        |
| POST   | `/api/dashboard/gasto`         | Registrar gasto desde el dashboard |
| POST   | `/api/dashboard/ingreso-extra` | Registrar ingreso extra            |

---

## Variables de entorno

```env
DATABASE_URL="postgresql://voucher_user:voucher_pass@localhost:5432/voucher_db?schema=public"
JWT_SECRET="cambia_esto_en_produccion"
JWT_EXPIRES_IN="7d"
PORT=3000
```
