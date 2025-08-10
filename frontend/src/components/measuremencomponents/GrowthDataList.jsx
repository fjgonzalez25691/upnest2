// src/components/GrowthDataList.jsx
// Purpose: List component to display and manage multiple growth measurements

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MeasurementCard from "./MeasurementCard";
import PrimaryButton from "../PrimaryButton";

const GrowthDataList = ({ 
    measurements = [], 
    onEdit, 
    onDelete, 
    onAdd,
    loading = false,
    error = null,
    title = "Growth Measurements",
    showAddButton = true,
    compact = false
}) => {
    const [sortBy, setSortBy] = useState("date");
    const [sortOrder, setSortOrder] = useState("desc");
    const [viewMode, setViewMode] = useState(compact ? "compact" : "cards");

    const sortedMeasurements = React.useMemo(() => {
        const sorted = [...measurements].sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case "date":
                    aValue = new Date(a.measurementDate);
                    bValue = new Date(b.measurementDate);
                    break;
                case "weight":
                    aValue = parseFloat(a.measurements?.weight || 0);
                    bValue = parseFloat(b.measurements?.weight || 0);
                    break;
                case "height":
                    aValue = parseFloat(a.measurements?.height || 0);
                    bValue = parseFloat(b.measurements?.height || 0);
                    break;
                case "headCircumference":
                    aValue = parseFloat(a.measurements?.headCircumference || 0);
                    bValue = parseFloat(b.measurements?.headCircumference || 0);
                    break;
                default:
                    return 0;
            }
            
            if (sortOrder === "asc") {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
        
        return sorted;
    }, [measurements, sortBy, sortOrder]);

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("desc");
        }
    };

    const handleEdit = (measurement) => {
        if (onEdit) {
            onEdit(measurement);
        }
    };

    const getSortIcon = (field) => {
        if (sortBy !== field) {
            return (
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            );
        }
        
        return sortOrder === "asc" ? (
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
        ) : (
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        );
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-center">
                    <div className="text-red-500 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Measurements</h3>
                    <p className="text-red-700">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    {showAddButton && onAdd && (
                        <PrimaryButton
                            variant="add"
                            onClick={onAdd}
                            className="px-4 py-2"
                        >
                            Add Measurement
                        </PrimaryButton>
                    )}
                </div>

                {/* Controls */}
                {!compact && measurements.length > 0 && (
                    <div className="flex flex-wrap gap-4 items-center">
                        {/* Sort Controls */}
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">Sort by:</span>
                            <div className="flex space-x-1">
                                {[
                                    { key: "date", label: "Date" },
                                    { key: "weight", label: "Weight" },
                                    { key: "height", label: "Height" },
                                    { key: "headCircumference", label: "Head" }
                                ].map(option => (
                                    <button
                                        key={option.key}
                                        onClick={() => handleSort(option.key)}
                                        className={`px-3 py-1 text-sm rounded-md flex items-center space-x-1 ${
                                            sortBy === option.key
                                                ? "bg-blue-100 text-blue-700"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                    >
                                        <span>{option.label}</span>
                                        {getSortIcon(option.key)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">View:</span>
                            <div className="flex space-x-1">
                                <button
                                    onClick={() => setViewMode("cards")}
                                    className={`px-3 py-1 text-sm rounded-md ${
                                        viewMode === "cards"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                >
                                    Cards
                                </button>
                                <button
                                    onClick={() => setViewMode("compact")}
                                    className={`px-3 py-1 text-sm rounded-md ${
                                        viewMode === "compact"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                >
                                    Compact
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
                        <div className="p-6">
                            {measurements.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 mb-4">
                                        <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No measurements yet</h3>
                                    <p className="text-gray-500 mb-4">Start tracking your baby's growth by adding the first measurement.</p>
                                    {showAddButton && onAdd && (
                                        <PrimaryButton
                                            variant="primary"
                                            onClick={onAdd}
                                            className="px-6 py-2"
                                        >
                                            Add First Measurement
                                        </PrimaryButton>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col space-y-4">
                                    {sortedMeasurements.map((measurement) => (
                                        <MeasurementCard
                                            key={measurement.dataId}
                                            measurement={measurement}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                            compact={viewMode === "compact"}
                                            showActions={!!onEdit && !!onDelete}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
            {measurements.length > 0 && (
                <div className="px-6 py-3 border-t border-gray-200 text-sm text-gray-500">
                    Showing {measurements.length} measurement{measurements.length !== 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
};

export default GrowthDataList;
