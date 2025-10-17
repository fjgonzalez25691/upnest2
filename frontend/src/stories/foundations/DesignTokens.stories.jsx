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
  <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
    <div
      className="h-12 w-20 rounded-md border border-gray-100 flex-shrink-0"
      style={{ background: `var(${variable})` }}
    />
    <div className="flex flex-col min-w-0 flex-1">
      <span className="text-sm font-semibold text-gray-800">{name}</span>
      <span className="text-xs text-gray-500 font-mono">{variable}</span>
      {usage && <span className="text-xs text-gray-600 mt-1">{usage}</span>}
    </div>
  </div>
);

const GradientSwatch = ({ name, variable, usage, leftVariable, rightVariable, leftHex, rightHex, leftName, rightName }) => (
  <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow lg:grid lg:grid-cols-3 lg:gap-6 lg:items-center">
    {/* Gradiente y descripción */}
    <div className="flex items-center gap-4 lg:col-span-1">
      <div
        className="h-12 w-32 rounded-md border border-gray-100 flex-shrink-0"
        style={{ background: `var(${variable})` }}
      />
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-base font-semibold text-gray-800 md:text-lg">{name}</span>
        <span className="text-xs text-gray-500 font-mono md:text-sm">{variable}</span>
        {usage && <span className="text-xs text-gray-600 mt-1 md:text-sm">{usage}</span>}
      </div>
    </div>
    
    {/* Colores individuales */}
    {leftVariable && rightVariable && (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-2 lg:gap-4">
        <div className="flex items-center gap-3">
          <div 
            className="h-12 w-20 rounded-md border border-gray-200 flex-shrink-0"
            style={{ backgroundColor: `var(${leftVariable})` }}
          />
          <div className="text-sm">
            <div className="font-bold text-gray-700 md:text-base">{leftName}</div>
            <div className="font-mono text-gray-600 text-xs md:text-sm">{leftHex}</div>
            <div className="text-gray-500 text-xs">Left</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div 
            className="h-12 w-20 rounded-md border border-gray-200 flex-shrink-0"
            style={{ backgroundColor: `var(${rightVariable})` }}
          />
          <div className="text-sm">
            <div className="font-bold text-gray-700 md:text-base">{rightName}</div>
            <div className="font-mono text-gray-600 text-xs md:text-sm">{rightHex}</div>
            <div className="text-gray-500 text-xs">Right</div>
          </div>
        </div>
      </div>
    )}
  </div>
);

const FontSpec = ({ label, stack, usage }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
    <p className="text-sm font-semibold text-gray-800">{label}</p>
    <p className="text-base text-gray-600 font-mono">{stack}</p>
    {usage && <p className="text-xs text-gray-500 mt-1">{usage}</p>}
  </div>
);

const SpacingContent = () => (
  <div className="space-y-8">
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Spacing System</h1>
      <p className="text-base text-gray-600">
        Consistent spacing tokens based on a 4px base unit. Our spacing scale uses multiples of eight 
        to create harmonious layouts and maintain visual rhythm throughout the interface.
      </p>
    </div>

    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Spacing Scale</h2>
        <p className="text-sm text-gray-600 mb-4">
          Base unit is 4px. Primary rhythm uses multiples of eight to stay harmonious.
        </p>
      </div>
      
      <TokenTable
        title="Spacing Tokens"
        description=""
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
    </section>

    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Visual Examples</h2>
        <p className="text-sm text-gray-600 mb-4">
          Interactive examples showing spacing tokens in practice.
        </p>
      </div>
      
      <div className="space-y-6">
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Padding Examples</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-20 text-xs text-gray-500">p-1 (4px)</div>
              <div className="p-1 bg-blue-100 rounded border-2 border-dashed border-blue-300">
                <div className="bg-blue-500 rounded text-white text-xs px-2 py-1">Content</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 text-xs text-gray-500">p-2 (8px)</div>
              <div className="p-2 bg-blue-100 rounded border-2 border-dashed border-blue-300">
                <div className="bg-blue-500 rounded text-white text-xs px-2 py-1">Content</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 text-xs text-gray-500">p-4 (16px)</div>
              <div className="p-4 bg-blue-100 rounded border-2 border-dashed border-blue-300">
                <div className="bg-blue-500 rounded text-white text-xs px-2 py-1">Content</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 text-xs text-gray-500">p-6 (24px)</div>
              <div className="p-6 bg-blue-100 rounded border-2 border-dashed border-blue-300">
                <div className="bg-blue-500 rounded text-white text-xs px-2 py-1">Content</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Gap Examples</h3>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-gray-500 mb-2">gap-2 (8px)</div>
              <div className="flex gap-2">
                <div className="w-16 h-8 bg-green-500 rounded"></div>
                <div className="w-16 h-8 bg-green-500 rounded"></div>
                <div className="w-16 h-8 bg-green-500 rounded"></div>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-2">gap-4 (16px)</div>
              <div className="flex gap-4">
                <div className="w-16 h-8 bg-green-500 rounded"></div>
                <div className="w-16 h-8 bg-green-500 rounded"></div>
                <div className="w-16 h-8 bg-green-500 rounded"></div>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-2">gap-6 (24px)</div>
              <div className="flex gap-6">
                <div className="w-16 h-8 bg-green-500 rounded"></div>
                <div className="w-16 h-8 bg-green-500 rounded"></div>
                <div className="w-16 h-8 bg-green-500 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Usage Guidelines</h2>
      </div>
      <div className="bg-blue-50 rounded-xl p-4 space-y-2">
        <h3 className="font-semibold text-blue-900">Best Practices</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use consistent spacing multiples (4px base unit)</li>
          <li>• Prefer spacing tokens over arbitrary values</li>
          <li>• Use <code>gap</code> for flex/grid layouts, <code>space-y</code> for stacked content</li>
          <li>• Larger spacing for major sections, smaller for related elements</li>
          <li>• Test spacing across different screen sizes</li>
        </ul>
      </div>
    </section>
  </div>
);

const TypographyContent = () => (
  <div className="space-y-8">
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Typography System</h1>
      <p className="text-base text-gray-600">
        Typography tokens based on Inter font family, defined in <code>src/index.css</code>.
        Our type system ensures consistency, readability, and proper hierarchy across all interfaces.
      </p>
    </div>

    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Font Families</h2>
        <p className="text-sm text-gray-600 mb-4">
          Primary font stacks used throughout the application.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
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

    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Type Scale</h2>
        <p className="text-sm text-gray-600 mb-4">
          Semantic text sizes using Tailwind's type scale for consistent hierarchy.
        </p>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <h1 className="text-4xl font-bold text-gray-900">Display Large</h1>
          <code className="text-sm text-gray-500">text-4xl font-bold</code>
          <p className="text-sm text-gray-600 mt-2">Hero headings, page titles</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Heading 1</h2>
          <code className="text-sm text-gray-500">text-2xl font-semibold</code>
          <p className="text-sm text-gray-600 mt-2">Section headings, card titles</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Heading 2</h3>
          <code className="text-sm text-gray-500">text-xl font-semibold</code>
          <p className="text-sm text-gray-600 mt-2">Subsection headings</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">Heading 3</h4>
          <code className="text-sm text-gray-500">text-lg font-semibold</code>
          <p className="text-sm text-gray-600 mt-2">Component headings</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <p className="text-base text-gray-900">Body Large</p>
          <code className="text-sm text-gray-500">text-base</code>
          <p className="text-sm text-gray-600 mt-2">Primary body text, descriptions</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <p className="text-sm text-gray-900">Body</p>
          <code className="text-sm text-gray-500">text-sm</code>
          <p className="text-sm text-gray-600 mt-2">Secondary text, labels</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <p className="text-xs text-gray-900">Caption</p>
          <code className="text-sm text-gray-500">text-xs</code>
          <p className="text-sm text-gray-600 mt-2">Helper text, metadata</p>
        </div>
      </div>
    </section>

    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Font Weights</h2>
        <p className="text-sm text-gray-600 mb-4">
          Available font weights for creating emphasis and hierarchy.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <p className="text-lg font-normal text-gray-900">Normal</p>
          <code className="text-sm text-gray-500">font-normal (400)</code>
        </div>
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <p className="text-lg font-semibold text-gray-900">Semibold</p>
          <code className="text-sm text-gray-500">font-semibold (600)</code>
        </div>
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <p className="text-lg font-bold text-gray-900">Bold</p>
          <code className="text-sm text-gray-500">font-bold (700)</code>
        </div>
      </div>
    </section>

    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Usage Guidelines</h2>
      </div>
      <div className="bg-blue-50 rounded-xl p-4 space-y-2">
        <h3 className="font-semibold text-blue-900">Best Practices</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use semantic classes (<code>text-xl</code>, <code>font-semibold</code>) over custom font declarations</li>
          <li>• Maintain consistent hierarchy with h1-h6 elements</li>
          <li>• Ensure sufficient contrast ratios for accessibility</li>
          <li>• Use font weights sparingly - normal and semibold cover most use cases</li>
          <li>• Test readability across different screen sizes</li>
        </ul>
      </div>
    </section>
  </div>
);

const ColorsContent = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Color Palette</h1>
      <p className="text-base text-gray-600">
        Core color tokens defined in <code>src/index.css</code> using Tailwind v4's <code>@theme</code> syntax.
        These variables are available globally and form the foundation of our visual identity.
      </p>
    </div>

    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Brand Colors</h2>
        <p className="text-sm text-gray-600 mb-4">
          Primary brand colors used for key interface elements, actions, and brand identity.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ColorSwatch name="Primary" variable="--color-primary" usage="Buttons, links, key highlights" />
        <ColorSwatch name="Secondary" variable="--color-secondary" usage="Accents, complementary highlights" />
      </div>
    </section>

    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Semantic Colors</h2>
        <p className="text-sm text-gray-600 mb-4">
          Status and feedback colors that communicate meaning and state to users.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ColorSwatch name="Success" variable="--color-success" usage="Positive alerts, confirmation states" />
        <ColorSwatch name="Danger" variable="--color-danger" usage="Errors, destructive actions" />
      </div>
    </section>

    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Neutral Colors</h2>
        <p className="text-sm text-gray-600 mb-4">
          Background and surface colors that provide structure and hierarchy.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ColorSwatch name="Background" variable="--color-background" usage="Page background" />
        <ColorSwatch name="Surface" variable="--color-surface" usage="Cards and elevated containers" />
        <ColorSwatch name="Text / Main" variable="--color-text-main" usage="Primary typography" />
        <ColorSwatch name="Text / Subtle" variable="--color-text-subtle" usage="Muted copy, helper text" />
      </div>
    </section>

    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Gradients</h2>
        <p className="text-sm text-gray-600 mb-4">
          All gradient combinations defined as CSS custom properties, organized by usage category.
        </p>
      </div>

      {/* Button Gradients */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Button Gradients</h3>
          <p className="text-sm text-gray-600 mb-4">Action button gradients for different interaction types.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-1">
          <GradientSwatch 
            name="Primary Button" 
            variable="--color-gradient-primary" 
            usage="Primary action buttons"
            leftVariable="--color-primary"
            rightVariable="--color-gradient-primary-right"
            leftHex="#3B82F6"
            rightHex="#2563eb"
            leftName="Blue 500"
            rightName="Blue 600"
          />
          <GradientSwatch 
            name="Edit Button" 
            variable="--color-gradient-edit" 
            usage="Edit and modify actions"
            leftVariable="--color-secondary"
            rightVariable="--color-gradient-edit-right"
            leftHex="#8b5cf6"
            rightHex="#7c3aed"
            leftName="Violet 500"
            rightName="Violet 600"
          />
          <GradientSwatch 
            name="Success Button" 
            variable="--color-gradient-success" 
            usage="Positive confirmations"
            leftVariable="--color-success"
            rightVariable="--color-gradient-success-right"
            leftHex="#22C55E"
            rightHex="#16a34a"
            leftName="Green 500"
            rightName="Green 600"
          />
          <GradientSwatch 
            name="Add Button" 
            variable="--color-gradient-add" 
            usage="Create and add actions"
            leftVariable="--color-success"
            rightVariable="--color-gradient-add-right"
            leftHex="#22C55E"
            rightHex="#16a34a"
            leftName="Green 500"
            rightName="Green 600"
          />
          <GradientSwatch 
            name="Danger Button" 
            variable="--color-gradient-danger" 
            usage="Delete and destructive actions"
            leftVariable="--color-danger"
            rightVariable="--color-gradient-danger-right"
            leftHex="#F43F5E"
            rightHex="#dc2626"
            leftName="Rose 500"
            rightName="Red 600"
          />
          <GradientSwatch 
            name="AI Assistant" 
            variable="--color-gradient-ai" 
            usage="AI-powered features"
            leftVariable="--color-ai"
            rightVariable="--color-gradient-ai-right"
            leftHex="#10b981"
            rightHex="#059669"
            leftName="Emerald 500"
            rightName="Emerald 600"
          />
          <GradientSwatch 
            name="Cancel Button" 
            variable="--color-gradient-cancel" 
            usage="Cancel and neutral actions"
            leftVariable="--color-cancel"
            rightVariable="--color-gradient-cancel-right"
            leftHex="#6B7280"
            rightHex="#4b5563"
            leftName="Gray 500"
            rightName="Gray 600"
          />
          <GradientSwatch 
            name="Logout Button" 
            variable="--color-gradient-logout" 
            usage="Logout and session actions"
            leftVariable="--color-logout"
            rightVariable="--color-gradient-logout-right"
            leftHex="#d1dedb"
            rightHex="#9ca3af"
            leftName="Custom Green"
            rightName="Gray 400"
          />
        </div>
      </div>

      {/* UI Element Gradients */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">UI Element Gradients</h3>
          <p className="text-sm text-gray-600 mb-4">Form elements and interface component gradients.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-1">
          <GradientSwatch 
            name="String Input" 
            variable="--gradient-string" 
            usage="Text input fields and string controls"
            leftVariable="--gradient-string-left"
            rightVariable="--gradient-string-right"
            leftHex="#eff6ff"
            rightHex="#f0f9ff"
            leftName="Blue 50"
            rightName="Sky 50"
          />
          <GradientSwatch 
            name="Number Input" 
            variable="--gradient-number" 
            usage="Numeric input fields and counters"
            leftVariable="--gradient-number-left"
            rightVariable="--gradient-number-right"
            leftHex="#f0fdf4"
            rightHex="#ecfdf5"
            leftName="Green 50"
            rightName="Emerald 50"
          />
          <GradientSwatch 
            name="Date Input" 
            variable="--gradient-date" 
            usage="Date picker and temporal controls"
            leftVariable="--gradient-date-left"
            rightVariable="--gradient-date-right"
            leftHex="#f9fafb"
            rightHex="#f1f5f9"
            leftName="Gray 50"
            rightName="Slate 100"
          />
          <GradientSwatch 
            name="Select Dropdown" 
            variable="--gradient-select" 
            usage="Select menus and dropdown controls"
            leftVariable="--gradient-select-left"
            rightVariable="--gradient-select-right"
            leftHex="#ede9fe"
            rightHex="#f3e8ff"
            leftName="Violet 100"
            rightName="Purple 100"
          />
          <GradientSwatch 
            name="Textarea Info" 
            variable="--gradient-textarea-info" 
            usage="Large text input areas and info panels"
            leftVariable="--gradient-textarea-info-left"
            rightVariable="--gradient-textarea-info-right"
            leftHex="#f0f9ff"
            rightHex="#f0fdf4"
            leftName="Sky 50"
            rightName="Green 50"
          />
        </div>
      </div>
    </section>

    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Usage Guidelines</h2>
      </div>
      <div className="bg-blue-50 rounded-xl p-4 space-y-2">
        <h3 className="font-semibold text-blue-900">Best Practices</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use semantic colors for status indicators (success, danger)</li>
          <li>• Maintain sufficient contrast ratios for accessibility</li>
          <li>• Reference colors via CSS custom properties: <code>var(--color-primary)</code></li>
          <li>• Avoid hardcoded hex values in components</li>
        </ul>
      </div>
    </section>
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
    layout: "fullscreen",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      page: () => <DocsContent />
    }
  }
};

export default meta;

export const Default = {
  render: () => <DocsContent />
};

export const Colors = {
  render: () => <ColorsContent />
};

Colors.parameters = {
  docs: {
    description: {
      story: "Comprehensive color palette showcasing all design tokens with organized categories and usage guidelines."
    }
  }
};

export const Typography = {
  render: () => <TypographyContent />
};

Typography.parameters = {
  docs: {
    description: {
      story: "Typography system showcasing font families, type scale, weights, and usage guidelines for consistent text hierarchy."
    }
  }
};

export const Spacing = {
  render: () => <SpacingContent />
};

Spacing.parameters = {
  docs: {
    description: {
      story: "Spacing system with 4px base unit, visual examples, and guidelines for consistent layouts and visual rhythm."
    }
  }
};

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
