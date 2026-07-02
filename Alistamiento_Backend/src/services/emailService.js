const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const enviarCredenciales = async (correo, nombre, contrasena) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'dhanymarth@gmail.com',
        pass: 'jrcw dlsh kujj wjrw',
      },
    });

    await transporter.sendMail({
      from: '"NodoRap" <dhanymarth@gmail.com>',
      to: correo,
      subject: 'Tus Credenciales para NodoRap',
      html: `
        <h2>Bienvenido/a ${nombre}</h2>
        <p>Estas son tus credenciales para ingresar a <b>NodoRap</b>:</p>
        <p><b>Correo:</b> ${correo}</p>
        <p><b>Contraseña:</b> ${contrasena}</p>

        <br/>
        <p>Por seguridad cambia tu contraseña cuando ingreses.</p>
      `,
    });

    logger.info('Correo de credenciales enviado correctamente');
  } catch (err) {
    logger.error('Error enviando correo', { stack: err.stack });
  }
};

module.exports = { enviarCredenciales };
