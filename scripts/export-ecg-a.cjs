// scripts/export-ecg-a.cjs
const fs = require('fs');
const path = require('path');

function readNpy(filePath) {
  const buf = fs.readFileSync(filePath);
  const major = buf[6];
  const headerLen = major === 1 ? buf.readUInt16LE(8) : buf.readUInt32LE(8);
  const offset = (major === 1 ? 10 : 12) + headerLen;
  const header = buf.slice(major === 1 ? 10 : 12, offset).toString('latin1').trim();
  const aligned = new Uint8Array(buf.byteLength - offset);
  aligned.set(new Uint8Array(buf.buffer, buf.byteOffset + offset, buf.byteLength - offset));
  const f64 = new Float64Array(aligned.buffer);
  return { header, data: f64 };
}

const candidates = [
  path.resolve(__dirname, '../data/ECG_A'),
  'd:/Kì 9 - Nháp/ECG_A',
];
const srcDir = candidates.find((d) => fs.existsSync(path.join(d, 'ECG_test.npy'))) || candidates[0];
const outDir = path.resolve(__dirname, '../public/mock');
const tsOutFile = path.resolve(__dirname, '../src/services/lab/ecgA.data.ts');
fs.mkdirSync(outDir, { recursive: true });

const testNpy = readNpy(path.join(srcDir, 'ECG_test.npy'));
const labelNpy = readNpy(path.join(srcDir, 'ECG_test_label.npy'));
const test = testNpy.data;
const label = labelNpy.data;
const N = 1841;

// fortran_order = True -> cột 0 (Lead I) trước, cột 1 (Lead II) sau
const leadI = Array.from(test.slice(0, N)).map((v) => Number(v.toFixed(6)));
const leadII = Array.from(test.slice(N, 2 * N)).map((v) => Number(v.toFixed(6)));
const gtLabels = Array.from(label).map((v) => (v > 0 ? 1 : 0));

const payload = {
  dataset: 'ECG_A',
  shape: [N, 2],
  dtype: '<f8',
  sampleRateHz: 100, // 1 mẫu = 10ms -> tổng 18.410ms
  leads: ['I', 'II'],
  anomalyCount: 269,
  anomalyRatio: 14.61,
  groundTruthSegments: [{ startIndex: 498, endIndex: 766, startOffsetMs: 4980, endOffsetMs: 7660 }],
  signals: { I: leadI, II: leadII },
  groundTruth: gtLabels,
};

fs.writeFileSync(path.join(outDir, 'ecg_a.json'), JSON.stringify(payload));

const csv = ['I,II', ...leadI.map((v, i) => `${v},${leadII[i]}`)].join('\n');
fs.writeFileSync(path.join(outDir, 'ecg_a_test.csv'), csv);

const tsContent = `// Auto-generated from ECG_A/ECG_test.npy & ECG_test_label.npy (fortran_order: True, shape: [1841, 2], dtype: <f8)
export const ECG_A_SAMPLE_RATE_HZ = 100;
export const ECG_A_TOTAL_SAMPLES = 1841;
export const ECG_A_SHAPE: [number, number] = [1841, 2];
export const ECG_A_DTYPE = '<f8';
export const ECG_A_ANOMALY_COUNT = 269;
export const ECG_A_ANOMALY_RATIO = 14.61;
export const ECG_A_GT_RANGE = { startIndex: 498, endIndex: 766, startOffsetMs: 4980, endOffsetMs: 7660 } as const;

export const ECG_A_LEAD_I: readonly number[] = ${JSON.stringify(leadI)};
export const ECG_A_LEAD_II: readonly number[] = ${JSON.stringify(leadII)};
`;

fs.writeFileSync(tsOutFile, tsContent);
console.log(
  'Exported ECG_A successfully:',
  'N =', N,
  'Lead I range =', [Math.min(...leadI), Math.max(...leadI)],
  'Lead II range =', [Math.min(...leadII), Math.max(...leadII)],
  'GT anomalies =', gtLabels.filter((x) => x === 1).length
);

