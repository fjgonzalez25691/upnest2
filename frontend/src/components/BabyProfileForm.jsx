// src/components/BabyProfileForm.jsx
// Reusable component for displaying baby profile information in a form layout
import React, { useState } from "react";
import PrimaryButton from "./PrimaryButton";
import TextBox from "./TextBox";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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

    // Calculates the baby's age based on the date of birth
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

    // Validates the form data
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

    // Formats a date as YYYY-MM-DD (ISO)
    const formatDateISO = date =>
      date ? new Date(date).toISOString().slice(0, 10) : "";

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
                    <TextBox
                        label="Name"
                        name="name"
                        value={formData.name || ""}
                        onChange={handleChange}
                        editable={isEditable}
                        required
                    />

                    {isEditable ? (
  <div>
    <label className="textbox-label" htmlFor="dateOfBirth">Date of Birth</label>
    <DatePicker
      id="dateOfBirth"
      name="dateOfBirth"
      selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : null}
      onChange={date => handleChange({
        target: {
          name: "dateOfBirth",
          value: date ? date.toISOString().slice(0, 10) : ""
        }
      })}
      dateFormat="yyyy-MM-dd"
      className="textbox-input-edit w-full"
      placeholderText="YYYY-MM-DD"
      required
    />
  </div>
) : (
  <TextBox
    label="Date of Birth"
    name="dateOfBirth"
    value={formData.dateOfBirth || ""}
    editable={false}
    type="date"
  />
)}

                    <TextBox
                        label="Gender"
                        name="gender"
                        value={formData.gender || ""}
                        onChange={handleChange}
                        editable={isEditable}
                        type="select"
                        options={[
                            { value: "male", label: "Male" },
                            { value: "female", label: "Female" }
                        ]}
                        required
                    />

                    {isEditable ? (
  <div>
    <label className="textbox-label">Birth Status</label>
    <div className="flex items-center gap-4">
      <input
        type="checkbox"
        id="premature"
        name="premature"
        checked={!!formData.premature}
        onChange={handleChange}
        className="mr-2"
      />
      <label htmlFor="premature" className="mr-4">Premature</label>
      {formData.premature && (
        <TextBox
          label="Gestational Week"
          name="gestationalWeek"
          type="number"
          value={formData.gestationalWeek || ""}
          onChange={e => {
            handleChange(e);
            const week = Number(e.target.value);
            // If gestational week is greater than 37, automatically set premature to false and clear week
            if (week > 37) {
              setFormData(prev => ({
                ...prev,
                premature: false,
                gestationalWeek: ""
              }));
            }
          }}
          editable={isEditable}
          min={20}
          max={37}
          required
          suffix="weeks"
          error={errors.gestationalWeek}
        />
      )}
    </div>
  </div>
) : (
  <TextBox
    label="Birth Status"
    name="birthStatus"
    value={baby.premature ? `Premature (${baby.gestationalWeek} weeks)` : 'Full Term'}
    editable={false}
    type="string"
  />
)}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <TextBox
                        label="Birth Weight"
                        name="birthWeight"
                        type="number"
                        value={formData.birthWeight || ""}
                        onChange={handleChange}
                        editable={isEditable}
                        suffix="g"
                        placeholder="Enter weight"
                        renderValue={v => v ? `${v} g` : "Not recorded"}
                    />

                    <TextBox
                        label="Birth Height"
                        name="birthHeight"
                        type="number"
                        value={formData.birthHeight || ""}
                        onChange={handleChange}
                        editable={isEditable}
                        suffix="cm"
                        placeholder="Enter height"
                        renderValue={v => v ? `${v} cm` : "Not recorded"}
                    />

                    <TextBox
                        label="Age"
                        name="age"
                        value={calculateAge(baby.dateOfBirth)}
                        editable={false}
                        type="string"
                    />

                    <TextBox
                        label="Profile Created"
                        name="profileCreated"
                        value={formatDateISO(baby.createdAt)}
                        editable={false}
                        type="date"
                    />
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