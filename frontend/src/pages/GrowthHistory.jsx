// src/pages/GrowthHistory.jsx
// Page showing complete growth measurement history for a baby

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import GrowthDataList from "../components/GrowthDataList";
import PrimaryButton from "../components/PrimaryButton";
import { getBaby } from "../services/babyApi";
// import { getGrowthData, deleteGrowthData } from "../services/growthDataApi"; // TODO: Create this service

const GrowthHistory = () => {
    const { babyId } = useParams();
    const [baby, setBaby] = useState(null);
    const [measurements, setMeasurements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [dateRange, setDateRange] = useState("all");

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

            // TODO: Uncomment when service is created
            // const growthData = await getGrowthData(babyId);
            // setMeasurements(Array.isArray(growthData) ? growthData : growthData?.data || []);

            // Mock data for now - more comprehensive dataset
            setMeasurements([
                {
                    dataId: "1",
                    measurementDate: "2024-01-15",
                    measurements: { weight: "5.2", height: "65.5", headCircumference: "42.1" },
                    notes: "Regular checkup - everything looks good",
                    measurementSource: "doctor",
                    createdAt: "2024-01-15T10:00:00Z"
                },
                {
                    dataId: "2",
                    measurementDate: "2024-02-15",
                    measurements: { weight: "5.8", height: "68.0", headCircumference: "43.2" },
                    notes: "Home measurement with new scale",
                    measurementSource: "home",
                    createdAt: "2024-02-15T10:00:00Z"
                },
                {
                    dataId: "3",
                    measurementDate: "2024-03-10",
                    measurements: { weight: "6.1", height: "70.2" },
                    notes: "Quick clinic visit",
                    measurementSource: "clinic",
                    createdAt: "2024-03-10T14:30:00Z"
                },
                {
                    dataId: "4",
                    measurementDate: "2024-03-15",
                    measurements: { weight: "6.2", height: "70.5", headCircumference: "44.1" },
                    notes: "2-month checkup",
                    measurementSource: "doctor",
                    createdAt: "2024-03-15T09:15:00Z"
                },
                {
                    dataId: "5",
                    measurementDate: "2024-04-20",
                    measurements: { weight: "6.8", height: "72.0", headCircumference: "44.8" },
                    notes: "Growing well!",
                    measurementSource: "doctor",
                    createdAt: "2024-04-20T11:00:00Z"
                }
            ]);

        } catch (err) {
            console.error("Error fetching growth data:", err);
            setError("Failed to load growth history. Please try again.");
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
        // Navigate to add measurement page
        window.location.href = `/baby/${babyId}/add-measurement`;
    };

    // Filter measurements based on selected filters
    const filteredMeasurements = React.useMemo(() => {
        let filtered = [...measurements];

        // Filter by measurement type
        if (filterType !== "all") {
            filtered = filtered.filter(m => m.measurements && m.measurements[filterType]);
        }

        // Filter by date range
        if (dateRange !== "all") {
            const now = new Date();
            const cutoffDate = new Date();
            
            switch (dateRange) {
                case "week":
                    cutoffDate.setDate(now.getDate() - 7);
                    break;
                case "month":
                    cutoffDate.setMonth(now.getMonth() - 1);
                    break;
                case "3months":
                    cutoffDate.setMonth(now.getMonth() - 3);
                    break;
                case "6months":
                    cutoffDate.setMonth(now.getMonth() - 6);
                    break;
                default:
                    break;
            }
            
            if (dateRange !== "all") {
                filtered = filtered.filter(m => new Date(m.measurementDate) >= cutoffDate);
            }
        }

        return filtered;
    }, [measurements, filterType, dateRange]);

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
                {/* Breadcrumb */}
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                    <Link to="/dashboard" className="hover:text-gray-700">Dashboard</Link>
                    <span>/</span>
                    <Link to={`/baby/${babyId}`} className="hover:text-gray-700">{baby.name}</Link>
                    <span>/</span>
                    <Link to={`/baby/${babyId}/growth`} className="hover:text-gray-700">Growth</Link>
                    <span>/</span>
                    <span>History</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{baby.name}'s Growth History</h1>
                        <p className="text-gray-600 mt-1">
                            Complete measurement history
                        </p>
                    </div>
                    <div className="flex space-x-3 mt-4 sm:mt-0">
                        <Link to={`/baby/${babyId}/add-measurement`}>
                            <PrimaryButton variant="add" className="px-6">
                                Add Measurement
                            </PrimaryButton>
                        </Link>
                        <Link to={`/baby/${babyId}/growth`}>
                            <PrimaryButton variant="cancel" className="px-4">
                                Back to Charts
                            </PrimaryButton>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Measurement Type Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Measurement Type
                        </label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Measurements</option>
                            <option value="weight">Weight Only</option>
                            <option value="height">Height Only</option>
                            <option value="headCircumference">Head Circumference Only</option>
                        </select>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date Range
                        </label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Time</option>
                            <option value="week">Last Week</option>
                            <option value="month">Last Month</option>
                            <option value="3months">Last 3 Months</option>
                            <option value="6months">Last 6 Months</option>
                        </select>
                    </div>
                </div>

                {/* Filter Summary */}
                <div className="mt-4 flex flex-wrap gap-2">
                    {filterType !== "all" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                            {filterType === "headCircumference" ? "Head Circumference" : 
                             filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                            <button
                                onClick={() => setFilterType("all")}
                                className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                                ×
                            </button>
                        </span>
                    )}
                    {dateRange !== "all" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                            {dateRange === "week" ? "Last Week" :
                             dateRange === "month" ? "Last Month" :
                             dateRange === "3months" ? "Last 3 Months" :
                             dateRange === "6months" ? "Last 6 Months" : dateRange}
                            <button
                                onClick={() => setDateRange("all")}
                                className="ml-2 text-green-600 hover:text-green-800"
                            >
                                ×
                            </button>
                        </span>
                    )}
                    {(filterType !== "all" || dateRange !== "all") && (
                        <button
                            onClick={() => {
                                setFilterType("all");
                                setDateRange("all");
                            }}
                            className="text-sm text-gray-600 hover:text-gray-800 underline"
                        >
                            Clear all filters
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <div className="text-sm text-gray-600">Total Measurements</div>
                    <div className="text-2xl font-bold text-gray-900">{filteredMeasurements.length}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <div className="text-sm text-gray-600">Weight Records</div>
                    <div className="text-2xl font-bold text-blue-600">
                        {filteredMeasurements.filter(m => m.measurements?.weight).length}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <div className="text-sm text-gray-600">Height Records</div>
                    <div className="text-2xl font-bold text-green-600">
                        {filteredMeasurements.filter(m => m.measurements?.height).length}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <div className="text-sm text-gray-600">Head Circ. Records</div>
                    <div className="text-2xl font-bold text-purple-600">
                        {filteredMeasurements.filter(m => m.measurements?.headCircumference).length}
                    </div>
                </div>
            </div>

            {/* Measurements List */}
            <GrowthDataList
                measurements={filteredMeasurements}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAdd={handleAddMeasurement}
                title={`Growth Measurements ${filteredMeasurements.length !== measurements.length ? 
                    `(${filteredMeasurements.length} of ${measurements.length})` : 
                    `(${measurements.length})`}`}
                showAddButton={false} // We have the button in the header
            />
        </div>
    );
};

export default GrowthHistory;
