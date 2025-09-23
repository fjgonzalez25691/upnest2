// src/pages/BabyProfile.jsx
// Baby profile page with targeted polling based on change type:
// - Structural changes (gender/dateOfBirth): poll all measurements
// - Birth measurement changes: poll specific birth measurement
// - Non-critical changes: no polling needed

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getBabyById, updateBaby, deleteBaby } from "../../services/babyApi";
import { getGrowthData, getGrowthMeasurement } from "../../services/growthDataApi";
import PrimaryButton from "../../components/PrimaryButton";
import BabyProfileForm from "../../components/babycomponents/BabyProfileForm";
import { usePolling } from "../../hooks/usePolling";

const BabyProfile = () => {
    const { babyId } = useParams();
    const [baby, setBaby] = useState(null);
    const [measurements, setMeasurements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [waitingRecalc, setWaitingRecalc] = useState(false);
    const [pollingError, setPollingError] = useState(null);
    const navigate = useNavigate();
    
    // References to store current state for polling stop conditions
    const prevUpdatedAtRef = useRef(null);
    const measurementSnapshotsRef = useRef({});
    const initialBirthMeasurementRef = useRef(null);
    const changedBirthFieldsRef = useRef([]);

    // Check if measurement has valid percentiles (accept numbers or numeric strings)
    const hasValidPercentiles = useCallback((measurement) => {
        const p = measurement?.percentiles;
        if (!p) return false;
        const toNumber = (val) => {
            if (val === null || val === undefined) return null;
            if (typeof val === 'number') return Number.isFinite(val) ? val : null;
            if (typeof val === 'string') {
                const cleaned = val.trim().replace('%', '').replace(',', '.');
                const n = Number.parseFloat(cleaned);
                return Number.isNaN(n) ? null : n;
            }
            return null;
        };
        return Object.values(p).some(v => toNumber(v) !== null);
    }, []);

    // Check if specific percentiles changed for modified measurements
    const hasChangedPercentiles = useCallback((currentMeasurement, initialMeasurement, changedFields) => {
        // Normalizador robusto: acepta number | string (con comas/pct) | null/undefined
        const toNumber = (val) => {
            if (val === null || val === undefined) return null;
            if (typeof val === 'number') return Number.isFinite(val) ? val : null;
            if (typeof val === 'string') {
                const cleaned = val.trim().replace('%', '').replace(',', '.');
                const n = Number.parseFloat(cleaned);
                return Number.isNaN(n) ? null : n;
            }
            return null;
        };

        const fieldMapping = {
            birthWeight: 'weight',
            birthHeight: 'height',
            headCircumference: 'headCircumference',
        };

        const currentP = currentMeasurement?.percentiles ?? null;
        const initialP = initialMeasurement?.percentiles ?? null;

        if (!currentP || !changedFields?.length) return false;

        // Recorremos solo los campos de nacimiento que cambiaron y exigimos que su percentil asociado:
        // - sea válido (number)
        // - y sea distinto al inicial (si el inicial existía); si el inicial era nulo, basta con que ahora sea válido
        for (const field of changedFields) {
            const pField = fieldMapping[field];
            if (!pField) continue; // campo no mapeado a percentil

            const cur = toNumber(currentP[pField]);
            const ini = toNumber(initialP ? initialP[pField] : null);

            // Si el percentil actual no es válido aún, seguimos esperando
            if (cur === null) {
                return false;
            }

            // Si antes no había percentil (ini === null), con tenerlo ya válido damos por cambiado
            if (ini === null) continue;

            // Si existía, debe ser distinto (tolerancia 0.01)
            if (Math.abs(cur - ini) < 0.01) {
                return false;
            }
        }

        // Todos los campos cambiados tienen percentiles válidos y cambiados
        return true;
    }, []);

    // Polling for all measurements (structural changes)
    const allMeasurementsPolling = usePolling(
        async () => await getGrowthData(babyId),
        {
            interval: 1000,
            enabled: false,
            maxRetries: 15,
            stopOnError: false,
            stopCondition: (currentData, attempts) => {
                if (!currentData || !Array.isArray(currentData)) return false;
                
                const snapshots = measurementSnapshotsRef.current;
                const ids = Object.keys(snapshots || {});
                
                if (ids.length === 0) return true; // No baseline, accept any data
                
                let allUpdated = true;
                let allHavePercentiles = true;
                
                for (const id of ids) {
                    const m = currentData.find(x => x.dataId === id);
                    if (!m || !m.updatedAt) {
                        allUpdated = false;
                        break;
                    }
                    if (m.updatedAt === snapshots[id]) {
                        allUpdated = false; // Not updated yet
                    }
                    if (!hasValidPercentiles(m)) {
                        allHavePercentiles = false;
                    }
                }
                
                console.log(`🔍 All measurements polling attempt ${attempts}/15:`, {
                    allUpdated,
                    allHavePercentiles,
                    totalMeasurements: ids.length
                });
                
                // Stop if all have valid percentiles (most important)
                if (allHavePercentiles) {
                    console.log(`✅ All measurements have valid percentiles, stopping polling`);
                    return true;
                }
                
                // If all updated but no percentiles yet, wait more (max 10 extra attempts)
                if (allUpdated && attempts <= 10) {
                    console.log('🔄 All measurements updated, waiting for percentiles...');
                    return false;
                }
                
                // After waiting, stop anyway if all are updated
                if (allUpdated && attempts > 10) {
                    console.log('⏱️ All measurements updated but no percentiles after waiting, stopping');
                    return true;
                }
                
                return false;
            }
        }
    );

    // Polling for specific birth measurement with integrated stop condition
    const birthMeasurementPolling = usePolling(
        async () => {
            const birthDataId = baby?.baby?.birthDataId;
            if (!birthDataId) return null;
            return await getGrowthMeasurement(birthDataId);
        },
        {
            interval: 1000,
            enabled: false,
            maxRetries: 10,
            stopOnError: false,
            stopCondition: (currentData, attempts) => {
                if (!currentData) return false;
                
                const prevUpdatedAt = prevUpdatedAtRef.current;
                const initialMeasurement = initialBirthMeasurementRef.current;
                const changedFields = changedBirthFieldsRef.current;
                
                if (!prevUpdatedAt || !initialMeasurement || !changedFields.length) {
                    return true; // No baseline, accept any data
                }
                
                const hasChanged = currentData.updatedAt !== prevUpdatedAt;
                const hasChangedPercentilesForFields = hasChangedPercentiles(currentData, initialMeasurement, changedFields);
                
                console.log(`🔍 Intelligent birth polling attempt ${attempts}/10:`, {
                    currentUpdatedAt: currentData.updatedAt,
                    prevUpdatedAt,
                    hasChanged,
                    changedFields,
                    hasChangedPercentiles: hasChangedPercentilesForFields,
                    initialPercentiles: initialMeasurement.percentiles,
                    currentPercentiles: currentData.percentiles
                });
                
                // Stop if we have valid changed percentiles for modified fields (most important)
                if (hasChangedPercentilesForFields) {
                    console.log('✅ Birth measurement has valid changed percentiles for modified fields, stopping polling');
                    return true;
                }
                
                // If updatedAt changed but percentiles haven't updated for changed fields, wait more
                if (hasChanged && attempts <= 7) {
                    console.log('🔄 Birth measurement updatedAt changed, waiting for percentiles to update...');
                    return false;
                }
                
                // After several attempts with changed updatedAt, stop anyway
                if (hasChanged && attempts > 7) {
                    console.log('⏱️ Birth measurement updatedAt changed but percentiles not updated after waiting, stopping');
                    return true;
                }
                
                return false;
            }
        }
    );

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
            setPollingError(null);

            // 1. CAPTURE INITIAL STATE WITH PERCENTILES
            const initialMeasurementsSnapshot = measurements.reduce((acc, m) => {
                if (m?.dataId) {
                    acc[m.dataId] = {
                        updatedAt: m.updatedAt,
                        percentiles: m.percentiles ? { ...m.percentiles } : null,
                        birthWeight: m.measurements?.weight,
                        birthHeight: m.measurements?.height,
                        headCircumference: m.measurements?.headCircumference
                    };
                }
                return acc;
            }, {});
            
            const birthDataId = baby?.baby?.birthDataId;
            const initialBirthMeasurement = birthDataId ? 
                measurements.find(m => m.dataId === birthDataId) : null;

            console.log("🔍 Initial state captured:", {
                totalMeasurements: Object.keys(initialMeasurementsSnapshot).length,
                birthDataId,
                initialBirthData: initialBirthMeasurement ? {
                    updatedAt: initialBirthMeasurement.updatedAt,
                    percentiles: initialBirthMeasurement.percentiles,
                    measurements: {
                        birthWeight: initialBirthMeasurement.measurements?.weight,
                        birthHeight: initialBirthMeasurement.measurements?.height,
                        headCircumference: initialBirthMeasurement.measurements?.headCircumference
                    }
                } : null
            });

            // Build diff payload - only send changed fields
            const original = baby?.baby || {};
            const allKeys = ['name','dateOfBirth','gender','premature','gestationalWeek','birthWeight','birthHeight','headCircumference'];
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
                setSaving(false);
                setEditMode(false);
                return;
            }

            // Classify change types
            const structuralKeys = ['gender', 'dateOfBirth'];
            const birthKeys = ['birthWeight', 'birthHeight', 'headCircumference'];
            const changedStructural = structuralKeys.filter(k => k in diffPayload);
            const changedBirth = birthKeys.filter(k => k in diffPayload);
            const needsSync = changedStructural.length > 0 || changedBirth.length > 0;

            console.log("🔍 Change analysis:", {
                total: Object.keys(diffPayload),
                structural: changedStructural,
                birth: changedBirth,
                needsSync
            });

            // Save changes
            const response = await updateBaby(babyId, diffPayload, { syncRecalc: needsSync });
            const mode = response?.mode;

            console.log(`🔍 PATCH response mode: ${mode}`);

            // Update baby data
            if (response.baby) setBaby({ baby: response.baby });

            // 2. INTELLIGENT POLLING LOGIC
            if (changedStructural.length > 0) {
                // Structural changes affect all measurements
                if (response.measurements) {
                    setMeasurements(response.measurements);
                    console.log(`🔍 Structural change: ${response.measurements.length} measurements updated`);
                }
                
                if (mode === 'full' && Object.keys(initialMeasurementsSnapshot).length > 0) {
                    setWaitingRecalc(true);
                    
                    // Set reference for intelligent stop condition
                    measurementSnapshotsRef.current = Object.keys(initialMeasurementsSnapshot).reduce((acc, id) => {
                        acc[id] = initialMeasurementsSnapshot[id].updatedAt;
                        return acc;
                    }, {});
                    
                    console.log('🔍 Starting intelligent structural measurements polling...');
                    allMeasurementsPolling.start();
                    
                    // Wait for polling to finish
                    while (allMeasurementsPolling.isRunning) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    
                    const finalData = allMeasurementsPolling.data;
                    if (finalData && finalData.length > 0) {
                        setMeasurements(finalData);
                        console.log(`✅ All measurements updated (attempts=${allMeasurementsPolling.attempts})`);
                    } else {
                        console.warn(`⚠️ Structural polling finished without success (attempts=${allMeasurementsPolling.attempts})`);
                        setPollingError("Failed to confirm all measurements update");
                    }
                    setWaitingRecalc(false);
                }
                
            } else if (changedBirth.length > 0) {
                // Only birth measurement changes - intelligent percentile checking
                const birthItem = response.measurements?.[0];
                if (birthItem) {
                    // Update measurements with birth item
                    const dob = response.baby?.dateOfBirth || baby?.baby?.dateOfBirth;
                    let next = [...measurements];
                    const idx = next.findIndex(m =>
                        (dob && m.measurementDate === dob) ||
                        (birthItem.dataId && m.dataId === birthItem.dataId)
                    );
                    if (idx >= 0) next[idx] = { ...next[idx], ...birthItem };
                    else next.push(birthItem);
                    next.sort((a, b) => (b.measurementDate || '').localeCompare(a.measurementDate || ''));
                    setMeasurements(next);
                    
                    // Intelligent check: only verify percentiles changed for modified fields
                    const hasValidPercentiles = hasChangedPercentiles(birthItem, initialBirthMeasurement, changedBirth);
                    const hasUpdatedTimestamp = birthItem.updatedAt && 
                        birthItem.updatedAt !== initialBirthMeasurement?.updatedAt;
                    
                    console.log('🔍 Birth-only intelligent analysis:', {
                        changedFields: changedBirth,
                        hasValidPercentiles,
                        hasUpdatedTimestamp,
                        mode,
                        initialPercentiles: initialBirthMeasurement?.percentiles,
                        currentPercentiles: birthItem.percentiles
                    });
                    
                    if (!hasValidPercentiles || !hasUpdatedTimestamp) {
                        setWaitingRecalc(true);
                        
                        // Set references for intelligent stop condition  
                        prevUpdatedAtRef.current = initialBirthMeasurement?.updatedAt;
                        initialBirthMeasurementRef.current = initialBirthMeasurement;
                        changedBirthFieldsRef.current = changedBirth;
                        
                        console.log('🔍 Starting intelligent birth measurement polling...');
                        birthMeasurementPolling.start();
                        
                        // Wait for polling to finish
                        while (birthMeasurementPolling.isRunning) {
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                        
                        const finalData = birthMeasurementPolling.data;
                        if (finalData && finalData.updatedAt !== initialBirthMeasurement?.updatedAt) {
                            // Update specific measurement
                            setMeasurements(prev => {
                                const updated = [...prev];
                                const idx = updated.findIndex(m => m.dataId === finalData.dataId);
                                if (idx >= 0) updated[idx] = finalData;
                                return updated;
                            });
                            
                            console.log(`✅ Birth measurement updated (attempts=${birthMeasurementPolling.attempts})`);
                        } else {
                            console.log("datos iniciales:", initialBirthMeasurement, "datos finales:", finalData);
                            console.warn(`⚠️ Birth polling finished without success (attempts=${birthMeasurementPolling.attempts})`);
                            setPollingError("Failed to confirm birth measurement update");
                        }
                        setWaitingRecalc(false);
                    } else {
                        console.log('✅ Birth measurement already updated, no polling needed');
                    }
                }
                
            } else {
                // Non-critical changes only
                console.log('✅ Non-critical changes only, no polling needed');
                if (mode === 'none' || !response.measurements) {
                    await loadData(false); // Fallback refresh
                }
            }

            setEditMode(false);
            console.log("✅ Baby profile updated successfully");

        } catch (err) {
            console.error("❌ Error updating baby profile:", err);
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
                        isRecalculating={saving || waitingRecalc}  // Show spinner while saving or confirming recalculation
                        onSave={handleSave}
                        onAdd={handleAddMeasurement}
                        onCancel={handleCancel}
                        onEdit={() => setEditMode(true)}
                        onDelete={handleDelete}
                    />
                    {(waitingRecalc || pollingError) && (
                        <div className={`mt-4 p-3 rounded-md border text-sm flex items-center gap-2 ${
                            pollingError 
                                ? 'bg-red-50 border-red-200 text-red-700'
                                : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}>
                            {waitingRecalc && (
                                <svg className="w-5 h-5 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25" />
                                    <path d="M4 12a8 8 0 018-8" strokeWidth="4" className="opacity-75" />
                                </svg>
                            )}
                            {pollingError && (
                                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            )}
                            {pollingError || "Updating percentiles..."}
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
