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
    points: [
        { x: number; y: number; },
        { x: number; y: number; }
    ];
    timestamp: number;
}

type PenAction = Action & {
    type: DrawingMode.PEN;
    points: [
        { x: number; y: number; },
        { x: number; y: number; },
        ...Array<{ x: number; y: number; }>
    ];
    color: string;
    size: number;
}

export { DrawingMode };
export type { Action, PenAction };