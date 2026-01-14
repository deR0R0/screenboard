async function eraseAt(x: number, y: number, size: number) {
  const canvas = document.getElementById("board") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.warn("Can't get canvas context");
    return;
  }

  ctx.clearRect(x - size / 2, y - size / 2, size*2, size*2);
}

export { eraseAt };