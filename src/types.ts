// drawing mode enums
enum DrawingMode {
  POINTER,
  PEN,
  FOUNTAIN_PEN,
  ERASER,
  SQUARE,
  ELLIPSE,
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

export { DrawingMode };
export type { Action, PenAction };