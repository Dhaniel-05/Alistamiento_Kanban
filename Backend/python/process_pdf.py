

# PDF_PATH = r"/home/plexx/Documentos/SENA/Programa_228118_v1.pdf"
# OUTPUT_PATH = r"Backend/python/output.json"

# def strip_accents(s: str) -> str:
#     return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')

# def norm(s: str) -> str:
#     s = strip_accents(s or "").upper()
#     s = re.sub(r"\s+", " ", s)
#     return s.strip()

# # --- Palabras clave ---
# TARGET_COMPETENCIA = "UNIDAD DE COMPETENCIA"
# TARGET_CODIGO = "CODIGO NORMA DE COMPETENCIA LABORAL"
# TARGET_NOMBRE = "NOMBRE DE LA COMPETENCIA"
# TARGET_HORA = "DURACION MAXIMA ESTIMADA"
# TARGET_RESULTADOS = "RESULTADOS DE APRENDIZAJE"
# TARGET_CONOCIMIENTOS_PROCESO = "CONOCIMIENTOS DE PROCESO"
# TARGET_CRITERIOS_EVALUACION = "CRITERIOS DE EVALUACION"
# TARGET_CONOCIMIENTOS_SABER = "CONOCIMIENTOS DEL SABER"

# IGNORE_KEYS = [
#     "LINEA TECNOLOGICA",
#     "RED TECNOLOGICA",
#     "RED DE CONOCIMIENTO",
#     "DENOMINACION"
# ]

# resultados = []
# registro_actual = {}

# # Flags
# capturando_resultados = False
# capturando_conocimientos = False
# capturando_criterios = False
# capturando_saber = False

# with pdfplumber.open(PDF_PATH) as pdf:
#     for num_pagina, page in enumerate(pdf.pages, 1):
#         tablas = page.extract_tables()
#         for tabla in tablas:
#             for fila in tabla:
#                 if fila and any(fila):
#                     fila_texto = " ".join([c for c in fila if c]).strip()
#                     fila_norm = norm(fila_texto)
#                     celda_izq = norm(fila[0] or "")

#                     if any(key in fila_norm for key in IGNORE_KEYS):
#                         continue

#                     if TARGET_COMPETENCIA in celda_izq:
#                         if registro_actual:
#                             # ✅ Antes de guardar, convertir listas en texto con saltos de línea
#                             for k in ["conocimientos_proceso", "criterios_evaluacion", "conocimientos_saber"]:
#                                 if k in registro_actual and isinstance(registro_actual[k], list):
#                                     registro_actual[k] = "\n".join(registro_actual[k])
#                             resultados.append(registro_actual)
#                             registro_actual = {}
#                         registro_actual["competencia"] = (fila[1] or "").strip()

#                     elif TARGET_CODIGO in celda_izq:
#                         registro_actual["codigo"] = (fila[1] or "").strip()

#                     elif TARGET_NOMBRE in celda_izq:
#                         registro_actual["nombre"] = (fila[1] or "").strip()

#                     elif TARGET_HORA in celda_izq:
#                         celda_derecha = " ".join([c for c in fila if c])
#                         match = re.search(r"(\d+\s*horas?)", celda_derecha, re.IGNORECASE)
#                         if match:
#                             registro_actual["hora"] = match.group(1)

#                     # === Secciones ===
#                     elif TARGET_RESULTADOS in celda_izq:
#                         capturando_resultados = True
#                         capturando_conocimientos = capturando_criterios = capturando_saber = False
#                         registro_actual["resultados_aprendizaje"] = []

#                     elif TARGET_CONOCIMIENTOS_PROCESO in celda_izq:
#                         capturando_conocimientos = True
#                         capturando_resultados = capturando_criterios = capturando_saber = False
#                         registro_actual["conocimientos_proceso"] = []

#                     elif TARGET_CRITERIOS_EVALUACION in celda_izq:
#                         capturando_criterios = True
#                         capturando_conocimientos = capturando_resultados = capturando_saber = False
#                         registro_actual["criterios_evaluacion"] = []

#                     elif TARGET_CONOCIMIENTOS_SABER in celda_izq:
#                         capturando_saber = True
#                         capturando_resultados = capturando_conocimientos = capturando_criterios = False
#                         registro_actual["conocimientos_saber"] = []

#                     # === Captura de líneas ===
#                     elif capturando_resultados:
#                         registro_actual.setdefault("resultados_aprendizaje", []).append(fila_texto)

#                     elif capturando_conocimientos:
#                         registro_actual.setdefault("conocimientos_proceso", []).append(fila_texto)

#                     elif capturando_criterios:
#                         registro_actual.setdefault("criterios_evaluacion", []).append(fila_texto)

#                     elif capturando_saber:
#                         registro_actual.setdefault("conocimientos_saber", []).append(fila_texto)

# # === Guardar el último bloque ===
# if registro_actual:
#     for k in ["conocimientos_proceso", "criterios_evaluacion", "conocimientos_saber"]:
#         if k in registro_actual and isinstance(registro_actual[k], list):
#             registro_actual[k] = "\n".join(registro_actual[k])
#     resultados.append(registro_actual)

# # === Exportar a JSON ===
# with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
#     json.dump(resultados, f, indent=4, ensure_ascii=False)

# print(f"✅ Se guardaron {len(resultados)} registros con saltos de línea en: {OUTPUT_PATH}")
# # """ import pdfplumber
# # import re
# # import unicodedata
# # import json
# # import sys
# # # La importación de la conexión a la DB (desde conecction.py) se mueve al bloque __main__ 
# # # para que los errores de inicialización puedan ser capturados y devueltos como JSON.
# # # from conecction import db, cursor 

# # # --- CONFIGURACIÓN Y FUNCIONES AUXILIARES ---

# # def strip_accents(s: str) -> str:
# #     """Función para quitar acentos de una cadena."""
# #     return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')

# # def norm(s: str) -> str:
# #     """Función de normalización para comparación de textos."""
# #     s = strip_accents(s or "").upper()
# #     s = re.sub(r"\s+", " ", s)
# #     return s.strip()

# # # --- Palabras clave para extracción del PDF ---
# # TARGET_COMPETENCIA = "UNIDAD DE COMPETENCIA"
# # TARGET_CODIGO = "CODIGO NORMA DE COMPETENCIA LABORAL"
# # TARGET_NOMBRE = "NOMBRE DE LA COMPETENCIA"
# # TARGET_HORA = "DURACION MAXIMA ESTIMADA"
# # TARGET_RESULTADOS = "RESULTADOS DE APRENDIZAJE"
# # TARGET_CONOCIMIENTOS_PROCESO = "CONOCIMIENTOS DE PROCESO"
# # TARGET_CRITERIOS_EVALUACION = "CRITERIOS DE EVALUACION"
# # TARGET_CONOCIMIENTOS_SABER = "CONOCIMIENTOS DEL SABER"

# # IGNORE_KEYS = [
# #     "LINEA TECNOLOGICA",
# #     "RED TECNOLOGICA",
# #     "RED DE CONOCIMIENTO",
# #     "DENOMINACION"
# # ]


# # def run_processor(pdf_path: str, db, cursor):
# #     """
# #     Función principal que ejecuta el parsing, la extracción del PDF 
# #     y la inserción de datos en la base de datos MySQL.
    
# #     :param pdf_path: Ruta al archivo PDF temporal.
# #     :param db: Objeto de conexión a la base de datos.
# #     :param cursor: Cursor de la base de datos.
# #     """
# #     resultados = []
# #     registro_actual = {}

# #     # Flags para saber qué sección del PDF estamos capturando
# #     capturando_resultados = False
# #     capturando_conocimientos = False
# #     capturando_criterios = False
# #     capturando_saber = False

# #     # 1. PARSING DEL PDF Y EXTRACCIÓN DE DATOS
# #     try:
# #         with pdfplumber.open(pdf_path) as pdf:
# #             for page in pdf.pages:
# #                 tablas = page.extract_tables()
                
# #                 for tabla in tablas:
# #                     for fila in tabla:
# #                         if fila and any(fila):
# #                             fila_texto = " ".join([c for c in fila if c]).strip()
# #                             fila_norm = norm(fila_texto)
# #                             celda_izq = norm(fila[0] or "")

# #                             if any(key in fila_norm for key in IGNORE_KEYS):
# #                                 continue
                            
# #                             # Lógica de detección de encabezados y extracción de campos clave
                            
# #                             if TARGET_COMPETENCIA in celda_izq:
# #                                 # Si encontramos una nueva competencia, guardamos la anterior
# #                                 if registro_actual:
# #                                     for k in ["conocimientos_proceso", "criterios_evaluacion", "conocimientos_saber"]:
# #                                         if k in registro_actual and isinstance(registro_actual[k], list):
# #                                             registro_actual[k] = "\n".join(registro_actual[k])
# #                                     resultados.append(registro_actual)
# #                                     registro_actual = {}
# #                                 registro_actual["competencia"] = (fila[1] or "").strip()

# #                             elif TARGET_CODIGO in celda_izq:
# #                                 registro_actual["codigo"] = (fila[1] or "").strip()

# #                             elif TARGET_NOMBRE in celda_izq:
# #                                 registro_actual["nombre"] = (fila[1] or "").strip()

# #                             elif TARGET_HORA in celda_izq:
# #                                 celda_derecha = " ".join([c for c in fila if c])
# #                                 match = re.search(r"(\d+)\s*horas?", celda_derecha, re.IGNORECASE)
# #                                 if match:
# #                                     # Guarda el número entero de horas
# #                                     registro_actual["hora"] = int(match.group(1)) 

# #                             # Lógica para cambiar los flags de captura de secciones de texto
                            
# #                             elif TARGET_RESULTADOS in celda_izq:
# #                                 capturando_resultados = True
# #                                 capturando_conocimientos = capturando_criterios = capturando_saber = False
# #                                 registro_actual["resultados_aprendizaje"] = []

# #                             elif TARGET_CONOCIMIENTOS_PROCESO in celda_izq:
# #                                 capturando_conocimientos = True
# #                                 capturando_resultados = capturando_criterios = capturando_saber = False
# #                                 registro_actual["conocimientos_proceso"] = []

# #                             elif TARGET_CRITERIOS_EVALUACION in celda_izq:
# #                                 capturando_criterios = True
# #                                 capturando_conocimientos = capturando_resultados = capturando_saber = False
# #                                 registro_actual["criterios_evaluacion"] = []

# #                             elif TARGET_CONOCIMIENTOS_SABER in celda_izq:
# #                                 capturando_saber = True
# #                                 capturando_resultados = capturando_conocimientos = capturando_criterios = False
# #                                 registro_actual["conocimientos_saber"] = []

# #                             # Lógica de acumulación de texto en la sección activa
# #                             elif capturando_resultados:
# #                                 registro_actual.setdefault("resultados_aprendizaje", []).append(fila_texto)

# #                             elif capturando_conocimientos:
# #                                 registro_actual.setdefault("conocimientos_proceso", []).append(fila_texto)

# #                             elif capturando_criterios:
# #                                 registro_actual.setdefault("criterios_evaluacion", []).append(fila_texto)

# #                             elif capturando_saber:
# #                                 registro_actual.setdefault("conocimientos_saber", []).append(fila_texto)
                
# #         # Asegurar que el último registro capturado se añada a la lista
# #         if registro_actual:
# #             for k in ["conocimientos_proceso", "criterios_evaluacion", "conocimientos_saber"]:
# #                 if k in registro_actual and isinstance(registro_actual[k], list):
# #                     registro_actual[k] = "\n".join(registro_actual[k])
# #             resultados.append(registro_actual)

# #     except Exception as e:
# #         # En caso de error de parsing (ej. PDF corrupto), hacemos rollback y lanzamos error
# #         db.rollback()
# #         raise Exception(f"Error al leer/parsear el PDF: {str(e)}")


# #     # 2. INSERCIÓN DE DATOS EN MYSQL
# #     registros_insertados = 0
    
# #     # --- VALORES POR DEFECTO PARA CAMPOS NO EXTRAÍDOS ---
# #     # CAMBIAR: El ID_PROGRAMA_FORMATIVO debe ser dinámico o configurado correctamente.
# #     ID_PROGRAMA_FORMATIVO = 1 
# #     DEFAULT_ACTIVIDAD = "N/A"
# #     DEFAULT_FASE = "N/A"

# #     sql = """
# #         INSERT INTO competencias (
# #             norma_competencia, codigo_competencia, actividad_proyecto, nombre_competencia, 
# #             duracion_competencia, criterios_de_evaluacion, conocimientos_proceso, 
# #             conocimientos_saber, fase_base, fase_vista, id_programa
# #         )
# #         VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
# #     """
    
# #     for registro in resultados:
# #         # Preparación de datos
# #         duracion_int = registro.get("hora", 0) if isinstance(registro.get("hora"), int) else 0

# #         data = (
# #             registro.get("competencia", ""),          
# #             registro.get("codigo", ""),               
# #             DEFAULT_ACTIVIDAD,                        
# #             registro.get("nombre", ""),               
# #             duracion_int,                             
# #             registro.get("criterios_evaluacion", ""), 
# #             registro.get("conocimientos_proceso", ""),
# #             registro.get("conocimientos_saber", ""),  
# #             DEFAULT_FASE,                             
# #             DEFAULT_FASE,                             
# #             ID_PROGRAMA_FORMATIVO                     
# #         )
        
# #         try:
# #             cursor.execute(sql, data)
# #             registros_insertados += 1
# #         except Exception as db_err:
# #             # Imprimir error de DB a stderr (para debugging en consola)
# #             print(f"ERROR_DB_INSERT: Error al insertar registro {registro.get('codigo')}: {db_err}", file=sys.stderr)
# #             db.rollback() # Rollback específico para este error de inserción

# #     db.commit() # Commit final si no hubo errores

# #     # 3. Devolver el resultado final a Node.js (stdout)
# #     print(json.dumps({
# #         "status": "success",
# #         "message": f"PDF procesado y {registros_insertados} registros de competencias guardados.",
# #         "total_registros": registros_insertados
# #     }))


# # # --- BLOQUE DE EJECUCIÓN PRINCIPAL CON MANEJO DE ERRORES GLOBAL ---
# # if __name__ == "__main__":
# #     try:
# #         # 1. Importación de dependencias críticas 
# #         from conecction import db, cursor 
        
# #         if len(sys.argv) > 1:
# #             pdf_file_path = sys.argv[1]
# #             # Ejecutar la función de procesamiento
# #             run_processor(pdf_file_path, db, cursor)
# #         else:
# #             # Error si Node.js no pasó el argumento de ruta
# #             raise ValueError("Falta la ruta del archivo PDF como argumento.")
            
# #     except Exception as e:
# #         # 2. Captura CUALQUIER error (ImportError, errores de DB, errores de lógica)
# #         # y asegura que se imprime un JSON a stderr.
# #         print(json.dumps({
# #             "status": "error",
# #             "message": f"Error fatal en el script de Python: {type(e).__name__}: {str(e)}",
# #             "detail": "Revise que las librerías (pdfplumber, etc.) estén instaladas y que 'conecction.py' funcione y exporte 'db' y 'cursor' correctamente."
# #         }), file=sys.stderr)
# #         # Terminar el proceso con código de error
# #         sys.exit(1) """

# import pdfplumber
# import re
# import unicodedata
# import json
# import sys

# # 📥 Recibir argumentos de línea de comandos
# if len(sys.argv) < 3:
#     print("❌ Error: Se requieren 2 argumentos (ruta del PDF y ruta de salida JSON)")
#     sys.exit(1)

# PDF_PATH = sys.argv[1]  # Ruta del PDF recibida como argumento
# OUTPUT_PATH = sys.argv[2]  # Ruta de salida del JSON

# def strip_accents(s: str) -> str:
#     return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')

# def norm(s: str) -> str:
#     s = strip_accents(s or "").upper()
#     s = re.sub(r"\s+", " ", s)
#     return s.strip()

# # --- Palabras clave ---
# TARGET_COMPETENCIA = "UNIDAD DE COMPETENCIA"
# TARGET_CODIGO = "CODIGO NORMA DE COMPETENCIA LABORAL"
# TARGET_NOMBRE = "NOMBRE DE LA COMPETENCIA"
# TARGET_HORA = "DURACION MAXIMA ESTIMADA"
# TARGET_RESULTADOS = "RESULTADOS DE APRENDIZAJE"
# TARGET_CONOCIMIENTOS_PROCESO = "CONOCIMIENTOS DE PROCESO"
# TARGET_CRITERIOS_EVALUACION = "CRITERIOS DE EVALUACION"
# TARGET_CONOCIMIENTOS_SABER = "CONOCIMIENTOS DEL SABER"

# IGNORE_KEYS = [
#     "LINEA TECNOLOGICA",
#     "RED TECNOLOGICA",
#     "RED DE CONOCIMIENTO",
#     "DENOMINACION"
# ]

# resultados = []
# registro_actual = {}

# # Flags
# capturando_resultados = False
# capturando_conocimientos = False
# capturando_criterios = False
# capturando_saber = False

# try:
#     print(f"📄 Procesando PDF: {PDF_PATH}")
    
#     with pdfplumber.open(PDF_PATH) as pdf:
#         print(f"📊 Total de páginas: {len(pdf.pages)}")
        
#         for num_pagina, page in enumerate(pdf.pages, 1):
#             tablas = page.extract_tables()
#             for tabla in tablas:
#                 for fila in tabla:
#                     if fila and any(fila):
#                         fila_texto = " ".join([c for c in fila if c]).strip()
#                         fila_norm = norm(fila_texto)
#                         celda_izq = norm(fila[0] or "")

#                         if any(key in fila_norm for key in IGNORE_KEYS):
#                             continue

#                         if TARGET_COMPETENCIA in celda_izq:
#                             if registro_actual:
#                                 # Convertir listas en texto con saltos de línea
#                                 for k in ["conocimientos_proceso", "criterios_evaluacion", "conocimientos_saber"]:
#                                     if k in registro_actual and isinstance(registro_actual[k], list):
#                                         registro_actual[k] = "\n".join(registro_actual[k])
#                                 resultados.append(registro_actual)
#                                 registro_actual = {}
#                             registro_actual["competencia"] = (fila[1] or "").strip()

#                         elif TARGET_CODIGO in celda_izq:
#                             registro_actual["codigo"] = (fila[1] or "").strip()

#                         elif TARGET_NOMBRE in celda_izq:
#                             registro_actual["nombre"] = (fila[1] or "").strip()

#                         elif TARGET_HORA in celda_izq:
#                             celda_derecha = " ".join([c for c in fila if c])
#                             match = re.search(r"(\d+\s*horas?)", celda_derecha, re.IGNORECASE)
#                             if match:
#                                 registro_actual["hora"] = match.group(1)

#                         # === Secciones ===
#                         elif TARGET_RESULTADOS in celda_izq:
#                             capturando_resultados = True
#                             capturando_conocimientos = capturando_criterios = capturando_saber = False
#                             registro_actual["resultados_aprendizaje"] = []

#                         elif TARGET_CONOCIMIENTOS_PROCESO in celda_izq:
#                             capturando_conocimientos = True
#                             capturando_resultados = capturando_criterios = capturando_saber = False
#                             registro_actual["conocimientos_proceso"] = []

#                         elif TARGET_CRITERIOS_EVALUACION in celda_izq:
#                             capturando_criterios = True
#                             capturando_conocimientos = capturando_resultados = capturando_saber = False
#                             registro_actual["criterios_evaluacion"] = []

#                         elif TARGET_CONOCIMIENTOS_SABER in celda_izq:
#                             capturando_saber = True
#                             capturando_resultados = capturando_conocimientos = capturando_criterios = False
#                             registro_actual["conocimientos_saber"] = []

#                         # === Captura de líneas ===
#                         elif capturando_resultados:
#                             registro_actual.setdefault("resultados_aprendizaje", []).append(fila_texto)

#                         elif capturando_conocimientos:
#                             registro_actual.setdefault("conocimientos_proceso", []).append(fila_texto)

#                         elif capturando_criterios:
#                             registro_actual.setdefault("criterios_evaluacion", []).append(fila_texto)

#                         elif capturando_saber:
#                             registro_actual.setdefault("conocimientos_saber", []).append(fila_texto)

#     # === Guardar el último bloque ===
#     if registro_actual:
#         for k in ["conocimientos_proceso", "criterios_evaluacion", "conocimientos_saber"]:
#             if k in registro_actual and isinstance(registro_actual[k], list):
#                 registro_actual[k] = "\n".join(registro_actual[k])
#         resultados.append(registro_actual)

#     # === Exportar a JSON ===
#     with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
#         json.dump(resultados, f, indent=4, ensure_ascii=False)

#     print(f"✅ Se guardaron {len(resultados)} registros en: {OUTPUT_PATH}")

# except FileNotFoundError:
#     print(f"❌ Error: No se encontró el archivo PDF en: {PDF_PATH}")
#     sys.exit(1)
# except Exception as e:
#     print(f"❌ Error al procesar el PDF: {str(e)}")
#     import traceback
#     traceback.print_exc()
#     sys.exit(1)
import sys
import io
try:
    # For Python 3.7+ on Windows, reconfigure stdout/stderr to UTF-8 to allow emojis
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    try:
        import codecs
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer)
    except Exception:
        pass

import pdfplumber
import re
import unicodedata
import json

# 📥 Recibir argumentos de línea de comandos
if len(sys.argv) < 3:
    print("❌ Error: Se requieren 2 argumentos (ruta del PDF y ruta de salida JSON)")
    sys.exit(1)

PDF_PATH = sys.argv[1]  # Ruta del PDF recibida como argumento
OUTPUT_PATH = sys.argv[2]  # Ruta de salida del JSON

def strip_accents(s: str) -> str:
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')

def norm(s: str) -> str:
    s = strip_accents(s or "").upper()
    s = re.sub(r"\s+", " ", s)
    return s.strip()

def extract_number(text: str) -> int | None:
    """Extrae el primer número de un texto"""
    if not text:
        return None
    match = re.search(r'\d+', str(text))
    return int(match.group()) if match else None

def extract_date(text: str) -> str | None:
    """Extrae una fecha en formato DD/MM/YYYY"""
    if not text:
        return None
    match = re.search(r'\d{1,2}/\d{1,2}/\d{2,4}', str(text))
    return match.group() if match else None

def limpiar_numero_inicial(texto: str) -> str:
    """Elimina el número inicial de un resultado de aprendizaje"""
    # Patrón: número de 1-2 dígitos al inicio, seguido de espacio
    texto_limpio = re.sub(r'^\s*\d{1,2}\s+', '', texto)
    return texto_limpio.strip()

def es_encabezado_seccion(texto: str) -> bool:
    """Identifica si una línea es un encabezado de sección que debe ignorarse"""
    texto_norm = norm(texto)
    # Patrones de encabezados: "4.6 CONOCIMIENTOS", "4.8 PERFIL", etc.
    if re.match(r'^\d+\.\d+\s+[A-Z\s]+$', texto):
        return True
    # Palabras clave de encabezados
    palabras_encabezado = ["CONOCIMIENTOS DE PROCESO", "CONOCIMIENTOS DEL SABER", 
                           "CRITERIOS DE EVALUACION", "PERFIL DEL INSTRUCTOR",
                           "CONTENIDOS CURRICULARES", "DENOMINACION"]
    return any(palabra in texto_norm for palabra in palabras_encabezado)

def es_resultado_aprendizaje_valido(texto: str) -> bool:
    """Valida si el texto es un resultado de aprendizaje válido"""
    if not texto or len(texto.strip()) < 10:
        return False
    
    texto_norm = norm(texto)
    
    # Lista de patrones a excluir
    patrones_excluir = [
        r'^\s*DENOMINACION\s*$',
        r'^\s*\d+\.\d+\s+CONOCIMIENTOS?\s*$',
        r'^\s*\d+\.\d+\s+CRITERIOS?\s*',
        r'^\s*\d+\.\d+\s+PERFIL\s*',
        r'^\s*CONOCIMIENTOS\s+DE\s+PROCESO\s*$',
        r'^\s*CONOCIMIENTOS\s+DEL\s+SABER\s*$',
        r'^\s*CRITERIOS\s+DE\s+EVALUACION\s*$',
        r'^\s*RESULTADOS\s+DE\s+APRENDIZAJE\s*$',
    ]
    
    for patron in patrones_excluir:
        if re.match(patron, texto_norm):
            return False
    
    # Palabras que indican que NO es un resultado de aprendizaje
    palabras_excluir = [
        "DENOMINACION",
        "CONOCIMIENTOS DE PROCESO",
        "CONOCIMIENTOS DEL SABER", 
        "CRITERIOS DE EVALUACION",
        "PERFIL DEL INSTRUCTOR",
        "REQUISITOS ACADEMICOS"
    ]
    
    if any(palabra in texto_norm for palabra in palabras_excluir):
        return False
    
    return True

# Estructura de datos
programa_info = {
    "denominacion_programa": None,
    "codigo_programa": None,
    "titulo_certificado": None,
    "tipo_programa": None,
    "version_programa": None,
    "duracion_total_horas": None,
    "etapa_lectiva_horas": None,
    "etapa_productiva_horas": None,
    "fecha_inicio": None,
    "fecha_fin": None
}

# --- Palabras clave para competencias ---
TARGET_COMPETENCIA = "UNIDAD DE COMPETENCIA"
TARGET_CODIGO = "CODIGO NORMA DE COMPETENCIA LABORAL"
TARGET_NOMBRE = "NOMBRE DE LA COMPETENCIA"
TARGET_HORA = "DURACION MAXIMA ESTIMADA"
TARGET_RESULTADOS = "RESULTADOS DE APRENDIZAJE"
TARGET_CONOCIMIENTOS_PROCESO = "CONOCIMIENTOS DE PROCESO"
TARGET_CRITERIOS_EVALUACION = "CRITERIOS DE EVALUACION"
TARGET_CONOCIMIENTOS_SABER = "CONOCIMIENTOS DEL SABER"

IGNORE_KEYS = [
    "LINEA TECNOLOGICA",
    "RED TECNOLOGICA",
    "RED DE CONOCIMIENTO"
]

competencias = []
registro_actual = {}

# Flags para captura de competencias
capturando_resultados = False
capturando_conocimientos = False
capturando_criterios = False
capturando_saber = False

try:
    print(f"📄 Procesando PDF: {PDF_PATH}")
    
    with pdfplumber.open(PDF_PATH) as pdf:
        print(f"📊 Total de páginas: {len(pdf.pages)}")
        
        # Variable para guardar texto de páginas iniciales
        texto_completo_inicio = ""
        
        for num_pagina, page in enumerate(pdf.pages, 1):
            # Extraer texto de las primeras 3 páginas para buscar info del programa
            if num_pagina <= 3:
                texto_pagina = page.extract_text() or ""
                texto_completo_inicio += texto_pagina + "\n"
            
            tablas = page.extract_tables()
            
            for tabla in tablas:
                for fila in tabla:
                    if fila and any(fila):
                        fila_texto = " ".join([c for c in fila if c]).strip()
                        fila_norm = norm(fila_texto)
                        celda_izq = norm(fila[0] or "")
                        celda_der = (fila[1] or "").strip() if len(fila) > 1 else ""

                        # === EXTRAER INFORMACIÓN DEL PROGRAMA desde tablas ===
                        if "DENOMINACION DEL PROGRAMA" in celda_izq:
                            programa_info["denominacion_programa"] = celda_der
                            print(f"✅ Denominación: {celda_der}")

                        elif "CODIGO PROGRAMA" in celda_izq or "CODIGO DEL PROGRAMA" in celda_izq:
                            if not programa_info["codigo_programa"]:
                                programa_info["codigo_programa"] = celda_der
                                print(f"✅ Código: {celda_der}")

                        elif "VERSION PROGRAMA" in celda_izq:
                            if not programa_info["version_programa"]:
                                programa_info["version_programa"] = celda_der
                                print(f"✅ Versión: {celda_der}")

                        elif "TITULO" in celda_izq and "CERTIFICADO" in celda_izq:
                            if not programa_info["titulo_certificado"]:
                                programa_info["titulo_certificado"] = celda_der
                                print(f"✅ Título: {celda_der}")

                        elif "TIPO DE PROGRAMA" in celda_izq:
                            if not programa_info["tipo_programa"]:
                                programa_info["tipo_programa"] = celda_der
                                print(f"✅ Tipo: {celda_der}")

                        # === EXTRAER COMPETENCIAS ===
                        
                        if any(key in fila_norm for key in IGNORE_KEYS):
                            continue

                        if TARGET_COMPETENCIA in celda_izq:
                            if registro_actual:
                                # Limpiar resultados de aprendizaje antes de guardar
                                if "resultados_aprendizaje" in registro_actual:
                                    registro_actual["resultados_aprendizaje"] = [
                                        limpiar_numero_inicial(r) for r in registro_actual["resultados_aprendizaje"] 
                                        if es_resultado_aprendizaje_valido(r)
                                    ]
                                
                                for k in ["conocimientos_proceso", "criterios_evaluacion", "conocimientos_saber"]:
                                    if k in registro_actual and isinstance(registro_actual[k], list):
                                        registro_actual[k] = "\n".join(registro_actual[k])
                                competencias.append(registro_actual)
                                registro_actual = {}
                            registro_actual["competencia"] = celda_der

                        elif TARGET_CODIGO in celda_izq:
                            registro_actual["codigo"] = celda_der

                        elif TARGET_NOMBRE in celda_izq:
                            registro_actual["nombre"] = celda_der
                            # Activar captura de resultados después del nombre de la competencia
                            if "resultados_aprendizaje" not in registro_actual:
                                registro_actual["resultados_aprendizaje"] = []
                                capturando_resultados = True

                        elif TARGET_HORA in celda_izq:
                            celda_completa = " ".join([c for c in fila if c])
                            match = re.search(r"(\d+\s*horas?)", celda_completa, re.IGNORECASE)
                            if match:
                                registro_actual["hora"] = match.group(1)

                        elif TARGET_RESULTADOS in celda_izq:
                            capturando_resultados = True
                            capturando_conocimientos = capturando_criterios = capturando_saber = False
                            if "resultados_aprendizaje" not in registro_actual:
                                registro_actual["resultados_aprendizaje"] = []

                        elif TARGET_CONOCIMIENTOS_PROCESO in celda_izq:
                            capturando_conocimientos = True
                            capturando_resultados = capturando_criterios = capturando_saber = False
                            registro_actual["conocimientos_proceso"] = []

                        elif TARGET_CRITERIOS_EVALUACION in celda_izq:
                            capturando_criterios = True
                            capturando_conocimientos = capturando_resultados = capturando_saber = False
                            registro_actual["criterios_evaluacion"] = []

                        elif TARGET_CONOCIMIENTOS_SABER in celda_izq:
                            capturando_saber = True
                            capturando_resultados = capturando_conocimientos = capturando_criterios = False
                            registro_actual["conocimientos_saber"] = []

                        elif capturando_resultados:
                            if fila_texto and fila_texto.strip():
                                texto_limpio = fila_texto.replace("\n", " ").strip()
                                
                                # Validar si es un resultado de aprendizaje válido
                                if not es_resultado_aprendizaje_valido(texto_limpio):
                                    continue
                                
                                # Detectar si parece un resultado de aprendizaje (empieza con número)
                                es_resultado = re.match(r'^\s*\d{1,2}(\s+|[^0-9])', texto_limpio)
                                if es_resultado:
                                    registro_actual.setdefault("resultados_aprendizaje", []).append(texto_limpio)
                                    continue
                                    
                                if registro_actual.get("resultados_aprendizaje"):
                                    registro_actual["resultados_aprendizaje"][-1] += " " + texto_limpio
                                else:
                                    # Si no existe resultado previo, lo tratamos como nuevo
                                    registro_actual.setdefault("resultados_aprendizaje", []).append(texto_limpio)   

                        elif capturando_conocimientos:
                            if fila_texto and fila_texto.strip() and len(fila_texto.strip()) > 5:
                                if not es_encabezado_seccion(fila_texto):
                                    registro_actual.setdefault("conocimientos_proceso", []).append(fila_texto)

                        elif capturando_criterios:
                            if fila_texto and fila_texto.strip() and len(fila_texto.strip()) > 5:
                                if not es_encabezado_seccion(fila_texto):
                                    registro_actual.setdefault("criterios_evaluacion", []).append(fila_texto)

                        elif capturando_saber:
                            if fila_texto and fila_texto.strip() and len(fila_texto.strip()) > 5:
                                if not es_encabezado_seccion(fila_texto):
                                    registro_actual.setdefault("conocimientos_saber", []).append(fila_texto)

        # Guardar última competencia con filtrado
        if registro_actual:
            # Limpiar resultados de aprendizaje antes de guardar
            if "resultados_aprendizaje" in registro_actual:
                registro_actual["resultados_aprendizaje"] = [
                    limpiar_numero_inicial(r) for r in registro_actual["resultados_aprendizaje"] 
                    if es_resultado_aprendizaje_valido(r)
                ]
            
            for k in ["conocimientos_proceso", "criterios_evaluacion", "conocimientos_saber"]:
                if k in registro_actual and isinstance(registro_actual[k], list):
                    registro_actual[k] = "\n".join(registro_actual[k])
            competencias.append(registro_actual)

        # === PROCESAR INFORMACIÓN DEL PROGRAMA desde texto completo (fallback) ===
        print("\n🔍 Buscando información faltante del programa en texto...")
        texto_norm = norm(texto_completo_inicio)
        
        # Solo buscar si no se encontró en tablas
        if not programa_info["denominacion_programa"]:
            match = re.search(r'1\.1[^\n:]*:?\s*([A-Z\sÁÉÍÓÚÑ\.\,]+?)(?:\s+1\.2|\s+EL PROGRAMA|\s+CODIGO)', texto_norm)
            if match:
                denominacion = match.group(1).strip()
                denominacion = re.sub(r'\s+', ' ', denominacion)
                if len(denominacion) > 3:
                    programa_info["denominacion_programa"] = denominacion
                    print(f"✅ Denominación (texto): {programa_info['denominacion_programa']}")
        
        if not programa_info["codigo_programa"]:
            match = re.search(r'1\.2[^\n:]*:?\s*(\d+)', texto_norm)
            if match:
                programa_info["codigo_programa"] = match.group(1).strip()
                print(f"✅ Código (texto): {programa_info['codigo_programa']}")
        
        if not programa_info["version_programa"]:
            match = re.search(r'1\.3[^\n:]*:?\s*(\d+)', texto_norm)
            if match:
                programa_info["version_programa"] = match.group(1).strip()
                print(f"✅ Versión (texto): {programa_info['version_programa']}")
        
        # Fecha inicio
        match = re.search(r'FECHA\s+INICIO[^\n:]*:?\s*(\d{1,2}/\d{1,2}/\d{2,4})', texto_norm)
        if match:
            programa_info["fecha_inicio"] = match.group(1)
            print(f"✅ Fecha inicio: {programa_info['fecha_inicio']}")
        
        # Fecha fin
        if "EL PROGRAMA AUN SE ENCUENTRA VIGENTE" in texto_norm:
            programa_info["fecha_fin"] = "vigente"
        else:
            match_fin = re.search(r'FECHA\s+FIN[^\d]*(\d{1,2}/\d{1,2}/\d{2,4})', texto_norm)
            programa_info["fecha_fin"] = match_fin.group(1) if match_fin else None
        
        # Etapa Lectiva
        match = re.search(r'ETAPA\s+LECTIVA[:\s]*(\d+)\s*HORAS', texto_norm)
        if match:
            programa_info["etapa_lectiva_horas"] = int(match.group(1))
            print(f"✅ Etapa Lectiva: {programa_info['etapa_lectiva_horas']} horas")
        
        # Etapa Productiva
        match = re.search(r'ETAPA\s+PRODUCTIVA[:\s]*(\d+)\s*HORAS', texto_norm)
        if match:
            programa_info["etapa_productiva_horas"] = int(match.group(1))
            print(f"✅ Etapa Productiva: {programa_info['etapa_productiva_horas']} horas")
        
        # Calcular Total
        if programa_info["etapa_lectiva_horas"] and programa_info["etapa_productiva_horas"]:
            programa_info["duracion_total_horas"] = programa_info["etapa_lectiva_horas"] + programa_info["etapa_productiva_horas"]
            print(f"✅ Total calculado: {programa_info['duracion_total_horas']} horas")
        else:
            match = re.search(r'TOTAL[:\s]*(\d+)\s*HORAS', texto_norm)
            if match:
                programa_info["duracion_total_horas"] = int(match.group(1))
                print(f"✅ Total: {programa_info['duracion_total_horas']} horas")
        
        # Tipo de programa si no se encontró
        if not programa_info["titulo_certificado"]:
            if re.search(r'TECNOLO[GÓ]GO', texto_norm):
                programa_info["titulo_certificado"] = "TECNÓLOGO"
                programa_info["tipo_programa"] = "TITULADO"
                print(f"✅ Título: TECNÓLOGO")
                print(f"✅ Tipo: TITULADO")
            elif re.search(r'TECNICO', texto_norm):
                programa_info["titulo_certificado"] = "TÉCNICO"
                programa_info["tipo_programa"] = "TITULADO"
                print(f"✅ Título: TÉCNICO")

        # === Crear estructura final ===
        resultado_final = {
            "programa": programa_info,
            "competencias": competencias
        }

        # === Exportar a JSON ===
        with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
            json.dump(resultado_final, f, indent=4, ensure_ascii=False)

        # Estadísticas
        total_resultados = sum(len(c.get("resultados_aprendizaje", [])) for c in competencias)
        print(f"\n✅ Procesamiento completado:")
        print(f"   📋 Información del programa extraída")
        print(f"   📚 {len(competencias)} competencias guardadas")
        print(f"   📝 {total_resultados} resultados de aprendizaje extraídos")
        print(f"   💾 Archivo guardado en: {OUTPUT_PATH}")

except FileNotFoundError:
    print(f"❌ Error: No se encontró el archivo PDF en: {PDF_PATH}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error al procesar el PDF: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)