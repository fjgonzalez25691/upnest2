// src/components/MeasurementCard.jsx
// Purpose: Card component to display individual growth measurement data

import React from "react";
import PrimaryButton from "../PrimaryButton";

const MeasurementCard = ({ 
    measurement, 
    onEdit, 
    onDelete, 
    showActions = true,
    compact = false 
}) => {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatMeasurement = (value, unit) => {
        if (!value) return "--";
        return `${parseFloat(value).toFixed(1)} ${unit}`;
    };

    const getAgeAtMeasurement = (measurementDate, birthDate) => {
        if (!birthDate) return null;
        
        const measureDate = new Date(measurementDate);
        const birth = new Date(birthDate);
        const diffTime = Math.abs(measureDate - birth);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 30) {
            return `${diffDays} days`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            const remainingDays = diffDays % 30;
            return remainingDays > 0 ? `${months}m ${remainingDays}d` : `${months} months`;
        } else {
            const years = Math.floor(diffDays / 365);
            const months = Math.floor((diffDays % 365) / 30);
            return months > 0 ? `${years}y ${months}m` : `${years} years`;
        }
    };

    if (compact) {
        return (
            <div className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900">
                        {formatDate(measurement.measurementDate)}
                    </span>
                    {measurement.babyBirthDate && (
                        <span className="text-xs text-gray-500">
                            {getAgeAtMeasurement(measurement.measurementDate, measurement.babyBirthDate)}
                        </span>
                    )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center">
                        <div className="text-xs text-gray-500">Weight</div>
                        <div className="font-medium">
                            {formatMeasurement(measurement.measurements?.weight, "kg")}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-gray-500">Height</div>
                        <div className="font-medium">
                            {formatMeasurement(measurement.measurements?.height, "cm")}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-gray-500">Head</div>
                        <div className="font-medium">
                            {formatMeasurement(measurement.measurements?.headCircumference, "cm")}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        {formatDate(measurement.measurementDate)}
                    </h3>
                    {measurement.babyBirthDate && (
                        <p className="text-sm text-gray-500">
                            Age: {getAgeAtMeasurement(measurement.measurementDate, measurement.babyBirthDate)}
                        </p>
                    )}
                </div>
                {showActions && (
                    <div className="flex space-x-2">
                        <PrimaryButton
                            variant="edit"
                            className="px-3 py-1 text-sm"
                            onClick={() => onEdit(measurement)}
                        >
                            Edit
                        </PrimaryButton>
                        <PrimaryButton
                            variant="danger"
                            className="px-3 py-1 text-sm"
                            onClick={() => onDelete(measurement)}
                        >
                            Delete
                        </PrimaryButton>
                    </div>
                )}
            </div>

            {/* Measurements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-600 font-medium">Weight</p>
                            <p className="text-2xl font-bold text-blue-900">
                                {formatMeasurement(measurement.measurements?.weight, "kg")}
                            </p>
                        </div>
                        <div className="text-blue-400">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600 font-medium">Height</p>
                            <p className="text-2xl font-bold text-green-900">
                                {formatMeasurement(measurement.measurements?.height, "cm")}
                            </p>
                        </div>
                        <div className="text-green-400">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-purple-600 font-medium">Head Circumference</p>
                            <p className="text-2xl font-bold text-purple-900">
                                {formatMeasurement(measurement.measurements?.headCircumference, "cm")}
                            </p>
                        </div>
                        <div className="text-purple-400">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Info */}
            <div className="border-t border-gray-200 pt-4">
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {measurement.measurementSource && (
                        <div>
                            <span className="font-medium">Source:</span> {measurement.measurementSource}
                        </div>
                    )}
                    {measurement.createdAt && (
                        <div>
                            <span className="font-medium">Recorded:</span> {formatDate(measurement.createdAt)}
                        </div>
                    )}
                </div>
                {measurement.notes && (
                    <div className="mt-3">
                        <p className="text-sm text-gray-700">
                            <span className="font-medium">Notes:</span> {measurement.notes}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MeasurementCard;
