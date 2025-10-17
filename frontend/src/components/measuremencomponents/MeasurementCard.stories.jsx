import MeasurementCard from "./MeasurementCard";

const sampleMeasurement = {
  dataId: "measure-001",
  measurementDate: "2024-09-05",
  createdAt: "2024-09-05T14:30:00Z",
  measurementSource: "Pediatric visit",
  notes: "Patient was calm during measurement.",
  measurements: {
    weight: 6200,
    height: 64.3,
    headCircumference: 41.2
  },
  percentiles: {
    weight: 54,
    height: 61,
    headCircumference: 48
  }
};

const birthMeasurement = {
  ...sampleMeasurement,
  dataId: "measure-birth",
  measurementDate: "2023-12-01",
  createdAt: "2023-12-01T08:15:00Z",
  measurementSource: "Hospital",
  notes: "Birth stats recorded immediately after delivery.",
  measurements: {
    weight: 3250,
    height: 50,
    headCircumference: 34
  },
  percentiles: {
    weight: 40,
    height: 45,
    headCircumference: 38
  }
};

const Template = (args) => (
  <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-[60vh] p-6">
    <div className="max-w-3xl mx-auto">
      <MeasurementCard {...args} />
    </div>
  </div>
);

export default {
  title: "Components/MeasurementCard",
  component: MeasurementCard,
  parameters: {
    docs: {
      description: {
        component:
          "Card layout used to display a single growth measurement with percentiles, source information and quick actions."
      }
    }
  },
  argTypes: {
    showActions: {
      control: "boolean",
      description: "Display the contextual action menu."
    },
    compact: {
      control: "boolean",
      description: "Render the condensed version for dense lists."
    }
  }
};

export const Default = Template.bind({});
Default.args = {
  measurement: sampleMeasurement,
  birthDate: "2023-12-01",
  showActions: true,
  compact: false,
  onEdit: (measurement) => console.log("Edit measurement", measurement.dataId),
  onDelete: (measurement) => console.log("Delete measurement", measurement.dataId)
};
Default.parameters = {
  docs: {
    description: {
      story:
        "Standard card presentation for a routine measurement, including actions and percentile highlights."
    }
  }
};

export const BirthMeasurement = Template.bind({});
BirthMeasurement.args = {
  measurement: birthMeasurement,
  birthDate: "2023-12-01",
  showActions: true,
  compact: false,
  onEdit: () => console.log("Attempted edit on birth measurement"),
  onDelete: () => console.log("Attempted delete on birth measurement")
};
BirthMeasurement.parameters = {
  docs: {
    description: {
      story:
        "Birth measurement style emphasises the card background and prevents actions, reflecting current UX behaviour."
    }
  }
};

export const CompactList = (args) => (
  <div className="bg-gray-50 min-h-[40vh] p-6">
    <div className="max-w-2xl mx-auto space-y-4">
      <MeasurementCard
        {...args}
        measurement={birthMeasurement}
        compact
        showActions={false}
      />
      <MeasurementCard
        {...args}
        measurement={sampleMeasurement}
        compact
      />
      <MeasurementCard
        {...args}
        measurement={{
          ...sampleMeasurement,
          dataId: "measure-002",
          measurementDate: "2024-10-12",
          measurements: {
            weight: 6480,
            height: 65.4,
            headCircumference: 41.6
          },
          percentiles: {
            weight: 59,
            height: 64,
            headCircumference: 52
          },
          notes: ""
        }}
        compact
      />
    </div>
  </div>
);
CompactList.args = {
  birthDate: "2023-12-01",
  onEdit: (measurement) => console.log("Edit measurement", measurement.dataId),
  onDelete: (measurement) => console.log("Delete measurement", measurement.dataId)
};
CompactList.parameters = {
  docs: {
    description: {
      story:
        "Compact cards fit into dense layouts such as timeline lists while keeping percentile context readable."
    }
  }
};
