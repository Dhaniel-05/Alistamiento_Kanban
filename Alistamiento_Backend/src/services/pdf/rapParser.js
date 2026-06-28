const logger = require('../../config/logger');

class RapParser {
  static normalizar(texto) {
    if (!texto) return '';
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/\r/g, '')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static extraerCodigoRap(rapDenominacion) {
    const match = rapDenominacion.trim().match(/^(\d{1,2})\s+/);
    return match ? match[1].padStart(2, '0') : null;
  }

  static dividirPorTitulos(textoCompleto) {
    if (!textoCompleto || !textoCompleto.trim()) return [];

    const patronTitulo = /^([A-ZÑÁÉÍÓÚ0-9][A-ZÑÁÉÍÓÚ0-9\s\-\.,()\/]{9,}):$/gm;
    const secciones = [];
    const titulos = [];
    const regex = new RegExp(patronTitulo);
    let match;

    while ((match = regex.exec(textoCompleto)) !== null) {
      titulos.push({
        titulo: match[1].trim(),
        indice: match.index,
        finTitulo: match.index + match[0].length,
      });
    }

    for (let i = 0; i < titulos.length; i += 1) {
      const actual = titulos[i];
      const siguiente = titulos[i + 1];
      const inicio = actual.finTitulo;
      const fin = siguiente ? siguiente.indice : textoCompleto.length;
      const contenido = textoCompleto.substring(inicio, fin).trim();

      if (contenido) {
        secciones.push({
          titulo: actual.titulo,
          contenido,
        });
      }
    }

    if (secciones.length === 0 && textoCompleto.trim()) {
      secciones.push({
        titulo: '',
        contenido: textoCompleto.trim(),
      });
    }

    return secciones;
  }

  static matchearTituloConRap(titulo, listaRaps) {
    if (!titulo || !Array.isArray(listaRaps) || listaRaps.length === 0) {
      return null;
    }

    const tituloNorm = this.normalizar(titulo);
    const codigoTitulo = this.extraerCodigoRap(titulo);

    if (codigoTitulo) {
      for (let i = 0; i < listaRaps.length; i += 1) {
        const codigoRap = this.extraerCodigoRap(listaRaps[i]);
        if (codigoRap === codigoTitulo) {
          return i;
        }
      }
    }

    const palabrasTitulo = tituloNorm
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 10);

    if (palabrasTitulo.length < 2) return null;

    let mejorIndice = null;
    let mejorScore = 0;

    for (let i = 0; i < listaRaps.length; i += 1) {
      const rapNorm = this.normalizar(listaRaps[i]);
      let score = 0;

      for (const palabra of palabrasTitulo) {
        if (rapNorm.includes(palabra)) {
          score += 1;
        }
      }

      if (score > mejorScore && score >= 3) {
        mejorScore = score;
        mejorIndice = i;
      }
    }

    return mejorIndice;
  }

  static distribuirSeccionesPorRap(textoCompleto, listaRaps) {
    if (!textoCompleto || !Array.isArray(listaRaps) || listaRaps.length === 0) {
      return {};
    }

    const secciones = this.dividirPorTitulos(textoCompleto);
    const contenidoPorRap = {};

    listaRaps.forEach((rap) => {
      contenidoPorRap[rap] = '';
    });

    if (secciones.length === 1 && !secciones[0].titulo) {
      const contenidoLimpio = secciones[0].contenido.trim();
      listaRaps.forEach((rap) => {
        contenidoPorRap[rap] = contenidoLimpio;
      });
      return contenidoPorRap;
    }

    for (const seccion of secciones) {
      const indiceRap = this.matchearTituloConRap(seccion.titulo, listaRaps);

      if (indiceRap !== null && indiceRap >= 0 && indiceRap < listaRaps.length) {
        const rapKey = listaRaps[indiceRap];
        const anterior = contenidoPorRap[rapKey];
        contenidoPorRap[rapKey] = anterior
          ? `${anterior}\n${seccion.contenido}`
          : seccion.contenido;
      } else {
        const rapsVacios = listaRaps.filter((rap) => !contenidoPorRap[rap]);
        if (rapsVacios.length > 0) {
          rapsVacios.forEach((rap) => {
            contenidoPorRap[rap] = seccion.contenido;
          });
        }
      }
    }

    listaRaps.forEach((rap) => {
      if (!contenidoPorRap[rap] || contenidoPorRap[rap].trim() === '') {
        contenidoPorRap[rap] = textoCompleto.trim();
      }
    });

    return contenidoPorRap;
  }

  static procesarCompetencia(competencia) {
    if (!competencia || !competencia.resultados_aprendizaje) {
      logger.warn('Competencia sin resultados_aprendizaje');
      return [];
    }

    const resultados = Array.isArray(competencia.resultados_aprendizaje)
      ? competencia.resultados_aprendizaje
      : [];

    if (resultados.length === 0) {
      logger.warn('Competencia sin RAPs');
      return [];
    }

    const listaRaps = resultados.map((r) => String(r).trim()).filter(Boolean);

    logger.debug('Procesando competencia', { total_raps: listaRaps.length });

    const textoProceso = String(competencia.conocimientos_proceso || '').trim();
    const textoSaber = String(competencia.conocimientos_saber || '').trim();
    const textoCriterios = String(competencia.criterios_evaluacion || '').trim();

    const procesoPorRap = this.distribuirSeccionesPorRap(textoProceso, listaRaps);
    const saberPorRap = this.distribuirSeccionesPorRap(textoSaber, listaRaps);
    const criteriosPorRap = this.distribuirSeccionesPorRap(textoCriterios, listaRaps);

    return listaRaps.map((rapCompleto, idx) => {
      const match = rapCompleto.match(/^(\d{1,2})\s+([\s\S]+)/);
      const codigo = match ? match[1].padStart(2, '0') : String(idx + 1).padStart(2, '0');

      let denominacion = match ? match[2] : rapCompleto;
      denominacion = denominacion
        .replace(/\r/g, '')
        .replace(/\n{2,}/g, '\n')
        .trim();

      const conocimientos_proceso = (procesoPorRap[rapCompleto] || '').trim();
      const conocimientos_saber = (saberPorRap[rapCompleto] || '').trim();
      const criterios_evaluacion = (criteriosPorRap[rapCompleto] || '').trim();

      logger.debug('Contenido distribuido por RAP', {
        codigo_rap: codigo,
        proceso_length: conocimientos_proceso.length,
        saber_length: conocimientos_saber.length,
        criterios_length: criterios_evaluacion.length,
      });

      return {
        codigo,
        denominacion,
        conocimientos_proceso,
        conocimientos_saber,
        criterios_evaluacion,
      };
    });
  }
}

module.exports = RapParser;
