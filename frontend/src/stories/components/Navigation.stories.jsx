import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import BackLink from '../../components/navigation/BackLink';

const RouterDecorator = (Story, context) => (
  <MemoryRouter>
    <div className="p-4">
      <Story {...context} />
    </div>
  </MemoryRouter>
);

export default {
  title: 'Components/Navigation',
  decorators: [RouterDecorator],
  parameters: {
    docs: {
      description: {
        component: `
# Navigation System (Phase 3 - Original Plan)

Basic navigation system that replaces repetitive back link patterns.

## Included Component
- **BackLink**: Consistent back navigation links

## Migration from Tailwind
Replaces the repetitive pattern of \`text-blue-600 hover:text-blue-800 flex items-center mb-4 transition-colors\`
        `
      }
    }
  }
};

// Basic BackLink stories
export const BackLinks = () => (
  <div className="space-y-4">
    <BackLink to="/dashboard">Back to Dashboard</BackLink>
    <BackLink to="/baby/123">Back to Profile</BackLink>
  </div>
);

// Migration comparison
export const MigrationComparison = () => (
  <div className="space-y-6">
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <h4 className="font-medium text-red-800 mb-2">❌ Before (Tailwind repetition):</h4>
      <code className="text-sm text-gray-700 block">
        {`<Link className="text-blue-600 hover:text-blue-800 flex items-center mb-4 transition-colors">`}
        <br />
        {`  <svg className="w-5 h-5 mr-2">...</svg>`}
        <br />
        {`  Back to Profile`}
        <br />
        {`</Link>`}
      </code>
    </div>
    
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h4 className="font-medium text-green-800 mb-2">✅ After (Component + CSS Layer):</h4>
      <code className="text-sm text-gray-700 block">
        {`<BackLink to="/baby/123">Back to Profile</BackLink>`}
      </code>
    </div>
  </div>
);