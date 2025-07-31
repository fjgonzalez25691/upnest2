// src/components/BabyProfileForm.jsx
// Reusable component for displaying baby profile information in form layout
import React, { useState } from "react";
import PrimaryButton from "./PrimaryButton";
import TextInput from "./TextInput";

const BabyProfileForm = ({ baby, isEditable = false, onSave, onCancel }) => {
    const [formData, setFormData] = useState(baby ? { ...baby } : {});
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

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

    const validate = (data) => {
        const errs = {};
        if (data.premature) {
            if (!data.gestationalWeek) {
                errs.gestationalWeek = "Required";
            } else if (data.gestationalWeek < 20 || data.gestationalWeek > 37) {
                errs.gestationalWeek = "Must be between 20 and 37";
            }
        }
        // Add more validation rules as needed
        return errs;
    };

    if (!baby) {
        return (
            <div className="bg-white rounded-3xl shadow-lg p-8 border border-blue-100">
                <div className="text-center py-8">
                    <p className="text-gray-500">No baby data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl shadow-lg p-8 border border-blue-100">
            {/* Baby Header */}
            <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center mr-6 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">{baby.name}</h2>
                    <p className="text-gray-600 text-lg">{baby.gender}</p>
                </div>
            </div>

            {/* Baby Details Form */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Left Column */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                        {isEditable ? (
                            <TextInput
                                label="Full Name"
                                name="name"
                                value={formData.name || ""}
                                onChange={handleChange}
                                required
                                variant="edit"
                            />
                        ) : (
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                                <p className="text-gray-800 font-medium">{baby.name}</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                        {isEditable ? (
                            <input
                                type="date"
                                name="dateOfBirth"
                                value={formData.dateOfBirth || ""}
                                onChange={handleChange}
                                className="w-full p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        ) : (
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                                <p className="text-gray-800 font-medium">{new Date(baby.dateOfBirth).toLocaleDateString()}</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                        {isEditable ? (
                            <select
                                name="gender"
                                value={formData.gender || ""}
                                onChange={handleChange}
                                className="w-full p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        ) : (
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                                <p className="text-gray-800 font-medium capitalize">{baby.gender}</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Birth Status</label>
                        {isEditable ? (
                            <div className="flex items-center gap-4">
                                <input
                                    type="checkbox"
                                    name="premature"
                                    checked={!!formData.premature}
                                    onChange={e => {
                                        setFormData(prev => ({
                                            ...prev,
                                            premature: e.target.checked,
                                            gestationalWeek: e.target.checked ? prev.gestationalWeek : undefined
                                        }));
                                    }}
                                    id="premature-checkbox"
                                />
                                <label htmlFor="premature-checkbox" className="mr-2">Premature</label>
                                {formData.premature && (
                                    <div>
                                        <input
                                            type="number"
                                            name="gestationalWeek"
                                            min={20}
                                            max={37}
                                            value={formData.gestationalWeek || ""}
                                            onChange={e => {
                                                const value = Number(e.target.value);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    gestationalWeek: value,
                                                    premature: value < 38
                                                }));
                                            }}
                                            placeholder="Gestational weeks"
                                            className="w-32 p-2 ml-2 border rounded"
                                        />
                                        {errors.gestationalWeek && (
                                            <span className="text-red-500 text-xs ml-2">{errors.gestationalWeek}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                                <p className="text-gray-800 font-medium">
                                    {baby.premature ? `Premature (${baby.gestationalWeek} weeks)` : 'Full Term'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Birth Weight</label>
                        {isEditable ? (
                            <div className="relative">
                                <input
                                    type="number"
                                    name="birthWeight"
                                    value={formData.birthWeight || ""}
                                    onChange={handleChange}
                                    placeholder="Enter weight"
                                    className="w-full p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                />
                                <span className="absolute right-4 top-4 text-gray-500 text-sm">grams</span>
                            </div>
                        ) : (
                            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                                <p className="text-gray-800 font-medium">{baby.birthWeight ? `${baby.birthWeight} grams` : 'Not recorded'}</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Birth Height</label>
                        {isEditable ? (
                            <div className="relative">
                                <input
                                    type="number"
                                    name="birthHeight"
                                    value={formData.birthHeight || ""}
                                    onChange={handleChange}
                                    placeholder="Enter height"
                                    className="w-full p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                />
                                <span className="absolute right-4 top-4 text-gray-500 text-sm">cm</span>
                            </div>
                        ) : (
                            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                                <p className="text-gray-800 font-medium">{baby.birthHeight ? `${baby.birthHeight} cm` : 'Not recorded'}</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                            <p className="text-gray-800 font-medium">{calculateAge(baby.dateOfBirth)}</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Created</label>
                        <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-100">
                            <p className="text-gray-800 font-medium">{new Date(baby.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons for Edit Mode */}
            {isEditable && (
                <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
                    <PrimaryButton
                        variant="primary"
                        className="flex-1"
                        onClick={() => {
                            const dataToSend = {
                                ...formData,
                                birthWeight: formData.birthWeight ? Number(formData.birthWeight) : undefined,
                                birthHeight: formData.birthHeight ? Number(formData.birthHeight) : undefined,
                                gestationalWeek: formData.gestationalWeek ? Number(formData.gestationalWeek) : undefined,
                            };
                            const validationErrors = validate(dataToSend);
                            setErrors(validationErrors);
                            if (Object.keys(validationErrors).length > 0) return;
                            onSave(dataToSend);
                        }}
                        type="button"
                    >
                        Save Changes
                    </PrimaryButton>
                    <PrimaryButton
                        variant="cancel"
                        className="flex-1"
                        onClick={onCancel}
                        type="button"
                    >
                        Cancel
                    </PrimaryButton>
                </div>
            )}
        </div>
    );
};

export default BabyProfileForm;