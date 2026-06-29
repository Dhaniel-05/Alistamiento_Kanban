import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Box from '@mui/material/Box';

const JORNADAS = ['Diurna', 'Nocturna', 'Personalizada'];
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

const VALORES_INICIALES = {
  jornada: 'Diurna',
  nombre_fase: '',
  orden: 1,
  color: '#3B82F6',
  descripcion: '',
  activo: 1,
};

function validarFormulario(form) {
  const errores = {};

  if (!form.nombre_fase?.trim()) {
    errores.nombre_fase = 'El nombre de la fase es obligatorio';
  }

  const orden = Number(form.orden);
  if (!Number.isInteger(orden) || orden < 0) {
    errores.orden = 'El orden debe ser un entero mayor o igual a 0';
  }

  if (!HEX_COLOR_REGEX.test(form.color || '')) {
    errores.color = 'El color debe estar en formato #RRGGBB';
  }

  return errores;
}

export const ModalFaseConfig = ({ open, onClose, onSave, faseSeleccionada }) => {
  const [form, setForm] = useState(VALORES_INICIALES);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (!open) return;

    if (faseSeleccionada) {
      setForm({
        jornada: faseSeleccionada.jornada || 'Diurna',
        nombre_fase: faseSeleccionada.nombre_fase || '',
        orden: faseSeleccionada.orden ?? 1,
        color: faseSeleccionada.color || '#3B82F6',
        descripcion: faseSeleccionada.descripcion || '',
        activo: faseSeleccionada.activo === 0 ? 0 : 1,
      });
    } else {
      setForm(VALORES_INICIALES);
    }
    setErrores({});
  }, [open, faseSeleccionada]);

  const handleChange = (field) => (event) => {
    const value = field === 'activo' ? (event.target.checked ? 1 : 0) : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrores((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const erroresValidacion = validarFormulario(form);
    if (Object.keys(erroresValidacion).length > 0) {
      setErrores(erroresValidacion);
      return;
    }

    onSave({
      jornada: form.jornada,
      nombre_fase: form.nombre_fase.trim(),
      orden: Number(form.orden),
      color: form.color,
      descripcion: form.descripcion?.trim() || null,
      activo: form.activo,
      ...(faseSeleccionada ? { id_fase_config: faseSeleccionada.id_fase_config } : {}),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {faseSeleccionada ? 'Editar fase de plantilla' : 'Crear fase de plantilla'}
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              select
              label="Jornada"
              value={form.jornada}
              onChange={handleChange('jornada')}
              required
              fullWidth
            >
              {JORNADAS.map((j) => (
                <MenuItem key={j} value={j}>{j}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="Nombre de fase"
              placeholder='Ej: Análisis 1'
              value={form.nombre_fase}
              onChange={handleChange('nombre_fase')}
              error={Boolean(errores.nombre_fase)}
              helperText={errores.nombre_fase}
              required
              fullWidth
            />

            <TextField
              label="Orden"
              type="number"
              value={form.orden}
              onChange={handleChange('orden')}
              error={Boolean(errores.orden)}
              helperText={errores.orden || 'Entero >= 0'}
              inputProps={{ min: 0, step: 1 }}
              required
              fullWidth
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                label="Color (#RRGGBB)"
                value={form.color}
                onChange={handleChange('color')}
                error={Boolean(errores.color)}
                helperText={errores.color}
                required
                fullWidth
              />
              <input
                type="color"
                value={HEX_COLOR_REGEX.test(form.color) ? form.color : '#3B82F6'}
                onChange={(e) => handleChange('color')({ target: { value: e.target.value } })}
                aria-label="Selector de color"
                style={{ width: 48, height: 48, border: 'none', cursor: 'pointer', background: 'none' }}
              />
            </Box>

            <TextField
              label="Descripción"
              value={form.descripcion}
              onChange={handleChange('descripcion')}
              multiline
              minRows={2}
              fullWidth
            />

            <FormControlLabel
              control={
                <Switch
                  checked={form.activo === 1}
                  onChange={handleChange('activo')}
                  color="primary"
                />
              }
              label="Activo"
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">Cancelar</Button>
          <Button type="submit" variant="contained">
            {faseSeleccionada ? 'Guardar cambios' : 'Crear fase'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
