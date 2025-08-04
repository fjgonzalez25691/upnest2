// src/pages/GrowthTracking.jsx
// Main growth tracking page showing charts and recent measurements for a specific baby

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import GrowthChart from "../components/GrowthChart";
import GrowthDataList from "../components/GrowthDataList";
import PrimaryButton from "../components/PrimaryButton";
import { getBaby } from "../services/babyApi";
// import { getGrowthData, deleteGrowthData } from "../services/growthDataApi"; // TODO: Create this service

const GrowthTracking = () => {
    const { babyId } = useParams();
    const [baby, setBaby] = useState(null);
    const [measurements, setMeasurements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedChart, setSelectedChart] = useState("weight");

    useEffect(() => {
        fetchData();
    }, [babyId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");

            // Fetch baby data
            const babyData = await getBaby(babyId);
            setBaby(babyData);

            // TODO: Uncomment when growth data service is created
            // Fetch growth measurements
            // const growthData = await getGrowthData(babyId);
            // setMeasurements(Array.isArray(growthData) ? growthData : growthData?.data || []);

            // Mock data for now
            setMeasurements([
                {
                    dataId: "1",
                    measurementDate: "2024-01-15",
                    measurements: { weight: "5.2", height: "65.5", headCircumference: "42.1" },
                    notes: "Regular checkup",
                    measurementSource: "doctor",
                    createdAt: "2024-01-15T10:00:00Z"
                },
                {
                    dataId: "2", 
                    measurementDate: "2024-02-15",
                    measurements: { weight: "5.8", height: "68.0", headCircumference: "43.2" },
                    notes: "Home measurement",
                    measurementSource: "home",
                    createdAt: "2024-02-15T10:00:00Z"
                }
            ]);

        } catch (err) {
            console.error("Error fetching growth data:", err);
            setError("Failed to load growth tracking data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (measurement) => {
        // TODO: Navigate to edit page or open modal
        console.log("Edit measurement:", measurement);
    };

    const handleDelete = async (measurement) => {
        if (!window.confirm("Are you sure you want to delete this measurement?")) {
            return;
        }

        try {
            // TODO: Uncomment when service is created
            // await deleteGrowthData(measurement.dataId);
            setMeasurements(prev => prev.filter(m => m.dataId !== measurement.dataId));
        } catch (err) {
            console.error("Error deleting measurement:", err);
            setError("Failed to delete measurement. Please try again.");
        }
    };

    const handleAddMeasurement = () => {
        // TODO: Navigate to add measurement page
        console.log("Add new measurement for baby:", babyId);
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="h-96 bg-gray-200 rounded"></div>
                        <div className="h-96 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <div className="text-red-500 mb-4">
                        <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Data</h2>
                    <p className="text-red-700 mb-4">{error}</p>
                    <PrimaryButton onClick={fetchData} variant="danger">
                        Try Again
                    </PrimaryButton>
                </div>
            </div>
        );
    }

    if (!baby) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Baby Not Found</h2>
                    <Link to="/dashboard">
                        <PrimaryButton variant="primary">Back to Dashboard</PrimaryButton>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{baby.name}'s Growth</h1>
                        <p className="text-gray-600 mt-1">
                            Born {new Date(baby.dateOfBirth).toLocaleDateString()}
                            {baby.gender && ` • ${baby.gender}`}
                        </p>
                    </div>
                    <div className="flex space-x-3 mt-4 sm:mt-0">
                        <Link to={`/baby/${babyId}/add-measurement`}>
                            <PrimaryButton variant="add" className="px-6">
                                Add Measurement
                            </PrimaryButton>
                        </Link>
                        <Link to={`/baby/${babyId}`}>
                            <PrimaryButton variant="cancel" className="px-4">
                                Baby Profile
                            </PrimaryButton>
                        </Link>
                    </div>
                </div>

                {/* Chart Type Selector */}
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: "weight", label: "Weight", color: "blue" },
                        { key: "height", label: "Height", color: "green" },
                        { key: "headCircumference", label: "Head Circumference", color: "purple" }
                    ].map(chart => (
                        <button
                            key={chart.key}
                            onClick={() => setSelectedChart(chart.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedChart === chart.key
                                    ? `bg-${chart.color}-100 text-${chart.color}-700 border-2 border-${chart.color}-200`
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent"
                            }`}
                        >
                            {chart.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Charts Section */}
                <div className="xl:col-span-2">
                    <GrowthChart
                        measurements={measurements}
                        chartType={selectedChart}
                        showTrendLine={true}
                        height={400}
                    />

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        {["weight", "height", "headCircumference"].map(type => {
                            const latestMeasurement = measurements
                                .filter(m => m.measurements?.[type])
                                .sort((a, b) => new Date(b.measurementDate) - new Date(a.measurementDate))[0];
                            
                            const unit = type === "weight" ? "kg" : "cm";
                            const label = type === "headCircumference" ? "Head Circ." : 
                                        type.charAt(0).toUpperCase() + type.slice(1);

                            return (
                                <div key={type} className="bg-white p-4 rounded-lg shadow-md border">
                                    <div className="text-sm text-gray-600">{label}</div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {latestMeasurement 
                                            ? `${parseFloat(latestMeasurement.measurements[type]).toFixed(1)} ${unit}`
                                            : "--"
                                        }
                                    </div>
                                    {latestMeasurement && (
                                        <div className="text-xs text-gray-500">
                                            {new Date(latestMeasurement.measurementDate).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Measurements */}
                <div className="xl:col-span-1">
                    <GrowthDataList
                        measurements={measurements.slice(0, 5)} // Show only recent 5
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onAdd={handleAddMeasurement}
                        title="Recent Measurements"
                        compact={true}
                    />

                    {measurements.length > 5 && (
                        <div className="mt-4 text-center">
                            <Link to={`/baby/${babyId}/growth-history`}>
                                <PrimaryButton variant="cancel" className="w-full">
                                    View All Measurements ({measurements.length})
                                </PrimaryButton>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GrowthTracking;
