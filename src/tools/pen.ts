const rawMousePoints: Array<{ x: number; y: number; }> = [];

async function pushRawMousePoint(x: number, y: number): Promise<void> {
  rawMousePoints.push({ x, y });
}

async function clearRawMousePoints(): Promise<Array<{ x: number; y: number; }>> {
  const points = [...rawMousePoints];
  rawMousePoints.length = 0;
  return points;
}

async function getRawMousePoints(): Promise<Array<{ x: number; y: number; }>> {
  return rawMousePoints;
}

// render
async function renderPen(splinePoints: Array<{ x: number; y: number; }>, color: string, size?: number): Promise<void> {
  const canvas = document.getElementById("board") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.warn("Can't get canvas context");
    return;
  }

  // draw a circle at each point
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = color;
  for (const point of splinePoints) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, (size || 1), 0, Math.PI * 2);
    ctx.fill();
  }
}

export { renderPen, pushRawMousePoint, clearRawMousePoints, getRawMousePoints };