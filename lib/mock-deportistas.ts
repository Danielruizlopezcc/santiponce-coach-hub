import { CLUB, MATRICULA_IMPORTE } from '@/lib/club'

export type EstadoDeportista = 'pendiente' | 'matriculado' | 'en_revision'
export type EstadoPago = 'pagado' | 'pendiente'

export type DeportistaTutor = {
  id: string
  nombre: string
  apellidos: string
  fechaNacimiento: string
  tipoIdentificacion: 'DNI' | 'NIE' | 'Pasaporte' | 'Otro'
  documento: string
  email: string
  telefono: string
  alergias: string
  tieneHermanos: 'si' | 'no'
  nombreHermano: string
  categoriaSolicitada: string
  equipoAsignado: string | null
  temporada: string
  estado: EstadoDeportista
  pagoEstado: EstadoPago
}

export const CATEGORIAS_DISPONIBLES = [
  'Bebés',
  'Prebenjamín',
  'Benjamín',
  'Alevín',
  'Infantil',
  'Cadete',
  'Juvenil',
] as const

export const ESTADOS_DEPORTISTA: {
  value: EstadoDeportista
  label: string
}[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'matriculado', label: 'Matriculado' },
  { value: 'en_revision', label: 'En revisión' },
]

export const ESTADOS_PAGO: { value: EstadoPago; label: string }[] = [
  { value: 'pagado', label: 'Pagada' },
  { value: 'pendiente', label: 'Pendiente' },
]

export const MOCK_DEPORTISTAS_TUTOR: DeportistaTutor[] = [
  {
    id: 'dep-alba-garcia',
    nombre: 'Alba',
    apellidos: 'García López',
    fechaNacimiento: '2014-05-17',
    tipoIdentificacion: 'DNI',
    documento: '12345678A',
    email: '',
    telefono: '',
    alergias: 'Alergia leve a frutos secos.',
    tieneHermanos: 'si',
    nombreHermano: 'Hugo García López',
    categoriaSolicitada: 'Infantil',
    equipoAsignado: null,
    temporada: CLUB.season,
    estado: 'pendiente',
    pagoEstado: 'pendiente',
  },
  {
    id: 'dep-hugo-garcia',
    nombre: 'Hugo',
    apellidos: 'García López',
    fechaNacimiento: '2017-09-04',
    tipoIdentificacion: 'DNI',
    documento: '23456789B',
    email: '',
    telefono: '',
    alergias: '',
    tieneHermanos: 'si',
    nombreHermano: 'Alba García López',
    categoriaSolicitada: 'Benjamín',
    equipoAsignado: 'Benjamín A',
    temporada: CLUB.season,
    estado: 'matriculado',
    pagoEstado: 'pagado',
  },
  {
    id: 'dep-irene-garcia',
    nombre: 'Irene',
    apellidos: 'García López',
    fechaNacimiento: '2012-02-28',
    tipoIdentificacion: 'Pasaporte',
    documento: 'PA-492021',
    email: 'irene.familia@ejemplo.com',
    telefono: '612345678',
    alergias: 'Asma leve en esfuerzos prolongados.',
    tieneHermanos: 'no',
    nombreHermano: '',
    categoriaSolicitada: 'Cadete',
    equipoAsignado: null,
    temporada: CLUB.season,
    estado: 'en_revision',
    pagoEstado: 'pendiente',
  },
]

export const MATRICULA_INFO = {
  temporada: CLUB.season,
  importe: MATRICULA_IMPORTE,
  mensajeWebhook:
    'La confirmación definitiva del pago se realizará de forma segura cuando Stripe notifique el pago al sistema.',
} as const

export function getDeportistaById(id: string) {
  return MOCK_DEPORTISTAS_TUTOR.find((deportista) => deportista.id === id)
}

export function canMatricularDeportista(deportista: DeportistaTutor) {
  return deportista.estado !== 'matriculado'
}
