import nodemailer from 'nodemailer'

type SendEmailInput = {
  to: string
  subject: string
  text: string
}

export async function sendEmail({ to, subject, text }: SendEmailInput) {
  const gmailUser = process.env.GMAIL_USER
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD

  if (gmailUser && gmailAppPassword) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    })

    await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? gmailUser,
      to,
      subject,
      text,
    })
    return
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL ?? process.env.EMAIL_FROM

  if (!apiKey || !from) {
    throw new Error('Falta configurar GMAIL_USER y GMAIL_APP_PASSWORD para enviar desde Gmail, o RESEND_API_KEY y RESEND_FROM_EMAIL para enviar con Resend.')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'No se ha podido enviar el email.')
  }
}
