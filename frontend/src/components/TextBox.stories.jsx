import TextBox from './TextBox';

export default {
  title: 'Components/TextBox',
  component: TextBox,
  parameters: {
    docs: {
      description: {
        component: 'Versatile input component supporting text input, select dropdowns, and read-only display modes with flexible label positioning and sizing options.'
      }
    }
  },
  argTypes: {
    labelPosition: {
      control: { type: 'select' },
      options: ['top', 'inline', 'none'],
      description: 'Position of the label relative to the input'
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'compact'],
      description: 'Size variant of the component'
    },
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'number', 'date', 'select'],
      description: 'Input type or select for dropdown'
    },
    editable: {
      control: 'boolean',
      description: 'Whether the field is editable or read-only'
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required'
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the field is disabled'
    }
  }
};

export const Default = {
  args: {
    label: 'Label',
    name: 'example',
    value: '',
    placeholder: 'Enter text...',
    editable: true,
    labelPosition: 'top',
    size: 'default'
  }
};

export const AllVariants = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <h4 className="font-semibold text-gray-700">Input Types</h4>
      <TextBox label="Text Input" name="text" editable placeholder="Enter text..." />
      <TextBox label="Email Input" name="email" type="email" editable placeholder="Enter email..." />
      <TextBox label="Password Input" name="password" type="password" editable placeholder="Enter password..." />
      <TextBox label="Number Input" name="number" type="number" editable placeholder="Enter number..." />
      <TextBox label="Date Input" name="date" type="date" editable />
      <TextBox label="Select Dropdown" name="select" type="select" editable options={['Option 1', 'Option 2', 'Option 3']} />
      <TextBox label="Read-only Display" name="readonly" value="Cannot be edited" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available input types and states displayed together for comparison.'
      }
    }
  }
};

export const SizeVariants = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <h4 className="font-semibold text-gray-700">Size Variants</h4>
      <TextBox label="Default Size" name="default" size="default" editable placeholder="Default size..." />
      <TextBox label="Compact Size" name="compact" size="compact" editable placeholder="Compact size..." />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different size variants - default for standard forms, compact for tight layouts.'
      }
    }
  }
};

export const LabelPositions = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <h4 className="font-semibold text-gray-700">Label Positions</h4>
      <TextBox label="Top Label" name="top" labelPosition="top" editable placeholder="Label above..." />
      <TextBox label="Inline Label" name="inline" labelPosition="inline" editable placeholder="Label inline..." />
      <TextBox name="none" labelPosition="none" editable placeholder="No label..." />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different label positioning options - top (default), inline for horizontal layouts, none for special cases.'
      }
    }
  }
};

export const States = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <h4 className="font-semibold text-gray-700">Component States</h4>
      <TextBox label="Normal State" name="normal" editable placeholder="Normal input..." />
      <TextBox label="Required Field" name="required" editable required placeholder="Required field..." />
      <TextBox label="Disabled Field" name="disabled" editable disabled placeholder="Disabled field..." />
      <TextBox label="With Error" name="error" editable error="This field has an error" placeholder="Field with error..." />
      <TextBox label="Read-only with Value" name="readonly" value="Read-only value" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different component states including normal, required, disabled, error, and read-only states.'
      }
    }
  }
};

export const SelectOptions = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <h4 className="font-semibold text-gray-700">Select Variants</h4>
      <TextBox 
        label="Simple Options" 
        name="simple" 
        type="select" 
        editable 
        options={['Option 1', 'Option 2', 'Option 3']} 
      />
      <TextBox 
        label="Object Options" 
        name="object" 
        type="select" 
        editable 
        options={[
          { value: 'small', label: 'Small Size' },
          { value: 'medium', label: 'Medium Size' },
          { value: 'large', label: 'Large Size' }
        ]} 
      />
      <TextBox 
        label="Compact Select" 
        name="compact-select" 
        type="select" 
        size="compact"
        editable 
        options={['Compact 1', 'Compact 2', 'Compact 3']} 
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Select dropdowns with different option formats and sizes.'
      }
    }
  }
};

export const FormExample = {
  render: () => (
    <form className="space-y-4 max-w-md">
      <h4 className="font-semibold text-gray-700">Complete Form Example</h4>
      <TextBox label="Full Name" name="name" editable required placeholder="Enter your full name..." />
      <TextBox label="Email" name="email" type="email" editable required placeholder="Enter your email..." />
      <TextBox label="Birth Date" name="birthdate" type="date" editable />
      <TextBox 
        label="Gender" 
        name="gender" 
        type="select" 
        editable 
        options={[
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
          { value: 'other', label: 'Other' }
        ]} 
      />
      <TextBox label="Weight" name="weight" type="number" editable placeholder="Weight in kg" suffix="kg" />
    </form>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of how TextBox components work together in a complete form context.'
      }
    }
  }
};