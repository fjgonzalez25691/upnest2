// src/pages/BabyProfile.jsx
// Baby profile page: displays baby baseline data, handles edits and orchestrates percentile recalculation polling.

import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getBabyById, updateBaby, deleteBaby } from "../../services/babyApi";
import { getGrowthData, getGrowthMeasurement } from "../../services/growthDataApi";
import PrimaryButton from "../../components/PrimaryButton";
import BabyProfileForm from "../../components/babycomponents/BabyProfileForm";
import { usePolling } from "../../hooks/usePolling";

// Utility comparator with numeric tolerance for percentile values (avoids noisy float diffs)
 function comparePercentiles(persisted = {}, expected = {}, eps = 0.01) {
    const keys = ["weight", "height", "headCircumference"];
    return keys.every(k => {
        const aRaw = persisted?.[k];
        const bRaw = expected?.[k];
        if (aRaw == null && bRaw == null) return true;
        const a = parseFloat(aRaw ?? 0);
        const b = parseFloat(bRaw ?? 0);
        if (Number.isNaN(a) && Number.isNaN(b)) return true;
        return Math.abs(a - b) < eps;
    });
}

const BabyProfile = () => {
    // Minimum polling/spinner runtime before allowing completion (ms)
    const MIN_POLL_DURATION_MS = 2000;

    const { babyId } = useParams();
    const [baby, setBaby] = useState(null);
    const [measurements, setMeasurements] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editMode, setEditMode] = useState(false);
    const navigate = useNavigate();
    // Polling coordination flags: keep separate booleans so modes don't interfere
    const [waitingForBirth, setWaitingForBirth] = useState(false);
    const [waitingForFull, setWaitingForFull] = useState(false);
    const isRecalculating = waitingForBirth || waitingForFull;

    // Start timestamps for each polling to enforce a minimum window
    const [birthPollStartedAt, setBirthPollStartedAt] = useState(null);
    const [fullPollStartedAt, setFullPollStartedAt] = useState(null);

    // Expected target data for each polling mode (isolated to prevent cross‑contamination between birth/full flows)
    const [expectedBirthPercentiles, setExpectedBirthPercentiles] = useState(null); // object { weight, height, headCircumference }
    const [expectedFullMeasurements, setExpectedFullMeasurements] = useState(null); // array of measurements with calculatedPercentiles

    // console.log("🔍 BabyProfile mounted with babyId:", babyId);

    

    // Polling hook: birth-only recalculation
    // Design: we only start when server responded with mode 'birth-only' and we have a target expectedBirthPercentiles set.
    const birthPolling = usePolling(
        async () => {
            const birthDataId = baby?.baby?.birthDataId;
            return birthDataId ? await getGrowthMeasurement(birthDataId) : null;
        },
        { 
            interval: 2000,
            enabled: waitingForBirth,
            maxRetries: 10,
            backoffFactor: 1.5,
            jitter: true,
            stopOnError: false,
            pauseOnHidden: true,
            stopCondition: (data) => {
                // Ensure minimum polling/spinner window (see MIN_POLL_DURATION_MS)
                if (!birthPollStartedAt || (Date.now() - birthPollStartedAt) < MIN_POLL_DURATION_MS) {
                    return false;
                }
                if (!data || !expectedBirthPercentiles) return false;
                const birthPersistedPercentiles = data.percentiles || {};
                const allMatch = comparePercentiles(birthPersistedPercentiles, expectedBirthPercentiles);
                console.log("🔍 Birth polling check", { birthPersisted: birthPersistedPercentiles, birthExpected: expectedBirthPercentiles, allMatch });
                if (allMatch) console.log("✅ Birth percentiles match calculated ones!");
                return allMatch;
            },
            onSuccess: (data) => {
                console.log("✅ Polling success - updated birth measurements:", data);
                setMeasurements(prev => [...prev, data]);
                setWaitingForBirth(false);
                setExpectedBirthPercentiles(null);
                setBirthPollStartedAt(null);
                setEditMode(false); // Exit edit mode when birth recalculation completes
            },
            onError: (err) => {
                console.error("❌ Polling error:", err);
                setWaitingForBirth(false);
                setExpectedBirthPercentiles(null);
                setBirthPollStartedAt(null);
            }
        }

    );

    // Polling hook: full recalculation (all measurements)
    // NOTE: This is a safety net; backend already does synchronous recompute, but retained while feature stabilizes.
    const fullPolling = usePolling(
        async () => {
            return await getGrowthData(babyId);
        },
        { 
            interval: 2000,
            enabled: waitingForFull,
            maxRetries: 15,
            backoffFactor: 1.5,
            jitter: true,
            stopOnError: false,
            pauseOnHidden: true,
            stopCondition: (data) => {
                // Ensure minimum polling/spinner window (see MIN_POLL_DURATION_MS)
                if (!fullPollStartedAt || (Date.now() - fullPollStartedAt) < MIN_POLL_DURATION_MS) {
                    return false;
                }
                // Basic type validation
                if (!Array.isArray(data) || !Array.isArray(expectedFullMeasurements)) return false;

                const requiredKeys = ["weight", "height", "headCircumference"];

                // Fast map for O(1) access by dataId
                const persistedMap = new Map(data.map(m => [m.dataId, m]));

                let matchedCount = 0;
                let missingMeasurements = 0;
                let mismatchDetails = [];
                let missingKeysDetails = [];

                for (const expected of expectedFullMeasurements) {
                    const persisted = persistedMap.get(expected.dataId);
                    if (!persisted) {
                        missingMeasurements++;
                        mismatchDetails.push({ dataId: expected.dataId, reason: 'missing measurement in DB' });
                        continue; // no break: keep full per-tick logging
                    }

                    const persistedP = persisted.percentiles || {};
                    const expectedP = expected.calculatedPercentiles || expected.percentiles || {};
                    console.log("🔍 Comparing measurement", { persisted: persistedP, expected: expectedP });

                    // Verify presence of required keys when they exist in expected
                    let keysOk = true;
                    for (const k of requiredKeys) {
                        const expVal = expectedP[k];
                        if (expVal != null && typeof expVal !== 'undefined') {
                            const dbVal = persistedP[k];
                            if (dbVal == null || typeof dbVal === 'undefined') {
                                keysOk = false;
                                missingKeysDetails.push({ dataId: expected.dataId, key: k, expected: expVal, persisted: dbVal });
                            }
                        }
                    }
                    if (!keysOk) continue;

                    const match = comparePercentiles(persistedP, expectedP);
                    if (!match) {
                        // Capture numeric differences per key
                        const diffs = requiredKeys.reduce((acc, k) => {
                            const e = expectedP[k];
                            const p = persistedP[k];
                            if (e != null && p != null) {
                                const diff = Math.abs(parseFloat(p) - parseFloat(e));
                                if (diff >= 0.01) acc[k] = { expected: e, persisted: p, diff };
                            }
                            return acc;
                        }, {});
                        mismatchDetails.push({ dataId: expected.dataId, diffs });
                        continue;
                    }

                    matchedCount++;
                }

                const allExpected = expectedFullMeasurements.length;
                const allMatch = matchedCount === allExpected && missingMeasurements === 0 && missingKeysDetails.length === 0 && mismatchDetails.length === 0;

                console.log("🔎 Full polling tick", {
                    persistedCount: data.length,
                    expectedCount: allExpected,
                    matchedCount,
                    missingMeasurements,
                    missingKeys: missingKeysDetails,
                    mismatches: mismatchDetails,
                    done: allMatch
                });

                if (allMatch) console.log("✅ All measurements match calculated percentiles (full recalculation complete)");
                return allMatch;
            },
            onSuccess: (data) => {
                console.log("✅ Full polling success - all measurements updated:", data);
                setMeasurements(data);
                setWaitingForFull(false);
                setExpectedFullMeasurements(null);
                setFullPollStartedAt(null);
                setEditMode(false); // Exit edit mode when full recalculation completes
            },
            onError: (err) => {
                console.error("❌ Full polling error:", err);
                setWaitingForFull(false);
                setExpectedFullMeasurements(null);
                setFullPollStartedAt(null);
            }
        }
    );

    // Unified data loading (idempotent) – batches baby + growth data fetches
    const loadData = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            setError("");

            const [babyData, growthData] = await Promise.all([
                getBabyById(babyId),
                getGrowthData(babyId),
            ]);


            const birthDataId = babyData.baby.birthDataId;
            const growthDataBirth = await getGrowthMeasurement(birthDataId); 
            setBaby(babyData);
            setMeasurements(growthData);                

            console.log("✅ Baby and growth data loaded:", { babyData, growthData, growthDataBirth });

            return { baby: babyData, measurements: growthData, birthMeasurements: growthDataBirth };

        } catch (err) {
            console.error("Error loading data:", err);
            setError(err.message || "Failed to load baby profile");
            return null;
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [babyId]);

    // Initial load
    useEffect(() => {
        if (babyId) {
            loadData();
        }
    }, [babyId, loadData]);

    // Reset polling states if babyId changes (avoid stale timers referencing previous baby context)
    const resertPollingStates = useCallback(() => {
        try {
            birthPolling.stop();
            birthPolling.reset();
        } catch (e) {
            console.warn("⚠️ Unable to reset birth polling:", e);
        }
        try {
            fullPolling.stop();
            fullPolling.reset();
        } catch (e) {
            console.warn("⚠️ Unable to reset full polling:", e);
        }
        setWaitingForBirth(false);
        setWaitingForFull(false);
        setExpectedBirthPercentiles(null);
        setExpectedFullMeasurements(null);
        setBirthPollStartedAt(null);
        setFullPollStartedAt(null);
    }, [birthPolling, fullPolling]);

    const handleSave = async (updatedBabyData) => {
        try {
            setError("");
            // Ensure polling related state is clean before starting a new save flow (avoid mixed expected targets)
            resertPollingStates();

            // Build minimal diff payload (optimizes network + avoids unintended recompute triggers)
            const original = baby?.baby || {};
            const allKeys = [
                'name',
                'dateOfBirth',
                'gender',
                'premature',
                'gestationalWeek',
                'birthWeight',
                'birthHeight',
                'headCircumference'
            ];
            console.log("🔍 Original baby data:", original);
            const diffPayload = {};

            for (const k of allKeys) {
                if (k in updatedBabyData) {
                    const newVal = updatedBabyData[k];
                    const oldVal = original[k];
                    const normalizedNew = typeof newVal === 'number' ? newVal : (newVal === '' ? undefined : newVal);
                    const normalizedOld = typeof oldVal === 'number' ? oldVal : (oldVal === '' ? undefined : oldVal);
                    if (JSON.stringify(normalizedNew) !== JSON.stringify(normalizedOld)) {
                        diffPayload[k] = newVal;
                    }
                }
            }

            if (Object.keys(diffPayload).length === 0) {
                console.log('ℹ️ No effective changes detected; aborting save.');
                setEditMode(false);
                return;
            }

            console.log("🔍 Saving changes:", diffPayload);

            // Persist changes (server chooses recalculation mode deterministically)
            const response = await updateBaby(babyId, diffPayload, { syncRecalc: true });

            if (response?.baby) {
                setBaby({ baby: response.baby });
            } else {
                // Update local snapshot to reflect form changes immediately
                setBaby(prev => ({ baby: { ...prev.baby, ...diffPayload }}));
            }
            
            switch (response.mode) {
                case 'birth-only':
                    // Sync local baby state so next edit diff calculation uses fresh baseline
                    if (response?.baby) {
                        setBaby({ baby: response.baby });
                    }
                    setExpectedBirthPercentiles(response.birthPercentiles);
                    setWaitingForBirth(true);
                    setBirthPollStartedAt(Date.now());
                    console.log("ℹ️ Waiting for birth measurements to be recalculated in the database...", {
                        calculated: response.birthPercentiles,
                        mode: response.mode
                    }); 
                    break;

                case 'full':
                    console.log("🔍 Full recalculation triggered, setting up polling...", response.measurements);
                    // Sync baby baseline immediately (gender/dateOfBirth changes affect recompute scope)
                    if (response?.baby) {
                        setBaby({ baby: response.baby });
                    }
                    setExpectedFullMeasurements(response.measurements);
                    setWaitingForFull(true);
                    setFullPollStartedAt(Date.now());
                    console.log("ℹ️ Waiting for all measurements to be recalculated in the database...", {
                        calculatedCount: response.measurements?.length,
                        mode: response.mode
                    });
                    break;
                    
                case 'none':
                    // Direct update without recompute
                    if (response?.baby?.babyId) {
                        setBaby({ baby: response.baby });
                        console.log("✅ Baby profile updated successfully (no recalc needed):", response);
                    }
                    break;
                    
                default:
                    console.log("ℹ️ Unknown mode:", response.mode);
                    break;
            }

            console.log("✅ Baby profile updated successfully:", response);            

            // Only exit edit mode if no recalculation is happening
            if (response.mode === 'none') {
                setEditMode(false);
            }

        } catch (err) {
            console.error("❌ Error updating baby profile:", err);
            setError(err.message || "Failed to update baby profile. Please try again.");
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

    // Loading skeleton state - spinner with gradient background
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

    // Error boundary state (basic inline handling)
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
        <>
            {/* Main content */}
            <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 ${isRecalculating ? "pointer-events-none select-none" : ""}`}>
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

                    {/* Baby Profile Form */}
                    <div className="mb-8">
                        <BabyProfileForm
                            baby={baby?.baby}
                            isEditable={editMode}
                            // Show recalculation banner while waiting for backend consistency
                            isRecalculating={isRecalculating}
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
                            <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-center sm:justify-between gap-3 mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">Growth Tracking</h2>
                                <Link
                                    to={`/baby/${babyId}/growth/tracking`}
                                    state={{
                                        babyName: baby.baby.name,
                                        birthDate: baby.baby.dateOfBirth,
                                        prevMeasurements: measurements
                                    }}
                                >
                                    <PrimaryButton variant="primary">
                                        View Growth Dashboard
                                    </PrimaryButton>
                                </Link>
                            </div>

                            {/* Growth Quick Actions */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Charts card */}
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
                                    <div className="flex justify-center">
                                        <Link
                                            to={`/baby/${babyId}/charts`}
                                            state={{ babyName: baby.baby.name, birthDate: baby.baby.dateOfBirth, gender: baby.baby.gender, prevMeasurements: measurements }}
                                        >
                                            <PrimaryButton variant="primary">
                                                View Charts
                                            </PrimaryButton>
                                        </Link>
                                    </div>
                                </div>

                                {/* Add Data card */}
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
                                    <div className="flex justify-center">
                                        <PrimaryButton variant="add" onClick={handleAddMeasurement}>
                                            Add Data
                                        </PrimaryButton>
                                    </div>
                                </div>

                                {/* History card */}
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
                                    <div className="flex justify-center">
                                        <Link
                                            to={`/baby/${babyId}/growth/tracking`}
                                            state={{ babyName: baby.baby.name, birthDate: baby.baby.dateOfBirth, prevMeasurements: measurements }}
                                        >
                                            <PrimaryButton variant="primary">
                                                View History
                                            </PrimaryButton>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Empty state message */}
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

            {/* Percentile Recalculation Overlay */}
            {(waitingForBirth || waitingForFull) && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-md"
                    role="alert"
                    aria-busy="true"
                    aria-live="assertive"
                >
                    <div className="bg-white/90 backdrop-blur-sm shadow-2xl rounded-3xl p-8 border border-white/30 max-w-md w-full text-center transform animate-pulse">
                        {/* Modern animated loader */}
                        <div className="mb-6 flex justify-center">
                            <div className="relative">
                                {/* Outer rotating ring with gradient effect */}
                                <div className="w-16 h-16 rounded-full animate-spin">
                                    <div className="w-full h-full rounded-full border-4 border-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-border"></div>
                                    <div className="absolute inset-1 bg-white rounded-full"></div>
                                </div>
                                {/* Inner pulsing core */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-ping"></div>
                                </div>
                                {/* Floating particles */}
                                <div className="absolute -inset-6">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce absolute top-0 left-1/2 transform -translate-x-1/2 opacity-75" style={{animationDelay: '0s'}}></div>
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce absolute top-1/2 right-0 transform -translate-y-1/2 opacity-75" style={{animationDelay: '0.2s'}}></div>
                                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce absolute bottom-0 left-1/2 transform -translate-x-1/2 opacity-75" style={{animationDelay: '0.4s'}}></div>
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce absolute top-1/2 left-0 transform -translate-y-1/2 opacity-75" style={{animationDelay: '0.6s'}}></div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Recalculating Percentiles
                            </h2>
                            <div className="h-1 w-32 mx-auto bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                        </div>
                        
                        <p className="text-gray-700 text-sm mt-5 leading-relaxed font-medium">
                            {waitingForFull && !waitingForBirth && 'Processing all measurements. Please wait for completion to ensure percentiles are updated.'}
                            {waitingForBirth && !waitingForFull && 'Updating birth percentiles. One moment...'}
                            {waitingForBirth && waitingForFull && 'Updating percentiles (birth and all measurements)...'}
                        </p>
                        
                        <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-500">
                            <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span>Please don't close this tab or navigate away</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
export default BabyProfile;
