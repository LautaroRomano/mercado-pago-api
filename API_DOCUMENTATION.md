# Documentación de la API de MercadoPago

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Base URL](#base-url)
3. [Autenticación](#autenticación)
4. [Endpoints](#endpoints)
   - [GET /api/mercadopago](#get-apimercadopago)
   - [POST /api/mercadopago](#post-apimercadopago)
   - [PUT /api/mercadopago](#put-apimercadopago)
   - [POST /api/mercadopago/validate](#post-apimercadopagovalidate)
   - [GET /api/mercadopago/payment/[paymentId]](#get-apimercadopagopaymentpaymentid)
5. [Modelos de Datos](#modelos-de-datos)
6. [Notificaciones Webhook](#notificaciones-webhook)
7. [Códigos de Error](#códigos-de-error)
8. [Ejemplos de Uso](#ejemplos-de-uso)

---

## Introducción

Esta API permite gestionar pagos mediante tarjetas de crédito/débito. El flujo de trabajo consiste en:

1. **Crear un pago** (POST) - Genera un nuevo pago pendiente
2. **Validar tarjeta** (POST /validate) - Opcional: Validar los datos de la tarjeta antes de procesar
3. **Procesar pago** (PUT) - Procesa el pago con los datos de la tarjeta
4. **Consultar pago** (GET /payment/[paymentId]) - Obtiene el estado de un pago

La API envía notificaciones webhook automáticamente cuando un pago es aprobado o falla.

---

## Base URL

```
https://mercado-pago-api-sigma.vercel.app/
```

---

## Autenticación

Actualmente la API no requiere autenticación, pero se recomienda implementar un sistema de API keys para producción.

---

## Endpoints

### GET /api/mercadopago

Endpoint de bienvenida que verifica el estado de la API.

#### Request

```http
GET /api/mercadopago
```

#### Response

**Status Code:** `200 OK`

```json
{
  "message": "Bienvenido a la API de MercadoPago"
}
```

---

### POST /api/mercadopago

Crea un nuevo pago pendiente y genera un `paymentId` único.

#### Request

```http
POST /api/mercadopago
Content-Type: application/json
```

#### Body Parameters

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `description` | string | Sí | Descripción del producto o servicio |
| `paymentAmount` | number | Sí | Monto del pago (ej: 1000.50) |
| `notificationUrl` | string | Sí | URL donde se enviarán las notificaciones webhook |
| `apiKey` | string | Sí | Clave de API (reservado para futura autenticación) |
| `clientEmail` | string | Sí | Email del cliente |
| `clientName` | string | Sí | Nombre del cliente |
| `backUrl` | string | Sí | URL de retorno después del pago |

#### Request Example

```json
{
  "description": "Compra de producto XYZ",
  "paymentAmount": 1500.00,
  "notificationUrl": "https://tu-servidor.com/webhook",
  "apiKey": "tu-api-key",
  "clientEmail": "cliente@example.com",
  "clientName": "Juan Pérez",
  "backUrl": "https://mercado-pago-api-sigma.vercel.app/payment-success"
}
```

#### Response

**Status Code:** `200 OK`

```json
{
  "message": "POST recibido",
  "paymentRoute": "https://mercado-pago-api-sigma.vercel.app/mercadopago/payment/abc123xyz456"
}
```

#### Response Fields

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `message` | string | Mensaje de confirmación |
| `paymentRoute` | string | URL completa para que el cliente complete el pago |

---

### PUT /api/mercadopago

Procesa un pago existente con los datos de la tarjeta. Valida la tarjeta y actualiza el estado del pago a "approved" si es exitoso.

#### Request

```http
PUT /api/mercadopago
Content-Type: application/json
```

#### Body Parameters

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `paymentId` | string | Sí | ID único del pago generado en POST |
| `clientEmail` | string | Sí | Email del cliente |
| `cardNumber` | string | Sí | Número de tarjeta (16 dígitos, sin espacios) |
| `cardExpirationDate` | string | Sí | Fecha de expiración en formato MMYY (ej: "1225") |
| `cardCvv` | string | Sí | Código de seguridad (3 o 4 dígitos) |
| `cardHolderName` | string | Sí | Nombre del titular de la tarjeta |

#### Request Example

```json
{
  "paymentId": "abc123xyz456",
  "clientEmail": "cliente@example.com",
  "cardNumber": "1234567890123456",
  "cardExpirationDate": "1225",
  "cardCvv": "123",
  "cardHolderName": "JUAN PEREZ"
}
```

#### Response

**Status Code:** `200 OK` (Pago aprobado)

```json
{
  "message": "Pago aprobado",
  "payment": {
    "id": 1,
    "paymentId": "abc123xyz456",
    "paymentStatus": "approved",
    "paymentAmount": 1500.00,
    "paymentMethod": "visa",
    "notificationUrl": "https://tu-servidor.com/webhook",
    "backUrl": "https://tu-servidor.com/payment-success",
    "description": "Compra de producto XYZ",
    "clientEmail": "cliente@example.com",
    "clientName": "JUAN PEREZ",
    "notificationRecived": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  },
  "backUrl": "https://tu-servidor.com/payment-success"
}
```

#### Errores

**Status Code:** `400 Bad Request`

```json
{
  "error": "CVV no válido"
}
```

**Status Code:** `404 Not Found`

```json
{
  "error": "Tarjeta no encontrada"
}
```

o

```json
{
  "error": "Pago no encontrado"
}
```

---

### POST /api/mercadopago/validate

Valida los datos de una tarjeta sin procesar el pago. Útil para validar antes de enviar el formulario completo.

#### Request

```http
POST https://mercado-pago-api-sigma.vercel.app/api/mercadopago/validate
Content-Type: application/json
```

#### Body Parameters

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `cardNumber` | string | Sí | Número de tarjeta (16 dígitos, sin espacios) |
| `cardExpirationDate` | string | Sí | Fecha de expiración en formato MMYY (ej: "1225") |
| `cardCvv` | string | Sí | Código de seguridad (3 o 4 dígitos) |

#### Request Example

```json
{
  "cardNumber": "1234567890123456",
  "cardExpirationDate": "1225",
  "cardCvv": "123"
}
```

#### Response

**Status Code:** `200 OK` (Tarjeta válida)

```json
{
  "success": true,
  "message": "Tarjeta válida"
}
```

#### Errores

**Status Code:** `400 Bad Request`

```json
{
  "error": "Todos los campos son requeridos",
  "errorCode": "MISSING_FIELDS"
}
```

```json
{
  "error": "CVV no válido",
  "errorCode": "INVALID_CVV"
}
```

```json
{
  "error": "Fecha de expiración no válida",
  "errorCode": "INVALID_EXPIRATION"
}
```

**Status Code:** `404 Not Found`

```json
{
  "error": "Tarjeta no encontrada",
  "errorCode": "CARD_NOT_FOUND"
}
```

---

### GET /api/mercadopago/payment/[paymentId]

Obtiene la información completa de un pago específico.

#### Request

```http
GET https://mercado-pago-api-sigma.vercel.app/api/mercadopago/payment/abc123xyz456
```

#### Path Parameters

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `paymentId` | string | Sí | ID único del pago |

#### Response

**Status Code:** `200 OK`

```json
{
  "payment": {
    "id": 1,
    "paymentId": "abc123xyz456",
    "paymentStatus": "approved",
    "paymentAmount": 1500.00,
    "paymentMethod": "visa",
    "notificationUrl": "https://mercado-pago-api-sigma.vercel.app/webhook",
    "backUrl": "https://mercado-pago-api-sigma.vercel.app/payment-success",
    "description": "Compra de producto XYZ",
    "clientEmail": "cliente@example.com",
    "clientName": "JUAN PEREZ",
    "notificationRecived": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  },
  "errorCode": 200
}
```

#### Errores

**Status Code:** `404 Not Found`

```json
{
  "error": "Pago no encontrado",
  "errorCode": 404
}
```

**Status Code:** `500 Internal Server Error`

```json
{
  "error": "Error interno del servidor"
}
```

---

## Modelos de Datos

### Payment

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | number | ID interno de la base de datos |
| `paymentId` | string | ID único del pago (generado automáticamente) |
| `paymentStatus` | string | Estado del pago: "pending", "approved", "failed" |
| `paymentAmount` | number | Monto del pago |
| `paymentMethod` | string? | Tipo de tarjeta: "visa", "mastercard", "discover", "troy", etc. |
| `notificationUrl` | string | URL para notificaciones webhook |
| `backUrl` | string | URL de retorno después del pago |
| `description` | string | Descripción del producto/servicio |
| `clientEmail` | string? | Email del cliente |
| `clientName` | string? | Nombre del cliente |
| `notificationRecived` | boolean | Indica si la notificación fue recibida |
| `createdAt` | string (ISO 8601) | Fecha de creación |
| `updatedAt` | string (ISO 8601) | Fecha de última actualización |

### Card

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | number | ID interno de la base de datos |
| `cardType` | string | Tipo de tarjeta: "visa", "mastercard", etc. |
| `cardNumber` | string | Número de tarjeta (único) |
| `cardExpirationDate` | string | Fecha de expiración en formato MMYY |
| `cardCvv` | string | Código de seguridad |
| `createdAt` | string (ISO 8601) | Fecha de creación |
| `updatedAt` | string (ISO 8601) | Fecha de última actualización |

---

## Notificaciones Webhook

La API envía notificaciones automáticamente a la `notificationUrl` especificada cuando:

- Un pago es **aprobado** exitosamente
- Un pago **falla** por alguna razón (tarjeta no encontrada, CVV inválido, fecha inválida)

### Estructura de la Notificación

```json
{
  "status": "approved" | "failed",
  "message": "Mensaje descriptivo del resultado",
  "payment": {
    "paymentId": "abc123xyz456",
    "paymentStatus": "approved" | "failed",
    "paymentAmount": 1500.00,
    "paymentMethod": "visa" | null,
    "description": "Compra de producto XYZ",
    "clientEmail": "cliente@example.com" | null,
    "clientName": "JUAN PEREZ" | null,
    "backUrl": "https://tu-servidor.com/payment-success",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

### Ejemplo: Pago Aprobado

```json
{
  "status": "approved",
  "message": "Pago aprobado",
  "payment": {
    "paymentId": "abc123xyz456",
    "paymentStatus": "approved",
    "paymentAmount": 1500.00,
    "paymentMethod": "visa",
    "description": "Compra de producto XYZ",
    "clientEmail": "cliente@example.com",
    "clientName": "JUAN PEREZ",
    "backUrl": "https://mercado-pago-api-sigma.vercel.app/payment-success",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

### Ejemplo: Pago Fallido

```json
{
  "status": "failed",
  "message": "CVV no válido",
  "payment": {
    "paymentId": "abc123xyz456",
    "paymentStatus": "failed",
    "paymentAmount": 1500.00,
    "paymentMethod": null,
    "description": "Compra de producto XYZ",
    "clientEmail": null,
    "clientName": null,
    "backUrl": "https://mercado-pago-api-sigma.vercel.app/payment-success",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

### Requisitos del Webhook

- Debe aceptar requests `POST`
- Debe aceptar `Content-Type: application/json`
- Debe responder con un status code `200 OK` para confirmar la recepción
- Si el webhook no responde correctamente, la API marcará `notificationRecived: false`

### Nota sobre localhost

La API corrige automáticamente el typo común "locahost" → "localhost" en las URLs de notificación.

---

## Códigos de Error

| Código HTTP | Error Code | Descripción |
|-------------|------------|-------------|
| 200 | - | Operación exitosa |
| 400 | `MISSING_FIELDS` | Faltan campos requeridos |
| 400 | `INVALID_CVV` | CVV no válido |
| 400 | `INVALID_EXPIRATION` | Fecha de expiración no válida |
| 404 | `CARD_NOT_FOUND` | Tarjeta no encontrada en la base de datos |
| 404 | - | Pago no encontrado |
| 500 | - | Error interno del servidor |

---

## Ejemplos de Uso

### Flujo Completo de Pago

#### 1. Crear un Pago

```bash
curl -X POST https://mercado-pago-api-sigma.vercel.app/api/mercadopago \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Compra de producto XYZ",
    "paymentAmount": 1500.00,
    "notificationUrl": "https://tu-servidor.com/webhook",
    "apiKey": "tu-api-key",
    "clientEmail": "cliente@example.com",
    "clientName": "Juan Pérez",
    "backUrl": "https://mercado-pago-api-sigma.vercel.app/payment-success"
  }'
```

**Respuesta:**
```json
{
  "message": "POST recibido",
  "paymentRoute": "https://mercado-pago-api-sigma.vercel.app/mercadopago/payment/abc123xyz456"
}
```

#### 2. Validar Tarjeta (Opcional)

```bash
curl -X POST https://mercado-pago-api-sigma.vercel.app/api/mercadopago/validate \
  -H "Content-Type: application/json" \
  -d '{
    "cardNumber": "1234567890123456",
    "cardExpirationDate": "1225",
    "cardCvv": "123"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Tarjeta válida"
}
```

#### 3. Procesar el Pago

```bash
curl -X PUT https://mercado-pago-api-sigma.vercel.app/api/mercadopago \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "abc123xyz456",
    "clientEmail": "cliente@example.com",
    "cardNumber": "1234567890123456",
    "cardExpirationDate": "1225",
    "cardCvv": "123",
    "cardHolderName": "JUAN PEREZ"
  }'
```

**Respuesta:**
```json
{
  "message": "Pago aprobado",
  "payment": { ... },
  "backUrl": "https://mercado-pago-api-sigma.vercel.app/payment-success"
}
```

#### 4. Consultar Estado del Pago

```bash
curl https://mercado-pago-api-sigma.vercel.app/api/mercadopago/payment/abc123xyz456
```

**Respuesta:**
```json
{
  "payment": { ... },
  "errorCode": 200
}
```

### Ejemplo con JavaScript (Fetch API)

```javascript
// 1. Crear pago
const createPayment = async () => {
  const response = await fetch('https://mercado-pago-api-sigma.vercel.app/api/mercadopago', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: 'Compra de producto XYZ',
      paymentAmount: 1500.00,
      notificationUrl: 'https://mercado-pago-api-sigma.vercel.app/webhook',
      apiKey: 'tu-api-key',
      clientEmail: 'cliente@example.com',
      clientName: 'Juan Pérez',
      backUrl: 'https://mercado-pago-api-sigma.vercel.app/payment-success'
    })
  });
  
  const data = await response.json();
  return data.paymentRoute; // URL para que el cliente complete el pago
};

// 2. Validar tarjeta
const validateCard = async (cardNumber, expirationDate, cvv) => {
  const response = await fetch('http://localhost:3000/api/mercadopago/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cardNumber: cardNumber.replace(/\s/g, ''),
      cardExpirationDate: expirationDate,
      cardCvv: cvv
    })
  });
  
  return await response.json();
};

// 3. Procesar pago
const processPayment = async (paymentId, cardData) => {
  const response = await fetch('http://localhost:3000/api/mercadopago', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentId: paymentId,
      clientEmail: cardData.email,
      cardNumber: cardData.number.replace(/\s/g, ''),
      cardExpirationDate: cardData.expirationDate,
      cardCvv: cardData.cvv,
      cardHolderName: cardData.holderName.toUpperCase()
    })
  });
  
  return await response.json();
};
```

### Ejemplo de Webhook Handler

```javascript
// Express.js example
app.post('/webhook', express.json(), async (req, res) => {
  const { status, message, payment, timestamp } = req.body;
  
  console.log(`Notificación recibida: ${status} - ${message}`);
  console.log('Datos del pago:', payment);
  
  if (status === 'approved') {
    // Procesar pago aprobado
    await updateOrderStatus(payment.paymentId, 'paid');
    await sendConfirmationEmail(payment.clientEmail);
  } else if (status === 'failed') {
    // Procesar pago fallido
    await updateOrderStatus(payment.paymentId, 'failed');
    await sendFailureEmail(payment.clientEmail, message);
  }
  
  // Siempre responder 200 para confirmar recepción
  res.status(200).json({ received: true });
});
```

---

## Notas Importantes

1. **Formato de Fecha de Expiración**: Debe ser en formato `MMYY` (ej: "1225" para diciembre 2025)

2. **Número de Tarjeta**: Debe tener exactamente 16 dígitos, sin espacios ni guiones

3. **CVV**: Debe tener 3 o 4 dígitos dependiendo del tipo de tarjeta

4. **Tarjetas en Base de Datos**: Las tarjetas deben estar previamente registradas en la base de datos para poder procesar pagos

5. **Notificaciones**: El webhook debe responder con status 200 para que la API marque la notificación como recibida

6. **URLs de Retorno**: La `backUrl` se utiliza para redirigir al usuario después de un pago exitoso

---

## Soporte

Para más información o soporte, contacta al equipo de desarrollo.

---

**Última actualización:** Enero 2024

