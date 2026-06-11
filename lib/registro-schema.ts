import { z } from 'zod'

// Teléfono español: opcional prefijo +34 / 0034 / 34, móvil o fijo (6,7,8,9),
// permite espacios o guiones intermedios.
const TELEFONO_ES = /^(?:(?:\+34|0034|34)[\s-]?)?[6789]\d{2}[\s-]?\d{3}[\s-]?\d{3}$/

// DNI (8 dígitos + letra) o NIE (X/Y/Z + 7 dígitos + letra).
const DNI_NIE = /^([0-9]{8}[A-Za-z]|[XYZxyz][0-9]{7}[A-Za-z])$/
const DNI_LETRAS = 'TRWAGMYFPDXBNJZSQVHLCKE'

// Código postal español: 01000 – 52999.
const CP_ES = /^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/

const REQ = 'Este campo es obligatorio'

export const CATEGORIAS = [
  'Bebés',
  'Prebenjamín',
  'Benjamín',
  'Alevín',
  'Infantil',
  'Cadete',
  'Juvenil',
] as const

export const TIPOS_IDENTIFICACION = ['DNI', 'NIE', 'Pasaporte', 'Otro'] as const

const emailOpcional = z
  .string()
  .trim()
  .email('Correo electrónico no válido')
  .max(120)
  .optional()
  .or(z.literal(''))

const telefonoOpcional = z
  .string()
  .trim()
  .regex(TELEFONO_ES, 'Teléfono español no válido')
  .optional()
  .or(z.literal(''))

function normalizarDocumento(value: string) {
  return value.trim().toUpperCase()
}

function isValidDniNie(value: string) {
  const documento = normalizarDocumento(value)

  if (!DNI_NIE.test(documento)) {
    return false
  }

  const letra = documento.at(-1)
  if (!letra) {
    return false
  }

  let numeroBase = documento.slice(0, -1)

  if (/^[XYZ]/.test(documento)) {
    const prefijo = documento[0]
    const mapaNie: Record<string, string> = {
      X: '0',
      Y: '1',
      Z: '2',
    }

    numeroBase = `${mapaNie[prefijo]}${documento.slice(1, -1)}`
  }

  const numero = Number(numeroBase)
  if (Number.isNaN(numero)) {
    return false
  }

  return DNI_LETRAS[numero % 23] === letra
}

const dniNieSchema = z
  .string()
  .trim()
  .min(1, REQ)
  .regex(DNI_NIE, 'DNI/NIE no válido (ej. 12345678A o X1234567A)')
  .refine(isValidDniNie, 'La letra del DNI/NIE no coincide con el número')

export const deportistaSchema = z
  .object({
    id: z.string(),
    nombre: z.string().trim().min(2, 'Introduce un nombre válido').max(60),
    apellidos: z.string().trim().min(2, 'Introduce los apellidos').max(80),
    fechaNacimiento: z
      .string()
      .min(1, REQ)
      .refine((v) => {
        const d = new Date(v)
        return !Number.isNaN(d.getTime()) && d < new Date()
      }, 'Fecha de nacimiento no válida'),
    tipoIdentificacion: z.enum(TIPOS_IDENTIFICACION, {
      message: 'Selecciona el tipo de identificación',
    }),
    documento: z.string().trim().min(3, REQ).max(40),
    email: emailOpcional,
    telefono: telefonoOpcional,
    alergias: z.string().max(500).optional().or(z.literal('')),
    tieneHermanos: z.enum(['si', 'no'], {
      message: 'Indica si tiene hermanos inscritos',
    }),
    nombreHermano: z.string().trim().max(120).optional().or(z.literal('')),
    categoria: z.enum(CATEGORIAS, {
      message: 'Selecciona la categoría solicitada',
    }),
  })
  .refine(
    (d) =>
      d.tieneHermanos !== 'si' ||
      (typeof d.nombreHermano === 'string' && d.nombreHermano.trim().length >= 2),
    {
      path: ['nombreHermano'],
      message: 'Indica el nombre del hermano inscrito',
    },
  )
  .superRefine((d, ctx) => {
    if (
      (d.tipoIdentificacion === 'DNI' || d.tipoIdentificacion === 'NIE') &&
      !isValidDniNie(d.documento)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['documento'],
        message: 'El DNI/NIE del deportista no es válido',
      })
    }
  })

export type DeportistaFormValues = z.infer<typeof deportistaSchema>

const passwordSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe incluir una mayúscula')
  .regex(/[a-z]/, 'Debe incluir una minúscula')
  .regex(/\d/, 'Debe incluir un número')

export const tutorProfileSchema = z.object({
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
  documento: dniNieSchema,
  direccion: z.string().trim().min(3, 'Introduce una dirección válida').max(120),
  codigoPostal: z.string().trim().regex(CP_ES, 'Código postal español no válido'),
  provincia: z.string().trim().min(2, REQ).max(60),
  ciudad: z.string().trim().min(2, REQ).max(60),
  pais: z.string().trim().min(2, REQ).max(60),
  preferenciaPago: z.enum(['cuotas', 'unico'], {
    message: 'Selecciona una preferencia de pago',
  }),
})

export type TutorProfileFormValues = z.infer<typeof tutorProfileSchema>

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
    documento: dniNieSchema,
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
    aceptaPrivacidad: z.boolean().refine((v) => v === true, {
      message: 'Debes aceptar la política de privacidad',
    }),
    aceptaCondiciones: z.boolean().refine((v) => v === true, {
      message: 'Debes aceptar las condiciones de matrícula',
    }),
    consienteDatosMenor: z.boolean().refine((v) => v === true, {
      message: 'Debes autorizar el tratamiento de datos del menor',
    }),
    consienteDatosSalud: z.boolean().refine((v) => v === true, {
      message: 'Debes autorizar el tratamiento de datos de salud y alergias',
    }),
    autorizaImagenes: z.boolean(),
    consienteMetodoPago: z.boolean().refine((v) => v === true, {
      message:
        'Debes autorizar guardar el método de pago para futuras cuotas',
    }),
    deportistas: z
      .array(deportistaSchema)
      .min(1, 'Debes añadir al menos un deportista'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden',
  })

export type RegistroFormValues = z.infer<typeof registroSchema>
