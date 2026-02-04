import { DrawingMode, PenAction } from "../types";

// pen action
async function createPenAction(initialPoint: { x: number; y: number; }, color: string, size: number): Promise<PenAction> {
  const penAction: PenAction = {
    type: DrawingMode.PEN,
    points: [initialPoint],
    color: color,
    size: size,
    timestamp: Date.now()
  }
  return penAction;
}

// render
async function renderPen(splinePoints: Array<{ x: number; y: number; }>, color: string, canvas: HTMLCanvasElement, size?: number): Promise<void> {
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

export { renderPen, createPenAction };