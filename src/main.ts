import { setupWindow, clickThruShortcut } from "./window";
import { register } from "@tauri-apps/plugin-global-shortcut";
import { drawPen } from "./tools/pen";
import { eraseAt } from "./tools/eraser";

// setup

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

// track mouse position for other functions
var mouseX: number = 0;
var mouseY: number = 0;

async function mouseDownHandler(event: MouseEvent | null) {
  currentlyDrawing = true;

  let result = undefined;

  if(currentDrawingMode === DrawingMode.PEN) {
    result = await drawPen(event!.clientX, event!.clientY, lastX, lastY, penColor, penSize);
  }
  if(currentDrawingMode === DrawingMode.ERASER) {
    result = await eraseAt(event!.clientX, event!.clientY, lastX, lastY, penSize);
  }

  if(result) {
    lastX = result.lastX;
    lastY = result.lastY;
  }
  
  console.log("pressed mouse!");
}

async function mouseUpHandler() {
  if(currentlyDrawing)
    currentlyDrawing = false;

  // reset the last positions :-)
  lastX = null;
  lastY = null;

  console.log("released mouse!")
}

async function pointerEventHandler(event: PointerEvent | null) {
  // fill in coalesced events if empty
  if(event?.getCoalescedEvents().length === 0) {
    event?.getCoalescedEvents().push(event);
  }

  // process each coalesced event
  for(const e of event!.getCoalescedEvents()) {

    let result = undefined;

    // pen mode
    if(currentlyDrawing && currentDrawingMode === DrawingMode.PEN) {
      result = await drawPen(e.clientX, e.clientY, lastX, lastY, penColor, penSize);
    }

    // eraser mode
    if(currentlyDrawing && currentDrawingMode === DrawingMode.ERASER) {
      result = await eraseAt(e.clientX, e.clientY, lastX, lastY, penSize);
    }

    if(result) {
      lastX = result.lastX;
      lastY = result.lastY;
    }

    // update cursor position
    const cursor = document.getElementById("cursor") as HTMLDivElement;
    if(cursor) {
      cursor.style.transform = `translate(${e.clientX - cursor.offsetWidth / 2}px, ${e.clientY - cursor.offsetHeight / 2}px)`;
    }

    // update global mouse position
    mouseX = e.clientX;
    mouseY = e.clientY;
  }
}

async function clearCanvas() {
  const canvas = document.getElementById("board") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    console.log("Cleared the canvas");
  }
}

async function resizeCursor() {
  // update cursor size visually
  const cursor = document.getElementById("cursor") as HTMLDivElement;
  if(cursor) {
    cursor.style.width = `${penSize * 2}px`;
    cursor.style.height = `${penSize * 2}px`;
    cursor.style.transform = `translate(${mouseX - cursor.offsetWidth / 2}px, ${mouseY - cursor.offsetHeight / 2}px)`;
  }
}

async function changeCursorAppearance(borderRadius: string, borderColor?: string, fillColor?: string) {
  const cursor = document.getElementById("cursor") as HTMLDivElement;

  if(!cursor)
    return;

  cursor.style.borderRadius = borderRadius;

  if(borderColor !== undefined) {
    cursor.style.borderColor = borderColor;
  }

  if(fillColor !== undefined) {
    cursor.style.backgroundColor = fillColor;
  }
}
/*
async function setPenSize(size: number) {
  penSize = size;
  await resizeCursor();
  console.log("Set pen size to " + penSize);
}
*/
async function increasePenSize(increment: number = 1) {
  penSize += increment;
  await resizeCursor();
  console.log("Increased pen size to " + penSize);
}

async function decreasePenSize(decrement: number = 1) {
  penSize = Math.max(1, penSize - decrement);
  await resizeCursor();
  console.log("Decreased pen size to " + penSize);
}

async function switchToPenMode() {
  currentDrawingMode = DrawingMode.PEN;
  await changeCursorAppearance("100%", penColor, penColor);
  console.log("Switched to pen mode");
}

async function switchToEraserMode() {
  currentDrawingMode = DrawingMode.ERASER;
  await changeCursorAppearance("50%", "white", "transparent");
  console.log("Switched to eraser mode");
}

async function handleAppShortcuts(event: KeyboardEvent | null) {
  if(event === null) return;
  
  switch(event.key) {
    case "a":
      await switchToPenMode();
      break;
    case "s":
      await switchToEraserMode();
      break;
    case 'z':
      // clear the canvas
      await clearCanvas();
      break;
    default:
      break;
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  await setupWindow();
  await resizeCursor();
  await switchToPenMode();
  // create drawing stuff
  document.addEventListener("mousedown", mouseDownHandler);
  document.addEventListener("pointermove", pointerEventHandler);
  document.addEventListener("mouseup", mouseUpHandler);

  document.addEventListener("wheel", async (event: WheelEvent) => {
    if(event.deltaY < 0) {
      await increasePenSize();
    } else if(event.deltaY > 0) {
      await decreasePenSize();
    }
  });
  
  // create our shortcuts
  register('F6', clickThruShortcut);
  document.addEventListener("keydown", handleAppShortcuts);
});