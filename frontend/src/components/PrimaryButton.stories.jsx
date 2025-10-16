import PrimaryButton from './PrimaryButton';

export default {
  title: 'Components/PrimaryButton',
  component: PrimaryButton,
  parameters: {
    docs: {
      description: {
        component: 'Primary button component with multiple variants, sizes, and icon support for consistent actions across the application.'
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'cancel', 'add', 'edit', 'success', 'danger', 'ai', 'logout'],
      description: 'Visual style variant'
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
      description: 'Whether to show icon (for backward compatibility)'
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled'
    }
  }
};

export const Default = {
  args: {
    children: 'Button Text',
    variant: 'primary',
    size: 'default'
  }
};

export const AllVariants = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <PrimaryButton variant="primary">Primary</PrimaryButton>
      <PrimaryButton variant="secondary">Secondary</PrimaryButton>
      <PrimaryButton variant="cancel">Cancel</PrimaryButton>
      <PrimaryButton variant="add">Add</PrimaryButton>
      <PrimaryButton variant="edit">Edit</PrimaryButton>
      <PrimaryButton variant="success">Success</PrimaryButton>
      <PrimaryButton variant="danger">Danger</PrimaryButton>
      <PrimaryButton variant="ai">AI Action</PrimaryButton>
      <PrimaryButton variant="logout">Logout</PrimaryButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available button variants with their semantic colors and purposes.'
      }
    }
  }
};

export const SizeVariants = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <PrimaryButton size="default">Default Size</PrimaryButton>
        <PrimaryButton size="compact">Compact Size</PrimaryButton>
      </div>
      <div className="flex items-center gap-3">
        <PrimaryButton variant="add" size="default">Add Item</PrimaryButton>
        <PrimaryButton variant="add" size="compact">Add Item</PrimaryButton>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Size variants - default for standard interfaces, compact for tight layouts or secondary actions.'
      }
    }
  }
};

export const WithIcons = {
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <PrimaryButton 
          variant="add"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>}
        >
          Add Item
        </PrimaryButton>
        <PrimaryButton 
          variant="edit"
          iconPosition="right"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
        >
          Edit
        </PrimaryButton>
        <PrimaryButton 
          variant="danger"
          iconPosition="only"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
          title="Delete"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <PrimaryButton 
          variant="success"
          size="compact"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
        >
          Save
        </PrimaryButton>
        <PrimaryButton 
          variant="cancel"
          size="compact"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
        >
          Cancel
        </PrimaryButton>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons with icons in different positions - left (default), right, or icon-only for compact interfaces.'
      }
    }
  }
};

export const States = {
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <PrimaryButton variant="primary">Normal</PrimaryButton>
        <PrimaryButton variant="primary" disabled>Disabled</PrimaryButton>
      </div>
      <div className="flex flex-wrap gap-3">
        <PrimaryButton variant="success">Active Success</PrimaryButton>
        <PrimaryButton variant="success" disabled>Disabled Success</PrimaryButton>
      </div>
      <div className="flex flex-wrap gap-3">
        <PrimaryButton variant="danger">Active Danger</PrimaryButton>
        <PrimaryButton variant="danger" disabled>Disabled Danger</PrimaryButton>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Button states including normal and disabled states across different variants.'
      }
    }
  }
};

export const FormActions = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Primary Form Actions</h4>
        <div className="flex gap-3">
          <PrimaryButton variant="primary">Submit Form</PrimaryButton>
          <PrimaryButton variant="cancel">Cancel</PrimaryButton>
        </div>
      </div>
      
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">CRUD Actions</h4>
        <div className="flex flex-wrap gap-3">
          <PrimaryButton variant="add" size="compact">Add New</PrimaryButton>
          <PrimaryButton variant="edit" size="compact">Edit</PrimaryButton>
          <PrimaryButton variant="danger" size="compact">Delete</PrimaryButton>
        </div>
      </div>
      
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Status Actions</h4>
        <div className="flex flex-wrap gap-3">
          <PrimaryButton variant="success">Approve</PrimaryButton>
          <PrimaryButton variant="danger">Reject</PrimaryButton>
          <PrimaryButton variant="secondary">Review Later</PrimaryButton>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common button combinations for different form and action contexts.'
      }
    }
  }
};

export const Responsive = {
  render: () => (
    <div className="space-y-4">
      <div className="block sm:hidden">
        <h4 className="font-semibold text-gray-700 mb-3">Mobile Layout (Compact)</h4>
        <div className="space-y-2">
          <PrimaryButton variant="primary" size="compact" className="w-full">Full Width Primary</PrimaryButton>
          <PrimaryButton variant="secondary" size="compact" className="w-full">Full Width Secondary</PrimaryButton>
        </div>
      </div>
      
      <div className="hidden sm:block">
        <h4 className="font-semibold text-gray-700 mb-3">Desktop Layout</h4>
        <div className="flex gap-3">
          <PrimaryButton variant="primary">Desktop Primary</PrimaryButton>
          <PrimaryButton variant="secondary">Desktop Secondary</PrimaryButton>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Responsive button layouts - full width compact buttons for mobile, inline for desktop.'
      }
    },
    viewport: {
      defaultViewport: 'mobile'
    }
  }
};