// src/pages/BabyProfile.jsx
// Baby profile page showing detailed information and growth tracking
// Updated (Option A): remove percentile polling. The backend PATCH returns immediate recalculation modes:
//  * full       -> all measurements with fresh percentiles
//  * birth-only -> single (possibly synthetic) birth measurement with birth percentiles
//  * none       -> no recalculation; fallback to existing data
// We pass prevMeasurements via navigation state to render charts instantly without P-- flicker.

import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getBabyById, updateBaby, deleteBaby } from "../../services/babyApi";
import { getGrowthData } from "../../services/growthDataApi";
import PrimaryButton from "../../components/PrimaryButton";
import BabyProfileForm from "../../components/babycomponents/BabyProfileForm";
import usePercentilePolling from "../../hooks/usePercentilePolling";

const BabyProfile = () => {
    const { babyId } = useParams();
    const [baby, setBaby] = useState(null);
    const [measurements, setMeasurements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);  // Saving PATCH request in flight
    const [waitingRecalc, setWaitingRecalc] = useState(false); // Waiting for percentile recomputation confirmation (updatedAt change)
    const navigate = useNavigate();

    // Waiters to confirm DynamoDB Stream has applied changes (updatedAt changed)
    const { waitForBirthRecalc, waitForAllRecalc } = usePercentilePolling(babyId, {
        intervalMs: 1000,
        maxAttempts: 12, // ~12s timeout
        debug: false
    });

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

            // Previous snapshot to detect updatedAt changes
            const snapshotMap = measurements.reduce((acc, m) => {
                if (m?.dataId && m.updatedAt) acc[m.dataId] = m.updatedAt;
                return acc;
            }, {});
            const prevBirthDate = baby?.baby?.dateOfBirth;
            const prevBirthUpdatedAt = measurements.find(m => m.measurementDate === prevBirthDate)?.updatedAt;

            // Decide if backend should request synchronous recalculation.
            // Backend only evaluates recalculation branches when syncRecalc=true, so we include
            // structural changes (gender/dateOfBirth) OR birth measurement field changes.
            const original = baby?.baby || {};
            const allKeys = ['name','dateOfBirth','gender','premature','gestationalWeek','birthWeight','birthHeight','headCircumference'];
            // Build diff object: only send fields that actually changed (strict inequality)
            const diffPayload = {};
            for (const k of allKeys) {
                if (k in updatedBabyData) {
                    const newVal = updatedBabyData[k];
                    const oldVal = original[k];
                    // Normalize number/string comparison (e.g., "3200" vs 3200)
                    const normalizedNew = typeof newVal === 'number' ? newVal : (newVal === '' ? undefined : newVal);
                    const normalizedOld = typeof oldVal === 'number' ? oldVal : (oldVal === '' ? undefined : oldVal);
                    if (JSON.stringify(normalizedNew) !== JSON.stringify(normalizedOld)) {
                        diffPayload[k] = newVal;
                    }
                }
            }
            const structuralKeys = ['gender', 'dateOfBirth'];
            const birthKeys = ['birthWeight', 'birthHeight', 'headCircumference'];
            const changedStructural = structuralKeys.filter(k => k in diffPayload);
            const changedBirth = birthKeys.filter(k => k in diffPayload);
            const needsSync = changedStructural.length > 0 || changedBirth.length > 0;
            const changedBirthSet = new Set(changedBirth);
            if (Object.keys(diffPayload).length === 0) {
                console.log('ℹ️ No effective changes detected; aborting save.');
                setSaving(false);
                setEditMode(false);
                return;
            }

            console.log("🔍 Saving baby data. diff keys=", Object.keys(diffPayload), "syncRecalc=", needsSync);

            // Save (send only diff fields)
            const response = await updateBaby(babyId, diffPayload, { syncRecalc: needsSync });
            
            const mode = response?.mode; // 'full' | 'birth-only' | 'none' | undefined (legacy)

            if (mode === 'full') {
                if (response.measurements) {
                    setMeasurements(response.measurements);
                    console.log(`🔍 FULL mode: ${response.measurements.length} measurements (recalculated).`);
                }
                if (response.baby) setBaby({ baby: response.baby });
                // Wait for confirmation: ALL measurements have a different updatedAt + valid percentiles
                setWaitingRecalc(true);
                try {
                    const res = await waitForAllRecalc({ snapshotMap });
                    if (res.success) {
                        setMeasurements(res.measurements);
                        console.log(`✅ Confirmed FULL recalc (attempts=${res.attempts}).`);
                    } else {
                        console.warn(`⚠️ Timeout waiting for FULL recalc (attempts=${res.attempts}).`);
                    }
                } finally {
                    setWaitingRecalc(false);
                }
            } else if (mode === 'birth-only') {
                if (response.baby) setBaby({ baby: response.baby });
                const birthItem = response.measurements?.[0];
                if (birthItem) {
                    const dob = (response.baby?.dateOfBirth) || (baby?.baby?.dateOfBirth);
                    let next = [...measurements];
                    const idx = next.findIndex(m =>
                        (dob && m.measurementDate === dob) ||
                        (birthItem.dataId && m.dataId === birthItem.dataId)
                    );
                    if (idx >= 0) next[idx] = { ...next[idx], ...birthItem }; else next.push(birthItem);
                    next.sort((a, b) => (b.measurementDate || '').localeCompare(a.measurementDate || ''));
                    setMeasurements(next);
                    console.log('🔍 BIRTH-ONLY mode: merged birth measurement.');
                    // Wait only for birth measurement (updatedAt changes + percentiles present)
                    if (prevBirthDate) {
                        setWaitingRecalc(true);
                        try {
                            const res = await waitForBirthRecalc({ birthDate: prevBirthDate, prevUpdatedAt: prevBirthUpdatedAt });
                            if (res.success) {
                                // Reemplazar lista completa para asegurar persistencia final
                                setMeasurements(res.measurements);
                                console.log(`✅ Confirmed BIRTH recalc (attempts=${res.attempts}).`);
                            } else {
                                console.warn(`⚠️ Timeout waiting for BIRTH recalc (attempts=${res.attempts}).`);
                            }
                        } finally {
                            setWaitingRecalc(false);
                        }
                    }
                }
            } else if (mode === 'none') {
                if (response.baby) setBaby({ baby: response.baby }); else await loadData(false);
                // Fallback: if birth fields changed but backend still returned none (legacy behavior), wait for birth recalculation.
                if (changedBirthSet.size > 0 && prevBirthDate) {
                    console.log('⚠️ Backend returned mode=none but birth fields changed; initiating fallback birth wait.');
                    setWaitingRecalc(true);
                    try {
                        const res = await waitForBirthRecalc({ birthDate: prevBirthDate, prevUpdatedAt: prevBirthUpdatedAt });
                        if (res.success) {
                            setMeasurements(res.measurements);
                            console.log(`✅ Fallback birth recalc confirmed (attempts=${res.attempts}).`);
                        } else {
                            console.warn(`⚠️ Timeout in fallback birth wait (attempts=${res.attempts}).`);
                        }
                    } finally {
                        setWaitingRecalc(false);
                    }
                } else {
                    console.log('🔍 NONE mode: no recalculation performed.');
                }
            } else {
                await loadData(false); // fallback legacy
                console.log('ℹ️ Fallback: reloaded data (no mode provided).');
            }
            // Close edit mode only AFTER any waiting logic finishes
            setEditMode(false);

            console.log("🔍 Baby profile updated successfully");

        } catch (err) {
            console.error("Error updating baby profile:", err);
            setError("Failed to update baby profile. Please try again.");
            setSaving(false);
        } finally {
            setSaving(false); // ensure spinner ends
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
                        isRecalculating={saving || waitingRecalc}  // Show spinner while saving or confirming recalculation
                        onSave={handleSave}
                        onAdd={handleAddMeasurement}
                        onCancel={handleCancel}
                        onEdit={() => setEditMode(true)}
                        onDelete={handleDelete}
                    />
                    {waitingRecalc && (
                        <div className="mt-4 p-3 rounded-md bg-blue-50 border border-blue-200 text-sm text-blue-700 flex items-center gap-2">
                            <svg className="w-5 h-5 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25" />
                                <path d="M4 12a8 8 0 018-8" strokeWidth="4" className="opacity-75" />
                            </svg>
                            Confirming updated percentiles...
                        </div>
                    )}
                </div>

                {/* Growth Tracking Section */}
                {measurements.length > 0 && (
                    <div className="bg-white rounded-3xl shadow-lg p-8 border border-green-100">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Growth Tracking</h2>
                            <Link
                                to={waitingRecalc ? '#' : `/baby/${babyId}/growth/tracking`}
                                onClick={e => { if (waitingRecalc) e.preventDefault(); }}
                                state={{
                                    babyName: baby.baby.name,
                                    birthDate: baby.baby.dateOfBirth,
                                    prevMeasurements: measurements
                                }}
                            >
                                <PrimaryButton variant="primary" className={`mt-4 sm:mt-0 ${waitingRecalc ? 'opacity-60 pointer-events-none' : ''}`} disabled={waitingRecalc}>
                                    {waitingRecalc ? 'Waiting recalc…' : 'View Growth Dashboard'}
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
                                <Link
                                    to={waitingRecalc ? '#' : `/baby/${babyId}/growth/tracking`}
                                    onClick={e => { if (waitingRecalc) e.preventDefault(); }}
                                    state={{ babyName: baby.baby.name, birthDate: baby.baby.dateOfBirth, prevMeasurements: measurements }}
                                >
                                    <PrimaryButton variant="primary" size="sm" disabled={waitingRecalc} className={waitingRecalc ? 'opacity-60 pointer-events-none' : ''}>
                                        {waitingRecalc ? 'Waiting…' : 'View Charts'}
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
                                <Link
                                    to={waitingRecalc ? '#' : `/baby/${babyId}/growth/tracking`}
                                    onClick={e => { if (waitingRecalc) e.preventDefault(); }}
                                    state={{ babyName: baby.baby.name, birthDate: baby.baby.dateOfBirth, prevMeasurements: measurements }}
                                >
                                    <PrimaryButton variant="primary" size="sm" disabled={waitingRecalc} className={waitingRecalc ? 'opacity-60 pointer-events-none' : ''}>
                                        {waitingRecalc ? 'Waiting…' : 'View History'}
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
