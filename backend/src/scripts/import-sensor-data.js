const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const SensorData = require('../models/SensorData');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const args = process.argv.slice(2);
const dropExisting = args.includes('--drop') || args.includes('-d');
const csvArg = args.find((arg) => !arg.startsWith('-'));
const csvPath = csvArg
  ? path.resolve(process.cwd(), csvArg)
  : path.resolve(__dirname, '../../../powerconsumption (12).csv');

function parseDate(value) {
  const [datePart, timePart = '00:00'] = value.split(' ');
  const [month, day, year] = datePart.split('/').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hours, minutes));
}

function parseNumber(value) {
  const v = parseFloat(value.replace(',', '.'));
  return Number.isNaN(v) ? null : v;
}

async function loadCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) {
    throw new Error('CSV file is empty or missing header');
  }

  const header = lines[0].split(',').map(h => h.trim());
  const expected = [
    'Datetime',
    'Temperature',
    'Humidity',
    'WindSpeed',
    'GeneralDiffuseFlows',
    'DiffuseFlows',
    'PowerConsumption_Zone1',
    'PowerConsumption_Zone2',
    'PowerConsumption_Zone3',
    'type_equipement',
  ];

  if (header.length !== expected.length) {
    console.warn('[import] Detected header columns:', header);
  }

  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const row = lines[i].split(',');
    if (row.length < expected.length) continue;

    const datetime = parseDate(row[0]);
    const temperature = parseNumber(row[1]);
    const humidity = parseNumber(row[2]);
    const windSpeed = parseNumber(row[3]);
    const generalDiffuseFlows = parseNumber(row[4]);
    const diffuseFlows = parseNumber(row[5]);
    const consumption_zone1 = parseNumber(row[6]);
    const consumption_zone2 = parseNumber(row[7]);
    const consumption_zone3 = parseNumber(row[8]);
    const type_equipement = row[9]?.trim();
    const totalConsumption = [consumption_zone1, consumption_zone2, consumption_zone3].reduce(
      (sum, value) => sum + (value || 0),
      0,
    );

    rows.push({
      datetime,
      temperature,
      humidity,
      windSpeed,
      generalDiffuseFlows,
      diffuseFlows,
      consumption_zone1,
      consumption_zone2,
      consumption_zone3,
      totalConsumption,
      type_equipement,
      is_manual_anomaly: false,
      ai_detected_anomaly: false,
    });
  }

  return rows;
}

async function main() {
  console.log('[import] Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  if (dropExisting) {
    console.log('[import] Dropping existing SensorData documents...');
    await SensorData.deleteMany({});
  }

  console.log(`[import] Loading CSV from ${csvPath}`);
  const documents = await loadCsv(csvPath);
  console.log(`[import] Parsed ${documents.length} rows`);

  if (documents.length === 0) {
    throw new Error('No documents to insert');
  }

  // Calculate energy and cost for each document
  // Assuming 10-minute intervals, power in watts
  documents.forEach((doc) => {
    // Energy over 10 minutes: (power in watts * 10 minutes) / (1000 * 60) = power * 10 / 60000
    // Simplified: energy_kwh = totalConsumption * 10 / 60000 = totalConsumption / 6000
    doc.energy_kwh = doc.totalConsumption / 6000;

    // Estimate peak/off-peak cost
    // Assuming tariff: peak (8am-8pm) ~0.3 DT/kWh, off-peak ~0.2 DT/kWh
    const hour = doc.datetime.getUTCHours();
    const isPeak = hour >= 8 && hour < 20;
    const rate = isPeak ? 0.3 : 0.2;
    doc.cost_est = doc.energy_kwh * rate;
    doc.is_peak_hour = isPeak;
  });

  const result = await SensorData.insertMany(documents, { ordered: false });
  console.log(`[import] Inserted ${result.length} documents successfully`);
  await mongoose.disconnect();
  console.log('[import] Done');
}

main().catch((err) => {
  console.error('[import] Error:', err);
  process.exit(1);
});
