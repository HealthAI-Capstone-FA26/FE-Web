/**
 * Largest-Triangle-Three-Buckets: giảm mẫu giữ hình dạng tổng thể — dùng cho minimap/overview.
 * x là sample index, y là biên độ.
 */
export function lttb(data: Float32Array, threshold: number): { x: Float32Array; y: Float32Array } {
  const length = data.length;
  if (threshold >= length || threshold < 3) {
    const x = new Float32Array(length);
    for (let i = 0; i < length; i++) x[i] = i;
    return { x, y: Float32Array.from(data) };
  }

  const outX = new Float32Array(threshold);
  const outY = new Float32Array(threshold);
  const bucketSize = (length - 2) / (threshold - 2);
  let a = 0;
  outX[0] = 0;
  outY[0] = data[0];

  for (let i = 0; i < threshold - 2; i++) {
    const avgStart = Math.floor((i + 1) * bucketSize) + 1;
    const avgEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, length);
    let avgX = 0;
    let avgY = 0;
    const avgLen = Math.max(1, avgEnd - avgStart);
    for (let j = avgStart; j < avgEnd; j++) {
      avgX += j;
      avgY += data[j];
    }
    avgX /= avgLen;
    avgY /= avgLen;

    const rangeStart = Math.floor(i * bucketSize) + 1;
    const rangeEnd = Math.floor((i + 1) * bucketSize) + 1;
    const ax = a;
    const ay = data[a];
    let maxArea = -1;
    let next = rangeStart;
    for (let j = rangeStart; j < rangeEnd; j++) {
      const area = Math.abs((ax - avgX) * (data[j] - ay) - (ax - j) * (avgY - ay));
      if (area > maxArea) {
        maxArea = area;
        next = j;
      }
    }
    outX[i + 1] = next;
    outY[i + 1] = data[next];
    a = next;
  }

  outX[threshold - 1] = length - 1;
  outY[threshold - 1] = data[length - 1];
  return { x: outX, y: outY };
}

