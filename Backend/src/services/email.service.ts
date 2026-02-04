/**
 * Servicio de envío de correos electrónicos
 */

import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Configuración del transporter de nodemailer
const createTransporter = () => {
  // Usar variables de entorno o configuración por defecto
  const config: EmailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true para 465, false para otros puertos
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || '', // Contraseña de aplicación para Gmail
    },
  };

  return nodemailer.createTransport(config);
};

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Envía un correo electrónico
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter();

    // Verificar configuración
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️ EMAIL_USER o EMAIL_PASS no configurados. El correo no se enviará.');
      return {
        success: false,
        error: 'Configuración de correo no disponible'
      };
    }

    const mailOptions = {
      from: `"SENA Alistamiento" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Versión texto plano
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Correo enviado:', info.messageId);

    return { success: true };
  } catch (error: any) {
    console.error('❌ Error enviando correo:', error);
    return {
      success: false,
      error: error.message || 'Error al enviar correo'
    };
  }
}

/**
 * Envía correo de bienvenida a un instructor con sus credenciales
 */
export async function sendInstructorWelcomeEmail(
  email: string,
  nombre: string,
  usuario: string,
  contrasena: string,
  fichasAsignadas?: string[]
): Promise<{ success: boolean; error?: string }> {
  const fichasList = fichasAsignadas && fichasAsignadas.length > 0
    ? fichasAsignadas.map(f => `<li>${f}</li>`).join('')
    : '<li>No hay fichas asignadas aún</li>';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2E7D32; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; }
        .credentials { background-color: white; padding: 15px; border-left: 4px solid #2E7D32; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2E7D32; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SENA - Sistema de Alistamiento</h1>
        </div>
        <div class="content">
          <h2>Bienvenido, ${nombre}</h2>
          <p>Has sido registrado como <strong>Instructor</strong> en el Sistema de Alistamiento SENA.</p>
          
          <div class="credentials">
            <h3>🔐 Tus credenciales de acceso:</h3>
            <p><strong>Usuario:</strong> ${usuario}</p>
            <p><strong>Contraseña temporal:</strong> ${contrasena}</p>
            <p style="color: #d32f2f; font-size: 14px;"><strong>⚠️ Importante:</strong> Por seguridad, cambia tu contraseña después del primer inicio de sesión.</p>
          </div>

          ${fichasAsignadas && fichasAsignadas.length > 0 ? `
          <h3>📋 Fichas asignadas:</h3>
          <ul>
            ${fichasList}
          </ul>
          ` : ''}

          <p>Puedes acceder al sistema en: <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">${process.env.FRONTEND_URL || 'http://localhost:5173'}</a></p>
          
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">Iniciar Sesión</a>
        </div>
        <div class="footer">
          <p>Este es un correo automático, por favor no responder.</p>
          <p>SENA - Sistema de Alistamiento</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Bienvenido al Sistema de Alistamiento SENA - Credenciales de Acceso',
    html,
  });
}

/**
 * Envía correo de recuperación de contraseña con token JWT
 */
export async function sendPasswordResetEmail(
  email: string,
  nombre: string,
  resetToken: string
): Promise<{ success: boolean; error?: string }> {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #39A900 0%, #2E7D32 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #39A900; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
        .link-box { word-break: break-all; background: #fff; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 Recuperación de Contraseña</h1>
          <p>Sistema de Alistamiento SENA</p>
        </div>
        <div class="content">
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
          <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
          </div>
          <p>O copia y pega este enlace en tu navegador:</p>
          <p class="link-box">${resetUrl}</p>
          <div class="warning">
            <strong>⚠️ Importante:</strong>
            <ul>
              <li>Este enlace expirará en <strong>1 hora</strong></li>
              <li>Si no solicitaste este cambio, ignora este correo</li>
              <li>Tu contraseña actual seguirá siendo válida hasta que la cambies</li>
            </ul>
          </div>
          <p>Si tienes problemas, contacta al administrador del sistema.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} SENA - Servicio Nacional de Aprendizaje</p>
          <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Recuperación de Contraseña - Sistema de Alistamiento SENA',
    html,
  });
}

export default {
  sendEmail,
  sendInstructorWelcomeEmail,
  sendPasswordResetEmail,
};
