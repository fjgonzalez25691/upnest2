// src/pages/measurements/AddMeasurement.jsx
// Page for adding new growth measurements to a baby

import React from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import GrowthDataForm from "../../components/measuremencomponents/GrowthDataForm";
import PrimaryButton from "../../components/PrimaryButton";
import { createGrowthData, getGrowthMeasurement } from "../../services/growthDataApi";

const AddMeasurement = () => {
    const location = useLocation();
    const { baby } = location.state || {};
    const navigate = useNavigate();

    if (!baby) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Baby Not Found</h2>
                    <p className="text-gray-600 mb-4">
                        Please access this page from the baby profile.
                    </p>
                    <Link to="/dashboard">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            Back to Dashboard
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    const handleSubmit = async (measurementData) => {
        try {
            const dataToSave = { ...measurementData, babyId: baby.babyId };
            
            // Create the measurement
            const response = await createGrowthData(dataToSave);
            const measurementId = response.data.dataId;
            console.log("Created measurement with ID:", measurementId);

            // Determine which fields were provided
            const hasWeight = dataToSave.weight !== undefined && dataToSave.weight !== null;
            const hasHeight = dataToSave.height !== undefined && dataToSave.height !== null;
            const hasHeadCircumference = dataToSave.headCircumference !== undefined && dataToSave.headCircumference !== null;

            // Poll until percentiles are calculated for the provided fields
            const startTime = Date.now();
            let updated = false;
            let retries = 0;
            
            while (!updated && retries < 40) {
                const fresh = await getGrowthMeasurement(measurementId);
                
                // Check if percentiles exist for the fields we provided
                if (fresh.percentiles) {
                    updated = 
                        (!hasWeight || (fresh.percentiles.weight !== null && fresh.percentiles.weight !== undefined)) &&
                        (!hasHeight || (fresh.percentiles.height !== null && fresh.percentiles.height !== undefined)) &&
                        (!hasHeadCircumference || (fresh.percentiles.headCircumference !== null && fresh.percentiles.headCircumference !== undefined));
                }
                
                if (!updated) {
                    await new Promise(res => setTimeout(res, 200)); // Wait 0.2s
                    retries++;
                }
            }
            
            const elapsed = Date.now() - startTime;
            console.log(`Polling took ${elapsed}ms`);

            // Navigate only when percentiles are ready
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
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                    <Link to="/dashboard" className="hover:text-gray-700">Dashboard</Link>
                    <span>/</span>
                    <Link to={`/baby/${baby.babyId}`} className="hover:text-gray-700">{baby.name}</Link>
                    <span>/</span>
                    <span>Add Measurement</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Add Measurement</h1>
                        <p className="text-gray-600 mt-1">
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
        </div>
    );
};

export default AddMeasurement;
