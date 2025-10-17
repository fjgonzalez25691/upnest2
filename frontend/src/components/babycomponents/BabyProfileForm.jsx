// src/components/BabyProfileForm.jsx
// Reusable component for displaying baby profile information in a form layout
import React, { useState } from "react";
import PrimaryButton from "../PrimaryButton.jsx";
import TextBox from "../TextBox.jsx";
import Spinner from "../Spinner.jsx";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { calculateAge } from "../../utils/dateUtils.js";
import { normalizeNumber, formatNumberWithOptionalDecimal, validateRange, FIELD_RANGES} from "../../utils/numberUtils.js";

const BabyProfileForm = ({ baby, isEditable = false, isRecalculating = false, recalcError = "", onSave, onCancel, onEdit, onDelete }) => {
  const [formData, setFormData] = useState(baby ? { ...baby } : {});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Validates the form data using centralized validation
  const validate = (data) => {
    const errs = {};
    
    // Validate gestational week if premature
    if (data.premature && data.gestationalWeek) {
      const gestationalError = validateRange(data.gestationalWeek, {
        ...FIELD_RANGES.gestationalWeek,
        field: "Gestational week"
      });
      if (gestationalError) errs.gestationalWeek = gestationalError;
      
      // Special case: if gestational week > 37, it's not premature
      const normalizedWeek = normalizeNumber(data.gestationalWeek, FIELD_RANGES.gestationalWeek.decimals);
      if (normalizedWeek >= 37) {
        errs.gestationalWeek = "Gestational week must be less than 37 for premature birth";
      }
    }
    
    if (data.premature && !data.gestationalWeek) {
      errs.gestationalWeek = "Required for premature birth";
    }

    // Validate birth measurements
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

  // Formats a date as YYYY-MM-DD (ISO)
  const formatDateISO = (date) =>
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
          {/* Age is shown in header using the new utility */}
          <p className="text-gray-500 text-base">{calculateAge(baby.dateOfBirth).readable}</p>
        </div>
      </div>

      {/* Baby Details Form */}
      <div className="space-y-6">
        {/* Basic Information Section */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <h3 className="text-lg font-medium mb-3">Basic Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
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
                <label className="textbox-label textbox-label-required" htmlFor="dateOfBirth">
                  Date of Birth
                </label>
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
                required
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

            <TextBox
              label="Profile Created"
              name="profileCreated"
              value={formatDateISO(baby.createdAt)}
              editable={false}
              type="date"
            />
          </div>
        </div>

        {/* Birth Conditions Section */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <h3 className="text-lg font-medium mb-3">Birth Conditions</h3>
          <div className="space-y-4">
            {isEditable ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="premature"
                    name="premature"
                    checked={!!formData.premature}
                    onChange={handleChange}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="premature" className="font-medium text-gray-700">Premature Birth</label>
                </div>
                
                {formData.premature && (
                  <TextBox
                    label="Gestational Week"
                    name="gestationalWeek"
                    type="number"
                    value={formData.gestationalWeek || ""}
                    onChange={e => {
                      handleChange(e);
                      // Auto-uncheck premature if week >= 37
                      const normalizedWeek = normalizeNumber(e.target.value, FIELD_RANGES.gestationalWeek.decimals);
                      if (normalizedWeek >= 37) {
                        setFormData(prev => ({
                          ...prev,
                          premature: false,
                          gestationalWeek: ""
                        }));
                      }
                    }}
                    editable={isEditable}
                    min={FIELD_RANGES.gestationalWeek.min}
                    max={FIELD_RANGES.gestationalWeek.max}
                    required
                    suffix="weeks"
                    placeholder="e.g., 36"
                    renderValue={v => v ? formatNumberWithOptionalDecimal(v, "weeks", FIELD_RANGES.gestationalWeek.decimals) : "Not specified"}
                    error={errors.gestationalWeek}
                  />
                )}
              </div>
            ) : (
              <TextBox
                label="Birth Status"
                name="birthStatus"
                value={baby.premature ? `Premature (${formatNumberWithOptionalDecimal(baby.gestationalWeek, "weeks", FIELD_RANGES.gestationalWeek.decimals)})` : 'Full Term'}
                editable={false}
                type="string"
              />
            )}
          </div>
        </div>

        {/* Birth Measurements Section */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <h3 className="text-lg font-medium mb-3">Birth Measurements</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <TextBox
              label="Birth Weight"
              name="birthWeight"
              type="number"
              value={formData.birthWeight || ""}
              onChange={handleChange}
              editable={isEditable}
              suffix="g"
              placeholder="e.g., 3200"
              min={FIELD_RANGES.birthWeight.min}
              max={FIELD_RANGES.birthWeight.max}
              renderValue={v => v ? formatNumberWithOptionalDecimal(v, "g", FIELD_RANGES.birthWeight.decimals) : "Not recorded"}
              error={errors.birthWeight}
            />

            <TextBox
              label="Birth Height"
              name="birthHeight"
              type="number"
              value={formData.birthHeight || ""}
              onChange={handleChange}
              editable={isEditable}
              suffix="cm"
              placeholder="e.g., 50.5"
              step="0.1"
              min={FIELD_RANGES.birthHeight.min}
              max={FIELD_RANGES.birthHeight.max}
              renderValue={v => v ? formatNumberWithOptionalDecimal(v, "cm", FIELD_RANGES.birthHeight.decimals) : "Not recorded"}
              error={errors.birthHeight}
            />

            <TextBox
              label="Head Circumference"
              name="headCircumference"
              type="number"
              value={formData.headCircumference || ""}
              onChange={handleChange}
              editable={isEditable}
              suffix="cm"
              placeholder="e.g., 35.2"
              step="0.1"
              min={FIELD_RANGES.headCircumference.min}
              max={FIELD_RANGES.headCircumference.max}
              renderValue={v => v ? formatNumberWithOptionalDecimal(v, "cm", FIELD_RANGES.headCircumference.decimals) : "Not recorded"}
              error={errors.headCircumference}
            />
          </div>
        </div>
      </div>


      {/* Recalculating percentiles notifications - only show in edit mode */}
      {isEditable && isRecalculating && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg">
          <div className="flex items-center">
            <Spinner variant="basic" size="sm" color="blue" className="mr-2" />
            Recalculating percentiles... this may take a few seconds.
          </div>
        </div>
      )}
      {isEditable && recalcError && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg">
          {recalcError}
        </div>
      )}
      {/* Action Buttons for Edit Mode */}
      <div className="gradient-textarea-info rounded-xl shadow p-6 mt-8 border border-blue-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Profile Actions</h2>
        <div className="flex flex-col items-center sm:grid sm:grid-cols-2 sm:justify-items-center gap-4">
          {!isEditable && (
            <>
              <PrimaryButton variant="edit" className="w-60" onClick={onEdit}>
                Edit
              </PrimaryButton>
              <PrimaryButton variant="danger" className="w-60" onClick={onDelete}>
                Delete Profile
              </PrimaryButton>
            </>
           
          )}
             
          {isEditable && (
            <>
              <PrimaryButton
                type="submit"
                variant="primary"
                className="w-60"
                disabled={isRecalculating || saving}
                onClick={async () => {
                  if (isRecalculating || saving) return; // Prevent double submits
                  const dataToSend = {
                    ...formData,
                    // Normalize all numeric fields using the centralized utility
                    birthWeight: formData.birthWeight ? normalizeNumber(formData.birthWeight, FIELD_RANGES.birthWeight.decimals) : undefined,
                    birthHeight: formData.birthHeight ? normalizeNumber(formData.birthHeight, FIELD_RANGES.birthHeight.decimals) : undefined,
                    headCircumference: formData.headCircumference ? normalizeNumber(formData.headCircumference, FIELD_RANGES.headCircumference.decimals) : undefined,
                    gestationalWeek: formData.gestationalWeek ? normalizeNumber(formData.gestationalWeek, FIELD_RANGES.gestationalWeek.decimals) : undefined,
                  };
                  const validationErrors = validate(dataToSend);
                  setErrors(validationErrors);
                  if (Object.keys(validationErrors).length > 0) return;
                  try {
                    setSaving(true);
                    await onSave(dataToSend);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {(isRecalculating || saving) ? (
                  <Spinner variant="inline" color="white" message="Saving..." />
                ) : (
                  "Save"
                )}
              </PrimaryButton>
              <PrimaryButton type="button" variant="cancel" className="w-60" disabled={isRecalculating || saving} onClick={onCancel}>
                Cancel
              </PrimaryButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BabyProfileForm;