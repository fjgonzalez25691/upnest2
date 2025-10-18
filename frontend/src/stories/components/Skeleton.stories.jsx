import Skeleton, { 
  SkeletonProfile, 
  SkeletonPost, 
  SkeletonCard, 
  SkeletonList, 
  SkeletonForm,
  SkeletonMeasurementCard,
  SkeletonBabyCard
} from '../../components/Skeleton';

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Skeleton loading components for displaying content placeholders while data is loading. Provides consistent loading states across the application.',
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['text', 'avatar', 'button', 'card', 'input', 'measurement', 'baby-card', 'custom'],
      description: 'Type of skeleton element',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size of the skeleton',
    },
    width: {
      control: { type: 'select' },
      options: ['quarter', 'half', 'three-quarters', 'full'],
      description: 'Width variant for text skeletons',
    },
    animation: {
      control: { type: 'select' },
      options: ['normal', 'slow', 'fast'],
      description: 'Animation speed',
    },
  },
};

export default meta;

export const BasicText = {
  args: {
    variant: 'text',
    size: 'md',
    width: 'full',
  },
};

export const TextSizes = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Small Text</p>
        <Skeleton variant="text" size="sm" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Medium Text (Default)</p>
        <Skeleton variant="text" size="md" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Large Text</p>
        <Skeleton variant="text" size="lg" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Extra Large Text</p>
        <Skeleton variant="text" size="xl" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different text skeleton sizes for various content hierarchies.',
      },
    },
  },
};

export const TextWidths = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Quarter Width</p>
        <Skeleton variant="text" width="quarter" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Half Width</p>
        <Skeleton variant="text" width="half" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Three Quarters Width</p>
        <Skeleton variant="text" width="three-quarters" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Full Width</p>
        <Skeleton variant="text" width="full" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Text width variants for creating realistic content patterns.',
      },
    },
  },
};

export const Avatars = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="text-center">
        <Skeleton variant="avatar" size="sm" />
        <p className="text-xs mt-2">Small</p>
      </div>
      <div className="text-center">
        <Skeleton variant="avatar" size="md" />
        <p className="text-xs mt-2">Medium</p>
      </div>
      <div className="text-center">
        <Skeleton variant="avatar" size="lg" />
        <p className="text-xs mt-2">Large</p>
      </div>
      <div className="text-center">
        <Skeleton variant="avatar" size="xl" />
        <p className="text-xs mt-2">Extra Large</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Avatar skeletons in different sizes for user profiles and lists.',
      },
    },
  },
};

export const Buttons = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="text-center">
        <Skeleton variant="button" size="compact" />
        <p className="text-xs mt-2">Compact</p>
      </div>
      <div className="text-center">
        <Skeleton variant="button" />
        <p className="text-xs mt-2">Default</p>
      </div>
      <div className="text-center">
        <Skeleton variant="button" size="wide" />
        <p className="text-xs mt-2">Wide</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Button skeletons matching the PrimaryButton component sizes.',
      },
    },
  },
};

export const AnimationSpeeds = {
  render: () => (
    <div className="space-y-6 max-w-md">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Slow Animation</p>
        <Skeleton variant="text" animation="slow" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Normal Animation</p>
        <Skeleton variant="text" animation="normal" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Fast Animation</p>
        <Skeleton variant="text" animation="fast" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different animation speeds for various loading contexts.',
      },
    },
  },
};

export const PrebuiltProfile = {
  render: () => (
    <div className="max-w-md">
      <SkeletonProfile />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Pre-built profile skeleton with avatar and text lines.',
      },
    },
  },
};

export const PrebuiltCard = {
  render: () => (
    <div className="max-w-md space-y-4">
      <SkeletonCard />
      <SkeletonCard compact />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Pre-built card skeletons in normal and compact variants.',
      },
    },
  },
};

export const PrebuiltPost = {
  render: () => (
    <div className="max-w-md">
      <SkeletonPost />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete post skeleton with profile, content, and actions.',
      },
    },
  },
};

export const PrebuiltList = {
  render: () => (
    <div className="max-w-md space-y-6">
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">3 Items (Default)</h4>
        <SkeletonList />
      </div>
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">5 Items</h4>
        <SkeletonList items={5} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'List skeletons with configurable number of items.',
      },
    },
  },
};

export const PrebuiltForm = {
  render: () => (
    <div className="max-w-md space-y-6">
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">3 Fields (Default)</h4>
        <SkeletonForm />
      </div>
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">5 Fields</h4>
        <SkeletonForm fields={5} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Form skeletons with labels, inputs, and action buttons.',
      },
    },
  },
};

export const AppSpecificSkeletons = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Measurement Cards</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <SkeletonMeasurementCard />
          <SkeletonMeasurementCard />
          <SkeletonMeasurementCard />
        </div>
      </div>
      
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Baby Cards</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <SkeletonBabyCard />
          <SkeletonBabyCard />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'App-specific skeleton components for UpNest domain objects.',
      },
    },
  },
};

export const UsageDemonstration = {
  render: () => (
    <div className="space-y-8">
      <div className="bg-blue-50 p-6 rounded-xl">
        <h3 className="font-semibold mb-4">Loading Dashboard</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard compact />
          <SkeletonCard compact />
          <SkeletonCard compact />
        </div>
      </div>

      <div className="bg-green-50 p-6 rounded-xl">
        <h3 className="font-semibold mb-4">Loading User List</h3>
        <SkeletonList items={4} />
      </div>

      <div className="bg-purple-50 p-6 rounded-xl">
        <h3 className="font-semibold mb-4">Loading Form</h3>
        <SkeletonForm fields={4} />
      </div>

      <div className="bg-orange-50 p-6 rounded-xl">
        <h3 className="font-semibold mb-4">Loading Profile Page</h3>
        <div className="space-y-4">
          <SkeletonProfile size="lg" />
          <div className="grid grid-cols-2 gap-4">
            <SkeletonCard compact />
            <SkeletonCard compact />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world usage examples showing skeleton loading states in different contexts.',
      },
    },
  },
};