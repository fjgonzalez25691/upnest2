// src/components/GrowthDataForm.jsx
// Purpose: Form component for recording baby growth measurements (weight, height, head circumference)

import React, { useState } from "react";
import PrimaryButton from "../PrimaryButton.jsx";
import TextBox from "../TextBox.jsx";
import Spinner from "../Spinner.jsx";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { normalizeNumber, formatNumberWithOptionalDecimal, validateRange, FIELD_RANGES } from "../../utils/numberUtils.js";

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
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
        
        // Clear specific field error when user types
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    const handleDateChange = (date) => {
        setForm((prev) => ({
            ...prev,
            measurementDate: date,
        }));
        
        // Clear date error
        if (errors.measurementDate) {
            setErrors(prev => ({
                ...prev,
                measurementDate: ""
            }));
        }
    };

    // Centralized validation using numberUtils
    const validateForm = (data) => {
        const errs = {};
        
        // Required date validation
        if (!data.measurementDate) {
            errs.measurementDate = "Measurement date is required";
        }
        
        // At least one measurement required
        if (!data.weight && !data.height && !data.headCircumference) {
            errs.general = "At least one measurement (weight, height, or head circumference) is required";
        }

        // Validate individual measurements using FIELD_RANGES
        if (data.weight) {
            const weightError = validateRange(data.weight, {
                ...FIELD_RANGES.weight,
                field: "Weight"
            });
            if (weightError) errs.weight = weightError;
        }

        if (data.height) {
            const heightError = validateRange(data.height, {
                ...FIELD_RANGES.height,
                field: "Height"
            });
            if (heightError) errs.height = heightError;
        }

        if (data.headCircumference) {
            const headError = validateRange(data.headCircumference, {
                ...FIELD_RANGES.headCircumference,
                field: "Head circumference"
            });
            if (headError) errs.headCircumference = headError;
        }

        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validateForm(form);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        try {
            const measurements = {};
            // Normalize using FIELD_RANGES decimals
            if (form.weight) measurements.weight = normalizeNumber(form.weight, FIELD_RANGES.weight.decimals);
            if (form.height) measurements.height = normalizeNumber(form.height, FIELD_RANGES.height.decimals);
            if (form.headCircumference) measurements.headCircumference = normalizeNumber(form.headCircumference, FIELD_RANGES.headCircumference.decimals);

            const submissionData = {
                babyId,
                measurementDate: form.measurementDate.toISOString().split('T')[0],
                measurements,
                notes: form.notes.trim() || undefined,
                measurementSource: form.measurementSource,
            };

            await onSubmit(submissionData); // La página gestiona la navegación
        } catch (err) {
            setErrors({ submit: err.message || "Failed to save measurement" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto card-basic">
            <h2 className="text-2xl font-semibold mb-6 text-center">{heading}</h2>
            
            {/* General errors */}
            {(errors.general || errors.submit) && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {errors.general || errors.submit}
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
                        {errors.measurementDate && (
                            <p className="textbox-error">{errors.measurementDate}</p>
                        )}
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
                            placeholder="e.g., 5200"
                            suffix="g"
                            min={FIELD_RANGES.weight.min}
                            max={FIELD_RANGES.weight.max}
                            renderValue={v => v ? formatNumberWithOptionalDecimal(v, "g", FIELD_RANGES.weight.decimals) : "Not recorded"}
                            error={errors.weight}
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
                            min={FIELD_RANGES.height.min}
                            max={FIELD_RANGES.height.max}
                            renderValue={v => v ? formatNumberWithOptionalDecimal(v, "cm", FIELD_RANGES.height.decimals) : "Not recorded"}
                            error={errors.height}
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
                            min={FIELD_RANGES.headCircumference.min}
                            max={FIELD_RANGES.headCircumference.max}
                            renderValue={v => v ? formatNumberWithOptionalDecimal(v, "cm", FIELD_RANGES.headCircumference.decimals) : "Not recorded"}
                            error={errors.headCircumference}
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
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <Spinner variant="inline" color="custom" message="Saving..." />
                        ) : (
                            submitLabel
                        )}
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
