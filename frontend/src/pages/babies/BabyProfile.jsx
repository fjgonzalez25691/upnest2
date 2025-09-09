// src/pages/BabyProfile.jsx
// Baby profile page showing detailed information and growth tracking
import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getBabyById, updateBaby, deleteBaby } from "../../services/babyApi";
import { getGrowthData } from "../../services/growthDataApi";
import PrimaryButton from "../../components/PrimaryButton";
import BabyProfileForm from "../../components/babycomponents/BabyProfileForm";

// Move constants outside component to avoid dependency issues
const MEASUREMENT_KEYS = ['weight', 'height', 'headCircumference'];

const BabyProfile = () => {
    const { babyId } = useParams();
    const [baby, setBaby] = useState(null);
    const [measurements, setMeasurements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);  // Renamed from recalculating
    const navigate = useNavigate();

    console.log("🔍 BabyProfile mounted with babyId:", babyId);

    // Unified data loading function
    const loadData = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            setError("");

            const [babyData, growthData] = await Promise.all([
                getBabyById(babyId),
                getGrowthData(babyId)
            ]);

            console.log("🔍 Loaded data:", { baby: babyData, measurements: growthData });
            setBaby(babyData);
            setMeasurements(growthData);

            return { baby: babyData, measurements: growthData };
        } catch (err) {
            console.error("Error loading data:", err);
            setError(err.message || "Failed to load baby profile");
            return null;
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [babyId]);

    // Initial data load
    useEffect(() => {
        if (babyId) {
            loadData();
        }
    }, [babyId, loadData]);

    const handleSave = async (updatedBabyData) => {
        try {
            setSaving(true);
            setError("");

            // Decide if backend must sync-recalc (gender or dateOfBirth changed)
            const original = baby?.baby || {};
            const needsSync = ['gender', 'dateOfBirth'].some(
                (k) => k in updatedBabyData && updatedBabyData[k] !== original[k]
            );

            console.log("🔍 Saving baby data with syncRecalc:", needsSync);

            // Save baby data (send ?syncRecalc=1 if needed)
            const response = await updateBaby(babyId, updatedBabyData, { syncRecalc: needsSync });
            
            // If backend did sync recalc, use the returned data instead of reloading
            if (response?.updatedCount !== undefined) {
                console.log(`🔍 Backend recalculated ${response.updatedCount} percentiles in ${response.durationMs}ms`);
                
                // Use the measurements returned by the backend
                if (response.measurements) {
                    setMeasurements(response.measurements);
                    console.log(`🔍 Using ${response.measurements} measurements from backend response`);
                }
                
                // Update baby data with the returned data
                if (response.baby) {
                    setBaby({ baby: response.baby });
                    console.log("🔍 Updated baby data from backend response");
                }
            } else {
                // Only reload if sync recalc was not performed
                await loadData(false);
            }
            setEditMode(false);

            console.log("🔍 Baby profile updated successfully");

        } catch (err) {
            console.error("Error updating baby profile:", err);
            setError("Failed to update baby profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditMode(false);
    };

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this baby profile? This action cannot be undone.")) {
            try {
                await deleteBaby(babyId);
                navigate("/dashboard");
            } catch (err) {
                console.error("Error deleting baby:", err);
                setError("Failed to delete baby profile. Please try again.");
            }
        }
    };

    const handleAddMeasurement = () => {
        navigate("/add-measurement", { state: { baby: baby?.baby } });
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading baby profile...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !baby) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <div className="text-red-500 mb-4">
                            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Profile</h2>
                        <p className="text-red-700 mb-4">{error || "Baby profile not found"}</p>
                        <Link to="/dashboard">
                            <PrimaryButton variant="primary">Back to Dashboard</PrimaryButton>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Navigation */}
                <div className="mb-8">
                    <Link
                        to="/dashboard"
                        className="text-blue-600 hover:text-blue-800 flex items-center mb-4 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </Link>
                </div>

                {/* Baby Profile Form Component */}
                <div className="mb-8">
                    <BabyProfileForm
                        baby={baby?.baby}
                        isEditable={editMode}
                        isRecalculating={saving}  // Pass saving state
                        onSave={handleSave}
                        onAdd={handleAddMeasurement}
                        onCancel={handleCancel}
                        onEdit={() => setEditMode(true)}
                        onDelete={handleDelete}
                    />
                </div>

                {/* Growth Tracking Section */}
                {measurements.length > 0 && (
                    <div className="bg-white rounded-3xl shadow-lg p-8 border border-green-100">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Growth Tracking</h2>
                            <Link
                                to={`/baby/${babyId}/growth/tracking`}
                                state={{
                                    babyName: baby.baby.name,
                                    birthDate: baby.baby.dateOfBirth 
                                }}
                            >
                                <PrimaryButton variant="primary" className="mt-4 sm:mt-0">
                                    View Growth Dashboard
                                </PrimaryButton>
                            </Link>
                        </div>

                        {/* Growth Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Charts */}
                            <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-100">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Growth Charts</h3>
                                <p className="text-gray-600 text-sm mb-4">
                                    View WHO percentile charts and growth trends
                                </p>
                                <Link to={`/baby/${babyId}/growth/tracking`} state={{ babyName: baby.baby.name }}>
                                    <PrimaryButton variant="primary" size="sm">
                                        View Charts
                                    </PrimaryButton>
                                </Link>
                            </div>

                            {/* Add Data */}
                            <div className="text-center p-6 bg-green-50 rounded-xl border border-green-100">
                                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">New Measurement</h3>
                                <p className="text-gray-600 text-sm mb-4">
                                    Record weight, height, and head circumference
                                </p>
                                <PrimaryButton variant="add" size="sm" onClick={handleAddMeasurement}>
                                    Add Data
                                </PrimaryButton>
                            </div>

                            {/* History */}
                            <div className="text-center p-6 bg-purple-50 rounded-xl border border-purple-100">
                                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Measurement History</h3>
                                <p className="text-gray-600 text-sm mb-4">
                                    Browse all recorded measurements and data
                                </p>
                                <Link to={`/baby/${babyId}/growth/tracking`}>
                                    <PrimaryButton variant="primary" size="sm">
                                        View History
                                    </PrimaryButton>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Get Started Message if no data */}
                {measurements.length === 0 && (
                    <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Start Tracking {baby.baby.name}'s Growth</h3>
                            <p className="text-gray-600 mb-4">
                                    Add your first measurement to start tracking growth with WHO percentile charts.
                            </p>
                            <PrimaryButton variant="add" onClick={handleAddMeasurement}>
                                Add First Measurement
                            </PrimaryButton>
                        </div>
                    </div>  
                )}
            </div>
        </div>
    );
};
export default BabyProfile;
