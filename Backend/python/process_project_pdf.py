# import sys
# import io
# try:
#     # For Python 3.7+ on Windows, reconfigure stdout/stderr to UTF-8 to allow emojis
#     sys.stdout.reconfigure(encoding='utf-8')
#     sys.stderr.reconfigure(encoding='utf-8')
# except Exception:
#     try:
#         import codecs
#         sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)
#         sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer)
#     except Exception:
#         pass

# import pdfplumber
# import re
# import unicodedata
# import json
# import sys


# PDF_PATH = sys.argv[1]  # Ruta del PDF recibida como argumento
# OUTPUT_PATH = sys.argv[2]  # Ruta de salida del JSON
# # PDF_PATH = r"/home/plexx/Documentos/SENA/Proyecto Formativo - 2537295 - CONSTRUCCIÓN DE SOFTWARE INTEG.pdf"
# # OUTPUT_PATH = r"/home/plexx/Documentos/SENA/output.json"

# def strip_accents(s: str) -> str:
#     return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')

# def norm(s: str) -> str:
#     s = strip_accents(s or "").upper()
#     s = re.sub(r"\s+", " ", s)
#     return s.strip()

# # --- Palabras clave para proyecto (formas más flexibles) ---
# TARGETS = {
#     'codigo_proyecto': ['CODIG', 'PROYECT'],
#     'codigo_programa': ['CODIG', 'PROGRAMA'],
#     'nombre_proyecto': ['NOMBRE', 'PROYECT'],
#     'tiempo': ['TIEMPO', 'EJECUC']
# }

# # Información del proyecto
# proyecto_info = {
#     "codigo_proyecto_sofia": None,
#     "codigo_programa_sofia": None,
#     "nombre_proyecto": None,
#     "tiempo_ejecucion_meses": None
# }

# # Lista de fases con sus competencias asociadas
# fases_competencias = []

# # Lista de resultados de aprendizaje con nombre, código completo y fase
# fases_resultados = []

# # Flag para detectar tabla de Planeación del Proyecto
# en_tabla_planeacion = False
# pagina_inicio_planeacion = None
# fases_ya_agregadas = set()  # Para evitar duplicados
# ultima_fase_global = None  # 🔥 NUEVO: Mantener fase entre tablas y páginas

# def extraer_codigo_resultado(texto: str) -> str | None:
#     """Extrae solo el código numérico del resultado de aprendizaje (ej: '593154' de '593154 - Descripción...')
    
#     IMPORTANTE: Los códigos de resultados de aprendizaje del SENA tienen EXACTAMENTE 6 dígitos.
#     Los códigos de competencia tienen 9 dígitos y deben ser ignorados para fases.
#     """
#     if not texto:
#         return None
    
#     texto = texto.strip()
    
#     # Buscar patrón: número de EXACTAMENTE 6 dígitos al inicio
#     # Ejemplos válidos: "593154", "593154 -", "593154 - Descripción..."
#     match = re.match(r'^(\d{6})\b', texto)
#     if match:
#         return match.group(1)
    
#     # Si no hay match al inicio, buscar cualquier código numérico de EXACTAMENTE 6 dígitos
#     match = re.search(r'\b(\d{6})\b', texto)
#     if match:
#         return match.group(1)
    
#     return None

# def extraer_codigo_completo_y_nombre(texto: str) -> tuple[str | None, str | None, str | None]:
#     """Extrae el código completo (ej: '593343 - 01'), el código corto (ej: '01') y el nombre del resultado.
    
#     Formato esperado: "593343 - 01 - Nombre del resultado de aprendizaje"
#     o variaciones como: "593343-01 Nombre", "593343 - 01 Nombre", etc.
    
#     Returns:
#         (codigo_completo, codigo_corto, nombre_resultado)
#     """
#     if not texto:
#         return None, None, None
    
#     texto = texto.strip()
    
#     # Normalizar espacios múltiples
#     texto = re.sub(r'\s+', ' ', texto)
    
#     # Patrón 1: "593343 - 01 - Nombre" o "593343-01-Nombre"
#     match = re.match(r'^(\d{6})\s*-\s*(\d+)\s*-\s*(.+)$', texto, re.DOTALL)
#     if match:
#         codigo_base = match.group(1)
#         codigo_corto = match.group(2)
#         nombre = match.group(3).strip()
#         codigo_completo = f"{codigo_base} - {codigo_corto}"
#         return codigo_completo, codigo_corto, nombre
    
#     # Patrón 2: "593343 - 01 Nombre" (sin guion antes del nombre)
#     match = re.match(r'^(\d{6})\s*-\s*(\d+)\s+(.+)$', texto, re.DOTALL)
#     if match:
#         codigo_base = match.group(1)
#         codigo_corto = match.group(2)
#         nombre = match.group(3).strip()
#         codigo_completo = f"{codigo_base} - {codigo_corto}"
#         return codigo_completo, codigo_corto, nombre
    
#     # Patrón 3: "593343-01Nombre" (sin espacios)
#     match = re.match(r'^(\d{6})-(\d+)(.+)$', texto, re.DOTALL)
#     if match:
#         codigo_base = match.group(1)
#         codigo_corto = match.group(2)
#         nombre = match.group(3).strip()
#         codigo_completo = f"{codigo_base} - {codigo_corto}"
#         return codigo_completo, codigo_corto, nombre
    
#     # Patrón 4: "593343 - 01" seguido de texto (sin guion explícito)
#     # Buscar código de 6 dígitos seguido de guion y número
#     match = re.match(r'^(\d{6})\s*-\s*(\d+)(?:\s+|\s*-\s*)(.+)$', texto, re.DOTALL)
#     if match:
#         codigo_base = match.group(1)
#         codigo_corto = match.group(2)
#         nombre = match.group(3).strip()
#         codigo_completo = f"{codigo_base} - {codigo_corto}"
#         return codigo_completo, codigo_corto, nombre
    
#     # Si no coincide ningún patrón, intentar extraer solo el código de 6 dígitos
#     codigo_base = extraer_codigo_resultado(texto)
#     if codigo_base:
#         # Intentar extraer el número después del guion
#         match = re.search(rf'{codigo_base}\s*-\s*(\d+)', texto)
#         if match:
#             codigo_corto = match.group(1)
#             codigo_completo = f"{codigo_base} - {codigo_corto}"
#             # El nombre sería todo lo que viene después del código corto
#             # Buscar después de "codigo_base - codigo_corto" cualquier cosa
#             nombre_match = re.search(rf'{codigo_base}\s*-\s*{codigo_corto}\s*-?\s*(.+)', texto, re.DOTALL)
#             if nombre_match:
#                 nombre = nombre_match.group(1).strip()
#                 return codigo_completo, codigo_corto, nombre
#             else:
#                 # Intentar sin el guion antes del nombre
#                 nombre_match = re.search(rf'{codigo_base}\s*-\s*{codigo_corto}\s+(.+)', texto, re.DOTALL)
#                 if nombre_match:
#                     nombre = nombre_match.group(1).strip()
#                     return codigo_completo, codigo_corto, nombre
#         else:
#             # Solo tenemos el código base, no hay código corto
#             return None, None, None
    
#     return None, None, None

# try:
#     print(f"📄 Procesando PDF de proyecto: {PDF_PATH}")
    
#     with pdfplumber.open(PDF_PATH) as pdf:
#         print(f"📊 Total de páginas: {len(pdf.pages)}")
        
#         for num_pagina, page in enumerate(pdf.pages, 1):
#             # Extraer texto de la página
#             texto_pagina = page.extract_text() or ""
#             texto_norm = norm(texto_pagina)
            
#             # Detectar si estamos en la sección de Planeación del Proyecto
#             if "PLANEACION DEL PROYECTO" in texto_norm or "PLANEACIÓN DEL PROYECTO" in texto_norm or "3. PLANEACION" in texto_norm or "3. PLANEACIÓN" in texto_norm:
#                 if not en_tabla_planeacion:
#                     en_tabla_planeacion = True
#                     pagina_inicio_planeacion = num_pagina
#                     print(f"✅ Encontrada sección 'Planeación del Proyecto' en página {num_pagina}")
            
#             # Detectar si salimos de la sección (nueva sección importante)
#             if en_tabla_planeacion and num_pagina > pagina_inicio_planeacion + 10:
#                 # Si pasaron más de 10 páginas desde el inicio, puede que ya terminó la sección
#                 # Pero continuamos por si acaso
#                 pass
            
#             # También intentar extraer de tablas
#             tablas = page.extract_tables()
            
#             # Si encontramos la sección, procesar todas las tablas de esta página y las siguientes
#             # Continuar procesando hasta el final del documento
#             procesar_tablas_fases = en_tabla_planeacion or (pagina_inicio_planeacion is not None and num_pagina >= pagina_inicio_planeacion)
            
#             if procesar_tablas_fases:
#                 print(f"   🔍 Buscando tabla de fases en página {num_pagina}...")
#                 if ultima_fase_global:
#                     print(f"   📌 Fase actual en memoria: '{ultima_fase_global}'")
                
#                 for tabla_idx, tabla in enumerate(tablas):
#                     if not tabla or len(tabla) < 2:
#                         continue
                    
#                     print(f"   📋 Analizando tabla {tabla_idx + 1} con {len(tabla)} filas")
                    
#                     # Buscar si esta tabla contiene información de fases
#                     tiene_fases = False
#                     tiene_competencias = False
                    
#                     # Revisar todas las filas para ver si contiene fases y competencias
#                     for fila in tabla[:15]:  # Revisar primeras 15 filas
#                         if not fila:
#                             continue
#                         for celda in fila:
#                             if not celda:
#                                 continue
#                             celda_str = str(celda).strip()
#                             celda_norm = norm(celda_str)
                            
#                             # Verificar si tiene fases (palabras clave más amplias)
#                             palabras_fase = ["ANALISIS", "ANÁLISIS", "DISENO", "DISEÑO", "DESARROLLO", 
#                                             "IMPLEMENTACION", "IMPLEMENTACIÓN", "PRUEBA", "FASE", 
#                                             "EJECUCION", "EJECUCIÓN", "PLANIFICACION", "PLANIFICACIÓN",
#                                             "CONSTRUCCION", "CONSTRUCCIÓN", "DOCUMENTACION", "DOCUMENTACIÓN"]
#                             if any(palabra in celda_norm for palabra in palabras_fase):
#                                 tiene_fases = True
                            
#                             # Verificar si tiene códigos de resultado (6 dígitos)
#                             codigo = extraer_codigo_resultado(celda_str)
#                             if codigo and len(codigo) == 6:
#                                 tiene_competencias = True
                            
#                             # Si ya encontramos ambos, salir
#                             if tiene_fases and tiene_competencias:
#                                 break
#                         if tiene_fases and tiene_competencias:
#                             break
                    
#                     # Si la tabla tiene fases y competencias, procesarla
#                     if tiene_fases and tiene_competencias:
#                         print(f"   ✅ Tabla {tabla_idx + 1} parece contener fases y competencias")
                        
#                         indice_columna_fase = None
#                         indice_columna_competencia = None
                        
#                         # Buscar columnas en todas las filas
#                         for fila_idx, fila in enumerate(tabla):
#                             if not fila:
#                                 continue
                            
#                             for col_idx, celda in enumerate(fila):
#                                 if not celda:
#                                     continue
                                
#                                 celda_str = str(celda).strip()
#                                 celda_norm = norm(celda_str)
                                
#                                 # Buscar columna de fases
#                                 if indice_columna_fase is None:
#                                     # Buscar encabezado 3.1 o texto que parezca fase
#                                     if ("3.1" in celda_norm and "FASE" in celda_norm) or \
#                                        ("FASES DEL PROYECTO" in celda_norm) or \
#                                        (len(celda_str) > 2 and len(celda_str) < 150 and 
#                                         not re.match(r'^\d{6,}', celda_str) and 
#                                         "COMPETENCIA" not in celda_norm and
#                                         not ("3.4" in celda_norm) and
#                                         (any(palabra in celda_norm for palabra in ["ANALISIS", "ANÁLISIS", "DISENO", "DISEÑO", "DESARROLLO", 
#                                                                                   "IMPLEMENTACION", "IMPLEMENTACIÓN", "PRUEBA", "FASE", 
#                                                                                   "EJECUCION", "EJECUCIÓN", "PLANIFICACION", "PLANIFICACIÓN",
#                                                                                   "CONSTRUCCION", "CONSTRUCCIÓN", "DOCUMENTACION", "DOCUMENTACIÓN"]) or
#                                          (fila_idx > 0 and len(celda_str) > 3))):  # Si no es la primera fila y tiene contenido, puede ser una fase
#                                         indice_columna_fase = col_idx
#                                         print(f"   ✅ Columna Fases encontrada en índice {col_idx}: '{celda_str[:50]}'")
                                
#                                 # Buscar columna de resultado de aprendizaje (códigos de 6 dígitos)
#                                 if indice_columna_competencia is None:
#                                     # Buscar encabezado 3.4 o código de resultado de 6 dígitos
#                                     if ("3.4" in celda_norm and "COMPETENCIA" in celda_norm) or \
#                                        ("COMPETENCIA ASOCIADA" in celda_norm) or \
#                                        (extraer_codigo_resultado(celda_str) and len(extraer_codigo_resultado(celda_str)) == 6):
#                                         indice_columna_competencia = col_idx
#                                         print(f"   ✅ Columna Resultado encontrada en índice {col_idx}: '{celda_str[:50]}'")
                                
#                                 if indice_columna_fase is not None and indice_columna_competencia is not None:
#                                     break
                            
#                             if indice_columna_fase is not None and indice_columna_competencia is not None:
#                                 break
                        
#                         # Si no encontramos, usar primera y última columna
#                         if indice_columna_fase is None:
#                             indice_columna_fase = 0
#                         if indice_columna_competencia is None:
#                             indice_columna_competencia = len(tabla[0]) - 1 if tabla[0] else -1
                        
#                         # Procesar todas las filas de la tabla
#                         filas_procesadas = 0
#                         # 🔥 Usar la última fase global si existe, sino inicializar como None
#                         ultima_fase_valida = ultima_fase_global
                        
#                         for fila_idx, fila in enumerate(tabla):
#                             if not fila or len(fila) == 0:
#                                 continue
                            
#                             # Extraer fase
#                             fase = None
#                             if indice_columna_fase < len(fila):
#                                 fase_celda = fila[indice_columna_fase]
#                                 if fase_celda:
#                                     fase_texto = str(fase_celda).strip()
#                                     # Si la celda no está vacía y tiene contenido válido
#                                     if fase_texto and len(fase_texto) > 2:
#                                         fase = fase_texto
                            
#                             # Extraer resultado de aprendizaje (código completo, código corto y nombre)
#                             codigo_comp = None
#                             codigo_completo = None
#                             codigo_corto = None
#                             nombre_resultado = None
#                             if indice_columna_competencia < len(fila):
#                                 competencia_celda = fila[indice_columna_competencia]
#                                 if competencia_celda:
#                                     # Obtener el texto completo de la celda, incluyendo saltos de línea
#                                     # Si es una lista (múltiples líneas), unirlas
#                                     if isinstance(competencia_celda, list):
#                                         competencia_texto = " ".join(str(x) for x in competencia_celda if x).strip()
#                                     else:
#                                         competencia_texto = str(competencia_celda).strip()
                                    
#                                     # Reemplazar múltiples espacios y saltos de línea por un solo espacio
#                                     competencia_texto = re.sub(r'\s+', ' ', competencia_texto)
                                    
#                                     # Intentar extraer código completo y nombre
#                                     codigo_completo, codigo_corto, nombre_resultado = extraer_codigo_completo_y_nombre(competencia_texto)
#                                     # Si no se pudo extraer el formato completo, usar el método anterior
#                                     if not codigo_completo:
#                                         codigo_comp = extraer_codigo_resultado(competencia_texto)
#                                         # Si hay código pero no nombre, el texto completo podría ser el nombre
#                                         if codigo_comp and len(competencia_texto) > len(codigo_comp):
#                                             # Remover el código y limpiar el nombre
#                                             nombre_temp = competencia_texto.replace(codigo_comp, "").strip()
#                                             # Remover guiones y espacios extra al inicio
#                                             nombre_temp = re.sub(r'^[\s\-]+', '', nombre_temp)
#                                             nombre_resultado = nombre_temp.strip()
#                                     else:
#                                         codigo_comp = extraer_codigo_resultado(competencia_texto)
                            
#                             # Si encontramos una fase válida, actualizarla como última fase
#                             if fase and len(fase.strip()) > 2:
#                                 fase_norm_temp = norm(fase)
#                                 # Verificar que es realmente una fase, no un encabezado
#                                 palabras_fase_validas = [
#                                     "ANALISIS", "ANÁLISIS", "DISENO", "DISEÑO", "DESARROLLO",
#                                     "IMPLEMENTACION", "IMPLEMENTACIÓN", "PRUEBA", "PRUEBAS",
#                                     "EJECUCION", "EJECUCIÓN", "PLANEACION", "PLANEACIÓN",
#                                     "CONSTRUCCION", "CONSTRUCCIÓN", "EVALUACION", "EVALUACIÓN",
#                                     "PLANIFICACION", "PLANIFICACIÓN", "DOCUMENTACION", "DOCUMENTACIÓN"
#                                 ]
#                                 es_fase_real = any(palabra in fase_norm_temp for palabra in palabras_fase_validas)
                                
#                                 # No es un encabezado y es una fase válida
#                                 es_encabezado_temp = (
#                                     ("3.1" in fase_norm_temp and "FASE" in fase_norm_temp) or
#                                     ("FASES DEL PROYECTO" in fase_norm_temp) or
#                                     (fase.strip().startswith("3.1") and "FASE" in fase_norm_temp)
#                                 )
                                
#                                 if es_fase_real and not es_encabezado_temp:
#                                     ultima_fase_valida = fase
#                                     ultima_fase_global = fase  # 🔥 Actualizar fase global
#                                     print(f"   🔖 Fase detectada: '{ultima_fase_valida}'")
                            
#                             # Si NO hay fase pero hay competencia, usar la última fase válida (salto de página)
#                             if not fase and codigo_comp and ultima_fase_valida:
#                                 fase = ultima_fase_valida
#                                 print(f"   🔄 Usando última fase válida '{fase}' para competencia {codigo_comp} (salto de página)")
                            
#                             # Validar y agregar (solo códigos de resultado de 6 dígitos)
#                             if fase and codigo_comp and len(fase.strip()) > 2 and len(codigo_comp) == 6:
#                                 fase_norm = norm(fase)
#                                 fase_limpia = fase.strip()
                                
#                                 # Excluir encabezados específicos
#                                 es_encabezado = (
#                                     ("3.1" in fase_norm and "FASE" in fase_norm) or
#                                     ("FASES DEL PROYECTO" in fase_norm) or
#                                     (fase_limpia.startswith("3.1") and "FASE" in fase_norm) or
#                                     (len(fase_limpia) < 5 and fase_limpia.isdigit())  # Solo números muy cortos
#                                 )
                                
#                                 # Excluir descripciones de competencias (textos muy largos o que contienen código de competencia)
#                                 es_descripcion_competencia = (
#                                     len(fase_limpia) > 100 or  # Textos muy largos
#                                     re.search(r'\d{6,}\s*-', fase_limpia) or  # Contiene código seguido de guión
#                                     "ACUERDO" in fase_norm or  # Palabras típicas de descripciones
#                                     "SEGUN" in fase_norm or
#                                     "SEGÚN" in fase_norm or
#                                     "APLICAR" in fase_norm or
#                                     "APLICACIÓN" in fase_norm or
#                                     "ORIENTAR" in fase_norm or
#                                     "EVALUAR" in fase_norm or
#                                     "RAZONAR" in fase_norm or
#                                     "INTERACTUAR" in fase_norm or
#                                     "\n" in fase_limpia  # Contiene saltos de línea
#                                 )
                                
#                                 # Solo agregar fases válidas (palabras clave comunes en fases)
#                                 palabras_fase_validas = [
#                                     "ANALISIS", "ANÁLISIS", "DISENO", "DISEÑO", "DESARROLLO",
#                                     "IMPLEMENTACION", "IMPLEMENTACIÓN", "PRUEBA", "PRUEBAS",
#                                     "EJECUCION", "EJECUCIÓN", "PLANEACION", "PLANEACIÓN",
#                                     "CONSTRUCCION", "CONSTRUCCIÓN", "EVALUACION", "EVALUACIÓN",
#                                     "PLANIFICACION", "PLANIFICACIÓN", "DOCUMENTACION", "DOCUMENTACIÓN"
#                                 ]
#                                 es_fase_valida = any(palabra in fase_norm for palabra in palabras_fase_validas)
                                
#                                 if not es_encabezado and not es_descripcion_competencia and es_fase_valida:
#                                     # Crear clave única para evitar duplicados
#                                     clave_unica = f"{fase_limpia}|{codigo_comp}"
#                                     if clave_unica not in fases_ya_agregadas:
#                                         # Agregar a fases_competencias (para compatibilidad)
#                                         fases_competencias.append({
#                                             "codigo_resultado": codigo_comp,
#                                             "fase": fase_limpia
#                                         })
#                                         # Agregar a fases_resultados con información completa
#                                         if nombre_resultado and codigo_completo and codigo_corto:
#                                             fases_resultados.append({
#                                                 "nombre_resultado": nombre_resultado,
#                                                 "codigo_completo": codigo_completo,
#                                                 "codigo_corto": codigo_corto,
#                                                 "fase": fase_limpia
#                                             })
#                                             print(f"   📋 Fase '{fase_limpia[:50]}' -> Resultado '{codigo_comp}' - '{nombre_resultado[:50]}...'")
#                                         else:
#                                             # Si no tenemos nombre completo, agregar solo con código
#                                             fases_resultados.append({
#                                                 "nombre_resultado": None,
#                                                 "codigo_completo": codigo_completo or f"{codigo_comp} -",
#                                                 "codigo_corto": codigo_corto or None,
#                                                 "fase": fase_limpia
#                                             })
#                                             print(f"   📋 Fase '{fase_limpia[:50]}' -> Resultado '{codigo_comp}'")
#                                         fases_ya_agregadas.add(clave_unica)
#                                         filas_procesadas += 1
                        
#                         if filas_procesadas > 0:
#                             print(f"   ✅ Procesadas {filas_procesadas} fases de la tabla {tabla_idx + 1}")
#                             # No romper el bucle, continuar buscando más tablas
                
#                 # Continuar buscando en más páginas, no desactivar el flag
                
#             # Extraer información del proyecto de TODAS las tablas (no solo las de fases)
#             for tabla in tablas:
#                 # Continuar con la extracción normal de información del proyecto
#                 for fila in tabla:
#                     if fila and any(fila):
#                         celda_izq = norm(fila[0] or "")
#                         celda_der = fila[1] or "" if len(fila) > 1 else ""

#                         # Código de proyecto (busca palabras clave en la celda izquierda)
#                         if all(k in celda_izq for k in TARGETS['codigo_proyecto']):
#                             val = (celda_der or "").strip()
#                             if val:
#                                 proyecto_info["codigo_proyecto_sofia"] = val
#                                 print(f"✅ Código proyecto SOFIA: {proyecto_info['codigo_proyecto_sofia']}")
#                         # Código del programa
#                         elif all(k in celda_izq for k in TARGETS['codigo_programa']):
#                             val = (celda_der or "").strip()
#                             if val:
#                                 proyecto_info["codigo_programa_sofia"] = val
#                                 print(f"✅ Código programa SOFIA: {proyecto_info['codigo_programa_sofia']}")
#                         # Nombre del proyecto
#                         elif all(k in celda_izq for k in TARGETS['nombre_proyecto']):
#                             val = (celda_der or "").strip()
#                             if val:
#                                 proyecto_info["nombre_proyecto"] = val
#                                 print(f"✅ Nombre proyecto: {proyecto_info['nombre_proyecto']}")
#                         # Tiempo de ejecución (meses)
#                         elif all(k in celda_izq for k in TARGETS['tiempo']):
#                             # intentamos extraer número de meses de la celda derecha
#                             val = (celda_der or "").strip()
#                             if val:
#                                 m = re.search(r"(\d+)\s*mes", val.lower())
#                                 if m:
#                                     proyecto_info["tiempo_ejecucion_meses"] = int(m.group(1))
#                                 else:
#                                     proyecto_info["tiempo_ejecucion_meses"] = val
#                                 print(f"✅ Tiempo ejecución: {proyecto_info['tiempo_ejecucion_meses']}")
            
#             # Buscar también en texto plano (por si no está en tablas)
#             # Buscar código de proyecto
#             if not proyecto_info["codigo_proyecto_sofia"]:
#                 # Buscar en texto con diferentes patrones
#                 patrones = [
#                     r"CODIGO\s+DE\s+PROYECTO\s+SOFIA[:\s]*(\S+)",
#                     r"CODIGO\s+PROYECTO[:\s]*(\d+)",
#                     r"PROYECTO\s+FORMATIVO[:\s]*(\d+)",
#                     r"CODIGO[:\s]*(\d{7})"
#                 ]
#                 for patron in patrones:
#                     match = re.search(patron, texto_norm)
#                     if match:
#                         proyecto_info["codigo_proyecto_sofia"] = match.group(1)
#                         print(f"✅ Código proyecto SOFIA (texto): {proyecto_info['codigo_proyecto_sofia']}")
#                         break
            
#             # Buscar código de programa
#             if not proyecto_info["codigo_programa_sofia"]:
#                 patrones = [
#                     r"CODIGO\s+DEL\s+PROGRAMA\s+SOFIA[:\s]*(\S+)",
#                     r"CODIGO\s+PROGRAMA[:\s]*(\d+)",
#                     r"PROGRAMA[:\s]*(\d{6})"
#                 ]
#                 for patron in patrones:
#                     match = re.search(patron, texto_norm)
#                     if match:
#                         proyecto_info["codigo_programa_sofia"] = match.group(1)
#                         print(f"✅ Código programa SOFIA (texto): {proyecto_info['codigo_programa_sofia']}")
#                         break
            
#             # Buscar nombre del proyecto
#             if not proyecto_info["nombre_proyecto"]:
#                 match = re.search(r"NOMBRE\s+DEL\s+PROYECTO[:\s]*([^\n]{10,200})", texto_norm)
#                 if match:
#                     nombre = match.group(1).strip()
#                     if len(nombre) > 10:
#                         proyecto_info["nombre_proyecto"] = nombre
#                         print(f"✅ Nombre proyecto (texto): {proyecto_info['nombre_proyecto'][:50]}...")
            
#             # Buscar tiempo de ejecución
#             if not proyecto_info["tiempo_ejecucion_meses"]:
#                 patrones = [
#                     r"TIEMPO\s+ESTIMADO[^0-9]*(\d+)\s*MES",
#                     r"TIEMPO\s+DE\s+EJECUCION[^0-9]*(\d+)\s*MES",
#                     r"DURACION[^0-9]*(\d+)\s*MES"
#                 ]
#                 for patron in patrones:
#                     match = re.search(patron, texto_norm)
#                     if match:
#                         proyecto_info["tiempo_ejecucion_meses"] = int(match.group(1))
#                         print(f"✅ Tiempo ejecución (texto): {proyecto_info['tiempo_ejecucion_meses']} meses")
#                         break

#     # Verificar que se encontró al menos algo
#     if not any(proyecto_info.values()) and len(fases_competencias) == 0:
#         print("⚠️ Advertencia: No se encontró información del proyecto o fases en el PDF")
    
#     # === Exportar a JSON ===
#     # Normalizar cadenas vacías a None para no insertar valores vacíos en la BD
#     for k, v in proyecto_info.items():
#         if isinstance(v, str) and v.strip() == "":
#             proyecto_info[k] = None

#     # Estructura final del JSON
#     resultado_final = {
#         "proyecto": proyecto_info,
#         "fases_competencias": fases_competencias,
#         "fases_resultados": fases_resultados
#     }

#     with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
#         json.dump(resultado_final, f, indent=4, ensure_ascii=False)

#     print(f"\n✅ Información extraída:")
#     print(f"   📋 Proyecto: {len([v for v in proyecto_info.values() if v])} campos")
#     print(f"   🔄 Fases (competencias): {len(fases_competencias)} relaciones")
#     print(f"   🔄 Fases (resultados): {len(fases_resultados)} relaciones")
#     if fases_resultados:
#         print(f"   📝 Resultados con nombre encontrados:")
#         for item in fases_resultados[:5]:  # Mostrar solo los primeros 5
#             if item.get('nombre_resultado'):
#                 print(f"      - {item['fase']} -> {item['codigo_completo']} - {item['nombre_resultado'][:50]}...")
#     elif fases_competencias:
#         print(f"   📝 Fases encontradas (solo códigos):")
#         for item in fases_competencias[:5]:  # Mostrar solo los primeros 5
#             print(f"      - {item['fase']} -> {item['codigo_resultado']}")
#     else:
#         print(f"   ⚠️ No se encontraron fases en la tabla")
#     print(f"   💾 Archivo guardado en: {OUTPUT_PATH}")

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
import sys

PDF_PATH = sys.argv[1]
OUTPUT_PATH = sys.argv[2]

def strip_accents(s: str) -> str:
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')

def norm(s: str) -> str:
    s = strip_accents(s or "").upper()
    s = re.sub(r"\s+", " ", s)
    return s.strip()

# Palabras clave para proyecto
TARGETS = {
    'codigo_proyecto': ['CODIG', 'PROYECT'],
    'codigo_programa': ['CODIG', 'PROGRAMA'],
    'nombre_proyecto': ['NOMBRE', 'PROYECT'],
    'tiempo': ['TIEMPO', 'EJECUC']
}

# Fases válidas del SENA
FASES_VALIDAS = {
    "ANALISIS": ["ANALISIS", "ANÁLISIS"],
    "PLANEACION": ["PLANEACION", "PLANEACIÓN"],
    "EJECUCION": ["EJECUCION", "EJECUCIÓN"],
    "EVALUACION": ["EVALUACION", "EVALUACIÓN"]
}

proyecto_info = {
    "codigo_proyecto_sofia": None,
    "codigo_programa_sofia": None,
    "nombre_proyecto": None,
    "tiempo_ejecucion_meses": None
}

fases_competencias = []
fases_resultados = []
en_tabla_planeacion = False
pagina_inicio_planeacion = None
fases_ya_agregadas = set()
ultima_fase_global = None

def normalizar_fase(fase_texto: str) -> str | None:
    """Normaliza el nombre de la fase a uno de los 4 valores válidos."""
    if not fase_texto:
        return None
    
    fase_norm = norm(fase_texto)
    
    for fase_estandar, variantes in FASES_VALIDAS.items():
        for variante in variantes:
            if variante in fase_norm:
                return fase_estandar
    
    return None

def extraer_codigo_resultado(texto: str) -> str | None:
    """Extrae el código de 6 dígitos del resultado de aprendizaje."""
    if not texto:
        return None
    
    texto = texto.strip()
    match = re.match(r'^(\d{6})\b', texto)
    if match:
        return match.group(1)
    
    match = re.search(r'\b(\d{6})\b', texto)
    if match:
        return match.group(1)
    
    return None

def extraer_codigo_completo_y_nombre(texto: str) -> tuple[str | None, str | None, str | None]:
    """Extrae código completo, código corto y nombre del resultado.
    
    Returns: (codigo_completo, codigo_corto, nombre_resultado)
    """
    if not texto:
        return None, None, None
    
    texto = texto.strip()
    texto = re.sub(r'\s+', ' ', texto)
    
    # Patrón 1: "593343 - 01 - Nombre"
    match = re.match(r'^(\d{6})\s*-\s*(\d+)\s*-\s*(.+)$', texto, re.DOTALL)
    if match:
        codigo_base = match.group(1)
        codigo_corto = match.group(2)
        nombre = match.group(3).strip()
        codigo_completo = f"{codigo_base} - {codigo_corto}"
        return codigo_completo, codigo_corto, nombre
    
    # Patrón 2: "593343 - 01 Nombre"
    match = re.match(r'^(\d{6})\s*-\s*(\d+)\s+(.+)$', texto, re.DOTALL)
    if match:
        codigo_base = match.group(1)
        codigo_corto = match.group(2)
        nombre = match.group(3).strip()
        codigo_completo = f"{codigo_base} - {codigo_corto}"
        return codigo_completo, codigo_corto, nombre
    
    # Patrón 3: "593343-01Nombre"
    match = re.match(r'^(\d{6})-(\d+)(.+)$', texto, re.DOTALL)
    if match:
        codigo_base = match.group(1)
        codigo_corto = match.group(2)
        nombre = match.group(3).strip()
        codigo_completo = f"{codigo_base} - {codigo_corto}"
        return codigo_completo, codigo_corto, nombre
    
    # Intentar extraer código base y buscar el resto
    codigo_base = extraer_codigo_resultado(texto)
    if codigo_base:
        match = re.search(rf'{codigo_base}\s*-\s*(\d+)', texto)
        if match:
            codigo_corto = match.group(1)
            codigo_completo = f"{codigo_base} - {codigo_corto}"
            
            # Buscar el nombre después del código
            nombre_match = re.search(rf'{codigo_base}\s*-\s*{codigo_corto}\s*[-\s]*(.+)', texto, re.DOTALL)
            if nombre_match:
                nombre = nombre_match.group(1).strip()
                # Limpiar guiones al inicio
                nombre = re.sub(r'^[\s\-]+', '', nombre)
                if nombre and len(nombre) > 5:
                    return codigo_completo, codigo_corto, nombre
    
    return None, None, None

def limpiar_nombre_resultado(texto: str) -> str | None:
    """Limpia el nombre del resultado removiendo códigos y caracteres extra."""
    if not texto:
        return None
    
    # Remover códigos de 6 dígitos
    texto = re.sub(r'\b\d{6}\b', '', texto)
    # Remover guiones sueltos
    texto = re.sub(r'\s*-\s*', ' ', texto)
    # Remover números solos al inicio (código corto)
    texto = re.sub(r'^\d+\s+', '', texto)
    # Limpiar espacios múltiples
    texto = re.sub(r'\s+', ' ', texto)
    
    texto = texto.strip()
    
    # Validar que no esté vacío y tenga contenido útil
    if len(texto) < 10:
        return None
    
    return texto

try:
    print(f"📄 Procesando PDF de proyecto: {PDF_PATH}")
    
    with pdfplumber.open(PDF_PATH) as pdf:
        print(f"📊 Total de páginas: {len(pdf.pages)}")
        
        for num_pagina, page in enumerate(pdf.pages, 1):
            texto_pagina = page.extract_text() or ""
            texto_norm = norm(texto_pagina)
            
            # Detectar sección de Planeación
            if any(x in texto_norm for x in ["PLANEACION DEL PROYECTO", "PLANEACIÓN DEL PROYECTO", "3. PLANEACION", "3. PLANEACIÓN"]):
                if not en_tabla_planeacion:
                    en_tabla_planeacion = True
                    pagina_inicio_planeacion = num_pagina
                    print(f"✅ Sección 'Planeación del Proyecto' en página {num_pagina}")
            
            tablas = page.extract_tables()
            procesar_tablas_fases = en_tabla_planeacion or (pagina_inicio_planeacion and num_pagina >= pagina_inicio_planeacion)
            
            if procesar_tablas_fases:
                print(f"   🔍 Buscando tabla de fases en página {num_pagina}...")
                if ultima_fase_global:
                    print(f"   📌 Fase actual: '{ultima_fase_global}'")
                
                for tabla_idx, tabla in enumerate(tablas):
                    if not tabla or len(tabla) < 2:
                        continue
                    
                    print(f"   📋 Analizando tabla {tabla_idx + 1} con {len(tabla)} filas")
                    
                    # Verificar si contiene fases y resultados
                    tiene_fases = False
                    tiene_resultados = False
                    
                    for fila in tabla[:15]:
                        if not fila:
                            continue
                        for celda in fila:
                            if not celda:
                                continue
                            celda_str = str(celda).strip()
                            celda_norm = norm(celda_str)
                            
                            # Buscar fases válidas
                            if normalizar_fase(celda_str):
                                tiene_fases = True
                            
                            # Buscar códigos de 6 dígitos
                            if extraer_codigo_resultado(celda_str):
                                tiene_resultados = True
                            
                            if tiene_fases and tiene_resultados:
                                break
                        if tiene_fases and tiene_resultados:
                            break
                    
                    if tiene_fases and tiene_resultados:
                        print(f"   ✅ Tabla {tabla_idx + 1} contiene fases y resultados")
                        
                        indice_columna_fase = None
                        indice_columna_resultado = None
                        
                        # Buscar índices de columnas
                        for fila_idx, fila in enumerate(tabla):
                            if not fila:
                                continue
                            
                            for col_idx, celda in enumerate(fila):
                                if not celda:
                                    continue
                                
                                celda_str = str(celda).strip()
                                celda_norm = norm(celda_str)
                                
                                # Columna de fases
                                if indice_columna_fase is None:
                                    if normalizar_fase(celda_str) or \
                                       ("3.1" in celda_norm and "FASE" in celda_norm) or \
                                       ("FASES DEL PROYECTO" in celda_norm):
                                        indice_columna_fase = col_idx
                                        print(f"   ✅ Columna Fases en índice {col_idx}")
                                
                                # Columna de resultados
                                if indice_columna_resultado is None:
                                    if ("3.4" in celda_norm and "COMPETENCIA" in celda_norm) or \
                                       ("COMPETENCIA ASOCIADA" in celda_norm) or \
                                       ("RESULTADO" in celda_norm and "APRENDIZAJE" in celda_norm) or \
                                       extraer_codigo_resultado(celda_str):
                                        indice_columna_resultado = col_idx
                                        print(f"   ✅ Columna Resultado en índice {col_idx}")
                                
                                if indice_columna_fase is not None and indice_columna_resultado is not None:
                                    break
                            
                            if indice_columna_fase is not None and indice_columna_resultado is not None:
                                break
                        
                        # Default: primera y última columna
                        if indice_columna_fase is None:
                            indice_columna_fase = 0
                        if indice_columna_resultado is None:
                            indice_columna_resultado = len(tabla[0]) - 1 if tabla[0] else -1
                        
                        # Procesar filas
                        filas_procesadas = 0
                        ultima_fase_valida = ultima_fase_global
                        
                        for fila_idx, fila in enumerate(tabla):
                            if not fila or len(fila) == 0:
                                continue
                            
                            # Extraer fase
                            fase = None
                            if indice_columna_fase < len(fila):
                                fase_celda = fila[indice_columna_fase]
                                if fase_celda:
                                    fase_texto = str(fase_celda).strip()
                                    if fase_texto and len(fase_texto) > 2:
                                        fase = fase_texto
                            
                            # Extraer resultado
                            codigo_comp = None
                            codigo_completo = None
                            codigo_corto = None
                            nombre_resultado = None
                            
                            if indice_columna_resultado < len(fila):
                                resultado_celda = fila[indice_columna_resultado]
                                if resultado_celda:
                                    # Unir si es lista
                                    if isinstance(resultado_celda, list):
                                        resultado_texto = " ".join(str(x) for x in resultado_celda if x).strip()
                                    else:
                                        resultado_texto = str(resultado_celda).strip()
                                    
                                    # Normalizar espacios
                                    resultado_texto = re.sub(r'\s+', ' ', resultado_texto)
                                    
                                    # Extraer información
                                    codigo_completo, codigo_corto, nombre_resultado = extraer_codigo_completo_y_nombre(resultado_texto)
                                    codigo_comp = extraer_codigo_resultado(resultado_texto)
                                    
                                    # Si no se extrajo el nombre, intentar limpiar el texto completo
                                    if codigo_comp and not nombre_resultado:
                                        nombre_resultado = limpiar_nombre_resultado(resultado_texto)
                            
                            # Actualizar fase válida
                            if fase and len(fase.strip()) > 2:
                                fase_normalizada = normalizar_fase(fase)
                                if fase_normalizada:
                                    ultima_fase_valida = fase_normalizada
                                    ultima_fase_global = fase_normalizada
                                    print(f"   🔖 Fase detectada: '{ultima_fase_valida}'")
                            
                            # Usar última fase válida si no hay fase en esta fila
                            if not fase and codigo_comp and ultima_fase_valida:
                                fase = ultima_fase_valida
                                print(f"   🔄 Usando fase '{fase}' para resultado {codigo_comp}")
                            
                            # Validar y agregar
                            if fase and codigo_comp and len(codigo_comp) == 6:
                                fase_normalizada = normalizar_fase(fase)
                                
                                if fase_normalizada:
                                    clave_unica = f"{fase_normalizada}|{codigo_comp}"
                                    
                                    if clave_unica not in fases_ya_agregadas:
                                        # Agregar a fases_competencias
                                        fases_competencias.append({
                                            "codigo_resultado": codigo_comp,
                                            "fase": fase_normalizada
                                        })
                                        
                                        # Agregar a fases_resultados con nombre
                                        resultado_item = {
                                            "nombre_resultado": nombre_resultado,
                                            "codigo_completo": codigo_completo or f"{codigo_comp} - 00",
                                            "codigo_corto": codigo_corto or "00",
                                            "fase": fase_normalizada
                                        }
                                        fases_resultados.append(resultado_item)
                                        
                                        if nombre_resultado:
                                            print(f"   📋 {fase_normalizada} -> {codigo_comp} - {nombre_resultado[:60]}...")
                                        else:
                                            print(f"   📋 {fase_normalizada} -> {codigo_comp} (sin nombre completo)")
                                        
                                        fases_ya_agregadas.add(clave_unica)
                                        filas_procesadas += 1
                        
                        if filas_procesadas > 0:
                            print(f"   ✅ Procesados {filas_procesadas} resultados de tabla {tabla_idx + 1}")
            
            # Extraer información del proyecto
            for tabla in tablas:
                for fila in tabla:
                    if fila and any(fila):
                        celda_izq = norm(fila[0] or "")
                        celda_der = fila[1] or "" if len(fila) > 1 else ""

                        if all(k in celda_izq for k in TARGETS['codigo_proyecto']):
                            val = (celda_der or "").strip()
                            if val:
                                proyecto_info["codigo_proyecto_sofia"] = val
                                print(f"✅ Código proyecto SOFIA: {val}")
                        elif all(k in celda_izq for k in TARGETS['codigo_programa']):
                            val = (celda_der or "").strip()
                            if val:
                                proyecto_info["codigo_programa_sofia"] = val
                                print(f"✅ Código programa SOFIA: {val}")
                        elif all(k in celda_izq for k in TARGETS['nombre_proyecto']):
                            val = (celda_der or "").strip()
                            if val:
                                proyecto_info["nombre_proyecto"] = val
                                print(f"✅ Nombre proyecto: {val}")
                        elif all(k in celda_izq for k in TARGETS['tiempo']):
                            val = (celda_der or "").strip()
                            if val:
                                m = re.search(r"(\d+)\s*mes", val.lower())
                                if m:
                                    proyecto_info["tiempo_ejecucion_meses"] = int(m.group(1))
                                else:
                                    proyecto_info["tiempo_ejecucion_meses"] = val
                                print(f"✅ Tiempo ejecución: {proyecto_info['tiempo_ejecucion_meses']}")
            
            # Buscar en texto plano si no se encontró en tablas
            if not proyecto_info["codigo_proyecto_sofia"]:
                for patron in [r"CODIGO\s+DE\s+PROYECTO\s+SOFIA[:\s]*(\S+)", r"CODIGO\s+PROYECTO[:\s]*(\d+)", r"PROYECTO\s+FORMATIVO[:\s]*(\d+)"]:
                    match = re.search(patron, texto_norm)
                    if match:
                        proyecto_info["codigo_proyecto_sofia"] = match.group(1)
                        break
            
            if not proyecto_info["codigo_programa_sofia"]:
                for patron in [r"CODIGO\s+DEL\s+PROGRAMA\s+SOFIA[:\s]*(\S+)", r"CODIGO\s+PROGRAMA[:\s]*(\d+)"]:
                    match = re.search(patron, texto_norm)
                    if match:
                        proyecto_info["codigo_programa_sofia"] = match.group(1)
                        break
            
            if not proyecto_info["nombre_proyecto"]:
                match = re.search(r"NOMBRE\s+DEL\s+PROYECTO[:\s]*([^\n]{10,200})", texto_norm)
                if match:
                    nombre = match.group(1).strip()
                    if len(nombre) > 10:
                        proyecto_info["nombre_proyecto"] = nombre
            
            if not proyecto_info["tiempo_ejecucion_meses"]:
                for patron in [r"TIEMPO\s+ESTIMADO[^0-9]*(\d+)\s*MES", r"TIEMPO\s+DE\s+EJECUCION[^0-9]*(\d+)\s*MES"]:
                    match = re.search(patron, texto_norm)
                    if match:
                        proyecto_info["tiempo_ejecucion_meses"] = int(match.group(1))
                        break

    # Normalizar valores None
    for k, v in proyecto_info.items():
        if isinstance(v, str) and v.strip() == "":
            proyecto_info[k] = None

    # Estructura final
    resultado_final = {
        "proyecto": proyecto_info,
        "fases_competencias": fases_competencias,
        "fases_resultados": fases_resultados
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(resultado_final, f, indent=4, ensure_ascii=False)

    print(f"\n✅ Información extraída:")
    print(f"   📋 Proyecto: {len([v for v in proyecto_info.values() if v])} campos")
    print(f"   🔄 Fases (competencias): {len(fases_competencias)} resultados")
    print(f"   🔄 Fases (resultados): {len(fases_resultados)} resultados")
    
    # Estadísticas por fase
    fases_count = {}
    resultados_con_nombre = 0
    resultados_sin_nombre = 0
    
    for item in fases_resultados:
        fase = item['fase']
        fases_count[fase] = fases_count.get(fase, 0) + 1
        if item.get('nombre_resultado'):
            resultados_con_nombre += 1
        else:
            resultados_sin_nombre += 1
    
    print(f"\n   📊 Distribución por fase:")
    for fase in ["ANALISIS", "PLANEACION", "EJECUCION", "EVALUACION"]:
        if fase in fases_count:
            print(f"      • {fase}: {fases_count[fase]} resultados")
    
    print(f"\n   ✅ Con nombre: {resultados_con_nombre}")
    print(f"   ⚠️  Sin nombre: {resultados_sin_nombre}")
    print(f"   💾 Archivo guardado en: {OUTPUT_PATH}")

except FileNotFoundError:
    print(f"❌ Error: No se encontró el archivo PDF en: {PDF_PATH}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error al procesar el PDF: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)