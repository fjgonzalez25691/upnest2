// src/pages/BabyProfile.jsx
// Baby profile page showing detailed information and growth tracking
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getBabyById } from "../services/babyApi";
import PrimaryButton from "../components/PrimaryButton";
import BabyProfileForm from "../components/BabyProfileForm";

const BabyProfile = () => {
    const { babyId } = useParams();
    const [baby, setBaby] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

    const calculateAge = (dateOfBirth) => {
        const today = new Date();
        const birth = new Date(dateOfBirth);
        const diffTime = Math.abs(today - birth);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const months = Math.floor(diffDays / 30.44);
        const days = Math.floor(diffDays % 30.44);

        if (months > 0) {
            return `${months} months and ${days} days old`;
        }
        return `${days} days old`;
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
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {baby?.baby.name}'s Profile
                    </h1>
                    <p className="text-gray-600 mt-2">{calculateAge(baby?.baby.dateOfBirth)}</p>
                </div>

                {/* Baby Profile Form Component */}
                <div className="mb-8">
                    <BabyProfileForm baby={baby?.baby} isEditable={false} />
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 border border-blue-100">
                    <div className="flex gap-4">
                        <PrimaryButton variant="blue" className="flex-1">
                            Edit Profile
                        </PrimaryButton>
                        <Link to={`/add-growth-data/${baby.babyId}`} className="flex-1">
                            <PrimaryButton variant="green" className="w-full">
                                Add Growth Data
                            </PrimaryButton>
                        </Link>
                        <PrimaryButton variant="red" className="flex-1">
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
                            Add your first measurement to start tracking {baby.name}'s growth with WHO percentile charts.
                        </p>
                        <Link to={`/add-growth-data/${baby.babyId}`}>
                            <PrimaryButton variant="green">Add First Measurement</PrimaryButton>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BabyProfile;