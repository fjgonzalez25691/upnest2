import PrimaryButton from '../../components/PrimaryButton';

// Simple SVG icons for the stories
const ChevronRightIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const PlusIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const PencilIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const XMarkIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default {
  title: 'Components/Buttons',
  component: PrimaryButton,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Button System

Unified button system with gradient variants and consistent styling.
Built on top of the PrimaryButton component with CSS layers support.

## Key Features
- **8 variants**: Primary, Add, Edit, Cancel, Success, Danger, AI, Logout
- **2 sizes**: Default and Compact
- **Icon support**: Left, right, or icon-only positioning
- **Accessibility**: Full keyboard and screen reader support
- **CSS + React**: Can be used as CSS classes or React component

## Design System
All buttons use CSS custom properties for gradients and consistent styling
defined in the design tokens system.
        `
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'add', 'edit', 'cancel', 'success', 'danger', 'ai', 'logout'],
      description: 'Button variant style'
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'compact'],
      description: 'Button size'
    },
    iconPosition: {
      control: { type: 'select' },
      options: ['left', 'right', 'only'],
      description: 'Icon position relative to text'
    },
    showIcon: {
      control: 'boolean',
      description: 'Show or hide the icon'
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state'
    }
  }
};

// Basic variants showcase
export const Primary = {
  args: {
    variant: 'primary',
    children: 'Primary Action'
  }
};

export const Add = {
  args: {
    variant: 'add',
    children: 'Add Item'
  }
};

export const Edit = {
  args: {
    variant: 'edit',
    children: 'Edit'
  }
};

export const Cancel = {
  args: {
    variant: 'cancel',
    children: 'Cancel'
  }
};

export const Success = {
  args: {
    variant: 'success',
    children: 'Success'
  }
};

export const Danger = {
  args: {
    variant: 'danger',
    children: 'Delete'
  }
};

export const AI = {
  args: {
    variant: 'ai',
    children: 'AI Assistant'
  }
};

export const Logout = {
  args: {
    variant: 'logout',
    children: 'Logout'
  }
};

// Size variants
export const Sizes = () => (
  <div className="space-y-4">
    <div>
      <h3 className="text-lg font-semibold mb-4">Button Sizes</h3>
    </div>
    
    <div className="flex items-center gap-4">
      <PrimaryButton variant="primary" size="default">
        Default Size
      </PrimaryButton>
      <PrimaryButton variant="primary" size="compact">
        Compact Size
      </PrimaryButton>
    </div>
  </div>
);

// All variants showcase
export const AllVariants = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <PrimaryButton variant="primary">Primary</PrimaryButton>
    <PrimaryButton variant="add">Add</PrimaryButton>
    <PrimaryButton variant="edit">Edit</PrimaryButton>
    <PrimaryButton variant="cancel">Cancel</PrimaryButton>
    <PrimaryButton variant="success">Success</PrimaryButton>
    <PrimaryButton variant="danger">Danger</PrimaryButton>
    <PrimaryButton variant="ai">AI</PrimaryButton>
    <PrimaryButton variant="logout">Logout</PrimaryButton>
  </div>
);

// Icon examples
export const WithIcons = () => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold mb-4">Buttons with Icons</h3>
    </div>
    
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <PrimaryButton 
          variant="add" 
          icon={<PlusIcon />}
          iconPosition="left"
        >
          Add New
        </PrimaryButton>
        
        <PrimaryButton 
          variant="edit" 
          icon={<PencilIcon />}
          iconPosition="left"
        >
          Edit Item
        </PrimaryButton>
        
        <PrimaryButton 
          variant="primary" 
          icon={<ChevronRightIcon />}
          iconPosition="right"
        >
          Continue
        </PrimaryButton>
      </div>
      
      <div className="flex items-center gap-4">
        <PrimaryButton 
          variant="danger" 
          icon={<XMarkIcon />}
          iconPosition="only"
          className="w-10 h-10"
        />
        
        <PrimaryButton 
          variant="add" 
          icon={<PlusIcon />}
          iconPosition="only"
          className="w-10 h-10"
        />
      </div>
    </div>
  </div>
);

// States showcase
export const ButtonStates = () => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold mb-4">Button States</h3>
    </div>
    
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <PrimaryButton variant="primary">Normal</PrimaryButton>
        <PrimaryButton variant="primary" disabled>Disabled</PrimaryButton>
      </div>
      
      <div className="flex items-center gap-4">
        <PrimaryButton variant="add">Normal</PrimaryButton>
        <PrimaryButton variant="add" disabled>Disabled</PrimaryButton>
      </div>
      
      <div className="flex items-center gap-4">
        <PrimaryButton variant="danger">Normal</PrimaryButton>
        <PrimaryButton variant="danger" disabled>Disabled</PrimaryButton>
      </div>
    </div>
  </div>
);

// Real usage examples
export const UsageExamples = () => (
  <div className="space-y-8">
    <div>
      <h3 className="text-lg font-semibold mb-4">Common Usage Patterns</h3>
    </div>
    
    {/* Form actions */}
    <div className="card-elevated--bordered p-6">
      <h4 className="font-semibold mb-4">Form Actions</h4>
      <div className="flex gap-4 justify-end">
        <PrimaryButton variant="cancel">Cancel</PrimaryButton>
        <PrimaryButton variant="primary">Save Changes</PrimaryButton>
      </div>
    </div>
    
    {/* Dashboard actions */}
    <div className="card-elevated--bordered p-6">
      <h4 className="font-semibold mb-4">Dashboard Actions</h4>
      <div className="flex flex-wrap gap-4">
        <PrimaryButton variant="add" icon={<PlusIcon />}>
          Add Baby
        </PrimaryButton>
        <PrimaryButton variant="primary" icon={<ChevronRightIcon />} iconPosition="right">
          View Growth Charts
        </PrimaryButton>
        <PrimaryButton variant="ai">AI Assistant</PrimaryButton>
      </div>
    </div>
    
    {/* Compact buttons */}
    <div className="card-elevated--bordered p-6">
      <h4 className="font-semibold mb-4">Compact Buttons (Mobile/Dense UI)</h4>
      <div className="flex flex-wrap gap-2">
        <PrimaryButton variant="edit" size="compact">Edit</PrimaryButton>
        <PrimaryButton variant="danger" size="compact">Delete</PrimaryButton>
        <PrimaryButton variant="primary" size="compact">View</PrimaryButton>
      </div>
    </div>
  </div>
);

// CSS-only usage examples
export const CSSOnlyUsage = () => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold mb-4">CSS-Only Usage</h3>
      <p className="text-gray-600 mb-4">
        You can use button styles without the React component:
      </p>
    </div>
    
    <div className="space-y-4">
      <button className="btn-base btn-primary">
        CSS: btn-base btn-primary
      </button>
      
      <button className="btn-base-compact btn-add">
        CSS: btn-base-compact btn-add
      </button>
      
      <button className="btn-base btn-danger" disabled>
        CSS: Disabled state
      </button>
    </div>
    
    <div className="bg-gray-100 p-4 rounded-lg">
      <h5 className="font-semibold mb-2">Example CSS Usage:</h5>
      <code className="text-sm">
        {`<button className="btn-base btn-primary">Click me</button>`}
      </code>
    </div>
  </div>
);

// Migration guide
export const MigrationGuide = () => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold mb-4">Migration Guide</h3>
    </div>
    
    <div className="space-y-4">
      <div className="bg-red-50 p-4 rounded-lg">
        <h4 className="font-semibold text-red-800 mb-2">❌ Before (Tailwind classes)</h4>
        <code className="text-sm text-red-700">
          {`<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">`}
        </code>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="font-semibold text-green-800 mb-2">✅ After (PrimaryButton)</h4>
        <code className="text-sm text-green-700">
          {`<PrimaryButton variant="primary">Click me</PrimaryButton>`}
        </code>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">✅ Alternative (CSS classes)</h4>
        <code className="text-sm text-blue-700">
          {`<button className="btn-base btn-primary">Click me</button>`}
        </code>
      </div>
    </div>
  </div>
);