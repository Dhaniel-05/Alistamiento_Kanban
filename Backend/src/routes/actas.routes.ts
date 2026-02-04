import { Router } from 'express';
import { query } from '../config/database';
import requireAuth from '../middleware/auth.middleware';
import ExcelJS from 'exceljs';

const router: Router = Router();

// Proteger todas las rutas
router.use(requireAuth);

/**
 * GET /api/actas
 * Obtener todas las actas de una ficha
 */
router.get('/', async (req, res) => {
    try {
        const { id_ficha } = req.query;

        let sql = `
      SELECT 
        a.*,
        f.codigo_ficha,
        f.nombre_ficha,
        u.nom_completo as creador_nombre
      FROM acta a
      LEFT JOIN fichas f ON a.id_ficha = f.id_ficha
      LEFT JOIN usuarios u ON a.creado_por = u.id_usuario
    `;

        const params: any[] = [];

        if (id_ficha) {
            sql += ' WHERE a.id_ficha = ?';
            params.push(id_ficha);
        }

        sql += ' ORDER BY a.fecha_sesion DESC';

        const actas = await query(sql, params);

        res.json({ success: true, data: actas });
    } catch (error) {
        console.error('Error al obtener actas:', error);
        res.status(500).json({ success: false, error: 'Error al obtener actas' });
    }
});

/**
 * GET /api/actas/:id
 * Obtener una acta específica
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [acta]: any = await query(`
      SELECT 
        a.*,
        f.codigo_ficha,
        f.nombre_ficha,
        u.nom_completo as creador_nombre
      FROM acta a
      LEFT JOIN fichas f ON a.id_ficha = f.id_ficha
      LEFT JOIN usuarios u ON a.creado_por = u.id_usuario
      WHERE a.id_acta = ?
    `, [id]);

        if (!acta || acta.length === 0) {
            return res.status(404).json({ success: false, error: 'Acta no encontrada' });
        }

        res.json({ success: true, data: acta[0] });
    } catch (error) {
        console.error('Error al obtener acta:', error);
        res.status(500).json({ success: false, error: 'Error al obtener acta' });
    }
});

/**
 * POST /api/actas
 * Crear una nueva acta
 */
router.post('/', async (req, res) => {
    try {
        const user = (req as any).user;
        const {
            id_ficha,
            numero_acta,
            fecha_sesion,
            asistentes,
            orden_del_dia,
            desarrollo,
            compromisos
        } = req.body;

        const [result]: any = await query(`
      INSERT INTO acta (
        id_ficha,
        numero_acta,
        fecha_sesion,
        asistentes,
        orden_del_dia,
        desarrollo,
        compromisos,
        creado_por
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            id_ficha,
            numero_acta,
            fecha_sesion,
            asistentes,
            orden_del_dia,
            desarrollo,
            compromisos,
            user.id_usuario
        ]);

        res.json({ success: true, data: { id_acta: result.insertId } });
    } catch (error) {
        console.error('Error al crear acta:', error);
        res.status(500).json({ success: false, error: 'Error al crear acta' });
    }
});

/**
 * PUT /api/actas/:id
 * Actualizar un acta
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            numero_acta,
            fecha_sesion,
            asistentes,
            orden_del_dia,
            desarrollo,
            compromisos
        } = req.body;

        await query(`
      UPDATE acta SET
        numero_acta = ?,
        fecha_sesion = ?,
        asistentes = ?,
        orden_del_dia = ?,
        desarrollo = ?,
        compromisos = ?
      WHERE id_acta = ?
    `, [
            numero_acta,
            fecha_sesion,
            asistentes,
            orden_del_dia,
            desarrollo,
            compromisos,
            id
        ]);

        res.json({ success: true });
    } catch (error) {
        console.error('Error al actualizar acta:', error);
        res.status(500).json({ success: false, error: 'Error al actualizar acta' });
    }
});

/**
 * DELETE /api/actas/:id
 * Eliminar un acta
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await query('DELETE FROM acta WHERE id_acta = ?', [id]);

        res.json({ success: true });
    } catch (error) {
        console.error('Error al eliminar acta:', error);
        res.status(500).json({ success: false, error: 'Error al eliminar acta' });
    }
});

/**
 * GET /api/actas/:id/export/word
 * Exportar acta a Word
 */
router.get('/:id/export/word', async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener datos del acta
        const [acta]: any = await query(`
      SELECT 
        a.*,
        f.codigo_ficha,
        f.nombre_ficha,
        u.nom_completo as creador_nombre
      FROM acta a
      LEFT JOIN fichas f ON a.id_ficha = f.id_ficha
      LEFT JOIN usuarios u ON a.creado_por = u.id_usuario
      WHERE a.id_acta = ?
    `, [id]);

        if (!acta || acta.length === 0) {
            return res.status(404).json({ success: false, error: 'Acta no encontrada' });
        }

        const actaData = acta[0];

        // Crear documento Word simple (sin plantilla por ahora)
        const content = `
ACTA N° ${actaData.numero_acta}
FICHA: ${actaData.codigo_ficha} - ${actaData.nombre_ficha}

FECHA DE SESIÓN: ${new Date(actaData.fecha_sesion).toLocaleDateString('es-CO')}

ASISTENTES:
${actaData.asistentes}

ORDEN DEL DÍA:
${actaData.orden_del_dia}

DESARROLLO:
${actaData.desarrollo}

COMPROMISOS:
${actaData.compromisos}

Creado por: ${actaData.creador_nombre}
Fecha de creación: ${new Date(actaData.fecha_creacion).toLocaleDateString('es-CO')}
    `;

        // Por ahora retornamos texto plano
        // TODO: Implementar generación real con docxtemplater
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="Acta_${actaData.numero_acta}.txt"`);
        res.send(content);

    } catch (error) {
        console.error('Error al exportar acta:', error);
        res.status(500).json({ success: false, error: 'Error al exportar acta' });
    }
});

/**
 * GET /api/planeacion/export/excel
 * Exportar planeación pedagógica a Excel (desde resultados de aprendizaje)
 */
router.get('/planeacion/export/excel', requireAuth, async (req, res) => {
    try {
        const { id_ficha, fase } = req.query as { id_ficha?: string; fase?: string };

        if (!id_ficha || !fase) {
            return res.status(400).json({ success: false, error: 'Se requieren id_ficha y fase' });
        }

        const normalizeText = (text?: string | null) => {
            if (!text) return '';
            return text
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .trim();
        };

        const stripPhaseVariant = (text: string) => text.replace(/\s*\d+$/, '').trim();

        // Normalizar la fase que viene del frontend (ej: "Análisis 1" -> "analisis 1" -> "analisis")
        const normalizedPhase = normalizeText(fase);
        const normalizedPhaseCore = stripPhaseVariant(normalizedPhase);

        // Obtener resultados de la ficha con los campos de detalle
        const resultadosRaw: any[] = await query(`
      SELECT 
        r.id_resultado,
        r.nombre_resultado,
        r.fase_base,
        r.fase_vista,
        r.id_competencia,
        r.conocimientos_saber,
        r.conocimientos_proceso,
        r.criterios_evaluacion,
        r.actividad_aprendizaje,
        r.evidencia_aprendizaje,
        r.estrategias_didacticas,
        r.materiales_formacion,
        r.actividad_proyecto,
        c.norma_competencia,
        c.nombre_competencia,
        c.codigo_competencia,
        c.duracion_competencia,
        f.codigo_ficha,
        f.nombre_ficha,
        f.ambiente,
        f.jornada,
        f.modalidad_formacion,
        u.ini_nom as instructor_iniciales,
        u.nom_completo as instructor_nombre,
        p.nombre_programa,
        p.codigo_programa,
        p.version,
        pf.nombre_proyecto,
        pf.codigo_proyecto,
        -- Calcular horas: (duracion_competencia / cantidad de resultados ÚNICOS de esa competencia) / veces que se repite este nombre_resultado en la ficha
        CASE 
          WHEN (SELECT COUNT(DISTINCT r2.nombre_resultado) FROM resultado_de_aprendizaje r2 WHERE r2.id_competencia = r.id_competencia AND r2.id_ficha = ?) > 0
            AND (SELECT COUNT(*) FROM resultado_de_aprendizaje r3 WHERE r3.nombre_resultado = r.nombre_resultado AND r3.id_ficha = ?) > 0
          THEN (CAST(c.duracion_competencia AS DECIMAL(10,2)) / (SELECT COUNT(DISTINCT r2.nombre_resultado) FROM resultado_de_aprendizaje r2 WHERE r2.id_competencia = r.id_competencia AND r2.id_ficha = ?)) 
               / (SELECT COUNT(*) FROM resultado_de_aprendizaje r3 WHERE r3.nombre_resultado = r.nombre_resultado AND r3.id_ficha = ?)
          ELSE 0
        END as horas_calculadas
      FROM resultado_de_aprendizaje r
      INNER JOIN competencias c ON r.id_competencia = c.id_competencia
      INNER JOIN fichas f ON r.id_ficha = f.id_ficha
      LEFT JOIN programa_formativo p ON f.id_programa = p.id_programa
      LEFT JOIN proyecto_formativo pf ON p.id_programa = pf.id_programa
      LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
      WHERE r.id_ficha = ?
      ORDER BY r.actividad_proyecto, c.norma_competencia, r.nombre_resultado
    `, [id_ficha, id_ficha, id_ficha, id_ficha, id_ficha]);

        // Obtener instructores con rol "Equipo Ejecutor" asignados a la ficha
        const instructores: any[] = await query(`
      SELECT u.nom_completo
      FROM asignar_crear_fichas a
      INNER JOIN usuarios u ON a.id_usuario = u.id_usuario
      WHERE a.id_ficha = ? AND a.rol_ficha = 'Equipo Ejecutor'
      ORDER BY u.nom_completo
    `, [id_ficha]);

        // Filtrar resultados que coincidan con la fase solicitada
        // Si la fase solicitada incluye número (ej: 'analisis 1'), requerir coincidencia exacta
        // Si la fase solicitada no incluye número (ej: 'analisis'), aceptar coincidencias por core (analisis 1, analisis 2, etc.)
        const hasNumberInRequested = /\d+$/.test(normalizedPhase);

        const resultados = resultadosRaw.filter((item) => {
            const faseVista = normalizeText(item.fase_vista);
            const faseBase = normalizeText(item.fase_base);

            // Si la fase solicitada termina en " 1", la base de datos la almacena SIN el número
            // Ejemplo: "Análisis 1" → "analisis" (sin el 1)
            // Pero "Análisis 2" → "analisis 2" (con el 2)
            let phaseToMatch = normalizedPhase;
            if (normalizedPhase.match(/\s+1$/)) {
                // Remover el " 1" al final para coincidir con la base de datos
                phaseToMatch = normalizedPhase.replace(/\s+1$/, '').trim();
            }

            // Comparar directamente la fase normalizada
            return faseVista === phaseToMatch || faseBase === phaseToMatch;
        });

        if (!resultados || resultados.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Esta fase no tiene resultados de aprendizaje asignados.'
            });
        }

        // Crear libro de Excel
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Sistema de Alistamiento SENA';
        workbook.created = new Date();

        const fechaActual = new Date().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });

        // Extraer datos del programa y proyecto del primer resultado
        const firstResult = resultados[0];
        const programaNombre = firstResult.nombre_programa || 'No definido';
        const modalidadFormacion = firstResult.modalidad_formacion || 'No definida';
        const codigoPrograma = firstResult.codigo_programa || '0';
        const versionPrograma = firstResult.version || '0';
        const proyectoNombre = firstResult.nombre_proyecto || 'No definido';
        const proyectoCodigo = firstResult.codigo_proyecto || '0';

        const worksheet = workbook.addWorksheet('Planeación Pedagógica');

        // Configurar título (Filas 1 y 2 combinadas)
        worksheet.mergeCells('A1:O2');
        worksheet.getCell('A1').value = 'FORMATO PARA LA PLANEACIÓN PEDAGÓGICA DEL PROYECTO FORMATIVO';
        worksheet.getCell('A1').font = { bold: true, size: 12 };

        // Versión y Código (Columna P)
        worksheet.getCell('P1').value = 'Versión: 04';
        worksheet.getCell('P1').font = { bold: true, size: 10 };

        worksheet.getCell('P2').value = 'Código: GFPI-F-134';
        worksheet.getCell('P2').font = { bold: true, size: 10 };

        // Fila 3: Vacía combinada
        worksheet.mergeCells('A3:P3');

        // Fila 4: Vacía combinada
        worksheet.mergeCells('A4:P4');

        // Fila 5: Fecha de Elaboración
        worksheet.mergeCells('A5:D5');
        worksheet.getCell('A5').value = 'Fecha de Elaboración';
        worksheet.getCell('A5').font = { bold: true };
        worksheet.getCell('A5').alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.mergeCells('E5:P5');
        worksheet.getCell('E5').value = fechaActual;
        worksheet.getCell('E5').alignment = { vertical: 'middle', horizontal: 'center' };

        // Fila 6: Denominación del Programa
        worksheet.mergeCells('A6:D6');
        worksheet.getCell('A6').value = 'Denominación del Programa de Formación';
        worksheet.getCell('A6').font = { bold: true };
        worksheet.getCell('A6').alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.mergeCells('E6:P6');
        worksheet.getCell('E6').value = programaNombre;
        worksheet.getCell('E6').alignment = { vertical: 'middle', horizontal: 'center' };

        // Fila 7: Modalidad de Formación
        worksheet.mergeCells('A7:D7');
        worksheet.getCell('A7').value = 'Modalidad de Formación';
        worksheet.getCell('A7').font = { bold: true };
        worksheet.getCell('A7').alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.mergeCells('E7:P7');
        worksheet.getCell('E7').value = modalidadFormacion;
        worksheet.getCell('E7').alignment = { vertical: 'middle', horizontal: 'center' };

        // Fila 8: Código y versión del Programa
        worksheet.mergeCells('A8:D8');
        worksheet.getCell('A8').value = 'Código y versión del Programa de Formación';
        worksheet.getCell('A8').font = { bold: true };
        worksheet.getCell('A8').alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.mergeCells('E8:P8');
        worksheet.getCell('E8').value = `${codigoPrograma} - ${versionPrograma}`;
        worksheet.getCell('E8').alignment = { vertical: 'middle', horizontal: 'center' };

        // Fila 9: Nombre del Proyecto Formativo
        worksheet.mergeCells('A9:D9');
        worksheet.getCell('A9').value = 'Nombre del Proyecto Formativo (Diligencie esta casilla únicamente si es un programa de formación Titulada)';
        worksheet.getCell('A9').font = { bold: true };
        worksheet.getCell('A9').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        worksheet.mergeCells('E9:P9');
        worksheet.getCell('E9').value = proyectoNombre;
        worksheet.getCell('E9').alignment = { vertical: 'middle', horizontal: 'center' };

        // Fila 10: Código del Proyecto
        worksheet.mergeCells('A10:D10');
        worksheet.getCell('A10').value = 'Código del Proyecto (Diligencie esta casilla únicamente  si es un programa de formación Titulada)';
        worksheet.getCell('A10').font = { bold: true };
        worksheet.getCell('A10').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        worksheet.mergeCells('E10:P10');
        worksheet.getCell('E10').value = proyectoCodigo;
        worksheet.getCell('E10').alignment = { vertical: 'middle', horizontal: 'center' };

        // Filas 11-14: Equipo de Gestión Curricular
        worksheet.mergeCells('A11:D14');
        worksheet.getCell('A11').value = 'Nombre Completo de los integrantes del Equipo de Gestión Curricular que realizó la planeación pedagógica';
        worksheet.getCell('A11').font = { bold: true };
        worksheet.getCell('A11').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

        // Combinar E11:P14 para los instructores
        worksheet.mergeCells('E11:P14');
        const nombresInstructores = instructores.map((i: any) => i.nom_completo).join('\n');
        worksheet.getCell('E11').value = nombresInstructores;
        worksheet.getCell('E11').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

        // Aplicar alineación centrada a todo el encabezado (A1:P14)
        for (let row = 1; row <= 14; row++) {
            for (let col = 1; col <= 16; col++) { // 1=A, 16=P
                const cell = worksheet.getRow(row).getCell(col);
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            }
        }

        // Fila 15: Vacía
        worksheet.mergeCells('A15:P15');

        // Estructura de encabezado compleja (Filas 16 y 17)
        // A16:H17 - Columnas combinadas verticalmente
        worksheet.mergeCells('A16:A17');
        worksheet.getCell('A16').value = 'Fase del Proyecto Formativo';

        worksheet.mergeCells('B16:B17');
        worksheet.getCell('B16').value = 'Actividad del Proyecto Formativo';

        worksheet.mergeCells('C16:C17');
        worksheet.getCell('C16').value = 'Competencia';

        worksheet.mergeCells('D16:D17');
        worksheet.getCell('D16').value = 'Resultado de Aprendizaje';

        worksheet.mergeCells('E16:E17');
        worksheet.getCell('E16').value = 'Saberes de conceptos y principios';

        worksheet.mergeCells('F16:F17');
        worksheet.getCell('F16').value = 'Saberes del proceso';

        worksheet.mergeCells('G16:G17');
        worksheet.getCell('G16').value = 'Criterios de evaluación';

        worksheet.mergeCells('H16:H17');
        worksheet.getCell('H16').value = 'Actividades de aprendizaje a desarrollar';

        // I16:J16 - Duración de actividad (combinada horizontalmente)
        worksheet.mergeCells('I16:J16');
        worksheet.getCell('I16').value = 'Duración actividad de aprendizaje (Horas)';

        // I17 y J17 - Subdivisión de horas
        worksheet.getCell('I17').value = 'Horas trabajo directo';
        worksheet.getCell('J17').value = 'Horas trabajo independiente';

        // K16:K17 - Descripción de la evidencia (combinada verticalmente)
        worksheet.mergeCells('K16:K17');
        worksheet.getCell('K16').value = 'Descripción de la evidencia de aprendizaje';

        // L16:L17 - Estrategias didácticas (combinada verticalmente)
        worksheet.mergeCells('L16:L17');
        worksheet.getCell('L16').value = 'Estrategias didácticas activas';

        // M16:O16 - Ambientes de aprendizaje (combinada horizontalmente)
        worksheet.mergeCells('M16:O16');
        worksheet.getCell('M16').value = 'Ambientes de aprendizaje tipificados';

        // M17, N17, O17 - Subdivisión de ambientes
        worksheet.getCell('M17').value = 'Ambiente';
        worksheet.getCell('N17').value = 'Materiales de formación';
        worksheet.getCell('O17').value = 'Instructores responsables';

        // P16:P17 - Observaciones (combinada verticalmente)
        worksheet.mergeCells('P16:P17');
        worksheet.getCell('P16').value = 'Observaciones';

        // Configurar anchos de columna
        worksheet.columns = [
            { key: 'fase_proyecto', width: 28 },           // A
            { key: 'actividad_proyecto', width: 40 },      // B
            { key: 'competencia', width: 38 },             // C
            { key: 'resultado', width: 50 },               // D
            { key: 'saberes_conceptos', width: 40 },       // E
            { key: 'saberes_proceso', width: 40 },         // F
            { key: 'criterios', width: 40 },               // G
            { key: 'actividades_aprendizaje', width: 40 }, // H
            { key: 'horas_directo', width: 20 },           // I
            { key: 'horas_independiente', width: 20 },     // J
            { key: 'evidencia', width: 40 },               // K
            { key: 'estrategias', width: 40 },             // L
            { key: 'ambiente', width: 25 },                // M
            { key: 'materiales', width: 30 },              // N
            { key: 'instructors', width: 30 },             // O
            { key: 'observaciones', width: 45 }            // P
        ];

        // Estilo del header de datos (filas 16 y 17)
        [16, 17].forEach(rowNum => {
            const row = worksheet.getRow(rowNum);
            row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            row.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF2E7D32' }
            };
            row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        });

        // Agregar datos
        resultados.forEach((item: any) => {
            // Calcular horas usando el campo horas_calculadas de la query SQL
            const horasBase = item.horas_calculadas || 0;
            const horasDirecto = horasBase * 0.8;
            const horasIndependiente = horasBase * 0.2;

            const row = worksheet.addRow({
                fase_proyecto: item.fase_vista || item.fase_base || '',
                actividad_proyecto: item.actividad_proyecto || '',
                competencia: item.norma_competencia || '',
                resultado: item.nombre_resultado || '',
                saberes_conceptos: item.conocimientos_saber || '',
                saberes_proceso: item.conocimientos_proceso || '',
                criterios: item.criterios_evaluacion || item.criterios_de_evaluacion || '',
                actividades_aprendizaje: item.actividad_aprendizaje || '',
                horas_directo: horasDirecto.toFixed(2),
                horas_independiente: horasIndependiente.toFixed(2),
                evidencia: item.evidencia_aprendizaje || '',
                estrategias: item.estrategias_didacticas || '',
                ambiente: item.ambiente || '',
                materiales: item.materiales_formacion || '',
                instructors: item.instructor_nombre || item.instructor_iniciales || '',
                observaciones: ''
            });

            const faseBase = (item.fase_base || '').trim();
            const faseVista = (item.fase_vista || '').trim();
            if (faseBase && faseVista && faseBase.toLowerCase() !== faseVista.toLowerCase()) {
                const message = `Este resultado pertenece originalmente a ${faseBase.toUpperCase()} pero se realizó en ${faseVista.toUpperCase()}`;
                try {
                    row.getCell('observaciones').value = {
                        richText: [
                            { text: 'Este resultado pertenece originalmente a ', font: { bold: false } },
                            { text: faseBase.toUpperCase(), font: { bold: true } },
                            { text: ' pero se realizó en ', font: { bold: false } },
                            { text: faseVista.toUpperCase(), font: { bold: true } }
                        ]
                    };
                } catch (richTextError) {
                    console.warn('No se pudo aplicar formato richText en observaciones:', richTextError);
                    row.getCell('observaciones').value = message;
                }
            }
        });

        // Aplicar bordes y alineación centrada a todas las celdas
        worksheet.eachRow((row: any, rowNumber: number) => {
            row.eachCell((cell: any) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            });
        });

        // Configurar respuesta y enviar buffer
        const safeFaseName = fase.replace(/[^a-zA-Z0-9-_]/g, '_');
        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Planeacion_${safeFaseName}_Ficha_${id_ficha}.xlsx"`);
        res.send(Buffer.from(buffer));

    } catch (error) {
        console.error('Error al exportar planeación:', error);
        const message = error instanceof Error ? error.message : 'Error al exportar planeación';
        res.status(500).json({ success: false, error: message });
    }
});


export default router;
