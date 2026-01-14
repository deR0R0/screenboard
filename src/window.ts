import { Window, PhysicalSize, PhysicalPosition, currentMonitor } from "@tauri-apps/api/window";
import { ShortcutEvent } from "@tauri-apps/plugin-global-shortcut";

var isIgnoringMouseEvents: boolean = false;

async function setIgnoreCursorEvents(ignore: boolean) {
  const curr_win = await Window.getCurrent();
  await curr_win.setIgnoreCursorEvents(ignore);
}

async function clickThruShortcut(event: ShortcutEvent | null) {
  if(event !== null && event.state !== "Pressed") {
    return; // skip released
  }

  isIgnoringMouseEvents = !isIgnoringMouseEvents;
  await setIgnoreCursorEvents(isIgnoringMouseEvents);
  console.log(`Toggled click-through mode: ${isIgnoringMouseEvents}`);
}

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

export { setupWindow, setIgnoreCursorEvents, clickThruShortcut, isIgnoringMouseEvents };