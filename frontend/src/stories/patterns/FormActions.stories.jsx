import PrimaryButton from "../../components/PrimaryButton";
import TextBox from "../../components/TextBox";

const FormGroup = ({ title, children }) => (
  <section className="bg-white rounded-3xl shadow-lg border border-blue-100 p-6 space-y-4">
    <div>
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-600">
        Stack spacing and consistent tokens keep multi-field sections tidy.
      </p>
    </div>
    {children}
  </section>
);

export default {
  title: "Patterns/FormActions",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Form grouping pattern that applies shared spacing, label positioning, and actionable footers using existing components."
      }
    }
  }
};

export const InlineForm = () => (
  <div className="w-full max-w-3xl space-y-6">
    <FormGroup title="Guardian details">
      <div className="grid gap-4 md:grid-cols-2">
        <TextBox
          label="Full name"
          name="guardianName"
          editable
          placeholder="Enter guardian full name"
        />
        <TextBox
          label="Contact email"
          name="guardianEmail"
          type="email"
          editable
          placeholder="name@example.com"
        />
        <TextBox
          label="Phone number"
          name="guardianPhone"
          editable
          placeholder="+34 600 000 000"
        />
        <TextBox
          label="Relationship"
          name="guardianRelation"
          type="select"
          editable
          options={[
            { value: "mother", label: "Mother" },
            { value: "father", label: "Father" },
            { value: "guardian", label: "Guardian" },
            { value: "other", label: "Other" }
          ]}
        />
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Use `md:flex-row` breakpoints to keep actions aligned without hardcoded
          widths.
        </p>
        <div className="flex gap-3 justify-end">
          <PrimaryButton variant="cancel" size="compact">
            Cancel
          </PrimaryButton>
          <PrimaryButton variant="primary" className="px-8">
            Save guardian
          </PrimaryButton>
        </div>
      </div>
    </FormGroup>

    <FormGroup title="Measurement preferences">
      <div className="grid gap-4 md:grid-cols-3">
        <TextBox
          label="Units"
          name="units"
          type="select"
          editable
          options={[
            { value: "metric", label: "Metric (kg, cm)" },
            { value: "imperial", label: "Imperial (lb, in)" }
          ]}
        />
        <TextBox
          label="Reminder frequency"
          name="reminderFrequency"
          type="select"
          editable
          options={[
            { value: "weekly", label: "Weekly" },
            { value: "biweekly", label: "Every two weeks" },
            { value: "monthly", label: "Monthly" }
          ]}
        />
        <TextBox
          label="Preferred channel"
          name="channel"
          type="select"
          editable
          options={[
            { value: "email", label: "Email" },
            { value: "sms", label: "SMS" },
            { value: "push", label: "Mobile push notification" }
          ]}
        />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Footer copy guides the caregiver and explains next steps.
        </p>
        <PrimaryButton variant="success" className="px-8">
          Update preferences
        </PrimaryButton>
      </div>
    </FormGroup>
  </div>
);
InlineForm.parameters = {
  docs: {
    description: {
      story:
        "Two-section form pattern showcasing consistent spacing (grid gap tokens) and responsive action bars."
    }
  }
};
