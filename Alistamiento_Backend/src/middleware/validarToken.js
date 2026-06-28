const jwt = require('jsonwebtoken');
const config = require('../config/env');

function validarToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).json({ error: 'Token requerido' });

    jwt.verify(token, config.jwtSecret, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Token inválido' });

        req.user = decoded; //datos del usuario
        next();
    });
}

module.exports = validarToken;