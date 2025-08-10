// src/components/MeasurementCard.jsx
// Purpose: Card component to display individual growth measurement data

import React, { useState } from "react";
import PrimaryButton from "../PrimaryButton";
import { formatNumberWithOptionalDecimal } from "../../utils/numberUtils";

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

    const ActionMenu = ({ onEdit, onDelete, measurement }) => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <div className="relative">
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Evita que se active el click de la tarjeta
                        setIsOpen(!isOpen);
                    }}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="More actions"
                >
                    <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                </button>
                
                {isOpen && (
                    <>
                        {/* Overlay invisible para cerrar el menú */}
                        <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setIsOpen(false)}
                        />
                        
                        {/* Menú dropdown */}
                        <div className="absolute right-0 top-8 z-20 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(measurement);
                                    setIsOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(measurement);
                                    setIsOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    };

    if (compact) {
        return (
            <div className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900">
                        {formatDate(measurement.measurementDate)}
                    </span>
                    <div className="flex items-center gap-2">
                        {measurement.babyBirthDate && (
                            <span className="text-xs text-gray-500">
                                {getAgeAtMeasurement(measurement.measurementDate, measurement.babyBirthDate)}
                            </span>
                        )}
                        {showActions && (
                            <ActionMenu 
                                onEdit={onEdit}
                                onDelete={onDelete}
                                measurement={measurement}
                            />
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center">
                        <div className="text-xs text-gray-500">Weight</div>
                        <div className="font-medium">
                            {formatNumberWithOptionalDecimal(measurement.measurements?.weight, "g")}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-gray-500">Height</div>
                        <div className="font-medium">
                            {formatNumberWithOptionalDecimal(measurement.measurements?.height, "cm")}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-gray-500">Head</div>
                        <div className="font-medium">
                            {formatNumberWithOptionalDecimal(measurement.measurements?.headCircumference, "cm")}
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
                    <ActionMenu 
                        onEdit={onEdit}
                        onDelete={onDelete}
                        measurement={measurement}
                    />
                )}
            </div>

            {/* Measurements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Weight</p>
                    <p className="text-2xl font-bold text-blue-900">
                        {formatNumberWithOptionalDecimal(measurement.measurements?.weight, "g")}
                    </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Height</p>
                    <p className="text-2xl font-bold text-green-900">
                        {formatNumberWithOptionalDecimal(measurement.measurements?.height, "cm")}
                    </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium">Head Circumference</p>
                    <p className="text-2xl font-bold text-purple-900">
                        {formatNumberWithOptionalDecimal(measurement.measurements?.headCircumference, "cm")}
                    </p>
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
