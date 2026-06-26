# SGID LogiChain – Backend API

Backend REST en **Express.js + TypeScript** para el Sistema de Gestión de Inventario y Despacho de "LogiChain Solutions" (proyecto IF0010 – Bases de Datos II, UCR SO-CIE).

---

## Requisitos

- Node.js ≥ 18
- MySQL Community Server 8.0 con la base de datos `SGID_LogiChain` creada y el script SQL aplicado

---

## Instalación

```bash
npm install
cp .env.example .env
# Edite .env con sus credenciales MySQL
```

## Ejecución

```bash
# Desarrollo (hot-reload)
npm run dev

# Producción
npm run build
npm start
```

---

## Variables de entorno (`.env`)

| Variable      | Descripción                          | Default       |
|---------------|--------------------------------------|---------------|
| `PORT`        | Puerto del servidor                  | `3000`        |
| `DB_HOST`     | Host MySQL                           | `localhost`   |
| `DB_PORT`     | Puerto MySQL                         | `3306`        |
| `DB_NAME`     | Nombre de la base de datos           | `SGID_LogiChain` |
| `DB_USER`     | Usuario MySQL del pool de aplicación | —             |
| `DB_PASSWORD` | Contraseña MySQL                     | —             |

---

## Endpoints

Todas las respuestas siguen el formato:
```json
{ "success": true, "data": <payload> }
{ "success": false, "error": "<mensaje>" } 
```

### Auth
| Método | Ruta              | Descripción                                               |
|--------|-------------------|-----------------------------------------------------------|
| POST   | `/api/auth/login` | Valida credenciales abriendo una conexión real a MySQL   |

**Body:** `{ "usuario": "crodriguez", "password": "MiClaveSegura123*" }`

---

### Clientes
| Método | Ruta                  | Descripción                                      |
|--------|-----------------------|--------------------------------------------------|
| GET    | `/api/clientes`       | Lista todos los clientes                         |
| GET    | `/api/clientes/:id`   | Obtiene un cliente por ID                        |
| POST   | `/api/clientes`       | Crea un cliente (`Nombre`, `Rol`)               |
| PUT    | `/api/clientes/:id`   | Actualiza `Nombre` y/o `Rol`                    |
| DELETE | `/api/clientes/:id`   | Elimina (falla si tiene movimientos asociados)  |

**Roles válidos:** `origen` | `destino` | `ambos`

---

### Productos
| Método | Ruta                           | Descripción                                      |
|--------|--------------------------------|--------------------------------------------------|
| GET    | `/api/productos`               | Lista todos los productos                        |
| GET    | `/api/productos/disponibles`   | Solo productos con stock > 0 (para despachos)   |
| GET    | `/api/productos/:id`           | Obtiene un producto por ID                       |
| POST   | `/api/productos`               | Crea un producto (cantidad inicial = 0)         |
| PUT    | `/api/productos/:id`           | Actualiza Nombre, Stock_Critico, ubicación      |
| DELETE | `/api/productos/:id`           | Elimina (falla si tiene movimientos)            |
| GET    | `/api/productos/:id/recepciones` | Historial de recepciones del producto         |

**Nota:** `Cantidad_Actual` no se puede modificar directamente; solo vía recepciones/despachos.

---

### Recepciones
| Método | Ruta               | Descripción                                       |
|--------|--------------------|---------------------------------------------------|
| GET    | `/api/recepciones` | Lista recepciones (`?fechaInicio=&fechaFin=`)    |
| POST   | `/api/recepciones` | Registra una recepción (llama `sp_RegistrarRecepcion`) |

**Body POST:** `{ "Id_Producto": 1, "Cantidad_Entrante": 10, "Id_Cliente": 1, "Numero_Lote": "LOT-2001" }`

---

### Despachos
| Método | Ruta                          | Descripción                                                   |
|--------|-------------------------------|---------------------------------------------------------------|
| GET    | `/api/despachos`              | Última semana (o `?fechaInicio=&fechaFin=`), orden DESC      |
| POST   | `/api/despachos`              | Crea despacho en estado `pendiente`                          |
| GET    | `/api/despachos/:id`          | Obtiene despacho + detalle de productos (si procesado)       |
| POST   | `/api/despachos/:id/procesar` | Ejecuta `sp_ProcesarDespacho` (ACID: commit o rollback)      |

#### Carro de compras (TEMPORAL_CARRO_COMPRAS)
El usuario se envía en el header `X-Usuario: crodriguez`.

| Método | Ruta                                   | Descripción                        |
|--------|----------------------------------------|------------------------------------|
| GET    | `/api/despachos/carro/items`           | Ver carro actual                   |
| POST   | `/api/despachos/carro/items`           | Agregar/actualizar item            |
| DELETE | `/api/despachos/carro/items/:idProd`   | Quitar un producto del carro       |
| DELETE | `/api/despachos/carro/items`           | Vaciar carro                       |

**Body POST carro:** `{ "Id_Producto": 2, "Cantidad": 5 }`

---

### Inventario (Monitoreo en Tiempo Real)
| Método | Ruta                            | Descripción                                             |
|--------|---------------------------------|---------------------------------------------------------|
| GET    | `/api/inventario/monitoreo`     | Invoca `sp_MonitoreoInventarioTiempoReal` (todos los productos con `EstadoStock`) |
| GET    | `/api/inventario/stock-critico` | Solo productos en estado `REORDEN`                     |

---

### Auditoría y Trazabilidad
| Método | Ruta                                   | Descripción                                         |
|--------|----------------------------------------|-----------------------------------------------------|
| GET    | `/api/auditoria/movimientos/:codigo`   | Reporte cronológico de un producto (recepciones + despachos) vía `sp_ReporteMovimientosProducto` |
| GET    | `/api/auditoria/log/:idProducto`       | Log de `AUDITORIA_PRODUCTOS` con columna `TipoCambio` |
| GET    | `/api/auditoria/log`                   | Log general (últimas 200 entradas)                  |

Todos aceptan `?fechaInicio=&fechaFin=` (ISO 8601). Por defecto: último mes.

---

## Estructura del proyecto

```
src/
├── config/
│   └── database.ts          # Pool MySQL + conexión autenticada
├── controllers/
│   ├── authController.ts    # Login via credenciales MySQL
│   ├── clientesController.ts
│   ├── productosController.ts
│   ├── recepcionesController.ts
│   ├── despachosController.ts   # Incluye carro de compras
│   ├── inventarioController.ts  # Monitoreo en tiempo real
│   └── auditoriaController.ts   # Reportes y trazabilidad
├── middleware/
│   └── errorHandler.ts      # Helpers sendSuccess/sendError + handlers globales
├── routes/
│   ├── authRoutes.ts
│   ├── clientesRoutes.ts
│   ├── productosRoutes.ts
│   ├── recepcionesRoutes.ts
│   ├── despachosRoutes.ts
│   ├── inventarioRoutes.ts
│   └── auditoriaRoutes.ts
├── types/
│   └── index.ts             # Interfaces TypeScript del dominio
└── index.ts                 # Entry point Express
```

---

## Flujo ACID de Despacho

1. `POST /api/despachos` → crea despacho `pendiente`
2. `POST /api/despachos/carro/items` (N veces) → llena el carro
3. `POST /api/despachos/:id/procesar` → llama `sp_ProcesarDespacho`:
   - Stock suficiente → `COMMIT`, estado `procesado`, limpia carro
   - Stock insuficiente → `ROLLBACK`, estado `cancelado`, limpia carro

---

## Stored Procedures invocados

| SP / Función                     | Endpoint que lo invoca                        |
|----------------------------------|-----------------------------------------------|
| `sp_RegistrarRecepcion`          | `POST /api/recepciones`                       |
| `sp_ProcesarDespacho`            | `POST /api/despachos/:id/procesar`            |
| `sp_EliminarCliente`             | `DELETE /api/clientes/:id`                    |
| `sp_EliminarProducto`            | `DELETE /api/productos/:id`                   |
| `sp_ReporteMovimientosProducto`  | `GET /api/auditoria/movimientos/:codigo`      |
| `sp_MonitoreoInventarioTiempoReal` | `GET /api/inventario/monitoreo`             |
| `fn_VerificarAlertaStock`        | `GET /api/inventario/stock-critico`           |
| `tg_AuditoriaInventario`         | Se activa automáticamente en cada UPDATE      |
