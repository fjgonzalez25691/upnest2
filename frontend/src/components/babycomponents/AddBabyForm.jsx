import React, { useState } from "react";
import PrimaryButton from "../PrimaryButton.jsx";
import TextBox from "../TextBox.jsx";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { normalizeNumber, formatNumberWithOptionalDecimal, FIELD_RANGES, validateRange } from "../../utils/numberUtils";

const BabyForm = ({
    initialData = {},
    onSubmit,
    onCancel,
    heading = "Baby Profile",
    submitLabel = "Save Baby",
}) => {
    const [form, setForm] = useState({
        name: initialData.name || "",
        dateOfBirth: initialData.dateOfBirth || "",
        gender: initialData.gender || "",
        premature: initialData.premature || false,
        gestationalWeek: initialData.gestationalWeek || "",
        birthWeight: initialData.birthWeight || "",
        birthHeight: initialData.birthHeight || "",
        headCircumference: initialData.headCircumference || "",
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        
        // Clear errors when user types
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    const handleDateChange = (date) => {
        setForm(prev => ({
            ...prev,
            dateOfBirth: date ? date.toISOString().slice(0, 10) : ""
        }));
        
        // Clear date error
        if (errors.dateOfBirth) {
            setErrors(prev => ({
                ...prev,
                dateOfBirth: ""
            }));
        }
    };

    // Centralized validation using numberUtils
    const validateForm = (data) => {
        const errs = {};
        
        // Required field validation
        if (!data.name.trim()) {
            errs.name = "Baby name is required";
        }
        if (!data.dateOfBirth) {
            errs.dateOfBirth = "Date of birth is required";
        }
        if (!data.gender) {
            errs.gender = "Gender is required";
        }
        
        // Premature birth validation
        if (data.premature) {
            if (!data.gestationalWeek) {
                errs.gestationalWeek = "Gestational week is required for premature birth";
            } else {
                const gestationalError = validateRange(data.gestationalWeek, {
                    ...FIELD_RANGES.gestationalWeek,
                    field: "Gestational week"
                });
                if (gestationalError) {
                    errs.gestationalWeek = gestationalError;
                } else {
                    // Special case: if gestational week >= 37, it's not premature
                    const normalizedWeek = normalizeNumber(data.gestationalWeek, FIELD_RANGES.gestationalWeek.decimals);
                    if (normalizedWeek >= 37) {
                        errs.gestationalWeek = "Gestational week must be less than 37 for premature birth";
                    }
                }
            }
        }
        
        // Birth measurements validation (optional but must be in range if provided)
        if (data.birthWeight) {
            const weightError = validateRange(data.birthWeight, {
                ...FIELD_RANGES.birthWeight,
                field: "Birth weight"
            });
            if (weightError) errs.birthWeight = weightError;
        }
        
        if (data.birthHeight) {
            const heightError = validateRange(data.birthHeight, {
                ...FIELD_RANGES.birthHeight,
                field: "Birth height"
            });
            if (heightError) errs.birthHeight = heightError;
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
            // Normalize numeric fields using centralized utility
            const dataToSend = {
                ...form,
                birthWeight: form.birthWeight ? normalizeNumber(form.birthWeight, FIELD_RANGES.birthWeight.decimals) : undefined,
                birthHeight: form.birthHeight ? normalizeNumber(form.birthHeight, FIELD_RANGES.birthHeight.decimals) : undefined,
                headCircumference: form.headCircumference ? normalizeNumber(form.headCircumference, FIELD_RANGES.headCircumference.decimals) : undefined,
                gestationalWeek: form.gestationalWeek ? normalizeNumber(form.gestationalWeek, FIELD_RANGES.gestationalWeek.decimals) : undefined,
            };
            await onSubmit(dataToSend);
        } catch (err) {
            setErrors({ submit: err.message || "Failed to save baby profile" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            // Fallback: come back to dashboard
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = "/dashboard";
            }
        }
    };

    return (
        <div className="card-elevated--bordered">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-semibold mb-6 text-center">{heading}</h2>
            
                {errors.submit && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {errors.submit}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information Section */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <h3 className="text-lg font-medium mb-3">Basic Information</h3>
                        <div className="space-y-4">
                            <TextBox
                                label="Full Name"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                editable={true}
                                required
                                error={errors.name}
                            />
            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="textbox-group">
                                    <label className="textbox-label textbox-label-required">
                                        Date of Birth
                                    </label>
                                    <DatePicker
                                        selected={form.dateOfBirth ? new Date(form.dateOfBirth) : null}
                                        onChange={handleDateChange}
                                        dateFormat="yyyy-MM-dd"
                                        maxDate={new Date()}
                                        className="textbox-input-edit w-full"
                                        placeholderText="YYYY-MM-DD"
                                        required
                                    />
                                    {errors.dateOfBirth && (
                                        <p className="textbox-error">{errors.dateOfBirth}</p>
                                    )}
                                </div>
            
                                <TextBox
                                    label="Gender"
                                    name="gender"
                                    value={form.gender}
                                    onChange={handleChange}
                                    editable={true}
                                    type="select"
                                    options={[
                                        { value: "", label: "Select gender" },
                                        { value: "male", label: "Male" },
                                        { value: "female", label: "Female" }
                                    ]}
                                    required
                                    error={errors.gender}
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Birth Conditions Section */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <h3 className="text-lg font-medium mb-3">Birth Conditions</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    name="premature"
                                    checked={form.premature}
                                    onChange={handleChange}
                                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="font-medium text-gray-700">Premature Birth</label>
                            </div>
                            {form.premature && (
                                <TextBox
                                    label="Gestational Week"
                                    name="gestationalWeek"
                                    value={form.gestationalWeek}
                                    onChange={handleChange}
                                    editable={true}
                                    type="number"
                                    min={FIELD_RANGES.gestationalWeek.min}
                                    max={FIELD_RANGES.gestationalWeek.max}
                                    placeholder="e.g., 36"
                                    suffix="weeks"
                                    renderValue={v => v ? formatNumberWithOptionalDecimal(v, "weeks", FIELD_RANGES.gestationalWeek.decimals) : "Not recorded"}
                                    required
                                    error={errors.gestationalWeek}
                                />
                            )}
                        </div>
                    </div>
                    
                    {/* Birth Measurements Section */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <h3 className="text-lg font-medium mb-3">Birth Measurements</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <TextBox
                                label="Birth Weight"
                                name="birthWeight"
                                value={form.birthWeight}
                                onChange={handleChange}
                                editable={true}
                                type="number"
                                min={FIELD_RANGES.birthWeight.min}
                                max={FIELD_RANGES.birthWeight.max}
                                placeholder="e.g., 3200"
                                suffix="g"
                                renderValue={v => v ? formatNumberWithOptionalDecimal(v, "g", FIELD_RANGES.birthWeight.decimals) : "Not recorded"}
                                error={errors.birthWeight}
                            />
            
                            <TextBox
                                label="Birth Height"
                                name="birthHeight"
                                value={form.birthHeight}
                                onChange={handleChange}
                                editable={true}
                                type="number"
                                min={FIELD_RANGES.birthHeight.min}
                                max={FIELD_RANGES.birthHeight.max}
                                step="0.1"
                                placeholder="e.g., 50.5"
                                suffix="cm"
                                renderValue={v => v ? formatNumberWithOptionalDecimal(v, "cm", FIELD_RANGES.birthHeight.decimals) : "Not recorded"}
                                error={errors.birthHeight}
                            />
            
                            <TextBox
                                label="Head Circumference"
                                name="headCircumference"
                                value={form.headCircumference}
                                onChange={handleChange}
                                editable={true}
                                type="number"
                                min={FIELD_RANGES.headCircumference.min}
                                max={FIELD_RANGES.headCircumference.max}
                                step="0.1"
                                placeholder="e.g., 35.2"
                                suffix="cm"
                                renderValue={v => v ? formatNumberWithOptionalDecimal(v, "cm", FIELD_RANGES.headCircumference.decimals) : "Not recorded"}
                                error={errors.headCircumference}
                            />
                        </div>
                    </div>
                    
                    {/* Submit Buttons */}
                    <div className="gradient-textarea-info rounded-xl shadow p-6 mt-8 border border-blue-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-center pt-4">
                            <PrimaryButton
                                type="submit"
                                variant="primary"
                                className="w-full md:w-auto px-8"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Saving..." : submitLabel}
                            </PrimaryButton>
                            <PrimaryButton
                                type="button"
                                variant="cancel"
                                onClick={handleCancel}
                                className="w-full md:w-auto px-8"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </PrimaryButton>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BabyForm;