interface PenParams {
  toX: number;
  toY: number;
  fromX: number | null;
  fromY: number | null;
  color: string;
  size?: number;
}

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
  ctx.fillStyle = color;
  for (const point of splinePoints) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, (size || 1), 0, Math.PI * 2);
    ctx.fill();
  }
}


// probably useless - ignore
async function drawPen(params: PenParams): Promise<void | { lastX: number; lastY: number; }> {
  const canvas = document.getElementById("board") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.warn("Can't get canvas context");
    return;
  }

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = params.color;
  ctx.lineWidth = (params.size || 1) * 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // protection, draw only if fromX and fromY are null
  if(params.fromX === null || params.fromY === null) {
    params.fromX = params.toX + 1; // offset it slightly to draw a dot
    params.fromY = params.toY + 1; 
  }

  // draw line from last position to current position
  ctx.beginPath();
  ctx.moveTo(params.fromX, params.fromY);
  ctx.lineTo(params.toX, params.toY);
  ctx.strokeStyle = params.color;
  ctx.stroke();

  // update last positions
  return { lastX: params.toX, lastY: params.toY };
}

export { renderPen, pushRawMousePoint, clearRawMousePoints, getRawMousePoints };
export type { PenParams };
