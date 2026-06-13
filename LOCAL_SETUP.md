# Arranque Local

Este documento deja los comandos base para trabajar en local con la app, Stripe y los resets de pruebas.

## 1. Variables necesarias

Comprueba que `.env.local` tenga al menos esto:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 2. Instalar dependencias

```powershell
pnpm install
```

## 3. Arrancar la app

Usa este comando:

```powershell
pnpm exec next dev --webpack
```

La app quedará en:

```text
http://localhost:3000
```

## 4. Login de Stripe CLI

Solo hace falta la primera vez, o cuando pierdas la sesión:

```powershell
stripe login
```

## 5. Escuchar webhooks de Stripe en local

En otra terminal, con la app ya arrancada:

```powershell
stripe listen --events checkout.session.completed --forward-to localhost:3000/api/stripe/webhook
```

Ese comando debe quedarse corriendo.

Si Stripe te devuelve un `whsec_...` nuevo, actualízalo en `.env.local`.

## 6. Flujo normal de trabajo

Terminal 1:

```powershell
pnpm exec next dev --webpack
```

Terminal 2:

```powershell
stripe listen --events checkout.session.completed --forward-to localhost:3000/api/stripe/webhook
```

Después:

1. Abre `http://localhost:3000`
2. Inicia sesión
3. Lanza un pago de socio o matrícula
4. Completa el checkout en modo test

## 7. Tarjeta de prueba de Stripe

```text
4242 4242 4242 4242
```

Usa también:

- fecha futura cualquiera
- CVC cualquiera
- código postal cualquiera

## 8. Reset de matrículas para pruebas

Si quieres volver a dejar deportistas como pendientes sin recrearlos, abre el SQL Editor de Supabase y ejecuta:

```sql
update public.athletes
set status = 'pendiente'
where status in ('matriculado', 'en_revision');

update public.payments
set status = 'canceled',
    paid_at = null
where payment_type = 'enrollment'
  and status in ('paid', 'pending');
```

También tienes una referencia en:

```text
supabase/reset-test-enrollments.sql
```

## 9. Reset de socio para pruebas

Si quieres volver a dejar socios como no pagados:

```sql
update public.profiles
set is_paid_member = false,
    membership_paid_at = null
where is_paid_member = true;

update public.payments
set status = 'canceled',
    paid_at = null
where payment_type = 'membership'
  and status in ('paid', 'pending');
```

## 10. Build de comprobación

Para verificar que todo compila:

```powershell
pnpm build
```

## 11. Resumen rápido

```powershell
pnpm install
pnpm exec next dev --webpack
stripe listen --events checkout.session.completed --forward-to localhost:3000/api/stripe/webhook
```
