-- Resetea matrículas de prueba para poder volver a probar pagos de deportistas
-- sin tener que recrearlos.
--
-- Qué hace:
-- 1. Busca deportistas con pagos de matrícula en estado `paid`.
-- 2. Devuelve esos deportistas a estado `pendiente`.
-- 3. Marca esos pagos como `canceled` para que no sigan contando como ingresos.
--
-- No toca pagos de socios (`membership`).
-- No borra registros, solo cambia estados.

update public.athletes a
set status = 'pendiente'
where a.id in (
  select distinct p.athlete_id
  from public.payments p
  where p.payment_type = 'enrollment'
    and p.status = 'paid'
    and p.athlete_id is not null
);

update public.payments p
set status = 'canceled',
    paid_at = null
where p.payment_type = 'enrollment'
  and p.status = 'paid';

-- Variante para un solo deportista:
-- update public.athletes
-- set status = 'pendiente'
-- where id = 'ATHLETE_ID_AQUI';
--
-- update public.payments
-- set status = 'canceled',
--     paid_at = null
-- where payment_type = 'enrollment'
--   and athlete_id = 'ATHLETE_ID_AQUI'
--   and status = 'paid';
