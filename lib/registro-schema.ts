import { z } from 'zod'

// Teléfono español: opcional prefijo +34 / 0034 / 34, móvil o fijo (6,7,8,9),
// permite espacios o guiones intermedios.
const TELEFONO_ES = /^(?:(?:\+34|0034|34)[\s-]?)?[6789]\d{2}[\s-]?\d{3}[\s-]?\d{3}$/

// DNI (8 dígitos + letra) o NIE (X/Y/Z + 7 dígitos + letra).
const DNI_NIE = /^([0-9]{8}[A-Za-z]|[XYZxyz][0-9]{7}[A-Za-z])$/

// Código postal español: 01000 – 52999.
const CP_ES = /^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/

const REQ = 'Este campo es obligatorio'

const passwordSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe incluir una mayúscula')
  .regex(/[a-z]/, 'Debe incluir una minúscula')
  .regex(/\d/, 'Debe incluir un número')

export const registroSchema = z
  .object({
    nombre: z.string().trim().min(2, 'Introduce un nombre válido').max(60),
    apellidos: z.string().trim().min(2, 'Introduce los apellidos').max(80),
    email: z
      .string()
      .trim()
      .min(1, REQ)
      .email('Correo electrónico no válido')
      .max(120),
    telefono: z
      .string()
      .trim()
      .min(1, REQ)
      .regex(TELEFONO_ES, 'Teléfono español no válido'),
    documento: z
      .string()
      .trim()
      .min(1, REQ)
      .regex(DNI_NIE, 'DNI/NIE no válido (ej. 12345678A o X1234567A)'),
    direccion: z.string().trim().min(3, 'Introduce una dirección válida').max(120),
    codigoPostal: z
      .string()
      .trim()
      .regex(CP_ES, 'Código postal español no válido'),
    provincia: z.string().trim().min(2, REQ).max(60),
    ciudad: z.string().trim().min(2, REQ).max(60),
    pais: z.string().trim().min(2, REQ).max(60),
    preferenciaPago: z.enum(['cuotas', 'unico'], {
      message: 'Selecciona una preferencia de pago',
    }),
    password: passwordSchema,
    confirmPassword: z.string().min(1, REQ),
    consentimiento: z.string().trim().min(2, REQ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden',
  })
  .refine(
    (data) => {
      const completo = `${data.nombre} ${data.apellidos}`.trim().toLowerCase()
      return data.consentimiento.trim().toLowerCase() === completo
    },
    {
      path: ['consentimiento'],
      message:
        'Debe coincidir exactamente con tu nombre y apellidos como consentimiento digital',
    },
  )

export type RegistroFormValues = z.infer<typeof registroSchema>