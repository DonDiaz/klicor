# BioImpulso SaaS

MVP tipo link in bio para negocios y emprendedores.

## Incluye

- Next.js App Router listo para Vercel
- Firebase Auth con email/contrasena y Google
- Firestore para usuarios, pagos, analytics y settings
- Firebase Storage para imagen del negocio y QR
- Landing publica por username
- QR PNG de 400px con actualizacion solo al cambiar el username
- Prueba gratuita de 30 dias
- Pago anual manual con Mercado Pago
- Periodo de gracia de 15 dias sin edicion
- Suspension automatica de landing y correo al no pagar
- Panel administrativo para cambiar el valor anual

## Estructura

- `app/`: interfaz y API routes
- `components/`: UI y formularios
- `lib/`: Firebase, auth, billing, mail y reglas de negocio
- `scripts/bootstrap-firestore.mjs`: inicializa el documento de facturacion si no existe
- `firestore.rules` y `storage.rules`: reglas base de Firebase
- `vercel.json`: cron diario para revisar vencimientos

## Variables de entorno

Copia `.env.example` a `.env.local` y completa:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_STORAGE_BUCKET`
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_PUBLIC_KEY`
- `MERCADOPAGO_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `ADMIN_EMAIL`
- `CRON_SECRET`

## Firebase

1. Crea un proyecto en Firebase.
2. Activa Authentication con Email/Password y Google.
3. Crea Firestore en modo production.
4. Crea Firebase Storage.
5. Genera una service account y copia sus credenciales en las variables de entorno server.
6. Instala Firebase CLI y ejecuta:

```bash
firebase login
firebase use TU_PROYECTO
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## Mercado Pago

1. Crea una aplicacion en Mercado Pago.
2. Usa `MERCADOPAGO_ACCESS_TOKEN` y `MERCADOPAGO_PUBLIC_KEY`.
3. Configura el webhook apuntando a:

```text
https://tu-dominio.com/api/billing/webhook
```

4. El checkout se crea desde `/api/billing/create-preference`.

## Vercel

1. Importa la carpeta `bioimpulso-saas` como nuevo proyecto.
2. Carga todas las variables de entorno.
3. Deja activo `vercel.json` para el cron diario.
4. Configura tu dominio final y actualiza `NEXT_PUBLIC_APP_URL`.
5. Despliega.

## Desarrollo local

```bash
npm install
npm run build
npm run dev
node scripts/bootstrap-firestore.mjs
```

## Notas operativas

- El usuario admin se asigna automaticamente cuando su email coincide con `ADMIN_EMAIL`.
- El precio anual se guarda en `settings/billing` y se crea solo si no existe.
- La landing publica muestra pantalla de suspension cuando la cuenta entra en `suspended` o `cancelled`.
- El cron mueve estados entre `trial`, `active`, `grace_period`, `suspended` y `cancelled`.
- Los correos transaccionales salen por Resend si la API key esta configurada.

## Pendientes recomendados para produccion

- Verificar la firma del webhook de Mercado Pago con el secreto real.
- Agregar pruebas E2E del flujo de pago.
- Refinar templates de correo y branding definitivo.
- Agregar dashboard de analytics por boton.