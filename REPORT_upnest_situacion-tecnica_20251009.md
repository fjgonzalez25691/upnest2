<!-- SAVE AS: REPORT_upnest_situacion-tecnica_20251009.md -->

# Portada

Proyecto: Upnest · Versión del informe: v1.0 · 2025-10-09

Alcance del informe · Autor (IA + “Copilot@VSCode”)

## Resumen ejecutivo (≤180 palabras)

Upnest es una aplicación full‑stack para seguimiento de crecimiento infantil basada en percentiles OMS. El backend está implementado en AWS Serverless (API Gateway + Lambda Python 3.12 + DynamoDB) desplegado con AWS SAM. El frontend es React + Vite + Tailwind y consume endpoints autenticados con Cognito (OIDC). El estado actual incluye: CRUD de bebés, CRUD de mediciones, cálculo síncrono de percentiles en creación/actualización y recálculo síncrono al modificar DOB/género (sin polling en cliente). La infraestructura define tablas DynamoDB (Babies, GrowthData, Milestones, Users, Vaccinations), capas de Lambda para dependencias y lógica de percentiles, y CORS por entorno. Hay documentación operativa (DEPLOYMENT, DEV, AUTHSYSTEM, TROUBLESHOOTING) y una batería de tests unitarios en backend. Riesgos actuales: complejidad de SAM/CFN con recursos existentes, tagging y permisos IAM, dependencia de archivos XLSX OMS en layer, versiones de librerías científicas en Lambda. Próximos pasos: pipeline CI/CD, monitoreo/alerting, cobertura de tests e2e, completar endpoints admin y hardening de auth/roles.

## Inventario del repositorio

Área | Rutas clave | Estado | Notas
-|-|-|-
Backend (Lambda) | `backend/lambdas/**` | Activo | Servicios: babies, growth-data, percentiles; handlers unificados; stream processor.
Infra (SAM) | `template.yaml`, `samconfig.toml` | Activo | Condiciones p/ tablas existentes; custom resource para StreamArn; tags normalizados.
Frontend (React) | `frontend/src/**`, `package.json` | Activo | Axios con token OIDC, servicios `/babies`, `/growth-data`, `/percentiles`.
Docs | `docs/*.md` | Activo | Guías de despliegue, desarrollo, auth y troubleshooting.
Tests backend | `backend/tests/*.py` | Activo | Unit tests para babies, growth-data, admin, percentiles (mínimos).
Scripts | `scripts/*.sh|*.py` | Activo | Árbol del proyecto, informe de commits, utilidades AWS.

## Arquitectura actual

```mermaid
flowchart LR
    user((User)) --> cf[CloudFront]
    cf --> spa[S3 Static Web]
    spa --> api[API Gateway]
    api --> lbd_baby[Lambda: babies]
    api --> lbd_growth[Lambda: growth-data]
    api --> lbd_pct_http[Lambda: percentiles (HTTP)]
    ddb_babies[(DynamoDB: Babies)]
    ddb_growth[(DynamoDB: GrowthData)]

    lbd_baby <--> ddb_babies
    lbd_growth <--> ddb_growth
    lbd_pct_http --> ddb_growth

    subgraph Streams
      ddb_growth -. stream .-> lbd_pct_stream[Lambda: percentiles stream]
      lbd_pct_stream --> ddb_growth
    end
```

Componentes y relaciones:
- API Gateway (Cognito authorizer) enruta a lambdas: babies, growth-data, percentiles. Ver `template.yaml` (63cdecdd).
- DynamoDB: `UpNest-Babies-*`, `UpNest-GrowthData2-*` con GSIs `BabyGrowthDataIndex`, `UserGrowthDataIndex`. Ver `template.yaml`.
- Recalculo: al PATCH de bebé con `syncRecalc=1` y cambios estructurales, se recalculan percentiles de todas las mediciones. Ver `backend/lambdas/babies/baby_service.py` (5570400a).
- Streams: cambios en GrowthData disparan stream processor que actualiza percentiles. Ver `backend/lambdas/percentiles/stream_processor.py` (611e058b).

## Stack tecnológico

Capa | Tecnología | Versión | Uso
-|-|-|-
Frontend | React, Vite, Tailwind | React ^19, Vite ^6, Tailwind ^4.1 | SPA, routing protegido, axios con OIDC.
Auth (FE) | react-oidc-context, oidc-client-ts | ^3.3.0 | Gestión de tokens OIDC Cognito.
Backend | AWS Lambda (Python) | 3.12 | Handlers y lógica de negocio.
Datos | DynamoDB | serverless | Tablas Babies/GrowthData + GSIs.
Infra | AWS SAM, CloudFormation | - | Plantilla `template.yaml`, despliegues por stage.
Percentiles | Pandas, SciPy, OpenPyXL | pandas 2.3.1, scipy 1.11.4 | Cálculo LMS/Z a partir de XLSX OMS.
SDK | boto3/botocore | 1.35.0 | AWS SDK en lambdas.
Testing | unittest, vitest | - | Tests backend unitarios; FE usa Vitest configurado.

Fuentes: `backend/requirements.txt` (9ee31ebd), `frontend/package.json` (4abace44).

## Infraestructura & despliegue

- Entornos: dev/staging/prod (parámetro `Stage`), CORS por stage. Ver `template.yaml` (63cdecdd) y `docs/DEPLOYMENT.md` (aee9830e).
- SAM: `sam build`/`sam deploy`, `samconfig.toml` con overrides para staging (239f0344).
- Recursos:
  - Custom Resource `GetStreamArnFunction` para detectar Stream ARN dinámico (evita hardcode). Ver `template.yaml`.
  - Tablas DynamoDB con `DeletionPolicy: Retain` para evitar pérdida de datos.
  - Tags consistentes (`awsApplication`, `Environment`, etc.). Ver `docs/TROUBLESHOOTING_DEPLOYMENT.md` (c9c7efb8).
- Frontend: Vite; variables `.env` apuntan a API por stage. Ver `docs/DEV.md` (d69b51e3) y `frontend/src/config/index.js` (c6a9386b).
- Hosting esperado: S3 + CloudFront (documentado en DEPLOYMENT).

## Calidad & seguridad

- Tests backend: `backend/tests/` cubren creación/actualización de bebés, growth-data CRUD y recálculo. Ver `backend/tests/*.py`.
- Linters: FE tiene ESLint; BE no incluye Black/isort en requirements actuales (mencionados en README, no hallados como config local). Supuesto: linting manual.
- SAST/secret scan: No hallado. `.gitignore` presente, pero no hay escaneo automatizado.
- Dependabot/Renovate: No hallado.
- Auth: Cognito JWT validado vía API Gateway authorizer; en código se usan claims `sub` para ownership. Ver lambdas.

## Estado funcional

- Módulos activos:
  - Babies: POST/GET/GET{id}/PUT/PATCH (sincroniza percentiles si `syncRecalc=1`) y DELETE lógico. Ver `baby_service.py` (5570400a).
  - Babies Admin: GET `/babies/all`, DELETE hard `/babies/hard/{id}` (advertido proteger antes de prod). Ver `baby_service_admin.py` (0d93fbe4).
  - Growth Data: POST/GET/GET{id}/PUT/DELETE con cálculo de percentiles en POST/PUT. Ver `growth_data_service.py` (0b34d08e).
  - Percentiles: HTTP directo y router para streams. Ver `percentiles_handler.py` (eb59b37b), `percentiles_service.py` (6f665c5c).
- Endpoints relevantes FE: `frontend/src/services/*.js` define rutas `/babies`, `/growth-data`, `/percentiles`.
- KPIs técnicos: No hallado; logs exhaustivos presentes para trazabilidad.

## Trabajos pendientes (backlog local)

Ítem | Fuente | Prioridad | Bloqueantes | Due/Estimado
-|-|-|-|-
Proteger endpoints admin con roles | `docs/AUTHSYSTEM.md`, `baby_service_admin.py` | Alta | Config roles Cognito | 1 semana
Pipeline CI/CD (GH Actions) | `docs/DEPLOYMENT.md` | Media | Permisos AWS, buckets | 1-2 semanas
Secret scanning y SAST | No hallado | Media | Selección herramienta | 1 semana
Reducir verbosidad logs a niveles apropiados | `growth_data_service.py` | Baja | - | -
Tests de integración (moto) | `backend/tests/test_sync_flows.py` | Media | Añadir moto/fixtures | 1-2 semanas
Tagging automático API GW | `docs/TROUBLESHOOTING_DEPLOYMENT.md` | Baja | CLI/infra permisos | -
Conversión XLSX a formato más liviano | `percentiles_service.py` | Media | Preparar assets | 1 semana

## Riesgos y mitigaciones

Riesgo | Impacto | Prob. | Mitigación
-|-|-|-
IAM insuficiente (invoke, streams) | Fallos silenciosos en recálculo | Media | Plantilla con políticas explícitas; tests de permisos.
Dependencias científicas en Lambda | Errores build/compatibilidad | Media | Capas precompiladas, pines y tests de import.
Archivos XLSX grandes en layer | Cold start y latencia | Media | Preprocesar a CSV/JSON comprimido, caché cálculos.
CFN reemplazando tablas | Pérdida de datos | Alta | `DeletionPolicy: Retain`, uso de Existing* en parámetros.
CORS/Origins por stage | Bloqueos frontend | Media | Validar `Globals.Api.Cors` por entorno.

## Roadmap (30-60-90)

- 30 días: CI/CD básico (build+deploy SAM/FE), roles admin, secret scan, preprocesar tablas OMS.
- 60 días: Observabilidad (dashboards/alerts), pruebas e2e, optimizar capas y tiempos de arranque.
- 90 días: Multi-tenant/organización, hardening seguridad (WAF, rate limiting), costos y etiquetado avanzado.

## Costes & footprint (estimación)

Supuesto: uso bajo en dev/staging. Costes principales: Lambda invocaciones, DynamoDB on-demand, S3/CloudFront bajo. Sin datos reales en repo para estimación precisa.

## Supuestos y lagunas

- No hay pipeline CI/CD en repo. 
- No hay configuración linters/format BE en repo.
- No se versionan assets OMS procesados; se cargan XLSX del repo (`backend/lambdas/percentiles/data/*`).

## Trazabilidad de evidencias

- `README.md` b284d851
- `template.yaml` 63cdecdd
- `backend/requirements.txt` 9ee31ebd
- `frontend/package.json` 4abace44
- `docs/DEPLOYMENT.md` aee9830e
- `docs/DEV.md` d69b51e3
- `docs/AUTHSYSTEM.md` f14347ae
- `docs/TROUBLESHOOTING_DEPLOYMENT.md` c9c7efb8
- `docs/percentiles_new_aproach.md` 8fd10a24
- `backend/lambdas/babies/baby_service.py` 5570400a
- `backend/lambdas/babies_admin/baby_service_admin.py` 0d93fbe4
- `backend/lambdas/growth_data/growth_data_service.py` 0b34d08e
- `backend/lambdas/percentiles/percentiles_service.py` 6f665c5c
- `backend/lambdas/percentiles/percentiles_handler.py` eb59b37b
- `backend/lambdas/percentiles/stream_processor.py` 611e058b
- `frontend/src/config/index.js` c6a9386b
- `frontend/src/services/axiosClient.js` 6459971f
- `frontend/src/services/babyApi.js` bfa1c2f3
- `frontend/src/services/growthDataApi.js` fb3441a1
- `frontend/src/App.jsx` eaca06d2
- `samconfig.toml` 239f0344

## Apéndices

Comandos útiles
- Backend
  - Activar venv: source `backend/venv-backend/bin/activate`
  - Build/Deploy SAM: `sam build` · `sam deploy --guided`
- Frontend
  - `npm run dev` · `npm run build`
- Logs
  - `sam logs -n upnest2-baby --stack-name sam-upNest2 --tail`

Sugerencia PDF (opcional)

```bash
pandoc REPORT_upnest_situacion-tecnica_20251009.md -o REPORT_upnest_situacion-tecnica_20251009.pdf
```
