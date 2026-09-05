# Pardo 664 Morada - MVP offline para sala de ventas

Aplicación web local-first para presentar el proyecto inmobiliario Pardo 664 en tablet, iPad, laptop, computadora de escritorio y pantallas táctiles.

## Arquitectura propuesta

- React + Vite + TypeScript para una app rápida y portable.
- Tailwind CSS para una interfaz editorial, sobria y responsive.
- PWA con `public/sw.js` y `manifest.webmanifest` para instalación y uso offline.
- IndexedDB para guardar el contenido publicado en cada dispositivo.
- JSZip para exportar e importar paquetes locales de actualización.
- Datos iniciales extraídos del PDF `PARDO-SMART-JUNIO2026-v2.pdf`.
- Renders, planta típica y planos iniciales empaquetados como assets locales.

## Estructura de carpetas

```text
public/
  icon.svg
  manifest.webmanifest
  sw.js
src/
  assets/pdf-pages/        Imágenes extraídas del PDF
  components/              Navegación, galería, planta y visor de planos
  context/                 Estado global del proyecto
  data/                    Contenido inicial
  services/                IndexedDB, archivos, ZIP e importación/exportación
  styles/                  Tailwind y estilos base
  types/                   Interfaces TypeScript
  App.tsx
  main.tsx
```

## Instalación

```bash
npm install
```

Si aparece un error de permisos de caché de npm en la computadora, usar:

```bash
npm install --cache /private/tmp/pardo-664-npm-cache
```

## Ejecutar en desarrollo

```bash
npm run dev
```

Abrir la URL que aparece en la terminal. Normalmente será:

```text
http://localhost:5173/
```

## Generar versión de producción

```bash
npm run build
```

El resultado queda en la carpeta `dist/`.

Para probar el build:

```bash
npm run preview
```

## Abrir en una computadora

Para uso local recomendado:

1. Instalar dependencias con `npm install`.
2. Ejecutar `npm run dev` durante edición o `npm run preview` después del build.
3. Abrir la URL local en Chrome, Edge, Safari o Firefox.

Para entregar una versión estable, copiar la carpeta del proyecto o publicar el contenido de `dist/` en un servidor local gratuito de la sala de ventas.

## Instalar como PWA

1. Ejecutar `npm run build`.
2. Ejecutar `npm run preview -- --host 0.0.0.0`.
3. Abrir la URL local en el navegador.
4. Usar la opción del navegador “Instalar app”, “Agregar al Dock” o “Agregar a pantalla de inicio”.
5. Abrir la app instalada una vez con conexión local.
6. Esperar unos segundos para que la PWA guarde todos los archivos offline.
7. Probar apagando internet o saliendo de la red.
8. Luego puede utilizarse sin internet.

En iPad, abrir desde Safari y usar “Compartir” > “Agregar a pantalla de inicio”.

Importante: no instales la tablet desde `npm run dev`. El modo desarrollo no prepara la PWA offline completa. Usa siempre `npm run build` y luego `npm run preview -- --host 0.0.0.0`.

## Administrador local

Acceso desde el botón discreto de la portada o desde el botón de engranaje.

PIN inicial:

```text
6640
```

Desde el administrador se puede:

- Editar información general.
- Cambiar metrajes, dormitorios, baños, ambientes y departamentos.
- Activar o desactivar tipologías.
- Reemplazar el plano de la tipología seleccionada.
- Configurar zonas clicables de la planta típica con porcentajes.
- Publicar cambios localmente.
- Exportar una actualización ZIP.
- Descargar `project.json` para publicar contenido maestro en GitHub.
- Importar una actualización ZIP.
- Sincronizar contenido desde GitHub.
- Restaurar el contenido inicial.

## Actualizar contenido

### Opción A: actualización manual por ZIP

1. Entrar al administrador.
2. Editar textos, tipologías o planos.
3. Revisar la vista previa dentro de la app.
4. Presionar “Publicar cambios”.
5. Presionar “Exportar actualización”.
6. Llevar el ZIP a otra tablet o computadora.
7. En la segunda instalación, entrar al administrador y elegir “Importar actualización”.

### Opción B: contenido maestro en GitHub

Esta opción permite que otras computadoras o tablets reciban el contenido nuevo desde GitHub cuando tengan internet, y luego lo mantengan guardado offline.

1. En la computadora principal, entrar al administrador.
2. Editar fotos, textos, planos, logo, mapa o puntos de interés.
3. Presionar “Publicar cambios”.
4. Presionar “Descargar project.json para GitHub”.
5. En GitHub Desktop, abrir el repositorio.
6. Reemplazar o agregar el archivo:

```text
public/content/project.json
```

7. Hacer commit y push.
8. Esperar a que GitHub Pages publique la nueva versión.
9. En cada tablet o computadora, abrir la app con internet.
10. La app revisará automáticamente si existe una versión más nueva en GitHub.
11. Si la encuentra, la guarda en IndexedDB y queda disponible offline.

También se puede entrar al administrador y presionar “Sincronizar desde GitHub” para forzar la revisión.

La sincronización automática ocurre:

- Al abrir la app.
- Al volver a enfocar la app.
- Al recuperar conexión a internet.
- Cada 60 segundos mientras la app esté abierta.

Importante: GitHub no recibe automáticamente las fotos subidas desde el administrador. Primero se debe descargar `project.json` y subirlo al repositorio.

## Copia de seguridad

Usar “Exportar actualización” antes de reemplazar planos o importar contenido nuevo.

El ZIP contiene:

- `pardo-664-project.json`
- versión
- fecha de publicación
- textos
- rutas o archivos embebidos en formato Data URL
- configuración de planta típica
- tipologías y planos reemplazados desde el administrador

## Datos iniciales extraídos del PDF

Incluye:

- Nombre: Pardo 664.
- Desarrollador: Morada.
- Arquitectos: Nómena Arquitectura.
- Ubicación: Av. José Pardo, Miraflores.
- Certificación: LEED.
- Estado: Lanzamiento.
- Formatos: flats y dúplex.
- Tipologías del MVP: A-1, A-2, A-3, A-4, A-5, B-1, B-2, B-3.
- Áreas: desde 60 m² hasta 112 m² según ficha del PDF.
- Áreas comunes: lobby, sala de espera, coworking, gimnasio, SUM, zona de parrillas, piscina, pet-wash, laundry-room y jardín.

Cuando un dato no era inequívoco en el PDF, se dejó editable o marcado como contenido demostrativo.
