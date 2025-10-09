const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - Password reset token
 * @param {string} firstName - User's first name
 */
const sendPasswordResetEmail = async (email, resetToken, firstName) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Tilbakestill passord - Voluplan',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Voluplan</h1>
          </div>
          <div class="content">
            <h2>Hei ${firstName}!</h2>
            <p>Vi mottok en forespørsel om å tilbakestille passordet ditt.</p>
            <p>Klikk på knappen nedenfor for å opprette et nytt passord:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Tilbakestill passord</a>
            </div>
            <p>Eller kopier og lim inn denne lenken i nettleseren din:</p>
            <p style="word-break: break-all; color: #1976d2;">${resetUrl}</p>
            <p><strong>Denne lenken er gyldig i 1 time.</strong></p>
            <p>Hvis du ikke ba om å tilbakestille passordet ditt, kan du ignorere denne e-posten.</p>
            <p>Med vennlig hilsen,<br>Voluplan-teamet</p>
          </div>
          <div class="footer">
            <p>Dette er en automatisk generert e-post. Vennligst ikke svar på denne meldingen.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hei ${firstName}!

      Vi mottok en forespørsel om å tilbakestille passordet ditt.

      Klikk på lenken nedenfor for å opprette et nytt passord:
      ${resetUrl}

      Denne lenken er gyldig i 1 time.

      Hvis du ikke ba om å tilbakestille passordet ditt, kan du ignorere denne e-posten.

      Med vennlig hilsen,
      Voluplan-teamet
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail,
};

