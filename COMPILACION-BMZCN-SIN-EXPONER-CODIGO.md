# Compilar BMZCN sin gastar minutos del repositorio privado

**Estado:** flujo listo, pero requiere habilitación de una credencial de lectura por el propietario.
**Flujo:** [Compilar BMZCN privado con runner publico](https://github.com/kusne/Control-Interno/actions/workflows/compilar-bmzcn-desde-privado.yml).

## Por qué
GitHub permite ejecutar gratis los runners estándar de Actions en repositorios públicos.
**No es necesario convertir `kusne/BMZCN` en público:** el runner de `Control-Interno` puede descargar una copia superficial del código privado con un token de solo lectura, verificarlo, generar el instalador y publicar únicamente `.exe`, `.blockmap` y `latest.yml` como release público.

## Configuración de única vez (en GitHub, no por chat)
1. Con la cuenta `kusne`, abrir **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. Elegir la cuenta como propietario y permitir acceso **únicamente a `kusne/BMZCN`**. Seleccionar **Repository permissions → Contents: Read-only**. El permiso Metadata Read es automático. Usar vencimiento corto y renovar cuando expire.
3. Guardar el token como secreto del repositorio **`kusne/Control-Interno`**: **Settings → Secrets and variables → Actions → New repository secret**, nombre exacto `BMZCN_SOURCE_READ_TOKEN`. Nunca subir el token a archivos, issues ni mensajes.
4. Abrir **Actions → Compilar BMZCN privado con runner publico → Run workflow**, desde la rama `main`.
5. El flujo verifica secretos del código actual, ejecuta pruebas y crea el próximo tag `v1.0.N` consecutivo al último release. Comprobar la descarga y actualización del instalador.

## Límites y precauciones
- El workflow público usa `workflow_dispatch`; **no acepta pull requests** ni se dispara por código externo.
- Usa `fetch-depth: 1` y `persist-credentials: false`; no publica el historial de Git de BMZCN.
- No incluye el código fuente ni logs de las pruebas operativas entre los archivos del release.
- Las credenciales pueden rotarse y revocarse en GitHub sin modificar la aplicación.
- Los secretos de un repositorio público no se comparten automáticamente con los privados.
- El programa empaquetado sí contiene los recursos de ejecución necesarios y ya se distribuye públicamente como instalador, lo cual es diferente de publicar el historial del repositorio.
- El flujo **no publica anuncios de actualización por Supabase OIDC**, porque el token OIDC emitido por `Control-Interno` tiene identidad distinta del repositorio `BMZCN`. El canal de releases de electron-updater sigue apuntando a `Control-Interno`; verificar manualmente la notificación de actualizaciones.
- Si el token caduca, el workflow fallará al descargar el repositorio privado, pero no expondrá código ni modificará la base.
- No modificar los permisos anónimos que necesita Informes GP solo para ejecutar este flujo.
