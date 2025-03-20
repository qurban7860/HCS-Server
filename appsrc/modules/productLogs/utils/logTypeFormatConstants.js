const machineLogTypeFormats = [
  {
    type: "ERP",
    disabled: false,
    tableColumns: [
      { id: 'date', label: 'Date',},
      { id: 'machineSerialNo', label: 'Machine',},
      { id: '_id', label: 'Log ID',},
      { id: 'componentLabel', label: 'Component Label',},
      { id: 'frameSet', label: 'Frame Set',},
      { id: 'componentLength', label: 'Component Length', numerical: true },
      { id: 'waste', label: 'Waste', numerical: true },
      { id: 'coilLength', label: 'Coil Length', numerical: true },
      { id: 'flangeHeight', label: 'Flange Height', numerical: true },
      { id: 'webWidth', label: 'Web Width', numerical: true },
      { id: 'profileShape', label: 'Profile Shape',},
      { id: 'componentWeight', label: 'Component Weight', numerical: true },
      { id: 'coilBatchName', label: 'Coil Batch Name',},
      { id: 'coilThickness', label: 'Coil Thickness', numerical: true },
      { id: 'coilWidth', label: 'Coil Width', numerical: true },
      { id: 'lineSpeed', label: 'Line Speed', numerical: true },
      { id: 'mode', label: 'Mode',},
      { id: 'time', label: 'Time' },
      { id: 'operator', label: 'Operator',},
      { id: 'ComponentGUID', label: 'Component GUID',},
    ],
    numericalLengthValues: ["coilLength", "coilWidth", "coilThickness", "flangeHeight", "webWidth", "componentLength", "waste" ]
  },
  {
    type: "PRODUCTION",
    disabled: true,
    versions: ["v1.4.5"],
    formats: {
      "v1.4.5": ["date", "frameSet", "componentName", "componentLength", "flangeHeight", "webWidth", "unitOfMeasurement", "muClassifier"],
    },
    tableColumns: [
      { id: 'date', label: 'Date',},
      { id: 'frameSet', label: 'Frame Set',},
      { id: 'componentName', label: 'Component Name',},
      { id: 'componentLength', label: 'Length', numerical: true },
      { id: 'waste', label: 'Waste', numerical: true },
      { id: 'flangeHeight', label: 'Flange Height', numerical: true },
      { id: 'webWidth', label: 'Web Width', numerical: true },
      { id: 'muClassifier', label: 'MU Classifier' },
    ],
    numericalLengthValues: ["flangeHeight", "webWidth", "componentLength", "waste" ]
  },
  {
    type: "COIL",
    disabled: true,
    versions: ["v1.4.5", "v1.1.X"],
    formats: {
      "v1.1.X": ["date", "coilBatchName", "coilLength", "coilLengthUnit", "coilThickness", "coilThicknessUnit", "coilWidth", "coilWeight", "coilDensity"],
      "v1.4.5": ["date", "coilBatchName", "coilLength", "coilLengthUnit", "coilThickness", "coilThicknessUnit", "coilWidth", "coilWeight", "coilDensity", "operator"],
    },
    tableColumns: [
      { id: 'date', label: 'Date',},
      { id: 'coilBatchName', label: 'Coil Batch Name',},
      { id: 'coilLength', label: 'Coil Length', numerical: true },
      { id: 'coilThickness', label: 'Coil Thickness', numerical: true },
      { id: 'coilWeight', label: 'Coil Weight', numerical: true },
      { id: 'coilWidth', label: 'Coil Width', numerical: true },
      { id: 'coilDensity', label: 'Coil Density', numerical: true },
      { id: 'operator', label: 'Oerator' },
    ],
    numericalLengthValues: ["coilLength", "coilWidth", "coilThickness" ]
  },
  {
    type: "TOOLCOUNT",
    disabled: true,
  },
  {
    type: "WASTE",
    disabled: true,
  },
]

module.exports = { machineLogTypeFormats };