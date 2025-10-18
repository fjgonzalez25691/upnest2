import Avatar, { AvatarStack, AvatarList, AvatarGrid } from './Avatar';
import { AVATAR_SIZES, AVATAR_GRADIENTS } from './avatar.constants';

export default {
  title: 'UI/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Avatar component with semantic sizing and thematic gradients.

Uses the optimized CSS system from \`/styles/components/avatar.css\`.
Replaces repetitive className patterns with semantic properties.

**Migration Example:**
- BEFORE: \`className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-purple-600"\`
- AFTER: \`<Avatar size="lg" gradient="pink" />\`
        `,
      },
    },
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: AVATAR_SIZES,
      description: 'Avatar size',
    },
    gradient: {
      control: { type: 'select' },
      options: AVATAR_GRADIENTS,
      description: 'Gradient theme',
    },
    interactive: {
      control: 'boolean',
      description: 'Enable interactive states (hover, focus, click)',
    },
    online: {
      control: 'boolean',
      description: 'Show online indicator',
    },
    notification: {
      control: 'boolean',
      description: 'Show notification badge',
    },
    bordered: {
      control: 'boolean',
      description: 'Add thematic border',
    },
    skeleton: {
      control: 'boolean',
      description: 'Show skeleton loading state',
    },
    editable: {
      control: 'boolean',
      description: 'Enable editable overlay',
    },
    responsive: {
      control: 'boolean',
      description: 'Use responsive sizing',
    },
  },
};

// Default story
export const Default = (args) => <Avatar {...args} />;
Default.args = {
  src: 'https://images.unsplash.com/photo-1494790108755-2616b612c89e?w=150',
  alt: 'User Avatar',
  size: 'lg',
  gradient: 'pink',
};

// All sizes
export const Sizes = () => (
  <div className="flex items-center gap-4">
    {AVATAR_SIZES.map(size => (
      <div key={size} className="text-center">
        <Avatar
          src="https://images.unsplash.com/photo-1494790108755-2616b612c89e?w=150"
          alt={`Avatar ${size}`}
          size={size}
          gradient="pink"
        />
        <p className="text-sm mt-2">{size}</p>
      </div>
    ))}
  </div>
);

// All gradients
export const Gradients = () => (
  <div className="flex items-center gap-4">
    {AVATAR_GRADIENTS.map(gradient => (
      <div key={gradient} className="text-center">
        <Avatar
          src="https://images.unsplash.com/photo-1494790108755-2616b612c89e?w=150"
          alt={`Avatar ${gradient}`}
          size="lg"
          gradient={gradient}
        />
        <p className="text-sm mt-2">{gradient}</p>
      </div>
    ))}
  </div>
);

// With initials
export const WithInitials = () => (
  <div className="flex items-center gap-4">
    <Avatar initials="AB" size="sm" gradient="blue" />
    <Avatar initials="CD" size="md" gradient="green" />
    <Avatar initials="EF" size="lg" gradient="purple" />
    <Avatar initials="GH" size="xl" gradient="orange" />
  </div>
);

// Interactive states
export const Interactive = () => (
  <div className="flex items-center gap-4">
    <Avatar
      src="https://images.unsplash.com/photo-1494790108755-2616b612c89e?w=150"
      alt="Interactive Avatar"
      size="lg"
      gradient="pink"
      interactive
      onClick={() => alert('Avatar clicked!')}
    />
    <Avatar
      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
      alt="Online Avatar"
      size="lg"
      gradient="blue"
      interactive
      online
    />
    <Avatar
      src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150"
      alt="Notification Avatar"
      size="lg"
      gradient="green"
      interactive
      notification
    />
  </div>
);

// Special variants
export const SpecialVariants = () => (
  <div className="flex items-center gap-4">
    <Avatar
      src="https://images.unsplash.com/photo-1494790108755-2616b612c89e?w=150"
      alt="Bordered Avatar"
      size="lg"
      gradient="pink"
      bordered
    />
    <Avatar
      size="lg"
      gradient="gray"
      skeleton
    />
    <Avatar
      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
      alt="Editable Avatar"
      size="lg"
      gradient="purple"
      editable
    />
  </div>
);

// Avatar Stack
export const StackExample = () => (
  <AvatarStack>
    <Avatar
      src="https://images.unsplash.com/photo-1494790108755-2616b612c89e?w=150"
      alt="User 1"
      size="md"
      gradient="pink"
    />
    <Avatar
      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
      alt="User 2"
      size="md"
      gradient="blue"
    />
    <Avatar
      src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150"
      alt="User 3"
      size="md"
      gradient="green"
    />
    <Avatar
      initials="+2"
      size="md"
      gradient="gray"
    />
  </AvatarStack>
);

// Avatar List
export const ListExample = () => (
  <AvatarList>
    <Avatar
      src="https://images.unsplash.com/photo-1494790108755-2616b612c89e?w=150"
      alt="User 1"
      size="sm"
      gradient="pink"
    />
    <Avatar
      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
      alt="User 2"
      size="sm"
      gradient="blue"
    />
    <Avatar
      src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150"
      alt="User 3"
      size="sm"
      gradient="green"
    />
  </AvatarList>
);

// Avatar Grid
export const GridExample = () => (
  <AvatarGrid>
    <Avatar
      src="https://images.unsplash.com/photo-1494790108755-2616b612c89e?w=150"
      alt="User 1"
      size="lg"
      gradient="pink"
    />
    <Avatar
      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
      alt="User 2"
      size="lg"
      gradient="blue"
    />
    <Avatar
      src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150"
      alt="User 3"
      size="lg"
      gradient="green"
    />
    <Avatar
      initials="AB"
      size="lg"
      gradient="purple"
    />
    <Avatar
      initials="CD"
      size="lg"
      gradient="orange"
    />
    <Avatar
      size="lg"
      gradient="gray"
      skeleton
    />
  </AvatarGrid>
);

// Responsive example
export const Responsive = () => (
  <div className="space-y-4">
    <p className="text-sm text-gray-600">Resize the window to see the responsive behavior:</p>
    <Avatar
      src="https://images.unsplash.com/photo-1494790108755-2616b612c89e?w=150"
      alt="Responsive Avatar"
      gradient="pink"
      responsive
    />
  </div>
);