/**
 * Min-max decimation theo cột pixel: với mỗi cột giữ min & max (theo đúng thứ tự xuất hiện)
 * để KHÔNG làm mất đỉnh R của phức bộ QRS (trung bình sẽ làm bẹt đỉnh).
 *
 * Ghi kết quả vào `out` (cặp x,y liên tiếp) để tái sử dụng bộ nhớ giữa các frame.
 * Trả về số điểm đã ghi.
 */
export function minMaxDecimate(
  read: (index: number) => number,
  startIndex: number,
  endIndex: number,
  pixelWidth: number,
  out: Float32Array,
): number {
  const count = endIndex - startIndex;
  if (count <= 0 || pixelWidth <= 0) return 0;
  const maxPoints = out.length >> 1;

  // Đủ thưa để vẽ trực tiếp.
  if (count <= pixelWidth * 2) {
    const n = Math.min(count, maxPoints);
    for (let i = 0; i < n; i++) {
      out[i * 2] = startIndex + i;
      out[i * 2 + 1] = read(startIndex + i);
    }
    return n;
  }

  const columns = Math.max(1, Math.floor(pixelWidth));
  const perColumn = count / columns;
  let written = 0;
  for (let c = 0; c < columns && written + 2 <= maxPoints; c++) {
    const from = startIndex + Math.floor(c * perColumn);
    const to = Math.min(endIndex, startIndex + Math.floor((c + 1) * perColumn));
    if (to <= from) continue;
    let minV = Infinity;
    let maxV = -Infinity;
    let minI = from;
    let maxI = from;
    for (let i = from; i < to; i++) {
      const v = read(i);
      if (v < minV) { minV = v; minI = i; }
      if (v > maxV) { maxV = v; maxI = i; }
    }
    if (minI <= maxI) {
      out[written * 2] = minI; out[written * 2 + 1] = minV; written++;
      out[written * 2] = maxI; out[written * 2 + 1] = maxV; written++;
    } else {
      out[written * 2] = maxI; out[written * 2 + 1] = maxV; written++;
      out[written * 2] = minI; out[written * 2 + 1] = minV; written++;
    }
  }
  return written;
}

