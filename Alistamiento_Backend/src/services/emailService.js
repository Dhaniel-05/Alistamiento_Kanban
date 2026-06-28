const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const enviarCredenciales = async (correo, nombre, contrasena) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'juanpaz1085@gmail.com',
        pass: 'lbrf zltz demk hfkn',
      },
    });

    await transporter.sendMail({
      from: '"NodoRap" <juanpaz1085@gmail.com@gmail.com>',
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
