import { setupWindow, clickThruShortcut } from "./window";
import { register } from "@tauri-apps/plugin-global-shortcut";
import { renderPen, createPenAction } from "./tools/pen";
import { renderErase, createEraserAction } from "./tools/eraser";
import { isDraggingToolbar, moveToolbar, releaseToolbar, selectToolbar, toggleToolbar } from "./toolbar";
import { DrawingMode } from "./types";
import type { Action, EraserAction, PenAction } from "./types";
import { catmullromSpline } from "./utils/catmullromSpline";

// drawing config
var currentlyDrawing: boolean = false;
var currentDrawingMode: DrawingMode = DrawingMode.PEN;
var penSize: number = 5;
var penColor: string = "white";
var penQuality: number = 2;

// history
var cementedHistory: Action[] = [];
var redoHistory: Action[] = [];
var activeState: Action[] = [];

// track mouse position for other functions
var mouseX: number = 0;
var mouseY: number = 0;


// TODO: OPTIMIZATION BY CHUNKING THE ACTIONS WHEN THEY GET TOO LONG!


async function renderAction(action: Action, canvas: HTMLCanvasElement) {
  if(action.type === DrawingMode.PEN) {
    const penAction = action as PenAction;
    // run the catmull-rom spline on the mouse points
    const splinePoints = await catmullromSpline(penAction.points, penSize, penQuality);
    // render the pen action
    await renderPen(splinePoints, penAction.color, canvas, penAction.size);
  }

  // same process as pen
  if(action.type === DrawingMode.ERASER) {
    const eraserAction = action as EraserAction;
    const splinePoints = await catmullromSpline(eraserAction.points, eraserAction.size, penQuality);
    await renderErase(splinePoints, eraserAction.size, canvas);
  }
}

async function render(fromIndex: number = 0) {
  // clear canvas
  let canvas = document.getElementById("board") as HTMLCanvasElement;
  let ctx = canvas.getContext("2d");
  if (!ctx) {
    console.warn("Can't get canvas context");
    return;
  }

  if(fromIndex === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // render cemented history
  for(let i = fromIndex; i < cementedHistory.length; i++) {
    const action = cementedHistory[i];
    await renderAction(action, canvas);
  }
}

async function renderActive() {
  // render active state
  const canvas = document.getElementById("active-board") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.warn("Can't get canvas context");
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for(const action of activeState) {
    // if it's an eraser action, then
    // we just render it directly on 
    // the concreted canvas
    if(action.type === DrawingMode.ERASER) {
      await renderAction(action, document.getElementById("board") as HTMLCanvasElement);
      continue;
    }
    await renderAction(action, canvas);
  }
}

async function undo() {
  // check for empty history
  if(cementedHistory.length === 0) {
    return;
  }

  // pop from cemented to redo
  redoHistory.push(cementedHistory.pop()!);

  // re-render
  await render();
}

async function redo() {
  // same as undo but opposite
  if(redoHistory.length === 0) {
    return;
  }
  cementedHistory.push(redoHistory.pop()!);
  await render();
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

  let action: Action | null = null;

  if(currentDrawingMode === DrawingMode.PEN) {
    // get pen action
    const penAction: PenAction = await createPenAction({ x: event!.clientX, y: event!.clientY }, penColor, penSize);

    // cast to action
    action = penAction;
  }

  if(currentDrawingMode === DrawingMode.ERASER) {
    const eraserAction: EraserAction = await createEraserAction({ x: event!.clientX, y: event!.clientY }, penSize);
    action = eraserAction;
  }

  // add to active state
  if(action) {
    activeState.push(action);
  }

  await renderActive();
}

async function mouseUpHandler() {
  if(currentlyDrawing)
    currentlyDrawing = false;

  // pop active state into cemented history
  if(activeState[activeState.length - 1] !== undefined) {
    console.log(activeState);
    while(activeState.length > 0) {
      cementedHistory.push(activeState.pop()!);
    }
  }

  await releaseToolbar();

  // clear the redo history
  redoHistory = [];

  // render our cemented history for testing
  const time = Date.now();
  await render(cementedHistory.length - 1); // make sure to only render the last action for max optimization
  console.log("rendered in " + (Date.now() - time) + "ms");
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

    if(await isDraggingToolbar()) {
      // move ze toolbar
      await moveToolbar(e.clientX, e.clientY);
      return;
    }

    // pen mode
    if(currentlyDrawing && currentDrawingMode === DrawingMode.PEN) {
      // push point to active state
      const lastAction = activeState[activeState.length - 1] as PenAction;
      lastAction.points.push({ x: e.clientX, y: e.clientY });
    }

    // eraser mode
    if(currentlyDrawing && currentDrawingMode === DrawingMode.ERASER) {
      const lastAction = activeState[activeState.length - 1] as EraserAction;
      lastAction.points.push({ x: e.clientX, y: e.clientY });
    }

    // render active state
    await renderActive();
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

async function handleAppShortcuts(event: KeyboardEvent) {
  // switch between pen and eraser
  switch (event.key.toLowerCase()) {
    case "a":
      await switchToPenMode();
      break;
    case "e":
      await switchToEraserMode();
      break;
    case "z":
      if(event.shiftKey && (event.ctrlKey || event.metaKey)) {
        await redo();
      } else if(event.ctrlKey || event.metaKey) {
        await undo();
      }
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