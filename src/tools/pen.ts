async function drawPen(toX: number, toY: number, fromX: number | null, fromY: number | null, color: string, size?: number): Promise<void | { lastX: number; lastY: number; }> {
  const canvas = document.getElementById("board") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.warn("Can't get canvas context");
    return;
  }

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = color;
  ctx.lineWidth = (size || 1) * 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // protection, draw only if fromX and fromY are null
  if(fromX === null || fromY === null) {
    fromX = toX + 1; // offset it slightly to draw a dot
    fromY = toY + 1; 
  }

  // draw line from last position to current position
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.strokeStyle = color;
  ctx.stroke();

  // update last positions
  return { lastX: toX, lastY: toY };
}

export { drawPen };