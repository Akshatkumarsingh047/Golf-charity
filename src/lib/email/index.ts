import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'GolfDraw <onboarding@resend.dev>'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html })
    if (error) console.error('Email send error:', error)
    return !error
  } catch (err) {
    console.error('Email service error:', err)
    return false
  }
}

// ─── Email templates ──────────────────────────────────────────────────────────
const base = (content: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0a0a0f;color:#e8e8f0;font-family:'Segoe UI',sans-serif;margin:0;padding:40px 20px">
  <div style="max-width:560px;margin:0 auto">
    <div style="margin-bottom:24px">
      <div style="display:inline-flex;align-items:center;gap:8px">
        <div style="width:32px;height:32px;background:#a8ff3e;border-radius:8px;display:flex;align-items:center;justify-content:center">
          <span style="color:#0a0a0f;font-weight:bold;font-size:16px">G</span>
        </div>
        <span style="font-size:20px;font-weight:700;color:#e8e8f0">GolfDraw</span>
      </div>
    </div>
    <div style="background:#1a1a26;border:1px solid #2a2a3a;border-radius:16px;padding:32px">
      ${content}
    </div>
    <p style="color:#6b7280;font-size:12px;text-align:center;margin-top:24px">
      © ${new Date().getFullYear()} GolfDraw. You received this because you have an active account.
    </p>
  </div>
</body>
</html>`

const cta = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#a8ff3e;color:#0a0a0f;padding:14px 28px;border-radius:100px;font-weight:700;text-decoration:none;margin-top:20px">${label}</a>`

export const emailTemplates = {
  welcome: (name: string) => base(`
    <h1 style="color:#e8e8f0;font-size:24px;margin:0 0 8px">Welcome to GolfDraw, ${name}! 🎉</h1>
    <p style="color:#9999b0;line-height:1.6">Your account is ready. Subscribe to start entering monthly draws and supporting your chosen charity.</p>
    ${cta(`${process.env.NEXT_PUBLIC_APP_URL}/pricing`, 'Choose Your Plan')}
  `),

  subscriptionActivated: (name: string) => base(`
    <h1 style="color:#a8ff3e;font-size:24px;margin:0 0 8px">You're in! 🏌️</h1>
    <p style="color:#e8e8f0;font-weight:600;margin-bottom:8px">Hi ${name},</p>
    <p style="color:#9999b0;line-height:1.6">Your subscription is now active. Start adding your Stableford scores to enter this month's draw.</p>
    ${cta(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/scores`, 'Add Your Scores')}
  `),

  paymentFailed: (name: string) => base(`
    <h1 style="color:#ff5e5e;font-size:24px;margin:0 0 8px">Payment Failed</h1>
    <p style="color:#e8e8f0;font-weight:600;margin-bottom:8px">Hi ${name},</p>
    <p style="color:#9999b0;line-height:1.6">We couldn't process your latest payment. Please update your payment details to keep your access and draw entries active.</p>
    ${cta(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`, 'Update Payment Details')}
  `),

  drawResults: (name: string, winningNumbers: number[], matched: number | null) => base(`
    <h1 style="color:#e8e8f0;font-size:24px;margin:0 0 8px">This month's draw is in! 🎲</h1>
    <p style="color:#e8e8f0;font-weight:600;margin-bottom:8px">Hi ${name},</p>
    <p style="color:#9999b0;line-height:1.6">The winning numbers for this month are:</p>
    <div style="display:flex;gap:8px;margin:16px 0;flex-wrap:wrap">
      ${winningNumbers.map(n => `<span style="width:40px;height:40px;background:#a8ff3e;color:#0a0a0f;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:18px">${n}</span>`).join('')}
    </div>
    ${matched ? `<p style="color:#a8ff3e;font-weight:700;font-size:18px">🎉 You matched ${matched} number${matched > 1 ? 's' : ''}!</p>` : `<p style="color:#9999b0">You didn't match this month — keep playing!</p>`}
    ${cta(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/draws`, 'View Draw Results')}
  `),

  winnerNotification: (name: string, matchCount: number, prizeAmount: number) => base(`
    <h1 style="color:#f0c040;font-size:28px;margin:0 0 8px">You're a winner! 🏆</h1>
    <p style="color:#e8e8f0;font-weight:600;margin-bottom:8px">Congratulations ${name}!</p>
    <p style="color:#9999b0;line-height:1.6">You matched <strong style="color:#e8e8f0">${matchCount} numbers</strong> and won <strong style="color:#a8ff3e">€${prizeAmount.toFixed(2)}</strong>!</p>
    <p style="color:#9999b0;line-height:1.6">To claim your prize, please upload a screenshot of your scores from your golf platform.</p>
    ${cta(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/winnings`, 'Upload Proof & Claim Prize')}
  `),

  winnerApproved: (name: string, prizeAmount: number) => base(`
    <h1 style="color:#a8ff3e;font-size:24px;margin:0 0 8px">Prize Approved! 💸</h1>
    <p style="color:#e8e8f0;font-weight:600;margin-bottom:8px">Hi ${name},</p>
    <p style="color:#9999b0;line-height:1.6">Your proof has been verified. Your prize of <strong style="color:#a8ff3e">€${prizeAmount.toFixed(2)}</strong> is being processed and will be paid shortly.</p>
    ${cta(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/winnings`, 'Track Your Payout')}
  `),

  winnerRejected: (name: string, notes: string | null) => base(`
    <h1 style="color:#ff5e5e;font-size:24px;margin:0 0 8px">Proof Not Accepted</h1>
    <p style="color:#e8e8f0;font-weight:600;margin-bottom:8px">Hi ${name},</p>
    <p style="color:#9999b0;line-height:1.6">Unfortunately your proof submission was not accepted.</p>
    ${notes ? `<p style="color:#9999b0;background:#12121a;padding:12px;border-radius:8px;font-style:italic">"${notes}"</p>` : ''}
    <p style="color:#9999b0">Please contact support if you believe this is an error.</p>
  `),

  payoutPaid: (name: string, prizeAmount: number) => base(`
    <h1 style="color:#a8ff3e;font-size:24px;margin:0 0 8px">Payout Sent! 🎊</h1>
    <p style="color:#e8e8f0;font-weight:600;margin-bottom:8px">Hi ${name},</p>
    <p style="color:#9999b0;line-height:1.6">Your prize of <strong style="color:#a8ff3e">€${prizeAmount.toFixed(2)}</strong> has been paid. Well played!</p>
    ${cta(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/scores`, 'Keep Playing')}
  `),
}
