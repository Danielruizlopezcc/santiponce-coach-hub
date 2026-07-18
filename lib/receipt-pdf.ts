import 'server-only'

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { AdminPaymentReceiptData } from '@/lib/admin-app'

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 56

const STATUS_LABELS: Record<AdminPaymentReceiptData['estado'], string> = {
  pagado: 'PAGADO',
  pendiente: 'PENDIENTE',
  fallido: 'FALLIDO',
  reembolsado: 'REEMBOLSADO',
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: currency.toUpperCase() }).format(amount)
}

export async function generatePaymentReceiptPdf(receipt: AdminPaymentReceiptData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  const ink = rgb(0.04, 0.09, 0.19)
  const muted = rgb(0.42, 0.45, 0.52)
  const primary = rgb(0.05, 0.15, 0.4)

  let y = PAGE_HEIGHT - MARGIN

  const drawText = (
    text: string,
    options: { size?: number; font?: typeof fontRegular; color?: ReturnType<typeof rgb>; x?: number } = {},
  ) => {
    page.drawText(text, {
      x: options.x ?? MARGIN,
      y,
      size: options.size ?? 11,
      font: options.font ?? fontRegular,
      color: options.color ?? ink,
    })
  }

  const { settings } = receipt

  drawText(settings.clubLegalName || settings.clubShortName, { size: 16, font: fontBold, color: primary })
  y -= 18
  if (settings.clubTaxId) {
    drawText(`CIF/NIF: ${settings.clubTaxId}`, { size: 9, color: muted })
    y -= 13
  }
  if (settings.clubFiscalAddress) {
    drawText(settings.clubFiscalAddress, { size: 9, color: muted })
    y -= 13
  }
  if (settings.clubRegistryNumber) {
    drawText(`Registro de entidades deportivas: ${settings.clubRegistryNumber}`, { size: 9, color: muted })
    y -= 13
  }

  y -= 20
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 1,
    color: rgb(0.85, 0.87, 0.9),
  })
  y -= 34

  drawText('RECIBO DE PAGO', { size: 20, font: fontBold })
  y -= 20
  drawText(`Referencia: ${receipt.id}`, { size: 9, color: muted })
  y -= 13
  drawText(`Fecha: ${receipt.fecha}`, { size: 9, color: muted })
  y -= 36

  const statusLabel = STATUS_LABELS[receipt.estado]
  drawText('Estado', { size: 9, font: fontBold, color: muted })
  y -= 15
  drawText(statusLabel, { size: 13, font: fontBold, color: receipt.estado === 'pagado' ? rgb(0.02, 0.45, 0.28) : ink })
  y -= 32

  const row = (label: string, value: string) => {
    drawText(label, { size: 9, font: fontBold, color: muted })
    y -= 15
    drawText(value || '—', { size: 12 })
    y -= 26
  }

  row('Pagado por', receipt.tutorNombre)
  if (receipt.tutorNif) row('NIF/DNI', receipt.tutorNif)
  if (receipt.deportistaNombre) row('Deportista', receipt.deportistaNombre)
  row('Concepto', receipt.concepto)
  if (receipt.temporadaNombre) row('Temporada', receipt.temporadaNombre)
  row('Método de cobro', receipt.proveedor)

  y -= 10
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 1,
    color: rgb(0.85, 0.87, 0.9),
  })
  y -= 34

  drawText('Importe total', { size: 9, font: fontBold, color: muted })
  y -= 22
  drawText(formatMoney(receipt.importe, receipt.currency), { size: 22, font: fontBold, color: primary })

  page.drawText('Documento generado automáticamente por la gestión interna del club.', {
    x: MARGIN,
    y: MARGIN,
    size: 8,
    font: fontRegular,
    color: muted,
  })

  return doc.save()
}
