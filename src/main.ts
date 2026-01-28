import { setupWindow, clickThruShortcut } from "./window";
import { register } from "@tauri-apps/plugin-global-shortcut";
import { renderPen, getRawMousePoints, pushRawMousePoint, clearRawMousePoints } from "./tools/pen";
import { eraseAt } from "./tools/eraser";
import { isDraggingToolbar, moveToolbar, releaseToolbar, selectToolbar, toggleToolbar } from "./toolbar";
import { drawFountainPen } from "./fountainPen";
import { DrawingMode } from "./types";
import type { Action, PenAction } from "./types";
import { catmullromSpline, cubicBezier } from "./utils/catmullromSpline";

// drawing config
var currentlyDrawing: boolean = false;
var currentDrawingMode: DrawingMode = DrawingMode.PEN;
var penSize: number = 5;
var penColor: string = "black";
var penQuality: number = 3;

// cemented history
var cementedHistory: Action[] = [];
var activeState: Action[] = []; // TODO: implement active state along with the active canvas

// track previous position for smooth line drawing
var lastX: number | null = null;
var lastY: number | null = null;

// track mouse position for other functions
var mouseX: number = 0;
var mouseY: number = 0;


async function render() {
  // clear canvas
  const canvas = document.getElementById("board") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.warn("Can't get canvas context");
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  console.log(cementedHistory);

  // render cemented history
  for(const action of cementedHistory) {
    if(action.type === DrawingMode.PEN) {
      const penAction = action as PenAction;
      // run the catmull-rom spline on the mouse points
      const splinePoints = await catmullromSpline(penAction.points, penSize, penQuality);
      // render the pen action
      await renderPen(splinePoints, penAction.color, penAction.size);
    }
  }
}

async function mouseDownHandler(event: MouseEvent | null) {
  // prevent drawing or other of any kind before moving toolbar
  if((event?.target as HTMLElement).closest("#drag-region")) {
    await selectToolbar(event!.clientX, event!.clientY, event?.target as HTMLElement | null);
    return;
  }

  // if box button is clicked
  if((event?.target as HTMLElement).closest("#open-toolbox")) {
    await toggleToolbar();
    return;
  }

  if((event?.target as HTMLElement).closest("#toolbar")) {
    return; // do nothing if other parts of toolbar are clicked
  }

  // drawing stuff
  currentlyDrawing = true;

  let result = undefined;

  if(currentDrawingMode === DrawingMode.PEN) {
    //result = await drawPen({ toX: event!.clientX, toY: event!.clientY, fromX: lastX, fromY: lastY, color: penColor, size: penSize });
    await pushRawMousePoint(event!.clientX, event!.clientY);
    await changeCursorAppearance("100%", penColor, "1px", penColor);
  }

  if(currentDrawingMode === DrawingMode.ERASER) {
    result = await eraseAt(event!.clientX, event!.clientY, lastX, lastY, penSize);
  }

  if(result) {
    lastX = result.lastX;
    lastY = result.lastY;
  }

  // log
  console.log("pressed mouse!");
}

async function mouseUpHandler() {
  if(currentlyDrawing)
    currentlyDrawing = false;

  // reset the outline after drawing
  if(currentDrawingMode === DrawingMode.PEN) {
    await changeCursorAppearance("100%", "white", "1px", penColor);

    // push the raw mouse points to the cemented history
    
    // get points and clear
    const points = [...await clearRawMousePoints()];
    
    // create a new action
    const action: PenAction = {
      type: DrawingMode.PEN,
      points: points,
      color: penColor,
      size: penSize,
      timestamp: Date.now()
    }

    cementedHistory.push(action);
  }

  // reset the last positions :-)
  lastX = null;
  lastY = null;

  await releaseToolbar();

  // render our cemented history for testing
  console.log("rendering...");
  await render();
  console.log("rendered!");
}

async function pointerEventHandler(event: PointerEvent | null) {
  // fill in coalesced events if empty
  if(event?.getCoalescedEvents().length === 0) {
    event?.getCoalescedEvents().push(event);
  }

  // process each coalesced event
  for(const e of event!.getCoalescedEvents()) {
    // update global mouse position
    mouseX = e.clientX;
    mouseY = e.clientY;

    // update cursor position
    const cursor = document.getElementById("cursor") as HTMLDivElement;
    if(cursor) {
      cursor.style.transform = `translate(${e.clientX - cursor.offsetWidth / 2}px, ${e.clientY - cursor.offsetHeight / 2}px)`;
    }

    let result = undefined;

    if(await isDraggingToolbar()) {
      // move ze toolbar
      await moveToolbar(e.clientX, e.clientY);
      return;
    }

    // pen mode
    if(currentlyDrawing && currentDrawingMode === DrawingMode.PEN) {
      //result = await drawPen({ toX: e.clientX, toY: e.clientY, fromX: lastX, fromY: lastY, color: penColor, size: penSize });
      await pushRawMousePoint(e.clientX, e.clientY);
    }

    // eraser mode
    if(currentlyDrawing && currentDrawingMode === DrawingMode.ERASER) {
      result = await eraseAt(e.clientX, e.clientY, lastX, lastY, penSize);
    }

    if(result) {
      lastX = result.lastX;
      lastY = result.lastY;
    }
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

async function changeCursorAppearance(borderRadius: string, borderColor?: string, borderWidth?: string, fillColor?: string) {
  const cursor = document.getElementById("cursor") as HTMLDivElement;

  if(!cursor)
    return;

  cursor.style.borderRadius = borderRadius;

  if(borderColor !== undefined) {
    cursor.style.borderColor = borderColor;
  }

  if(borderWidth !== undefined) {
    cursor.style.borderWidth = borderWidth;
  }

  if(fillColor !== undefined) {
    cursor.style.backgroundColor = fillColor;
  }
}

async function setPenSize(size: number) {
  penSize = size;
  await resizeCursor();
  console.log("Set pen size to " + penSize);
}

async function switchToPenMode() {
  currentDrawingMode = DrawingMode.PEN;
  await changeCursorAppearance("100%", `color-mix(in srgb, ${penColor} 80%, white)`, "1px", penColor);
  console.log("Switched to pen mode");
}

async function switchToEraserMode() {
  currentDrawingMode = DrawingMode.ERASER;
  await changeCursorAppearance("50%", "white", "1px", "transparent");
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
    case 't':
      penQuality += 1
      console.log("Pen quality increased to " + penQuality);
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
      await setPenSize(penSize + 1);
    } else if(event.deltaY > 0) {
      await setPenSize(Math.max(1, penSize - 1));
    }
  });
  
  // create our shortcuts
  register('F6', clickThruShortcut);
  document.addEventListener("keydown", handleAppShortcuts);
});