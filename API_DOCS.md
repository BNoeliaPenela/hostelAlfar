# API BackendHostel

## Base
- Prefijo: `/api/v1/`
- Autenticación: JWT Bearer. Tokens:
  - `POST /api/login/` → `{ "username", "password" }`
  - `POST /api/refresh/` → `{ "refresh" }`

Estados de cama (`estado` / `estado_actual`):
- `LIBRE`: cama disponible.
- `EN_PROCESO`: check-in próximo (≤ 20 minutos).
- `OCUPADA`: reserva en curso.
- `PARA_LIMPIAR`: pendiente de limpieza después del checkout.

## Clientes
Endpoints estándar del `ModelViewSet`:
- `GET /api/v1/clientes/` (lista)
- `POST /api/v1/clientes/` (crea)
- `GET /api/v1/clientes/{id}/` (detalle)
- `PATCH /api/v1/clientes/{id}/` (actualiza parcial)
- `DELETE /api/v1/clientes/{id}/` (elimina)

Campos:
- `nombre` (str, 2-100 caracteres)
- `apellido` (str, 2-100 caracteres)
- `documento` (str único, se guarda sin separadores)
- `telefono` (7-15 dígitos reales)
- `direccion` (str, opcional)
- `patente` (opcional, `ABC123` o `AB123CD`)

> Búsqueda: habilitada con `SearchFilter` por `nombre`, `apellido`, `documento`.
> Ejemplo: `GET /api/v1/clientes/?search=perez`.

Ejemplo creación:
```http
POST /api/v1/clientes/
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "documento": "12.345.678",
  "telefono": "+54 9 11 2345-6789",
  "direccion": "Calle Falsa 123"
}
```

## Camas
- `GET /api/v1/camas/` (lista; recalcula estados antes de responder)
- `POST /api/v1/camas/` (crea; campos: `numero` [1..24])
- `GET /api/v1/camas/{id}/` (detalle; recalcula estado)
- `PATCH /api/v1/camas/{id}/` (actualiza `numero` o `estado`)
- `DELETE /api/v1/camas/{id}/` (elimina)

Acciones:
- `POST /api/v1/camas/{id}/recalcular/`
- `POST /api/v1/camas/recalcular_todas/`
- `GET /api/v1/camas/disponibles/?check_in=YYYY-MM-DD[ HH:MM]&check_out=YYYY-MM-DD[ HH:MM]`
- `POST /api/v1/camas/{id}/limpiar/` → marca `LIBRE` y recalcula; puede quedar `EN_PROCESO` si hay reserva próxima.

Respuesta típica:
```json
{
  "id": 7,
  "numero": 5,
  "estado": "LIBRE",
  "estado_actual": "LIBRE"
}
```

## Reservas
- `GET /api/v1/reservas/` (lista)
- `POST /api/v1/reservas/` (crea)
- `GET /api/v1/reservas/{id}/` (detalle)
- `PATCH /api/v1/reservas/{id}/` (actualiza parcial)
- `DELETE /api/v1/reservas/{id}/` (elimina)

Acciones:
- `POST /api/v1/reservas/{id}/checkin/`
  - Body opcional: `{ "check_in": "YYYY-MM-DD HH:MM" }`
  - Efecto: marca TODAS las camas de la reserva como `OCUPADA`.
  - Respuesta:
    ```json
    { "message": "Check-in realizado para camas 5, 12", "check_in": "2024-12-15 15:05" }
    ```
- `POST /api/v1/reservas/{id}/checkout/` → pasa las camas a `PARA_LIMPIAR`
  - Body opcional: `{ "check_out": "YYYY-MM-DD HH:MM" }`
  - Respuesta:
    ```json
    {
      "message": "Check-out realizado para camas 5, 12",
      "check_out": "2024-12-18 10:55",
      "duracion_estadia": "3 days, 19:50:00"
    }
    ```
- `GET /api/v1/reservas/activas/`
- `GET /api/v1/reservas/actualizar_estados/`

Campos principales (serializer `ReservaSerializer`):
- `cliente` (id del titular; requerido)
- `huespedes` (lista de ids; opcional. El backend agrega siempre al titular y deduplica)
- `camas` (write-only) lista de objetos `{ "cliente": <id>, "cama": <id> }` para asignar cada cama a un huésped
- `camas_detalle` (read-only) lista: `{ "cama_numero": <int>, "cliente_nombre": <str> }`
- `cliente_detalle`, `cliente_nombre` (read-only)
- `huespedes_detalle`, `huespedes_nombres` (read-only)
- `check_in`, `check_out` (`YYYY-MM-DD HH:MM` o ISO)
- `senia`, `debe`, `notas`
- `creada_en`, `actualizada_en` (read-only)

Validaciones:
- `check_out` > `check_in`
- Estadía mínima: 1 hora
- Estadía máxima: 30 días
- Fechas dentro de ±6 meses razonables (no pasado más de 1 hora, no futuro >6 meses)
- Sin solapamientos para la misma cama
- No admite camas `PARA_LIMPIAR`

Ejemplo creación (reserva con 2 camas: titular + 1 huésped):
```http
POST /api/v1/reservas/
{
  "cliente": 3,
  "huespedes": [8],
  "camas": [
    { "cliente": 3, "cama": 5 },
    { "cliente": 8, "cama": 12 }
  ],
  "check_in": "2025-09-10 15:00",
  "check_out": "2025-09-12 11:00",
  "senia": "20000.00",
  "notas": "Incluye desayuno vegetariano y lockers extra"
}
```

Respuesta típica:
```json
{
  "id": 42,
  "cliente": 3,
  "cliente_detalle": {
    "id": 3,
    "nombre": "Juan",
    "apellido": "Pérez",
    "documento": "12345678",
    "telefono": "+54 9 11 2345-6789",
    "direccion": "Calle Falsa 123",
    "patente": null
  },
  "cliente_nombre": "Juan Pérez",
  "huespedes": [3, 8],
  "huespedes_detalle": [...],
  "huespedes_nombres": ["Juan Pérez", "Ana García"],
  "camas_detalle": [
    { "cama_numero": 5, "cliente_nombre": "Juan Pérez" },
    { "cama_numero": 12, "cliente_nombre": "Ana García" }
  ],
  "check_in": "2025-09-10T15:00:00",
  "check_out": "2025-09-12T11:00:00",
  "senia": "20000.00",
  "debe": "0.00",
  "notas": "Incluye desayuno vegetariano y lockers extra",
  "creada_en": "2025-08-30T22:15:31",
  "actualizada_en": "2025-08-30T22:15:31"
}
```

### Notas sobre Amenities
Ya no existe el modelo `Amenity`. El campo `notas` en `Reserva` queda como espacio libre para registrar manualmente los servicios incluidos o cualquier observación relevante.

## Autenticación
- `POST /api/login/`
```http
{
  "username": "admin",
  "password": "secret"
}
```
Respuesta:
```json
{
  "access": "<jwt>",
  "refresh": "<jwt>"
}
```
- `POST /api/refresh/` con `{ "refresh": "<jwt>" }` devuelve nuevo `access`.

> Todas las rutas bajo `/api/v1/` requieren `Authorization: Bearer <access>`.

## Reportes
### Ocupación diaria
`GET /api/v1/reportes/ocupacion-diaria?fecha=YYYY-MM-DD`  
Si no se envía `fecha`, usa el día actual.

```json
{
  "camas": 24,
  "capacidad_segundos": 2073600,
  "ocupado_segundos": 86400,
  "tasa": 0.0417,
  "porcentaje": 4.17,
  "periodo_inicio": "2025-09-10 00:00:00",
  "periodo_fin": "2025-09-11 00:00:00",
  "base": "segundos-ocupados / (camas * 86400)"
}
```

### Ocupación mensual
`GET /api/v1/reportes/ocupacion-mensual?anio=YYYY&mes=MM`  
Usa el mes actual si faltan parámetros.

```json
{
  "camas": 24,
  "capacidad_segundos": 62208000,
  "ocupado_segundos": 3024000,
  "tasa": 0.0486,
  "porcentaje": 4.86,
  "periodo_inicio": "2025-09-01 00:00:00",
  "periodo_fin": "2025-10-01 00:00:00",
  "base": "segundos-ocupados / (camas * segundos del período)",
  "diario": [
    { "fecha": "2025-09-01", "ocupado_segundos": 86400, "tasa": 0.05, "porcentaje": 5.0 },
    { "fecha": "2025-09-02", "ocupado_segundos": 0, "tasa": 0.0, "porcentaje": 0.0 }
  ]
}
```

### Ocupación total
`GET /api/v1/reportes/ocupacion-total?desde=YYYY-MM-DD&hasta=YYYY-MM-DD`  
Si no se envían fechas, usa todo el rango de reservas existentes.

```json
{
  "camas": 24,
  "capacidad_segundos": 103680000,
  "ocupado_segundos": 4320000,
  "tasa": 0.0417,
  "porcentaje": 4.17,
  "periodo_inicio": "2025-01-01 00:00:00",
  "periodo_fin": "2025-12-31 23:59:59",
  "base": "segundos-ocupados / (camas * segundos del período)"
}
```

## Notas generales
- `USE_TZ=False`, por lo que se esperan datetimes sin zona horaria; el backend los trata como hora local configurada (`America/Buenos_Aires`).
- Los listados de camas siempre recalculan estado antes de responder.
- El backend garantiza que toda reserva mantiene al cliente titular dentro de `huespedes` y evita duplicados.
