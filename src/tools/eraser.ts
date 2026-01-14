async function eraseAt(toX: number, toY: number, fromX: number | null, fromY: number | null, size: number): Promise<void | { lastX: number; lastY: number; }> {
  const canvas = document.getElementById("board") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.warn("Can't get canvas context");
    return;
  }

  ctx.globalCompositeOperation = "destination-out";
  ctx.lineWidth = (size || 1) * 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(0,0,0,1)";

  // protection, erase only if fromX and fromY are null
  if(fromX === null || fromY === null) {
    fromX = toX + 1; // offset it slightly to draw a dot
    fromY = toY + 1; 
  }

  // erase line from last position to current position
  ctx.save();

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  ctx.restore();

  return { lastX: toX, lastY: toY };
}

export { eraseAt };