interface SplineParams {
    time: number;
    startingPoint: { x: number; y: number; };
    controlPoint1: { x: number; y: number; };
    controlPoint2: { x: number; y: number; };
    endingPoint: { x: number; y: number; };
}

// this function will just returna single point on a cubic bezier curve at a given time t (0 to 1)
async function cubicBezierAt(params: SplineParams): Promise<{ x: number; y: number; }> {
    const resultX: number = Math.pow(1 - params.time, 3) * params.startingPoint.x + 3 * Math.pow(1 - params.time, 2) * params.time * params.controlPoint1.x + 3 * (1 - params.time) * Math.pow(params.time, 2) * params.controlPoint2.x + Math.pow(params.time, 3) * params.endingPoint.x;
    const resultY: number = Math.pow(1 - params.time, 3) * params.startingPoint.y + 3 * Math.pow(1 - params.time, 2) * params.time * params.controlPoint1.y + 3 * (1 - params.time) * Math.pow(params.time, 2) * params.controlPoint2.y + Math.pow(params.time, 3) * params.endingPoint.y;
    return { x: resultX, y: resultY };
}

// this function will actually get all the points along the cubic bezier curve
// spaced by distance: most likely based on pen size
async function cubicBezier(params: SplineParams, size: number, quality: number = 3): Promise<Array<{ x: number; y: number; }>> {
    const points: Array<{ x: number; y: number; }> = [];
    const step: number = 1 / (size * quality);
    for(let t = 0; t <= 1; t += step) {
        const point = await cubicBezierAt({ ...params, time: t });
        points.push(point);
    }
    return points;
}

// takes in a list of raw mouse points and returns a smoothed list of points using the Catmull-Rom spline algorithm
async function catmullromSpline(points: Array<{ x: number; y: number; }>, size: number, quality: number = 3): Promise<Array<{ x: number; y: number; }>> {
    const smoothedPoints: Array<{ x: number; y: number; }> = [];
    // first, duplicate the starting and ending points of the mouse points array
    points.unshift(points[0]);
    points.push(points[points.length - 1]);

    // run through each set of 4 points and generate cubic bezier curves between them
    for(let i = 0; i < points.length - 3; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const p2 = points[i + 2];
        const p3 = points[i + 3];

        // calculate control points for the cubic bezier curve
        const cp1 = {
            x: p1.x + (p2.x - p0.x) / 6,
            y: p1.y + (p2.y - p0.y) / 6,
        };
        const cp2 = {
            x: p2.x - (p3.x - p1.x) / 6,
            y: p2.y - (p3.y - p1.y) / 6,
        };

        // generate cubic bezier points between p1 and p2
        const bezierPoints = await cubicBezier({
            time: 0,
            startingPoint: p1,
            controlPoint1: cp1,
            controlPoint2: cp2,
            endingPoint: p2,
        }, size, quality);

        // append bezier points to smoothed points array
        // skip the last point to avoid duplicates
        smoothedPoints.push(...bezierPoints.slice(0, -1));
    }

    // finally, add the last point
    smoothedPoints.push(points[points.length - 2]);

    return smoothedPoints;
}





export { cubicBezier, catmullromSpline };