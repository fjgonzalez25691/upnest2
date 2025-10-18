// src/pages/measurements/AddMeasurement.jsx
// Page for adding new growth measurements to a baby

import React from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import GrowthDataForm from "../../components/measuremencomponents/GrowthDataForm";
import PrimaryButton from "../../components/PrimaryButton";
import { createGrowthData } from "../../services/growthDataApi";
import PageShell from "../../components/layout/PageShell";

const AddMeasurement = () => {
    const location = useLocation();
    const { baby } = location.state || {};
    const navigate = useNavigate();

    if (!baby) {
        return (
            <PageShell>
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        No Baby Selected
                    </h1>
                    <p className="text-gray-600 mb-4">
                        Please access this page from the baby profile.
                    </p>
                    <Link to="/dashboard">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            Back to Dashboard
                        </button>
                    </Link>
                </div>
            </PageShell>
        );
    }

    const handleSubmit = async (measurementData) => {
        try {
            const dataToSave = { ...measurementData, babyId: baby.babyId };
            
            // Create the measurement - backend now returns percentiles immediately
            const response = await createGrowthData(dataToSave);
            console.log("Created measurement with percentiles:", response);

            // No more polling needed - percentiles are in the response
            navigate(`/baby/${baby.babyId}`);
            
        } catch (err) {
            console.error("Error creating measurement:", err);
            throw new Error("Failed to save measurement. Please try again.");
        }
    };

    const handleCancel = () => {
        navigate(`/baby/${baby.babyId}`);
    };

    return (
        <PageShell>
            {/* Header */}
            <div className="max-w-2xl mx-auto mb-8">
                <div className="bg-white rounded-3xl shadow-lg p-8 border border-blue-100">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-blue-900 mb-2">
                            📏 New Measurement
                        </h1>
                        <p className="text-blue-700 text-lg">
                            Record new growth data for {baby.name}
                        </p>
                    </div>
                    
                </div>
            </div>

            {/* Baby Info Card */}
            <div className="max-w-2xl mx-auto mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-blue-900">{baby.name}</h3>
                            <div className="text-sm text-blue-700">
                                <p>Born: {new Date(baby.dateOfBirth).toLocaleDateString()}</p>
                                {baby.gender && <p>Gender: {baby.gender}</p>}
                                {baby.premature && (
                                    <p>Premature: {baby.gestationalWeek} weeks</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            <GrowthDataForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                babyId={baby.babyId}
                heading="Record Growth Measurement"
                submitLabel="Save Measurement"
            />

            {/* Tips */}
            <div className="max-w-2xl mx-auto mt-8">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">📏 Measurement Tips</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Measure weight without clothes or diaper when possible</li>
                        <li>• For height, lay baby flat and measure from head to heel</li>
                        <li>• Head circumference should be measured at the widest part</li>
                        <li>• Take measurements at consistent times for better tracking</li>
                        <li>• Record the source (doctor visit, home scale, etc.) for context</li>
                    </ul>
                </div>
            </div>
        </PageShell>
    );
};

export default AddMeasurement;
