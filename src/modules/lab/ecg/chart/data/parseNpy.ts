import type { EcgSignal } from '../../../../../types/ecg';
import { lttb } from '../math/lttb';

interface NpyHeader {
  descr: string;
  fortranOrder: boolean;
  shape: number[];
  dataOffset: number;
}

function parseNpyHeader(buffer: ArrayBuffer): NpyHeader {
  const bytes = new Uint8Array(buffer);
  if (
    bytes.length < 10 ||
    bytes[0] !== 0x93 ||
    bytes[1] !== 0x4e ||
    bytes[2] !== 0x55 ||
    bytes[3] !== 0x4d ||
    bytes[4] !== 0x50 ||
    bytes[5] !== 0x59
  ) {
    throw new Error('Tệp .npy không hợp lệ (sai magic header NumPy).');
  }
  const major = bytes[6];
  const view = new DataView(buffer);
  const headerLen = major === 1 ? view.getUint16(8, true) : view.getUint32(8, true);
  const headerStart = major === 1 ? 10 : 12;
  const headerText = new TextDecoder('latin1').decode(bytes.slice(headerStart, headerStart + headerLen));

  const descrMatch = headerText.match(/'descr'\s*:\s*'([^']+)'/);
  const fortranMatch = headerText.match(/'fortran_order'\s*:\s*(True|False)/);
  const shapeMatch = headerText.match(/'shape'\s*:\s*\(([^)]*)\)/);
  if (!descrMatch || !shapeMatch) {
    throw new Error('Không đọc được metadata của tệp .npy.');
  }

  const shape = shapeMatch[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number);
  if (shape.length !== 2 || shape.some((n) => !Number.isInteger(n) || n <= 0)) {
    throw new Error(`Tệp .npy phải là mảng 2 chiều (steps x kênh), nhận shape (${shape.join(', ')}).`);
  }

  return {
    descr: descrMatch[1],
    fortranOrder: fortranMatch?.[1] === 'True',
    shape,
    dataOffset: headerStart + headerLen,
  };
}

function readElement(view: DataView, byteOffset: number, descr: string): number {
  const littleEndian = descr[0] !== '>';
  const kind = descr.slice(1);
  switch (kind) {
    case 'f8':
      return view.getFloat64(byteOffset, littleEndian);
    case 'f4':
      return view.getFloat32(byteOffset, littleEndian);
    case 'i4':
      return view.getInt32(byteOffset, littleEndian);
    case 'i2':
      return view.getInt16(byteOffset, littleEndian);
    case 'i1':
      return view.getInt8(byteOffset);
    case 'u1':
      return view.getUint8(byteOffset);
    default:
      throw new Error(`Chưa hỗ trợ kiểu dữ liệu NumPy '${descr}'.`);
  }
}

function bytesPerElement(descr: string): number {
  const size = Number(descr.slice(2));
  if (!Number.isInteger(size) || size <= 0) {
    throw new Error(`Kiểu dữ liệu NumPy không hợp lệ: '${descr}'.`);
  }
  return size;
}

/**
 * Parse tệp NumPy `.npy` (2D: steps x leads hoặc leads x steps) thành `EcgSignal` để xem trước & vẽ biểu đồ.
 */
export function parseNpyBuffer(
  buffer: ArrayBuffer,
  sampleRateHz: number,
  leadNames: string[],
  overviewPoints = 1600,
): EcgSignal {
  const { descr, fortranOrder, shape, dataOffset } = parseNpyHeader(buffer);
  const elemBytes = bytesPerElement(descr);
  const view = new DataView(buffer);

  // Nếu shape[0] nhỏ (<= 16) và shape[1] > shape[0], hiểu là (leads, steps); ngược lại là (steps, leads).
  const transposed = shape[0] <= 16 && shape[1] > shape[0];
  const steps = transposed ? shape[1] : shape[0];
  const numLeads = transposed ? shape[0] : shape[1];

  const leads = Array.from({ length: numLeads }, () => new Float32Array(steps));
  const [rows, cols] = shape;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const linearIdx = fortranOrder ? c * rows + r : r * cols + c;
      const val = readElement(view, dataOffset + linearIdx * elemBytes, descr);
      const safe = Number.isFinite(val) ? val : 0;
      if (transposed) leads[r][c] = safe;
      else leads[c][r] = safe;
    }
  }

  // Đổi µV -> mV nếu biên độ lớn
  let peak = 0;
  for (const lead of leads) {
    for (let i = 0; i < lead.length; i += 7) {
      const a = Math.abs(lead[i]);
      if (a > peak) peak = a;
    }
  }
  if (peak > 50) {
    for (const lead of leads) for (let i = 0; i < lead.length; i++) lead[i] /= 1000;
  }

  const resolvedNames = Array.from({ length: numLeads }, (_, i) =>
    leadNames[i] || (numLeads === 2 ? (i === 0 ? 'II' : 'V5') : `L${i + 1}`),
  );
  const overview = leads.map((samples) => lttb(samples, overviewPoints));

  return {
    sampleRateHz,
    leadNames: resolvedNames,
    leads,
    durationMs: Math.round((steps / sampleRateHz) * 1000),
    overview,
  };
}
