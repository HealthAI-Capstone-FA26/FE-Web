import { lttb } from '../math/lttb';

/** Kết quả parse dạng transferable (chỉ ArrayBuffer + metadata). */
export interface ParsedSignalPayload {
  sampleRateHz: number;
  leadNames: string[];
  leads: Float32Array[];
  overview: { x: Float32Array; y: Float32Array }[];
}

export interface ParseRequest {
  format: 'csv' | 'json';
  text: string;
  sampleRateHz: number;
  leadNames: string[];
  overviewPoints: number;
}

const TIME_COLUMN = /^(t|time|time_?s|time_?ms|timestamp|sample|index|idx)$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toFloat32(values: unknown): Float32Array | null {
  if (!Array.isArray(values)) return null;
  const out = new Float32Array(values.length);
  for (let i = 0; i < values.length; i++) {
    const v = Number(values[i]);
    out[i] = Number.isFinite(v) ? v : 0;
  }
  return out;
}

/** Nếu biên độ trông như µV (|max| > 50) thì đổi sang mV. */
function normalizeUnits(leads: Float32Array[]): void {
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
}

function parseCsv(text: string, fallbackNames: string[]): { names: string[]; leads: Float32Array[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error('Tệp CSV không có dữ liệu.');
  const delimiter = lines[0].includes(';') && !lines[0].includes(',') ? ';' : lines[0].includes('\t') ? '\t' : ',';
  const firstCells = lines[0].split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''));
  const hasHeader = firstCells.some((c) => c !== '' && Number.isNaN(Number(c)));
  const header = hasHeader ? firstCells : firstCells.map((_, i) => fallbackNames[i] ?? `L${i + 1}`);
  const keep = header.map((name, i) => ({ name, i })).filter((c) => !TIME_COLUMN.test(c.name));
  const rows = hasHeader ? lines.slice(1) : lines;
  const leads = keep.map(() => new Float32Array(rows.length));
  for (let r = 0; r < rows.length; r++) {
    const cells = rows[r].split(delimiter);
    for (let k = 0; k < keep.length; k++) {
      const v = Number(cells[keep[k].i]);
      leads[k][r] = Number.isFinite(v) ? v : 0;
    }
  }
  return { names: keep.map((c) => c.name), leads };
}

function parseJson(text: string, fallbackNames: string[]): { names: string[]; leads: Float32Array[]; fs?: number } {
  const root: unknown = JSON.parse(text);
  const fs = isRecord(root) ? Number(root.sampleRateHz ?? root.sampleRate ?? root.fs) : Number.NaN;
  const fsOut = Number.isFinite(fs) && fs > 0 ? fs : undefined;

  // { leads: { I: [...], II: [...] } } hoặc { signals: { ... } }
  const mapLike = isRecord(root) ? (root.leads ?? root.signals ?? root.data) : root;
  if (isRecord(mapLike)) {
    const names: string[] = [];
    const leads: Float32Array[] = [];
    for (const [name, values] of Object.entries(mapLike)) {
      const arr = toFloat32(values);
      if (arr) { names.push(name); leads.push(arr); }
    }
    if (leads.length) return { names, leads, fs: fsOut };
  }

  // { leadNames: [...], data: [[lead0...],[lead1...]] } hoặc mảng 2 chiều thuần
  if (Array.isArray(mapLike) && mapLike.length > 0) {
    const names = isRecord(root) && Array.isArray(root.leadNames) ? root.leadNames.map(String) : fallbackNames;
    if (Array.isArray(mapLike[0])) {
      const matrix = mapLike as unknown[][];
      // Nhận diện dạng [sample][lead] (nhiều hàng, ít cột) → chuyển vị.
      const sampleMajor = matrix.length > matrix[0].length;
      if (sampleMajor) {
        const numLeads = matrix[0].length;
        const leads = Array.from({ length: numLeads }, () => new Float32Array(matrix.length));
        for (let s = 0; s < matrix.length; s++) {
          for (let l = 0; l < numLeads; l++) {
            const v = Number(matrix[s][l]);
            leads[l][s] = Number.isFinite(v) ? v : 0;
          }
        }
        return { names: leads.map((_, i) => names[i] ?? `L${i + 1}`), leads, fs: fsOut };
      }
      const leads = matrix.map((row) => toFloat32(row) ?? new Float32Array(0));
      return { names: leads.map((_, i) => names[i] ?? `L${i + 1}`), leads, fs: fsOut };
    }
    const single = toFloat32(mapLike);
    if (single) return { names: [names[0] ?? 'II'], leads: [single], fs: fsOut };
  }
  throw new Error('Không nhận diện được cấu trúc JSON tín hiệu.');
}

export function parseSignalText(req: ParseRequest): ParsedSignalPayload {
  const parsed: { names: string[]; leads: Float32Array[]; fs?: number } =
    req.format === 'csv' ? parseCsv(req.text, req.leadNames) : parseJson(req.text, req.leadNames);
  const sampleRateHz = parsed.fs ?? req.sampleRateHz;
  normalizeUnits(parsed.leads);
  return {
    sampleRateHz,
    leadNames: parsed.names,
    leads: parsed.leads,
    overview: parsed.leads.map((lead) => lttb(lead, req.overviewPoints)),
  };
}

export function collectTransferables(payload: ParsedSignalPayload): ArrayBuffer[] {
  const list: ArrayBuffer[] = [];
  for (const l of payload.leads) list.push(l.buffer as ArrayBuffer);
  for (const o of payload.overview) list.push(o.x.buffer as ArrayBuffer, o.y.buffer as ArrayBuffer);
  return list;
}
