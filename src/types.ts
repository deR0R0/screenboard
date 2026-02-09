// drawing mode enums
enum DrawingMode {
  POINTER,
  PEN,
  FOUNTAIN_PEN,
  ERASER,
  CLEAR,
}

type Action = {
    type: DrawingMode;
    timestamp: number;
}

type PenAction = Action & {
    type: DrawingMode.PEN;
    points: Array<{ x: number; y: number; }>;
    color: string;
    size: number;
}

type EraserAction = Action & {
    type: DrawingMode.ERASER;
    points: Array<{ x: number; y: number; }>;
    size: number;
}

type ClearAction = Action & {
    type: DrawingMode.CLEAR;
}

export { DrawingMode };
export type { Action, PenAction, EraserAction, ClearAction };