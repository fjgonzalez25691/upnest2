import Card, { ElevatedCard, InteractiveCard, BasicCard, CompactCard, CardHeader } from '../../components/ui/Card';

export default {
  title: 'Components/Cards',
  component: Card,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Cards System

Unified card components based on analysis of 32+ card instances across the application.
Supports 4 main variants with color theming and flexible composition.

## Key Features
- **4 main variants**: Elevated, Interactive, Basic, Compact
- **Color theming**: Default, Success, Danger, Secondary, Neutral
- **Flexible composition**: Header, content, actions
- **CSS-first approach**: Can be used as CSS classes or React components
- **Responsive design**: Built-in responsive padding and border radius
        `
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['elevated', 'interactive', 'basic', 'compact'],
      description: 'Card style variant'
    },
    color: {
      control: { type: 'select' },
      options: ['default', 'success', 'danger', 'secondary', 'neutral'],
      description: 'Border color variant'
    },
    bordered: {
      control: 'boolean',
      description: 'Add border'
    },
    interactive: {
      control: 'boolean', 
      description: 'Enable hover effects'
    }
  }
};

// Basic card examples
export const Elevated = {
  args: {
    variant: 'elevated',
    children: (
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Elevated Card</h3>
        <p className="text-gray-600">This is the most common card style with elevated shadow and padding.</p>
      </div>
    )
  }
};

export const Interactive = {
  args: {
    variant: 'interactive',
    children: (
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Interactive Card</h3>
        <p className="text-gray-600">Hover over this card to see the interactive effects.</p>
      </div>
    )
  }
};

export const Basic = {
  args: {
    variant: 'basic',
    children: (
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Basic Card</h3>
        <p className="text-gray-600">Simple card with moderate shadow, used in components.</p>
      </div>
    )
  }
};

export const Compact = {
  args: {
    variant: 'compact',
    children: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Compact Card</h3>
        <p className="text-gray-600">Responsive padding for mobile-first design.</p>
      </div>
    )
  }
};

// Color variants showcase
export const ColorVariants = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <ElevatedCard color="default">
      <h4 className="font-semibold text-blue-900 mb-2">Default (Blue)</h4>
      <p className="text-sm text-gray-600">Most common border color</p>
    </ElevatedCard>
    
    <ElevatedCard color="success">
      <h4 className="font-semibold text-green-900 mb-2">Success (Green)</h4>
      <p className="text-sm text-gray-600">For positive states</p>
    </ElevatedCard>
    
    <ElevatedCard color="danger">
      <h4 className="font-semibold text-red-900 mb-2">Danger (Red)</h4>
      <p className="text-sm text-gray-600">For error states</p>
    </ElevatedCard>
    
    <ElevatedCard color="secondary">
      <h4 className="font-semibold text-purple-900 mb-2">Secondary (Purple)</h4>
      <p className="text-sm text-gray-600">For secondary actions</p>
    </ElevatedCard>
    
    <ElevatedCard color="neutral">
      <h4 className="font-semibold text-gray-900 mb-2">Neutral (Gray)</h4>
      <p className="text-sm text-gray-600">For neutral content</p>
    </ElevatedCard>
  </div>
);

// Complex card with header and actions
export const WithHeaderAndActions = () => (
  <ElevatedCard
    header={
      <CardHeader 
        icon="📏"
        title="Edit Measurement"
        subtitle="Update measurement for Baby Name"
      />
    }
    actions={
      <div className="flex gap-4">
        <button className="btn-base-compact btn-cancel">Cancel</button>
        <button className="btn-base-compact btn-primary">Save Changes</button>
      </div>
    }
  >
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
        <input 
          type="number" 
          className="textbox-input" 
          placeholder="Enter weight"
          defaultValue="7.5"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
        <input 
          type="number" 
          className="textbox-input" 
          placeholder="Enter height"
          defaultValue="68"
        />
      </div>
    </div>
  </ElevatedCard>
);

// Dashboard-style interactive cards
export const DashboardCards = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div className="card-interactive--dashboard">
      <div className="text-center">
        <div className="text-3xl mb-2">👶</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Emma Watson</h3>
        <p className="text-sm text-gray-600 mb-3">8 months old</p>
        <div className="text-xs text-gray-500">Last measurement: 2 days ago</div>
      </div>
    </div>
    
    <div className="card-interactive--dashboard">
      <div className="text-center">
        <div className="text-3xl mb-2">📊</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Growth Stats</h3>
        <p className="text-sm text-gray-600 mb-3">Weight: 8.2kg</p>
        <div className="text-xs text-gray-500">Height: 70cm</div>
      </div>
    </div>
    
    <div className="card-interactive--dashboard">
      <div className="text-center">
        <div className="text-3xl mb-2">⏰</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Next Checkup</h3>
        <p className="text-sm text-gray-600 mb-3">In 5 days</p>
        <div className="text-xs text-gray-500">Dr. Smith appointment</div>
      </div>
    </div>
  </div>
);

// CSS-only usage examples
export const CSSOnlyUsage = () => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold mb-4">CSS-Only Usage Examples</h3>
      <p className="text-gray-600 mb-4">
        You can use these cards without the React component, just with CSS classes:
      </p>
    </div>
    
    <div className="card-elevated--bordered">
      <h4 className="font-semibold mb-2">Using: .card-elevated--bordered</h4>
      <p className="text-sm text-gray-600">Direct CSS class usage</p>
    </div>
    
    <div className="card-basic--bordered">
      <h4 className="font-semibold mb-2">Using: .card-basic--bordered</h4>
      <p className="text-sm text-gray-600">Simple card with border</p>
    </div>
    
    <div className="card-compact--responsive">
      <h4 className="font-semibold mb-2">Using: .card-compact--responsive</h4>
      <p className="text-sm text-gray-600">Responsive border radius and padding</p>
    </div>
  </div>
);

// Migration examples
export const BeforeAfterMigration = () => (
  <div className="space-y-8">
    <div>
      <h3 className="text-lg font-semibold mb-4">Migration Examples</h3>
    </div>
    
    <div className="space-y-4">
      <h4 className="font-medium text-red-700">❌ Before (Tailwind repetition):</h4>
      <div className="bg-gray-100 p-4 rounded-lg">
        <code className="text-sm">
          {`<div className="bg-white rounded-3xl shadow-lg p-8 border border-blue-100">`}
        </code>
      </div>
      
      <h4 className="font-medium text-green-700">✅ After (CSS layer):</h4>
      <div className="bg-gray-100 p-4 rounded-lg">
        <code className="text-sm">
          {`<div className="card-elevated--bordered">`}
        </code>
      </div>
      
      <div className="card-elevated--bordered">
        <h5 className="font-semibold mb-2">Result</h5>
        <p className="text-sm text-gray-600">Same visual result, cleaner code, better maintainability</p>
      </div>
    </div>
  </div>
);