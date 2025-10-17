const PageShell = ({ header, children, footer }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <header className="bg-white rounded-3xl shadow-lg border border-blue-100 p-6">
        {header}
      </header>
      <main>{children}</main>
      {footer && (
        <footer className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 text-center text-gray-500 text-sm">
          {footer}
        </footer>
      )}
    </div>
  </div>
);

export default {
  title: "Layout/PageShell",
  component: PageShell,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Reusable page container tokens that establish the gradient backdrop, responsive max-width, and card-like surfaces."
      }
    }
  }
};

const HeroSection = () => (
  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-3xl p-8 shadow-lg">
    <h1 className="text-3xl font-bold mb-2">Welcome back, Parent!</h1>
    <p className="text-blue-100 text-lg">
      Keep track of growth measurements, milestones, and supportive insights.
    </p>
  </div>
);

const InfoGrid = () => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {["Measurements", "Appointments", "Insights"].map((card) => (
      <div
        key={card}
        className="bg-white rounded-3xl shadow-lg border border-blue-100 p-6"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{card}</h3>
        <p className="text-gray-600 text-sm">
          Consistent padding (p-6) and rounded-3xl tokens simplify card usage
          across dashboards.
        </p>
      </div>
    ))}
  </div>
);

export const DashboardShell = () => (
  <PageShell
    header={<HeroSection />}
    footer="Need a different layout? Combine PageShell with Stack and Card tokens."
  >
    <InfoGrid />
  </PageShell>
);
DashboardShell.parameters = {
  docs: {
    description: {
      story:
        "Illustrates the default dashboard surface using gradient hero, uniform card spacing, and responsive grid tokens."
    }
  }
};

const FormSection = () => (
  <div className="grid gap-6 md:grid-cols-[1fr_320px]">
    <div className="bg-white rounded-3xl shadow-lg border border-blue-100 p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">
          Record a new measurement
        </h2>
        <p className="text-gray-600">
          Stack tokens (space-y-6) keep vertical rhythm and reduce ad-hoc gap
          choices.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Prepare for the visit
          </h4>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Use consistent measurement tools.</li>
            <li>Note any symptoms to share.</li>
          </ul>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Quick tips
          </h4>
          <p className="text-sm text-gray-600">
            Extend Stack spacing tokens to tooltips, toasts, and modals for
            predictable density.
          </p>
        </div>
      </div>
    </div>
    <aside className="bg-white rounded-3xl shadow-lg border border-purple-100 p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">PageShell usage</h3>
      <p className="text-gray-600 text-sm">
        Combine gradient background, centered container, and rounded cards to
        keep structural consistency.
      </p>
      <p className="text-gray-600 text-sm">
        Modify padding via tokens (`p-6`, `p-8`) rather than arbitrary spacing.
      </p>
    </aside>
  </div>
);

export const FormShell = () => (
  <PageShell header={<HeroSection />}>
    <FormSection />
  </PageShell>
);
FormShell.parameters = {
  docs: {
    description: {
      story:
        "Demonstrates a form-centric layout mixing main content and guidance sidebar while reusing shell tokens."
    }
  }
};
