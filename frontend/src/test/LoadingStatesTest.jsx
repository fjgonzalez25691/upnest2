import React from 'react';
import PrimaryButton from '../components/PrimaryButton';
import Skeleton from '../components/Skeleton';

// Simple test component to verify everything works
const TestComponent = () => {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Test Loading States</h2>
      
      <div className="space-y-2">
        <h3 className="font-semibold">PrimaryButton Loading</h3>
        <PrimaryButton>Normal Button</PrimaryButton>
        <PrimaryButton isLoading>Loading Button</PrimaryButton>
        <PrimaryButton isLoading loadingText="Saving...">Save Button</PrimaryButton>
      </div>
      
      <div className="space-y-2">
        <h3 className="font-semibold">Skeleton Loading</h3>
        <Skeleton variant="text" width="half" />
        <Skeleton variant="text" width="three-quarters" />
        <Skeleton variant="avatar" />
        <Skeleton variant="button" />
      </div>
    </div>
  );
};

export default TestComponent;