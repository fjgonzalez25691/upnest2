// src/components/GrowthDataForm.jsx
// Purpose: Form component for recording baby growth measurements (weight, height, head circumference)

import React, { useState } from "react";
import PrimaryButton from "../PrimaryButton.jsx";
import TextBox from "../TextBox.jsx";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { normalizeNumber } from "../../utils/numberUtils.js";

const GrowthDataForm = ({
    initialData = {},
    onSubmit,
    onCancel,
    heading = "Record Growth Measurement",
    submitLabel = "Save Measurement",
    babyId,
}) => {
    const [form, setForm] = useState({
        measurementDate: initialData.measurementDate ? new Date(initialData.measurementDate) : new Date(),
        weight: initialData.measurements?.weight || "",
        height: initialData.measurements?.height || "",
        headCircumference: initialData.measurements?.headCircumference || "",
        notes: initialData.notes || "",
        measurementSource: initialData.measurementSource || "manual",
    });
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (error) setError("");
    };

    const handleDateChange = (date) => {
        setForm((prev) => ({
            ...prev,
            measurementDate: date,
        }));
        if (error) setError("");
    };

    const validateForm = () => {
        if (!form.measurementDate) {
            return "Measurement date is required";
        }
        
        if (!form.weight && !form.height && !form.headCircumference) {
            return "At least one measurement (weight, height, or head circumference) is required";
        }

        // Validate numeric fields
        if (form.weight && (isNaN(form.weight) || parseFloat(form.weight) <= 0)) {
            return "Weight must be a positive number";
        }
        if (form.height && (isNaN(form.height) || parseFloat(form.height) <= 0)) {
            return "Height must be a positive number";
        }
        if (form.headCircumference && (isNaN(form.headCircumference) || parseFloat(form.headCircumference) <= 0)) {
            return "Head circumference must be a positive number";
        }

        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const measurements = {};
            if (form.weight) measurements.weight = normalizeNumber(form.weight);
            if (form.height) measurements.height = normalizeNumber(form.height);
            if (form.headCircumference) measurements.headCircumference = normalizeNumber(form.headCircumference);

            const submissionData = {
                babyId,
                measurementDate: form.measurementDate.toISOString().split('T')[0],
                measurements,
                notes: form.notes.trim() || undefined,
                measurementSource: form.measurementSource,
            };

            await onSubmit(submissionData);
        } catch (err) {
            setError(err.message || "Failed to save measurement");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6 text-center">{heading}</h2>
            
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3">Measurement Date</h3>
                    <div className="textbox-group">
                        <label className="textbox-label textbox-label-required">
                            Date
                        </label>
                        <DatePicker
                            selected={form.measurementDate}
                            onChange={handleDateChange}
                            dateFormat="yyyy-MM-dd"
                            maxDate={new Date()}
                            className="textbox-input-edit w-full"
                            required
                        />
                    </div>
                </div>

                {/* Measurements Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3">Measurements</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <TextBox
                            label="Weight"
                            name="weight"
                            value={form.weight}
                            onChange={handleChange}
                            editable={true}
                            type="number"
                            placeholder="e.g., 5.2"
                            suffix="kg"
                            step="0.1"
                            min="0"
                        />
                        <TextBox
                            label="Height"
                            name="height"
                            value={form.height}
                            onChange={handleChange}
                            editable={true}
                            type="number"
                            placeholder="e.g., 65.5"
                            suffix="cm"
                            step="0.1"
                            min="0"
                        />
                        <TextBox
                            label="Head Circumference"
                            name="headCircumference"
                            value={form.headCircumference}
                            onChange={handleChange}
                            editable={true}
                            type="number"
                            placeholder="e.g., 42.1"
                            suffix="cm"
                            step="0.1"
                            min="0"
                        />
                    </div>
                </div>

                {/* Additional Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3">Additional Information</h3>
                    <div className="space-y-4">
                        <TextBox
                            label="Measurement Source"
                            name="measurementSource"
                            value={form.measurementSource}
                            onChange={handleChange}
                            editable={true}
                            type="select"
                            options={[
                                { value: "manual", label: "Manual Entry" },
                                { value: "doctor", label: "Doctor Visit" },
                                { value: "home", label: "Home Scale" },
                                { value: "clinic", label: "Clinic" }
                            ]}
                        />
                        <TextBox
                            label="Notes"
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            editable={true}
                            type="textarea"
                            placeholder="Add any additional notes about this measurement..."
                            rows="3"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-center pt-4">
                    <PrimaryButton
                        type="submit"
                        variant="primary"
                        className="w-full md:w-auto px-8"
                    >
                        {submitLabel}
                    </PrimaryButton>
                    <PrimaryButton
                        type="button"
                        variant="cancel"
                        onClick={onCancel}
                        className="w-full md:w-auto px-8"

                    >
                        Cancel
                    </PrimaryButton>
                </div>
            </form>            
        </div>
    );
};

export default GrowthDataForm;
