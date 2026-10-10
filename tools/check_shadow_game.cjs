const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadModule(relativePath) {
    const source = fs.readFileSync(path.join(__dirname, relativePath), 'utf8')
        .replace(/^import .*;\r?\n/gm, '')
        .replace(/^export /gm, '');
    const context = vm.createContext({});
    vm.runInContext(source, context);
    return context;
}

const puzzleModule = loadModule('../public/js/features/atividades/sombra-puzzle.js');
const serviceModule = loadModule('../public/js/services/atividade-service.js');

// Flatten the produced SVG, independently of the puzzle's edge generator.
function flattenPath(svgPath) {
    const points = [];
    let current;
    for (const [, command, values] of svgPath.matchAll(/([MLCZ])([^MLCZ]*)/g)) {
        const numbers = (values.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
        if (command === 'M' || command === 'L') {
            assert.equal(numbers.length, 2);
            current = numbers;
            points.push(current);
        } else if (command === 'C') {
            assert.equal(numbers.length, 6);
            const start = current;
            for (let step = 1; step <= 24; step += 1) {
                const t = step / 24;
                const u = 1 - t;
                points.push([0, 1].map(axis =>
                    u ** 3 * start[axis] +
                    3 * u ** 2 * t * numbers[axis] +
                    3 * u * t ** 2 * numbers[axis + 2] +
                    t ** 3 * numbers[axis + 4],
                ));
            }
            current = numbers.slice(4);
        } else {
            assert.equal(command, 'Z');
            assert.equal(numbers.length, 0);
        }
    }
    assert.ok(points.length > 3, 'A piece needs a closed outline.');
    assert.ok(points.every(point => point.every(Number.isFinite)));
    assert.ok(nearPoint(points[0], points.at(-1)), 'The outline must close.');
    return points;
}

function nearPoint(first, second) {
    return Math.hypot(first[0] - second[0], first[1] - second[1]) < 0.002;
}

function signedArea(points) {
    return points.reduce((sum, first, index) => {
        const second = points[(index + 1) % points.length];
        return sum + first[0] * second[1] - second[0] * first[1];
    }, 0) / 2;
}

function containsPoint(x, y, points) {
    let inside = false;
    for (let index = 0, previous = points.length - 1; index < points.length; previous = index++) {
        const first = points[index];
        const second = points[previous];
        if ((first[1] > y) !== (second[1] > y) &&
            x < (second[0] - first[0]) * (y - first[1]) / (second[1] - first[1]) + first[0]) {
            inside = !inside;
        }
    }
    return inside;
}

function edgePoints(points, start, end) {
    const first = points.findIndex(point => nearPoint(point, start));
    assert.ok(first >= 0, 'An edge must start at its cell corner.');
    const last = points.findIndex((point, index) => index > first && nearPoint(point, end));
    assert.ok(last > first, 'An edge must reach the next cell corner.');
    return points.slice(first, last + 1);
}

function assertComplementary(first, second, axis, seam) {
    const reversed = [...second].reverse();
    assert.equal(first.length, reversed.length, 'Adjacent tabs must describe the same curve.');
    first.forEach((point, index) => {
        assert.ok(nearPoint(point, reversed[index]), 'Adjacent tabs must meet without a gap.');
    });
    assert.ok(first.some(point => Math.abs(point[axis] - seam) > 0.01),
        'A shared edge should include a puzzle tab.');
}

for (const count of [2, 4, 6]) {
    const puzzle = puzzleModule.createShadowPuzzle(count);
    assert.equal(puzzle.pieces.length, count);
    assert.equal(puzzle.columns * puzzle.rows, count);
    assert.equal(new Set(puzzle.pieces.map(piece => piece.id)).size, count);
    const outlines = puzzle.pieces.map(piece => flattenPath(piece.path));

    for (const piece of puzzle.pieces) {
        const points = outlines[piece.id];
        assert.equal(puzzle.pieces[piece.id], piece, 'IDs must identify their matching outline.');
        assert.ok(signedArea(points) > 0, 'Each piece must have a positive, ordered area.');
        for (const [x, y] of points) {
            assert.ok(x >= -0.001 && x <= puzzle.size + 0.001);
            assert.ok(y >= -0.001 && y <= puzzle.size + 0.001);
            assert.ok(x >= piece.bounds.x - 0.001 && x <= piece.bounds.right + 0.001,
                'An SVG viewport must contain the entire piece.');
            assert.ok(y >= piece.bounds.y - 0.001 && y <= piece.bounds.bottom + 0.001,
                'An SVG viewport must contain the entire piece.');
        }

        const right = puzzle.pieces.find(other =>
            other.row === piece.row && other.column === piece.column + 1,
        );
        if (right) {
            const top = [piece.x + piece.width, piece.y];
            const bottom = [piece.x + piece.width, piece.y + piece.height];
            assertComplementary(
                edgePoints(points, top, bottom),
                edgePoints(outlines[right.id], bottom, top),
                0, top[0],
            );
        }
        const below = puzzle.pieces.find(other =>
            other.row === piece.row + 1 && other.column === piece.column,
        );
        if (below) {
            const left = [piece.x, piece.y + piece.height];
            const rightCorner = [piece.x + piece.width, piece.y + piece.height];
            assertComplementary(
                edgePoints(points, rightCorner, left),
                edgePoints(outlines[below.id], left, rightCorner),
                1, left[1],
            );
        }
    }

    const area = outlines.reduce((sum, points) => sum + signedArea(points), 0);
    assert.ok(Math.abs(area - puzzle.size ** 2) < 0.01,
        'The completed pieces must have the area of the whole board.');
    for (let row = 0; row < 100; row += 1) {
        for (let column = 0; column < 100; column += 1) {
            const x = (column + 0.5) * puzzle.size / 100;
            const y = (row + 0.5) * puzzle.size / 100;
            assert.equal(outlines.filter(points => containsPoint(x, y, points)).length, 1,
                `${count} pieces: (${x}, ${y}) must be covered exactly once.`);
        }
    }
}

for (const alias of ['Sombra', 'SHADOW', 'Quebra-cabeça', 'Quebra_cabeca', ' quebra cabeça ']) {
    const activity = serviceModule.normalizeActivity({
        atividade_id: 7,
        ordem_sequencia: 1,
        tipo_interacao: alias,
        palavra_chave: 'COW',
    });
    assert.equal(activity.type, 'shadow', alias);
}
assert.equal(serviceModule.normalizeActivity({
    atividade_id: 7,
    ordem_sequencia: 1,
    tipo_interacao: 'DragAndDrop',
}).type, 'associate', 'Existing association activities must retain their engine.');

console.log('Sombras: 2/4/6 peças cobrem 30.000 pontos sem lacunas ou sobreposições; áreas, abas, bounds e aliases válidos.');
