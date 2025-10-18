import clsx from "clsx";

/**
 * PageShell - Contenedor principal para páginas de la aplicación
 * 
 * Reemplaza el patrón repetido de:
 * - min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 md:px-8 py-6
 * - max-w-6xl mx-auto flex flex-col gap-8
 * 
 * Usado en: Dashboard, PercentilesView, GrowthTracking, BabyProfile, 
 *           AddMeasurement, EditMeasurement, AddBaby, etc.
 * 
 * @param {string} className - Clases adicionales para el main
 * @param {ReactNode} header - Contenido del header (opcional)
 * @param {ReactNode} footer - Contenido del footer (opcional)
 * @param {ReactNode} children - Contenido principal de la página
 * @param {string} variant - Variante del shell: 'default', 'form', 'compact', 'full-height'
 */
export function PageShell({ 
  className, 
  header, 
  footer, 
  children, 
  variant = 'default' 
}) {
  // Determinar clase del shell según variante
  const shellClass = variant === 'default' 
    ? 'page-shell' 
    : `page-shell page-shell--${variant}`;
  
  return (
    <div className={shellClass}>
      <div className="page-shell__content">
        {header && (
          <header className="page-header">
            {header}
          </header>
        )}
        <main className={clsx("flex flex-col gap-6", className)}>
          {children}
        </main>
        {footer && (
          <footer className="page-footer-actions">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

// Export por defecto para facilitar imports
export default PageShell;