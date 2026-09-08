# Registro de asistencia

Control diario de jornada (lunes a viernes) y documento mensual listo para imprimir y firmar.

Los registros se guardan en el navegador. No hay backend ni base de datos.

## Desarrollo

```bash
npm install
npm run dev
```

```bash
npm run build
npm run lint
```

Node 20+. Next.js (export estático), React y TypeScript.

## Datos

Perfil y asistencia viven en `localStorage`. Un respaldo JSON se exporta e importa desde la propia interfaz. Cada origen (por ejemplo, entorno local vs. el sitio publicado) tiene su propio almacenamiento.
