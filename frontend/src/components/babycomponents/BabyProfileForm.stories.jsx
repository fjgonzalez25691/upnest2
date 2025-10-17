import BabyProfileForm from "./BabyProfileForm";

const sampleBaby = {
  babyId: "baby-001",
  name: "Ava Thompson",
  gender: "Female",
  dateOfBirth: "2023-12-01",
  premature: true,
  gestationalWeek: 35,
  birthWeight: 3200,
  birthHeight: 49,
  headCircumference: 33.5,
  allergies: "Milk protein sensitivity",
  medicalNotes: "Monitor weight gain during the next visit."
};

const Template = (args) => (
  <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-[80vh] p-6">
    <div className="max-w-4xl mx-auto">
      <BabyProfileForm {...args} />
    </div>
  </div>
);

export default {
  title: "Components/BabyProfileForm",
  component: BabyProfileForm,
  parameters: {
    docs: {
      description: {
        component:
          "Rich form surface that consolidates baby profile details, handles edit mode, and highlights recalculation state."
      }
    }
  },
  argTypes: {
    isEditable: {
      control: "boolean",
      description: "Toggle edit mode for inline form controls."
    },
    isRecalculating: {
      control: "boolean",
      description: "Show recalculation banner and loading states."
    },
    recalcError: {
      control: "text",
      description: "Optional error banner while recalculation fails."
    }
  }
};

export const Overview = Template.bind({});
Overview.args = {
  baby: sampleBaby,
  isEditable: false,
  isRecalculating: false,
  recalcError: "",
  onSave: (data) => console.log("Save profile", data),
  onCancel: () => console.log("Cancel edit"),
  onEdit: () => console.log("Enter edit mode"),
  onDelete: () => console.log("Delete profile"),
  onAdd: () => console.log("Add measurement")
};
Overview.parameters = {
  docs: {
    description: {
      story:
        "Read-only presentation mirrors what the caregiver sees by default, including birth stats and calculated age."
    }
  }
};

export const EditableState = Template.bind({});
EditableState.args = {
  baby: sampleBaby,
  isEditable: true,
  isRecalculating: false,
  recalcError: "",
  onSave: (data) => console.log("Save profile", data),
  onCancel: () => console.log("Cancel edit"),
  onEdit: () => console.log("Enter edit mode"),
  onDelete: () => console.log("Delete profile"),
  onAdd: () => console.log("Add measurement")
};
EditableState.parameters = {
  docs: {
    description: {
      story:
        "Edit mode surfaces inline inputs and date pickers while retaining contextual layout and token usage."
    }
  }
};

export const RecalculationPending = Template.bind({});
RecalculationPending.args = {
  baby: sampleBaby,
  isEditable: false,
  isRecalculating: true,
  recalcError: "",
  onSave: (data) => console.log("Save profile", data),
  onCancel: () => console.log("Cancel edit"),
  onEdit: () => console.log("Enter edit mode"),
  onDelete: () => console.log("Delete profile"),
  onAdd: () => console.log("Add measurement")
};
RecalculationPending.parameters = {
  docs: {
    description: {
      story:
        "Demonstrates the translucent overlay and informative messaging used while backend recalculation is running."
    }
  }
};

export const RecalculationError = Template.bind({});
RecalculationError.args = {
  baby: sampleBaby,
  isEditable: false,
  isRecalculating: false,
  recalcError: "The recalculation service is unavailable. Please retry shortly.",
  onSave: (data) => console.log("Save profile", data),
  onCancel: () => console.log("Cancel edit"),
  onEdit: () => console.log("Enter edit mode"),
  onDelete: () => console.log("Delete profile"),
  onAdd: () => console.log("Add measurement")
};
RecalculationError.parameters = {
  docs: {
    description: {
      story:
        "Error notices appear inline to keep caregivers informed when recalculation or synchronization fails."
    }
  }
};
