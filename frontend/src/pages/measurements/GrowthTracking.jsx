// src/pages/measurements/GrowthTracking.jsx
// Main growth tracking page showing charts and recent measurements for a specific baby

import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { getGrowthData, deleteGrowthData } from "../../services/growthDataApi";
import PrimaryButton from "../../components/PrimaryButton";
import GrowthDataList from "../../components/measuremencomponents/GrowthDataList";

const GrowthTracking = () => {
    const { babyId } = useParams();
    const [measurements, setMeasurements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchMeasurements = async () => {
            setLoading(true);
            setError("");
            try {
                const data = await getGrowthData(babyId);
                setMeasurements(Array.isArray(data) ? data : []);
            } catch (err) {
                setError("Failed to load measurements.");
            } finally {
                setLoading(false);
            }
        };
        if (babyId) fetchMeasurements();
    }, [babyId]);

    const navigate = useNavigate();
    const location = useLocation();
    const babyName = location.state?.babyName || "Baby";

    const handleEdit = (measurement) => {
        console.log("Edit measurement:", measurement);
        navigate(`/edit-measurement/${measurement.dataId}`);
    };

    const handleDelete = async (measurement) => {
        if (!window.confirm("Are you sure you want to delete this measurement? This action cannot be undone.")) {
            return;
        }
        try {
            await deleteGrowthData(measurement.dataId);
            setMeasurements((prev) => prev.filter((m) => m.dataId !== measurement.dataId));
        } catch (err) {
            alert("Failed to delete measurement. Please try again.");
            console.error(err);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading measurements...</div>;
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-600">
                {error}
                <br />
                <PrimaryButton onClick={() => window.location.reload()}>Retry</PrimaryButton>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Link to={`/baby/${babyId}`} className="text-blue-600 hover:text-blue-800 flex items-center mb-4 transition-colors">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Profile
                    </Link>
                </div>
                <div className="bg-white rounded-3xl shadow-lg p-8 border border-blue-100">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold">{babyName}'s Growth Measurements</h1>
                    </div>
                    {measurements.length === 0 ? (
                        <div className="text-center text-gray-500">No measurements found for this baby.</div>
                    ) : (
                        <GrowthDataList
                            measurements={measurements}
                            loading={loading}
                            error={error}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default GrowthTracking;
