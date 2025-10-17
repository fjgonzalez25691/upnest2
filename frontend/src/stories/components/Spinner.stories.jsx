import Spinner from '../../components/Spinner';

const meta = {
  title: 'Components/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Unified spinner component with multiple variants for different use cases. Fully customizable for any long-running process.',
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['basic', 'inline', 'premium'],
      description: 'Visual style variant',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size of the spinner',
    },
    color: {
      control: { type: 'select' },
      options: ['primary', 'blue', 'white', 'custom'],
      description: 'Color theme',
    },
    message: {
      control: 'text',
      description: 'Optional message to display (basic/inline variants)',
    },
    message1: {
      control: 'text',
      description: 'First line message for premium variant (blue color)',
    },
    message2: {
      control: 'text',
      description: 'Second line message for premium variant',
    },
    message3: {
      control: 'text',
      description: 'Third line message for premium variant',
    },
    overlay: {
      control: 'boolean',
      description: 'Show as modal overlay (premium variant only)',
    },
    particles: {
      control: 'boolean',
      description: 'Show floating particles (premium variant only)',
    },
  },
};

export default meta;

export const Basic = {
  args: {
    variant: 'basic',
    size: 'md',
    color: 'primary',
  },
};

export const BasicWithMessage = {
  args: {
    variant: 'basic',
    size: 'md',
    color: 'primary',
    message: 'Loading...',
  },
};

export const Inline = {
  args: {
    variant: 'inline',
    message: 'Saving...',
    color: 'blue',
  },
};

export const Premium = {
  args: {
    variant: 'premium',
    particles: true,
  },
};

export const PremiumOverlay = {
  args: {
    variant: 'premium',
    overlay: true,
    message1: 'Processing Request',
    message2: 'This process may take a few moments while we handle your request.',
    message3: 'Please don\'t close this tab or navigate away',
    particles: true,
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export const AllSizes = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="text-center">
        <Spinner variant="basic" size="sm" color="primary" />
        <p className="text-xs mt-2">Small</p>
      </div>
      <div className="text-center">
        <Spinner variant="basic" size="md" color="primary" />
        <p className="text-xs mt-2">Medium</p>
      </div>
      <div className="text-center">
        <Spinner variant="basic" size="lg" color="primary" />
        <p className="text-xs mt-2">Large</p>
      </div>
      <div className="text-center">
        <Spinner variant="basic" size="xl" color="primary" />
        <p className="text-xs mt-2">Extra Large</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Available sizes for the basic spinner variant.',
      },
    },
  },
};

export const AllColors = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="text-center">
        <Spinner variant="basic" size="md" color="primary" />
        <p className="text-xs mt-2">Primary</p>
      </div>
      <div className="text-center">
        <Spinner variant="basic" size="md" color="blue" />
        <p className="text-xs mt-2">Blue</p>
      </div>
      <div className="text-center bg-gray-800 p-4 rounded">
        <Spinner variant="basic" size="md" color="white" />
        <p className="text-xs mt-2 text-white">White</p>
      </div>
      <div className="text-center text-red-500">
        <Spinner variant="basic" size="md" color="custom" />
        <p className="text-xs mt-2">Custom (inherits)</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Available color variants. Custom color inherits from parent text color.',
      },
    },
  },
};

export const UsageDemonstration = {
  render: () => (
    <div className="space-y-8 p-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-4">Page Loading States</h3>
        <div className="space-y-4">
          <Spinner variant="basic" size="md" color="primary" message="Loading profile..." />
          <Spinner variant="basic" size="md" color="blue" message="Loading data..." />
        </div>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-4">Form Submissions</h3>
        <div className="flex gap-4">
          <button className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
            <Spinner variant="inline" color="white" message="Saving..." />
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2">
            <Spinner variant="inline" color="white" message="Processing..." />
          </button>
        </div>
      </div>
      
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-4">Notification Banners</h3>
        <div className="bg-blue-100 border border-blue-200 text-blue-800 rounded-lg p-3">
          <div className="flex items-center">
            <Spinner variant="basic" size="sm" color="blue" className="mr-2" />
            Processing your request... this may take a few seconds.
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common usage patterns for different spinner variants in real application contexts.',
      },
    },
  },
};