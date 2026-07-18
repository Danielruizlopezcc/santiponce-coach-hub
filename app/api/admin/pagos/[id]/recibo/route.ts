import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getAdminPaymentReceiptData } from '@/lib/admin-app'
import { generatePaymentReceiptPdf } from '@/lib/receipt-pdf'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()

  const { id } = await params
  const receipt = await getAdminPaymentReceiptData(id)

  if (!receipt) {
    return NextResponse.json({ error: 'No se ha encontrado el pago.' }, { status: 404 })
  }

  const pdfBytes = await generatePaymentReceiptPdf(receipt)

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="recibo-${receipt.id}.pdf"`,
    },
  })
}
