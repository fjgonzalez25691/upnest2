// src/pages/AddMeasurement.jsx
// Page for adding new growth measurements to a baby

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import GrowthDataForm from "../components/GrowthDataForm";
import { getBaby } from "../services/babyApi";
// import { createGrowthData } from "../services/growthDataApi"; // TODO: Create this service

const AddMeasurement = () => {
    const { babyId } = useParams();
    const navigate = useNavigate();
    const [baby, setBaby] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchBaby();
    }, [babyId]);

    const fetchBaby = async () => {
        try {
            setLoading(true);
            const babyData = await getBaby(babyId);
            setBaby(babyData);
        } catch (err) {
            console.error("Error fetching baby:", err);
            setError("Failed to load baby information. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (measurementData) => {
        try {
            console.log("Creating measurement:", measurementData);
            
            // TODO: Uncomment when service is created
            // await createGrowthData(measurementData);
            
            // Mock success for now
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Navigate back to growth tracking page
            navigate(`/baby/${babyId}/growth`);
        } catch (err) {
            console.error("Error creating measurement:", err);
            throw new Error("Failed to save measurement. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                    <div className="max-w-2xl mx-auto">
                        <div className="h-96 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <div className="text-red-500 mb-4">
                            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-red-900 mb-2">Error</h2>
                        <p className="text-red-700 mb-4">{error}</p>
                        <Link to="/dashboard">
                            <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                                Back to Dashboard
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!baby) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Baby Not Found</h2>
                    <Link to="/dashboard">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            Back to Dashboard
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                    <Link to="/dashboard" className="hover:text-gray-700">Dashboard</Link>
                    <span>/</span>
                    <Link to={`/baby/${babyId}`} className="hover:text-gray-700">{baby.name}</Link>
                    <span>/</span>
                    <Link to={`/baby/${babyId}/growth`} className="hover:text-gray-700">Growth</Link>
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
                    <div className="flex space-x-3 mt-4 sm:mt-0">
                        <Link to={`/baby/${babyId}/growth`}>
                            <button className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                                Cancel
                            </button>
                        </Link>
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
                babyId={babyId}
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
