// src/pages/EditMeasurement.jsx
// Page for editing an existing growth measurement

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import GrowthDataForm from "../../components/measuremencomponents/GrowthDataForm";
import PrimaryButton from "../../components/PrimaryButton";
import { getGrowthMeasurement, updateGrowthData} from "../../services/growthDataApi";

const EditMeasurement = () => {
    const { measurementId } = useParams();
    const navigate = useNavigate();

    const [measurement, setMeasurement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            console.log("MeasurementId from params:", measurementId); // LOG 1
            try {
                setLoading(true);
                setError("");

                // Fetch measurement data
                const measurementData = await getGrowthMeasurement(measurementId);
                console.log("Measurement data from API:", measurementData); // LOG 2
                setMeasurement(measurementData);

                
            } catch (err) {
                console.error("Error fetching measurement data:", err);
                setError("Failed to load measurement data. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [measurementId]);    

    const handleSave = async (formData) => {
        setSaving(true);
        try {
            await updateGrowthData(measurementId, formData);
            navigate(`/baby/${measurement.babyId}/growth/tracking`);
        } catch (err) {
            console.error("Error updating measurement:", err);
            throw new Error("Failed to update measurement. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate(`/baby/${measurement.babyId}/growth/tracking`);
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this measurement? This action cannot be undone.")) {
            return;
        }

        try {
            setSaving(true);
            await deleteGrowthData(measurementId);
            navigate(`/baby/${measurement.babyId}/growth/history`);
        } catch (err) {
            console.error("Error deleting measurement:", err);
            setError("Failed to delete measurement. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                    <div className="h-96 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (error && !measurement) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <div className="text-red-500 mb-4">
                        <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Measurement</h2>
                    <p className="text-red-700 mb-4">{error}</p>
                    <div className="space-x-3">
                        <PrimaryButton onClick={fetchData} variant="danger">
                            Try Again
                        </PrimaryButton>
                        <Link to={`/baby/${measurement.babyId}/growth/history`}>
                            <PrimaryButton variant="cancel">
                                Back to Growth
                            </PrimaryButton>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!measurement) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                        Measurement Not Found
                    </h2>
                    <Link to="/dashboard">
                        <PrimaryButton variant="primary">Back to Dashboard</PrimaryButton>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Edit Measurement</h1>
                    <p className="text-gray-600 mt-1">
                        {/* Modify {baby.name}'s growth measurement from {new Date(measurement.measurementDate).toLocaleDateString()} */}
                    </p>
                </div>
                
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-red-700">{error}</div>
                </div>
            )}

            {/* Form */}
            <div className="bg-white">
                <GrowthDataForm
                    onSubmit={handleSave}
                    onCancel={handleCancel}
                    heading="Edit Growth Measurement"
                    submitLabel={saving ? "Saving..." : "Save Changes"}
                    babyId={measurement.babyId}
                    initialData={{
                        measurementDate: measurement.measurementDate,
                        measurements: {
                            weight: measurement.measurements?.weight || "",
                            height: measurement.measurements?.height || "",
                            headCircumference: measurement.measurements?.headCircumference || "",
                        },
                        notes: measurement.notes || "",
                        measurementSource: measurement.measurementSource || "home"
                    }}
                />
            </div>

            {/* Tips Section */}
            <div className="mt-8 bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Editing Tips</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">Data Accuracy</h4>
                        <ul className="space-y-1">
                            <li>• Double-check measurements before saving</li>
                            <li>• Update notes to reflect any changes</li>
                            <li>• Consider the measurement source accuracy</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">Version Control</h4>
                        <ul className="space-y-1">
                            <li>• Changes are immediately saved</li>
                            <li>• Previous versions are not recoverable</li>
                            <li>• Use delete carefully - it's permanent</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditMeasurement;
