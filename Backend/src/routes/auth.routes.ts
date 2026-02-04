import { Router } from 'express';
import { login, getAllUsers, me, logout, register, requestPasswordReset, resetPassword } from '../controllers/auth.controller';
import requireAuth from '../middleware/auth.middleware';
import { query } from '../config/database';

const router = Router();

// Endpoint temporal para crear tabla planeacion_resultados
router.get('/setup-db', async (req, res) => {
    try {
        await query(`
      CREATE TABLE IF NOT EXISTS planeacion_resultados (
        id_planeacion INT AUTO_INCREMENT PRIMARY KEY,
        id_ficha INT NOT NULL,
        id_resultado INT NOT NULL,
        fase VARCHAR(50),
        instructor_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_ficha_resultado (id_ficha, id_resultado),
        FOREIGN KEY (id_ficha) REFERENCES fichas(id_ficha) ON DELETE CASCADE,
        FOREIGN KEY (id_resultado) REFERENCES resultado_de_aprendizaje(id_resultado) ON DELETE CASCADE,
        FOREIGN KEY (instructor_id) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
      )
    `);
        res.json({ success: true, message: 'Tabla planeacion_resultados creada' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', requireAuth, me);
router.post('/logout', requireAuth, logout);
router.get('/users', requireAuth, getAllUsers);

export default router;
