require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Machine = require("../appsrc/modules/products/models/product");
const MachineTechParam = require("../appsrc/modules/products/models/productTechParam");
const MachineTechParamValue = require("../appsrc/modules/products/models/productTechParamValue");
const MachineStatus = require("../appsrc/modules/products/models/productStatus");
const MachineModel = require("../appsrc/modules/products/models/productModel");
const Customer = require("../appsrc/modules/crm/models/customer");

const TECH_PARAMS_CONFIG = [
  { code: "HLCSoftwareVersion", displayName: "HLC Software Version" },
  { code: "PLCSWVersion", displayName: "PLC Software Version" },
];

async function connectDB() {
  const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    dbName: "howickDB",
  };

  await mongoose.connect(process.env.MONGODB_URI, mongoOptions);
  console.log("Connected to MongoDB");
}

async function getMachinesWithVersions() {
  const machines = await Machine.find({})
    .populate("status")
    .populate("machineModel", "name")
    .populate("customer", "name")
    .select("serialNo machineModel customer")
    .lean()
    .then((machines) => machines.filter((m) => m.status?.name !== "Transferred" || m.status?.name !== "Decommissioned"));

  console.log(`Found ${machines.length} machines`);

  const techParams = await MachineTechParam.find({
    code: { $in: TECH_PARAMS_CONFIG.map((config) => config.code) },
  }).lean();

  console.log(`Found ${techParams.length} tech params`);

  const paramValues = await MachineTechParamValue.find({
    machine: { $in: machines.map((m) => m._id) },
    techParam: { $in: techParams.map((tp) => tp._id) },
  }).lean();

  console.log(`Found ${paramValues.length} param values`);

  const result = machines.map((machine) => {
    const machineValues = paramValues.filter((pv) => pv.machine.toString() === machine._id.toString());

    const baseData = {
      serialNo: machine.serialNo,
      machineModelName: machine.machineModel?.name,
      customerName: machine.customer?.name,
    };

    TECH_PARAMS_CONFIG.forEach((config) => {
      const value = machineValues.find((mv) => techParams.find((tp) => tp._id.toString() === mv.techParam.toString() && tp.code.includes(config.code)))?.techParamValue;

      baseData[config.displayName] = value || null;
    });

    return baseData;
  });

  return result;
}

function escapeCSVValue(value) {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

async function generateCSV(data) {
  const headers = ["serialNo", "machineModelName", "customerName", ...TECH_PARAMS_CONFIG.map((config) => config.displayName)];

  const csvRows = [headers];

  data.forEach((item) => {
    const row = [
      escapeCSVValue(item.serialNo),
      escapeCSVValue(item.machineModelName),
      escapeCSVValue(item.customerName),
      ...TECH_PARAMS_CONFIG.map((config) => escapeCSVValue(item[config.displayName])),
    ];
    csvRows.push(row);
  });

  const csvContent = csvRows.map((row) => row.join(",")).join("\n");
  const currentDate = new Date().toISOString().split("T")[0];
  const reportsDir = path.join(process.cwd(), "generatedReports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
  }
  const outputPath = path.join(reportsDir, `machines_param_value_report_${currentDate}.csv`);
  fs.writeFileSync(outputPath, csvContent);
  console.log(`CSV file generated at: ${outputPath}`);
}

async function main() {
  await connectDB();

  // Verify connection with count
  const machineCount = await Machine.countDocuments({});
  console.log(`Total machines in database: ${machineCount}`);

  const results = await getMachinesWithVersions();
  console.table(results);
  await generateCSV(results);
  await mongoose.disconnect();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
