import fs from 'fs';

const lines = fs.readFileSync('src/pages/SabanaPagina.jsx', 'utf8').split(/\r?\n/);
const body = lines.slice(131, 652).join('\n');

const header = `import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  obtenerSabanaPorFicha,
  obtenerTrimestres,
  asignarRAP,
  desasignarRAP,
  obtenerInstructoresPorFicha,
  asignarInstructor,
  desasignarInstructor,
} from '../services/sabanaService';
import httpClient from '../services/httpClient';

export function useSabana(idFicha, user) {
  const navigate = useNavigate();
`;

const transformed = body
  .replace('export const SabanaPagina = () => {', '')
  .replace(/const \{ idFicha \} = useParams\(\);\r?\n/, '')
  .replace(/const \{ user \} = useAuthContext\(\);\r?\n/, '')
  .replace(/const navigate = useNavigate\(\);\r?\n/, '');

fs.writeFileSync('src/hooks/useSabana.js', `${header}${transformed}\n}\n`);
