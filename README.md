# Registro de asistencia mensual

Aplicación estática para marcar asistencia de lunes a viernes, imprimir el mes en A4 y hacer firmar al jefe.

No usa servidor ni base de datos. Todo queda en **localStorage de tu navegador**. Por eso puede publicarse en GitHub Pages.

## Privacidad

- GitHub Pages sirve el **código** (la app). El sitio suele ser público.
- Tus asistencias, nombre y notas **no se suben a GitHub**. Viven solo en el navegador donde las cargás.
- `localhost` y `usuario.github.io` son orígenes distintos: el historial de uno no aparece en el otro. Usá **Exportar respaldo** / **Importar respaldo**.
- Conviene un repo **privado**. El sitio de Pages, en el plan gratuito, igual puede verse con la URL.

## Uso local

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

## Publicar en GitHub Pages

1. Subí el repo a GitHub (rama `main`).
2. En el repo: **Settings → Pages → Source: GitHub Actions**.
3. El workflow `.github/workflows/deploy-pages.yml` construye el sitio y lo publica.
4. La URL queda así:
   - repo de proyecto: `https://TU_USUARIO.github.io/NOMBRE_DEL_REPO/`
   - repo `TU_USUARIO.github.io`: `https://TU_USUARIO.github.io/`

El `basePath` se calcula solo en CI según el nombre del repo. Si usás un dominio propio, definí `NEXT_PUBLIC_BASE_PATH` vacío en el workflow.

## Impresión

En el diálogo del navegador: papel **A4**, desmarcar **Encabezados y pies de página**, activar **Gráficos de fondo**.
