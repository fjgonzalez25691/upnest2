import PrimaryButton from "../../components/PrimaryButton";
import TextBox from "../../components/TextBox";

const TokenTable = ({ title, description, columns, rows }) => (
  <section className="space-y-3">
    <div>
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      {description && <p className="text-sm text-gray-600">{description}</p>}
    </div>
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className="px-4 py-2 text-left font-semibold text-gray-700"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-2 text-gray-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

const ColorSwatch = ({ name, variable, usage }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
    <div
      className="h-12 w-20 rounded-xl border border-gray-100"
      style={{ background: `var(${variable})` }}
    />
    <div className="flex flex-col">
      <span className="text-sm font-semibold text-gray-800">{name}</span>
      <span className="text-xs text-gray-500">{variable}</span>
      {usage && <span className="text-xs text-gray-600">{usage}</span>}
    </div>
  </div>
);

const FontSpec = ({ label, stack, usage }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
    <p className="text-sm font-semibold text-gray-800">{label}</p>
    <p className="text-base text-gray-600">{stack}</p>
    {usage && <p className="text-xs text-gray-500 mt-1">{usage}</p>}
  </div>
);

const DocsContent = () => (
  <div className="space-y-8">
    <p className="text-base text-gray-600">
      These tokens mirror the base design values defined in <code>src/index.css</code>
      and form the foundation for spacing, radius, elevation and responsive behaviours.
      Keep component implementations aligned with this set to avoid visual drift.
    </p>

    <TokenTable
      title="Spacing Scale"
      description="Base unit is 4px. Primary rhythm uses multiples of eight to stay harmonious."
      columns={["Token", "Utility classes", "Pixels", "Usage"]}
      rows={[
        ["space-1", "`gap-1`, `p-1`", "4px", "Chips, tight icon wraps"],
        ["space-2", "`gap-2`, `p-2`", "8px", "Inline icon/text padding"],
        ["space-3", "`gap-3`, `p-3`", "12px", "Compact grids"],
        ["space-4", "`gap-4`, `p-4`", "16px", "Compact cards & form groups"],
        ["space-6", "`gap-6`, `p-6`", "24px", "Default card padding"],
        ["space-8", "`gap-8`, `p-8`", "32px", "Page heroes, major stacks"]
      ]}
    />

    <TokenTable
      title="Border Radius"
      columns={["Token", "Utility", "Pixels", "Apply to"]}
      rows={[
        ["radius-sm", "`rounded-lg`", "8px", "Inputs, compact tags"],
        ["radius-md", "`rounded-xl`", "12px", "Buttons, select menus"],
        ["radius-lg", "`rounded-2xl`", "16px", "Secondary cards, modals"],
        ["radius-xl", "`rounded-3xl`", "24px", "Primary cards, page shells"],
        ["radius-full", "`rounded-full`", "999px", "Avatars, status pills"]
      ]}
    />

    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-gray-800">Core Colours</h2>
      <p className="text-sm text-gray-600">
        Colour variables live in the global <code>@theme</code> block and should be referenced via CSS custom properties.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <ColorSwatch name="Primary" variable="--color-primary" usage="Buttons, links, key highlights" />
        <ColorSwatch name="Secondary" variable="--color-secondary" usage="Accents, complementary highlights" />
        <ColorSwatch name="Success" variable="--color-success" usage="Positive alerts, confirmation states" />
        <ColorSwatch name="Danger" variable="--color-danger" usage="Errors, destructive actions" />
        <ColorSwatch name="Background" variable="--color-background" usage="Page background" />
        <ColorSwatch name="Surface" variable="--color-surface" usage="Cards and elevated containers" />
        <ColorSwatch name="Text / Main" variable="--color-text-main" usage="Primary typography" />
        <ColorSwatch name="Text / Subtle" variable="--color-text-subtle" usage="Muted copy, helper text" />
      </div>
    </section>

    <TokenTable
      title="Shadows"
      description="Use elevation sparingly; hover states typically step up one level."
      columns={["Token", "Utility", "Value", "Notes"]}
      rows={[
        ["shadow-sm", "`shadow-sm`", "0 1px 2px rgba(15, 23, 42, 0.08)", "Subtle elevation, dividers"],
        ["shadow-md", "`shadow-md`", "0 4px 6px rgba(15, 23, 42, 0.10)", "Default card surfaces"],
        ["shadow-lg", "`shadow-lg`", "0 10px 15px rgba(15, 23, 42, 0.12)", "Important tiles, hover states"],
        ["shadow-xl", "`shadow-xl`", "0 20px 25px rgba(15, 23, 42, 0.14)", "Hero cards, marketing sections"]
      ]}
    />

    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-gray-800">Typography</h2>
      <p className="text-sm text-gray-600">
        Font stacks inherit from <code>--font-display</code> with Inter as the default family.
        Apply semantic classes (<code>text-xl</code>, <code>font-semibold</code>) rather than custom font declarations.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <FontSpec
          label="Display"
          stack='"Inter", "sans-serif"'
          usage="Headings, buttons, emphasised numbers"
        />
        <FontSpec
          label="Body"
          stack='"Inter", "sans-serif"'
          usage="Paragraphs, helper text, inputs"
        />
      </div>
    </section>

    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-gray-800">Gradients</h2>
      <p className="text-sm text-gray-600">
        Theme gradients live in CSS custom properties. Prefer semantic classes instead of raw <code>bg-gradient-to</code> chains.
      </p>
      <ul className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
        <li><code>bg-gradient-page</code> → <span className="text-gray-500">Background wrapper (blue → white → purple)</span></li>
        <li><code>btn-primary</code> → <span className="text-gray-500">Primary actions</span></li>
        <li><code>btn-add</code> → <span className="text-gray-500">Positive actions / creation</span></li>
        <li><code>btn-ai</code> → <span className="text-gray-500">AI assistant actions</span></li>
        <li><code>btn-danger</code> → <span className="text-gray-500">Destructive flows</span></li>
      </ul>
    </section>

    <TokenTable
      title="Breakpoints"
      columns={["Breakpoint", "Token", "Pixels", "Usage"]}
      rows={[
        ["Mobile", "default", "0 – 639px", "Stacked layouts, full-width buttons"],
        ["Small", "`sm`", "≥ 640px", "Inline actions, horizontal labels"],
        ["Medium", "`md`", "≥ 768px", "Two-column forms, small grids"],
        ["Large", "`lg`", "≥ 1024px", "Dashboards, charts, multi-column cards"]
      ]}
    />
  </div>
);

const meta = {
  title: "Foundations/Design Tokens",
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      page: DocsContent
    }
  }
};

export default meta;

export const Playground = {
  render: () => (
    <div className="space-y-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 rounded-3xl border border-blue-100 shadow-lg">
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">Button tokens</h3>
        <div className="flex flex-wrap gap-4">
          <PrimaryButton variant="primary">Primary action</PrimaryButton>
          <PrimaryButton variant="add">Add measurement</PrimaryButton>
          <PrimaryButton variant="ai" size="compact">
            AI assistant
          </PrimaryButton>
          <PrimaryButton variant="danger" size="compact">
            Delete entry
          </PrimaryButton>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">Form tokens</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <TextBox
            label="Weight"
            name="weight"
            editable
            placeholder="6000"
            suffix="g"
          />
          <TextBox
            label="Measurement date"
            name="measurementDate"
            type="date"
            editable
          />
          <TextBox
            label="Percentile source"
            name="percentileSource"
            value="WHO"
            readOnly
          />
          <TextBox
            label="Notes"
            name="notes"
            editable
            placeholder="Optional notes"
          />
        </div>
      </section>
    </div>
  )
};
Playground.parameters = {
  docs: {
    description: {
      story:
        "Quick playground referencing button and form tokens. Components inherit the same spacing, radius and gradient system documented above."
    }
  }
};
