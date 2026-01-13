import { PhysicalSize, Window, currentMonitor, PhysicalPosition } from "@tauri-apps/api/window";
import { register, ShortcutEvent } from "@tauri-apps/plugin-global-shortcut";

// setup
var isIgnoringMouseEvents: boolean = false;

// drawing mode enums
enum DrawingMode {
  PEN,
  CALLIGRAPHY_PEN,
  ERASER,
  SQUARE,
  ELLIPSE,
}

// drawing config
var currentlyDrawing: boolean = false;
var currentDrawingMode: number = DrawingMode.PEN;
var penSize: number = 5;
var penColor: string = "black";

// track previous position for smooth line drawing
var lastX: number | null = null;
var lastY: number | null = null;

async function setupWindow() {
  const curr_win = await Window.getCurrent();
  const curr_mon = await currentMonitor();

  if (!curr_mon) {
    console.warn("Can't find current monitor");
    return;
  }

  const { width, height } = curr_mon.size;
  const { x, y } = curr_mon.position;

  // set the size to the thingy yeah
  await curr_win.setSize(new PhysicalSize(width, height));
  await curr_win.setPosition(new PhysicalPosition(x, y));
  await setIgnoreCursorEvents(isIgnoringMouseEvents);

  // fix canvas size
  const canvas = document.getElementById("board") as HTMLCanvasElement;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

async function setIgnoreCursorEvents(ignore: boolean) {
  const curr_win = await Window.getCurrent();
  await curr_win.setIgnoreCursorEvents(ignore);
}

async function drawPen(toX: number, toY: number, fromX: number | null, fromY: number | null, color: string, size?: number) {
  const canvas = document.getElementById("board") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.warn("Can't get canvas context");
    return;
  }

  ctx.fillStyle = color;
  ctx.lineWidth = (size || 1) * 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // protection, draw only if fromX and fromY are null
  if(fromX === null || fromY === null) {
    ctx.fillRect(toX, toY, size || 1, size || 1);
    lastX = toX;
    lastY = toY;
    return;
  }

  // draw line from last position to current position
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.strokeStyle = color;
  ctx.stroke();

  // update last positions
  lastX = toX;
  lastY = toY;
}

async function eraseAt(x: number, y: number, size: number) {
  const canvas = document.getElementById("board") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.warn("Can't get canvas context");
    return;
  }

  ctx.clearRect(x - size / 2, y - size / 2, size*2, size*2);
}

async function mouseDownHandler(event: MouseEvent | null) {
  currentlyDrawing = true;
  if(currentDrawingMode === DrawingMode.PEN)
    drawPen(event!.clientX, event!.clientY, lastX, lastY, penColor, penSize);
  if(currentDrawingMode === DrawingMode.ERASER)
    eraseAt(event!.clientX, event!.clientY, penSize);
  console.log("pressed mouse!");
}

async function mouseMoveHandler(event: MouseEvent | null) {
  // pen mode
  if(currentlyDrawing && currentDrawingMode === DrawingMode.PEN) {
    drawPen(event!.clientX, event!.clientY, lastX, lastY, penColor, penSize);
  }

  // eraser mode
  if(currentlyDrawing && currentDrawingMode === DrawingMode.ERASER) {
    eraseAt(event!.clientX, event!.clientY, penSize);
  }

  // update cursor position
  const cursor = document.getElementById("cursor") as HTMLDivElement;
  if(cursor) {
    cursor.style.transform = `translate(${event!.clientX - cursor.offsetWidth / 2}px, ${event!.clientY - cursor.offsetHeight / 2}px)`;
  }
}

async function mouseUpHandler() {
  if(currentlyDrawing)
    currentlyDrawing = false;

  // reset the last positions :-)
  if(currentDrawingMode === DrawingMode.PEN) {
    lastX = null;
    lastY = null;
  }

  console.log("released mouse!")
}

async function handleAppShortcuts(event: KeyboardEvent | null) {
  if(event === null) return;
  
  switch(event.key) {
    case "a":
      currentDrawingMode = DrawingMode.PEN;
      console.log("Switched to pen mode");
      break;
    case "s":
      currentDrawingMode = DrawingMode.ERASER;
      console.log("Switched to eraser mode");
      break;
    case 'z':
      // clear the canvas
      const canvas = document.getElementById("board") as HTMLCanvasElement;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        console.log("Cleared the canvas");
      }
      break;
    case '=':
      penSize += 1;
      console.log("increasing pen size to " + penSize);
      break;
    case '-':
      penSize -= 1;
      console.log("decreasing pen size to " + penSize);
      break;
    default:
      break;
  }
}

async function clickThruShortcut(event: ShortcutEvent | null) {
  if(event !== null && event.state !== "Pressed") {
    return; // skip released
  }

  isIgnoringMouseEvents = !isIgnoringMouseEvents;
  await setIgnoreCursorEvents(isIgnoringMouseEvents);
  console.log(`Toggled click-through mode: ${isIgnoringMouseEvents}`);
}

window.addEventListener("DOMContentLoaded", () => {
  setupWindow();
  // create drawing stuff
  document.addEventListener("mousedown", mouseDownHandler);
  document.addEventListener("mousemove", mouseMoveHandler);
  document.addEventListener("mouseup", mouseUpHandler);
  
  // create our shortcuts
  register('F6', clickThruShortcut);
  document.addEventListener("keydown", handleAppShortcuts);
});