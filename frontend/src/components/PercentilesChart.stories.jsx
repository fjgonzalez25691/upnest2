// src/components/PercentilesChart.stories.jsx
import React from 'react';
import PercentilesChart from './PercentilesChart';

// Mock data que simula mediciones de bebé
const mockMeasurements = [
  {
    measurementDate: '2024-01-15',
    measurements: { weight: 3200, height: 50, headCircumference: 35 },
    dataId: '1'
  },
  {
    measurementDate: '2024-03-15', 
    measurements: { weight: 4500, height: 55, headCircumference: 37 },
    dataId: '2'
  },
  {
    measurementDate: '2024-06-15',
    measurements: { weight: 6800, height: 62, headCircumference: 40 },
    dataId: '3'
  },
  {
    measurementDate: '2024-09-15',
    measurements: { weight: 8200, height: 68, headCircumference: 42 },
    dataId: '4'
  }
];

const Template = (args) => (
  <div className="p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Percentiles Chart
      </h2>
      <PercentilesChart {...args} />
    </div>
  </div>
);

export default {
  title: "Components/Charts/PercentilesChart",
  component: PercentilesChart,
  parameters: {
    docs: {
      description: {
        component: `
## PercentilesChart Component

Interactive percentile charts for baby growth measurements using WHO data standards.

### Recent Updates (v2.1)
- **Debug logs removed**: Cleaned up console.log statements added for development tracking
- **Performance optimized**: Memoized components and axis configurations
- **Eliminated CSS conflicts**: Fixed font-size/letter-spacing parsing errors with native Recharts styling
- **Streamlined rendering**: Simplified chart ready state management

### Features
- **Interactive selector**: Built-in dropdown to switch between Weight, Height, and Head Circumference
- **WHO Standards**: Based on World Health Organization growth standards (0-24 months)
- **Gender-specific**: Separate percentile curves for male/female babies
- **Responsive design**: Mobile-first layout with adaptive legend
- **Hover tooltips**: Detailed percentile information on data point hover

### Technical Implementation
- **Recharts Native**: Uses \`tick={{ fontSize: 14, fill: '#334155' }}\` for optimal compatibility
- **React.memo**: Memoized legend and tooltip components for performance
- **useMemo**: Optimized axis configuration and chart data processing
- **CSS Scoping**: Isolated SVG text styling to prevent conflicts
        `
      }
    },
    layout: 'fullscreen'
  },
  argTypes: {
    gender: {
      control: 'select', 
      options: ['male', 'female'],
      description: 'Baby gender for WHO percentile curves'
    }
  }
};

export const WeightChart = Template.bind({});
WeightChart.args = {
  measurementsWithPercentiles: mockMeasurements,
  birthDate: '2024-01-01',
  gender: 'male'
};
WeightChart.parameters = {
  docs: {
    description: {
      story: 'Chart with baby measurements. Component includes built-in selector to switch between weight, height, and head circumference. Measurements are automatically converted from grams to kilograms for display.'
    }
  }
};

export const HeightChart = Template.bind({});
HeightChart.args = {
  measurementsWithPercentiles: mockMeasurements,
  birthDate: '2024-01-01',
  gender: 'male'
};
HeightChart.parameters = {
  docs: {
    description: {
      story: 'Chart showing growth progression. Use the built-in selector to view different measurement types. Shows WHO standard curves P3, P15, P50 (median), P85, P97.'
    }
  }
};

export const HeadCircumferenceChart = Template.bind({});
HeadCircumferenceChart.args = {
  measurementsWithPercentiles: mockMeasurements,
  birthDate: '2024-01-01',
  gender: 'male'
};
HeadCircumferenceChart.parameters = {
  docs: {
    description: {
      story: 'Chart for tracking neurological development. Critical measurement for early childhood assessment. Use the selector to switch between measurement types.'
    }
  }
};

export const FemaleComparison = Template.bind({});
FemaleComparison.args = {
  measurementsWithPercentiles: mockMeasurements,
  birthDate: '2024-01-01',
  gender: 'female'
};
FemaleComparison.parameters = {
  docs: {
    description: {
      story: 'Female-specific WHO percentile curves. Growth patterns differ between genders according to WHO standards.'
    }
  }
};

export const EmptyState = Template.bind({});
EmptyState.args = {
  measurementsWithPercentiles: [],
  birthDate: '2024-01-01',
  gender: 'male'
};
EmptyState.parameters = {
  docs: {
    description: {
      story: 'Empty state when no measurements are available. Shows WHO percentile curves without baby data points.'
    }
  }
};

export const SingleMeasurement = Template.bind({});
SingleMeasurement.args = {
  measurementsWithPercentiles: [mockMeasurements[0]],
  birthDate: '2024-01-01',
  gender: 'male'
};
SingleMeasurement.parameters = {
  docs: {
    description: {
      story: 'Chart with single measurement point. Useful for initial measurements or sparse data scenarios.'
    }
  }
};

// Playground story for interactive testing
export const Playground = Template.bind({});
Playground.args = {
  measurementsWithPercentiles: mockMeasurements,
  birthDate: '2024-01-01',
  gender: 'male'
};
Playground.parameters = {
  docs: {
    description: {
      story: `
### Interactive Playground

Use the controls below to test different configurations:

- **Gender**: Compare male vs female WHO curves
- **Built-in selector**: The component includes its own measurement type selector
- Observe smooth transitions without CSS errors or console noise

### Recent Improvements
This version reflects the latest optimizations:

1. **Clean console**: Removed debug logs for production-ready experience
2. **Performance optimized**: Memoized components reduce unnecessary re-renders
3. **Stable rendering**: Simplified isChartReady gating prevents render flickering
4. **Native Recharts styling**: Eliminates CSS parsing errors

The component now provides a clean, professional experience suitable for production use.
      `
    }
  }
};