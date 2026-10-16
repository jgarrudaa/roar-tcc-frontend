const SIZE = 400;

function point(x, y) {
    return `${Number(x.toFixed(3))} ${Number(y.toFixed(3))}`;
}

/* The same curve is traversed in reverse by the adjacent piece. */
function edgePath(startX, startY, endX, endY, tab, depth) {
    if (!tab) return `L ${point(endX, endY)}`;

    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.hypot(dx, dy);
    const normalX = dy / length;
    const normalY = -dx / length;
    const at = (along, outward = 0) => point(
        startX + dx * along + normalX * outward * depth * tab,
        startY + dy * along + normalY * outward * depth * tab,
    );

    return [
        `L ${at(0.38)}`,
        `C ${at(0.46)} ${at(0.39, 0.4)} ${at(0.39, 0.65)}`,
        `C ${at(0.39, 1.15)} ${at(0.61, 1.15)} ${at(0.61, 0.65)}`,
        `C ${at(0.61, 0.4)} ${at(0.54)} ${at(0.62)}`,
        `L ${at(1)}`,
    ].join(" ");
}

export function getShadowPieceCount(context) {
    const requested = Number(context.pieceCount);
    if ([2, 4, 6].includes(requested)) return requested;
    const level = Number(context.student?.supportLevel ?? 1);
    return level === 3 ? 6 : level === 2 ? 4 : 2;
}

export function createShadowPuzzle(pieceCount) {
    const columns = pieceCount === 6 ? 3 : 2;
    const rows = pieceCount === 2 ? 1 : 2;
    const width = SIZE / columns;
    const height = SIZE / rows;
    const depth = Math.min(width, height) * 0.13;
    const margin = depth * 1.2;
    const pieces = [];

    for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
            const x = column * width;
            const y = row * height;
            const right = column < columns - 1 ? ((row + column) % 2 ? -1 : 1) : 0;
            const bottom = row < rows - 1 ? ((row + column) % 2 ? 1 : -1) : 0;
            const left = column > 0 ? -((row + column - 1) % 2 ? -1 : 1) : 0;
            const top = row > 0 ? -((row - 1 + column) % 2 ? 1 : -1) : 0;
            const bounds = {
                x: Math.max(0, x - margin),
                y: Math.max(0, y - margin),
                right: Math.min(SIZE, x + width + margin),
                bottom: Math.min(SIZE, y + height + margin),
            };

            pieces.push({
                id: row * columns + column,
                row,
                column,
                x,
                y,
                width,
                height,
                bounds,
                path: [
                    `M ${point(x, y)}`,
                    edgePath(x, y, x + width, y, top, depth),
                    edgePath(x + width, y, x + width, y + height, right, depth),
                    edgePath(x + width, y + height, x, y + height, bottom, depth),
                    edgePath(x, y + height, x, y, left, depth),
                    "Z",
                ].join(" "),
            });
        }
    }

    return { size: SIZE, columns, rows, pieces };
}
