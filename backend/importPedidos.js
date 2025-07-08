const mongoose = require("mongoose");
const xlsx = require("xlsx");
const dotenv = require("dotenv");
const path = require("path");
const moment = require("moment");
const Pedido = require("./models/Pedido"); // Adjust path if needed

dotenv.config(); // Load environment variables from .env

// Ensure MongoDB URI is set
if (!process.env.MONGODB_URI) {
  console.error("❌ Missing MONGODB_URI in .env file.");
  process.exit(1);
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Load Excel file
const filePath = path.join(__dirname, "Gestion_pedidos_corrected.xlsx");
const workbook = xlsx.readFile(filePath);
const sheetName = "Pedidos"; // Ensure this matches the sheet name exactly

if (!workbook.Sheets[sheetName]) {
  console.error(`❌ Sheet '${sheetName}' not found in the Excel file.`);
  process.exit(1);
}

const sheet = workbook.Sheets[sheetName];
const jsonData = xlsx.utils.sheet_to_json(sheet);

if (jsonData.length === 0) {
  console.error("❌ The sheet is empty or data couldn't be read.");
  process.exit(1);
}

// Helper function to safely parse numbers (allow empty string for invalid values)
const parseNumber = (value) => {
  if (typeof value === "string") {
    value = value.replace(",", ".").trim(); // Handle European decimal format
  }
  const num = Number(value);
  return isNaN(num) ? "" : num;
};

// Helper function to parse dates correctly for MongoDB
const parseDate = (value) => {
  if (!value || value === "") return null;

  // Check if it's a number (Excel serial format)
  if (typeof value === "number") {
    return new Date((value - 25569) * 86400 * 1000); // Convert Excel serial to JS Date
  }

  // Check if it's a valid date string
  const dateFormats = ["YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY", "YYYY/MM/DD", "DD-MM-YYYY"];
  const date = moment(value, dateFormats, true);

  return date.isValid() ? date.toDate() : null; // Return as JavaScript Date object
};

// Helper function to safely parse booleans (convert 'si' to true, else false)
const parseBoolean = (value) => {
  return typeof value === "string" && value.trim().toLowerCase() === "si";
};

// Transform data
const transformedData = jsonData.map((row) => ({
  tipo: row["tipo"] || "",
  descripcionInterna: row["descripcionInterna"] || "",
  fabricante: row["fabricante"] || "",
  referencia: row["referencia"] || "",
  descripcionProveedor: row["descripcionProveedor"] || "",
  solicitante: row["solicitante"] || "",
  cantidad: parseNumber(row["cantidad"]),
  precioUnidad: parseNumber(row["precioUnidad"]),
  importePedido: parseNumber(row["importePedido"]),
  fechaSolicitud: parseDate(row["fechaSolicitud"]), // Ensure column names match
  proveedor: row["proveedor"] || "",
  comentario: row["comentario"] || "",
  pedir: row["pedir"] || "",
  introducidaSAP: parseDate(row["introducidaSAP"]),
  aceptadoDireccion: parseDate(row["aceptado"]),
  direccion: row["direccion"] || "",
  recepcionPrevista: parseDate(row["recepcionPrevista"]),
  recepcionado: parseBoolean(row["recepcionado"]),
  ano: parseNumber(row["ano"]),
}));

// Log transformed data to verify
console.log("🔍 Transformed Data Sample:", transformedData.slice(0, 5)); // Show first 5 records

if (transformedData.length === 0) {
  console.error("❌ No valid data found to insert.");
  mongoose.connection.close();
  process.exit(1);
}

// Insert into MongoDB
Pedido.insertMany(transformedData)
  .then(() => {
    console.log(`✅ Successfully inserted ${transformedData.length} records into MongoDB.`);
    mongoose.connection.close();
  })
  .catch((err) => {
    console.error("❌ Error inserting data:", err);
    mongoose.connection.close();
  });
