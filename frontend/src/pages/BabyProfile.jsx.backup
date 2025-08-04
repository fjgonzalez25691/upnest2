// src/pages/BabyProfile.jsx
// Baby profile page showing detailed information and growth tracking
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getBabyById } from "../services/babyApi";
import { updateBaby } from "../services/babyApi";
import { deleteBaby } from "../services/babyApi";
import PrimaryButton from "../components/PrimaryButton";
import BabyProfileForm from "../components/BabyProfileForm";

const BabyProfile = () => {
    const { babyId } = useParams();
    const [baby, setBaby] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editMode, setEditMode] = useState(false)

    console.log("🔍 BabyProfile mounted with babyId:", babyId);

    useEffect(() => {
        const fetchBaby = async () => {
            try {
                setLoading(true);
                const babyData = await getBabyById(babyId);
                console.log("🔍 Fetched baby data:", babyData);
                setBaby(babyData);
            } catch (err) {
                console.error("Error fetching baby:", err);
                setError("Failed to load baby profile. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        if (babyId) {
            fetchBaby();
        }
    }, [babyId]);

    // Handle to save changes in edit mode
    const handleSave = async (updatedBaby) => {
        try {
            setLoading(true);
            // Call API to update baby profile
            const res = await updateBaby(babyId, updatedBaby);
            if (res.baby) {
                console.log("🔍 Baby profile updated successfully:", res.baby);
                setBaby({ baby: res.baby });
            } else {
                const babyData = await getBabyById(babyId);
                setBaby(babyData);
            }
            setEditMode(false);
        } catch (err) {
            console.error("Error saving baby profile:", err);
            setError("Failed to save changes. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Handle to cancel edit mode
    const handleCancel = () => {
        setEditMode(false);
        setError("");
    };

    // Handle to delete baby profile
    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this baby profile? This action cannot be undone.")) {
            try {
                setLoading(true);
                await deleteBaby(babyId);
                console.log("🔍 Baby profile deleted successfully");
                // Redirect to dashboard or show success message
                window.location.href = "/dashboard";
            } catch (err) {
                console.error("Error deleting baby profile:", err);
                setError("Failed to delete baby profile. Please try again.");
            } finally {
                setLoading(false);
            }
        }
    };

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

    if (error || !baby) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                        <p className="text-red-600 mb-4">{error || "Baby not found"}</p>
                        <Link to="/dashboard">
                            <PrimaryButton>Back to Dashboard</PrimaryButton>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
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
                        onSave={handleSave}
                        onCancel={() => handleCancel()}
                    />
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 border border-blue-100">
                    <div className="flex gap-4">
                        <PrimaryButton variant="edit" className="flex-1" onClick={() => setEditMode(true)}>
                            Edit Profile
                        </PrimaryButton>
                        <Link to={`/add-growth-data/${baby.babyId}`} className="flex-1">
                            <PrimaryButton variant="add" className="w-full">
                                Add Growth Data
                            </PrimaryButton>
                        </Link>
                        <PrimaryButton variant="danger" className="flex-1" onClick={handleDelete}>
                            Delete Profile
                        </PrimaryButton>
                    </div>
                </div>

                {/* Growth Data Section - Placeholder for future */}
                <div className="bg-white rounded-3xl shadow-lg p-8 border border-green-100">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Growth Tracking</h2>
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-3">Start Tracking Growth</h3>
                        <p className="text-gray-600 mb-6">
                            Add your first measurement to start tracking {baby.baby.name}'s growth with WHO percentile charts.
                        </p>
                        <Link to={`/add-growth-data/${baby.babyId}`}>
                            <PrimaryButton variant="add">Add First Measurement</PrimaryButton>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BabyProfile;