import React, { useState } from "react";
import PrimaryButton from "../PrimaryButton.jsx";
import TextBox from "../TextBox.jsx";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { normalizeNumber } from "../../utils/numberUtils.js";

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
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        if (error) setError("");
    };

    // Decimal input handler using the utility
    const handleDecimalChange = (name) => (e) => {
        const value = normalizeNumber(e.target.value);
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (error) setError("");
    };

    const handleDateChange = (date) => {
        setForm(prev => ({
            ...prev,
            dateOfBirth: date ? date.toISOString().slice(0, 10) : ""
        }));
        if (error) setError("");
    };

    const validateForm = () => {
        if (!form.name.trim()) {
            return "Baby name is required";
        }
        if (!form.dateOfBirth) {
            return "Date of birth is required";
        }
        if (!form.gender) {
            return "Gender is required";
        }
        if (form.premature && (!form.gestationalWeek || form.gestationalWeek < 20 || form.gestationalWeek > 42)) {
            return "Gestational week must be between 20 and 42 for premature babies";
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
            // Convert numeric fields to Number before sending
            const dataToSend = {
                ...form,
                birthWeight: form.birthWeight ? Number(form.birthWeight) : undefined,
                birthHeight: form.birthHeight ? Number(form.birthHeight) : undefined,
                headCircumference: form.headCircumference ? Number(form.headCircumference) : undefined,
                gestationalWeek: form.gestationalWeek ? Number(form.gestationalWeek) : undefined,
            };
            await onSubmit(dataToSend);
        } catch (err) {
            setError(err.message || "Failed to save baby profile");
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
        <div className="bg-white rounded-3xl shadow-lg p-8 border border-blue-100">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-semibold mb-6 text-center">{heading}</h2>
            
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
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
                                    min={20}
                                    max={42}
                                    placeholder="e.g., 36"
                                    suffix="weeks"
                                    required
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
                                min={500}
                                max={6000}
                                placeholder="e.g., 3200"
                                suffix="g"
                            />
            
                            <TextBox
                                label="Birth Height"
                                name="birthHeight"
                                value={form.birthHeight}
                                onChange={handleDecimalChange("birthHeight")}
                                editable={true}
                                type="number"
                                min={20}
                                max={60}
                                step="0.1"
                                placeholder="e.g., 50.5"
                                suffix="cm"
                            />
            
                            <TextBox
                                label="Head Circumference"
                                name="headCircumference"
                                value={form.headCircumference}
                                onChange={handleDecimalChange("headCircumference")}
                                editable={true}
                                type="number"
                                min={20}
                                max={60}
                                step="0.1"
                                placeholder="e.g., 35.2"
                                suffix="cm"
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