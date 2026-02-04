import { DrawingMode, EraserAction } from "../types";

// eraser action
async function createEraserAction(initialPoint: { x: number; y: number; }, size: number): Promise<EraserAction> {
  const eraserAction: EraserAction = {
    type: DrawingMode.ERASER,
    timestamp: Date.now(),
    points: [initialPoint],
    size,
  };
  return eraserAction;
}

// render
async function renderErase(splinePoints: Array<{ x: number; y: number; }>, size: number, canvas: HTMLCanvasElement): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.warn("Can't get canvas context");
    return;
  }

  // erase a circle at each point
  ctx.globalCompositeOperation = "destination-out";
  for (const point of splinePoints) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export { renderErase, createEraserAction };