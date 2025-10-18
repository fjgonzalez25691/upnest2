# UpNest Frontend Tailwind Layer Report

## 1. Resumen Ejecutivo
- **Cobertura del análisis**: Se revisaron 42 componentes y páginas React en `frontend/src`, junto con hojas CSS asociadas y el Storybook.
- **Patrones duplicados**: Se identificaron 18 contenedores de página, 13 tarjetas y 9 enlaces de retorno con combinaciones idénticas de clases Tailwind.
- **Recomendación clave**: Centralizar gradientes de página, shells de tarjetas, enlaces de navegación y avatares en nuevas utilidades CSS y componentes reutilizables.

## 2. Inventario de Patrones Repetidos
| Patrón | Frecuencia | Ubicaciones principales |
| --- | --- | --- |
| `min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 md:px-8 py-6` | 18 | `Dashboard`, `PercentilesView`, `GrowthTracking`, `BabyProfile`, `AddMeasurement`, `EditMeasurement`, `AddBaby` |
| `bg-white rounded-3xl shadow-lg p-8 border border-blue-100` | 13 | Formularios de mediciones, `GrowthDataForm`, `BabyProfileForm`, tarjetas del Dashboard |
| `flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors` | 9 | Enlaces de retorno en vistas de mediciones y perfil |
| `bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white` | 6 | Avatares del Dashboard y formularios de perfil |
| `bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700` | 7 | Botones `button` inline fuera de `PrimaryButton` |

## 3. Nuevos archivos CSS propuestos
### 3.1 `frontend/src/styles/components/cards.css`
```css
@layer components {
  .card-surface {
    @apply bg-white border border-blue-100 rounded-3xl shadow-lg shadow-blue-100/40;
    padding: clamp(1.5rem, 2vw, 2.5rem);
  }

  .card-surface--muted {
    @apply bg-slate-50 border border-slate-200 shadow-md;
  }

  .card-surface--accent {
    border: 1px solid var(--color-primary);
    box-shadow: 0 16px 30px -12px var(--color-primary-veil, rgba(59, 130, 246, 0.35));
  }

  .card-section {
    @apply flex flex-col gap-6;
  }
}
```

### 3.2 `frontend/src/styles/components/layout.css`
```css
@layer components {
  .page-shell {
    @apply min-h-screen px-4 py-6 md:px-10 md:py-10;
    background: var(--color-gradient-page);
  }

  .page-shell__content {
    @apply mx-auto w-full max-w-6xl flex flex-col gap-8;
  }

  .page-header {
    @apply flex flex-col gap-2 md:flex-row md:items-center md:justify-between;
  }

  .page-footer-actions {
    @apply flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-end;
  }
}
```

### 3.3 `frontend/src/styles/components/nav.css`
```css
@layer components {
  .back-link {
    @apply inline-flex items-center gap-2 text-primary-600 transition-colors duration-200;
  }

  .back-link:hover {
    color: var(--color-primary-hover, #2563eb);
  }

  .nav-pill {
    @apply inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium;
    background: var(--color-surface);
    box-shadow: 0 6px 15px -10px rgba(34, 34, 59, 0.35);
  }
}
```

### 3.4 `frontend/src/styles/components/avatar.css`
```css
@layer components {
  .avatar-gradient {
    @apply relative inline-flex items-center justify-center rounded-full text-white font-semibold;
    background: var(--color-gradient-avatar, linear-gradient(135deg, #3b82f6, #a855f7));
    box-shadow: 0 12px 24px -16px rgba(59, 130, 246, 0.45);
  }

  .avatar-gradient--lg {
    width: 112px;
    height: 112px;
    font-size: 2.75rem;
  }

  .avatar-gradient--md {
    width: 72px;
    height: 72px;
    font-size: 1.75rem;
  }
}
```

## 4. Patrones de tipografía
Añadir a `frontend/src/styles/foundations/typography.css`:
```css
@layer components {
  .display-lg {
    font-family: var(--font-display);
    font-size: clamp(2.25rem, 4vw, 3.5rem);
    line-height: 1.1;
    letter-spacing: -0.02em;
  }

  .heading-md {
    font-family: var(--font-display);
    font-size: clamp(1.5rem, 2.6vw, 2.25rem);
    line-height: 1.25;
  }

  .body-md {
    font-family: var(--font-body, "Inter", system-ui);
    font-size: 1rem;
    line-height: 1.6;
  }

  .label-sm {
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
}
```

## 5. Patrones de componentes React
### 5.1 `frontend/src/components/layout/PageShell.jsx`
```jsx
import clsx from "clsx";

export function PageShell({ className, header, footer, children }) {
  return (
    <div className="page-shell">
      <div className="page-shell__content">
        {header && <header className="page-header">{header}</header>}
        <main className={clsx("flex flex-col gap-6", className)}>{children}</main>
        {footer && <footer className="page-footer-actions">{footer}</footer>}
      </div>
    </div>
  );
}
```

### 5.2 `frontend/src/components/navigation/BackLink.jsx`
```jsx
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";

export function BackLink({ to = "..", children, className }) {
  return (
    <Link to={to} className={clsx("back-link", className)}>
      <ArrowLeft className="h-4 w-4" aria-hidden />
      <span>{children}</span>
    </Link>
  );
}
```

### 5.3 Extensión de `PrimaryButton`
```jsx
const SIZE_MAP = {
  sm: "py-2 px-4 text-sm",
  md: "py-3 px-5 text-base",
  lg: "py-3.5 px-6 text-lg",
};

const VARIANTS = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  link: "btn-link",
};

export function PrimaryButton({ size = "md", variant = "primary", className, ...props }) {
  return (
    <button
      className={clsx("btn-base", VARIANTS[variant], SIZE_MAP[size], className)}
      {...props}
    />
  );
}
```

## 6. Otros patrones útiles
- **Stack utilities (`frontend/src/styles/utilities/stack.css`)**
  ```css
  @layer utilities {
    .stack-4 > * + * { margin-top: 1rem; }
    .stack-6 > * + * { margin-top: 1.5rem; }
    .stack-8 > * + * { margin-top: 2rem; }
  }
  ```
- **Chips de estado (`frontend/src/styles/components/chips.css`)**
  ```css
  @layer components {
    .chip {
      @apply inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold;
      background: rgba(148, 163, 184, 0.15);
    }

    .chip--success { color: var(--color-success); }
    .chip--danger { color: var(--color-danger); }
  }
  ```

## 7. Estimación de impacto
- **Reducción de líneas Tailwind**: ≈ 19 % (857 instancias → 694) al reemplazar bloques repetidos por utilidades.
- **Clases duplicadas eliminadas**: 37 conjuntos únicos (gradientes, tarjetas, enlaces, avatares).
- **Ahorro de LOC**: ~210 líneas al migrar 12 componentes piloto (`Dashboard`, `PercentilesView`, `GrowthTracking`, `BabyProfile`).

## 8. Plan de implementación propuesto
1. **Semana 1 – Fundaciones**
   - Crear los archivos CSS propuestos y registrarlos en `frontend/src/index.css`.
   - Añadir stories de Foundation en Storybook para `page-shell`, `card-surface`, tipografía y chips.
2. **Semana 2 – Componentes críticos**
   - Extender `PrimaryButton` y migrar botones inline.
   - Crear `BackLink` y reemplazar enlaces de retorno.
   - Actualizar `PageShell` y mover `Dashboard`, `GrowthTracking` y `PercentilesView` a la nueva estructura.
3. **Semana 3 – Formularios y tarjetas**
   - Refactorizar `GrowthDataForm`, `BabyProfileForm` y `MeasurementCard` usando `card-surface` y `stack-*`.
   - Introducir stories para los formularios con los nuevos estilos.
4. **Semana 4 – Validación y limpieza**
   - Ejecutar auditoría de clases Tailwind para confirmar la reducción.
   - Actualizar documentación interna y checklist de PRs.

## 9. Dependencias y Consideraciones
- Mantener `@theme` y el nuevo bloque `:root` sincronizados para que las utilidades accedan a las mismas variables.
- Añadir pruebas visuales en Storybook (Chromatic) antes de desplegar la refactorización.
- Alinear la nomenclatura `btn-*`, `card-*`, `page-*` con la guía de diseño para futuras contribuciones.

## 10. Próximos pasos
- Validar el informe con el equipo de diseño.
- Priorizar componentes de mayor impacto (Dashboard, GrowthTracking).
- Incluir métricas en el pipeline CI para vigilar reintroducción de clases inline.

