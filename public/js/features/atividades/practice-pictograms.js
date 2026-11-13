const NS = "http://www.w3.org/2000/svg";

function svg(markup, className = "practice-pictogram", viewBox = "0 0 120 140") {
    const element = document.createElementNS(NS, "svg");
    element.setAttribute("viewBox", viewBox);
    element.setAttribute("class", className);
    element.setAttribute("aria-hidden", "true");
    // Only developer-owned vector paths are passed to this helper.
    element.innerHTML = markup;
    return element;
}

const PARTS = {
    HEAD: ['head'], NECK: ['neck'], BELLY: ['torso'], CHEST: ['torso'], BACK: ['torso'],
    ARM: ['arm'], HAND: ['hand'], LEG: ['leg'], FOOT: ['foot'], FEET: ['foot'],
    KNEE: ['leg'], ELBOW: ['arm'],
};

export function bodyPictogram(parts) {
    const color = part => parts.includes(part) ? '#1765c1' : '#dce3ec';
    const stroke = part => parts.includes(part) ? '#113f79' : '#98a7b8';
    const limb = (part, d) => `<path d="${d}" fill="none" stroke="${stroke(part)}" stroke-width="16" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${color(part)}" stroke-width="12" stroke-linecap="round"/>`;
    return svg(`
        ${limb('leg', 'M49 85 L45 123 M71 85 L75 123')}
        ${limb('arm', 'M40 47 L22 79 M80 47 L98 79')}
        <rect x="52" y="29" width="16" height="15" rx="4" fill="${color('neck')}" stroke="${stroke('neck')}" stroke-width="2"/>
        <rect x="39" y="39" width="42" height="52" rx="12" fill="${color('torso')}" stroke="${stroke('torso')}" stroke-width="2"/>
        <circle cx="60" cy="18" r="15" fill="${color('head')}" stroke="${stroke('head')}" stroke-width="2"/>
        ${limb('hand', 'M20 83 L17 89 M100 83 L103 89')}
        ${limb('foot', 'M44 129 L35 131 M76 129 L85 131')}
    `);
}

export function itemPictogram(word) {
    const parts = PARTS[String(word).trim().toUpperCase()];
    return parts ? bodyPictogram(parts) : null;
}

const COLOR_IMAGES_DIR = "/public/assets/imagens/modulos/cores";

// O cesto da atividade de arrastar mostra a cor, não o objeto.
const COLOR_IMAGES = Object.freeze({
    red: `${COLOR_IMAGES_DIR}/red.png`,
    blue: `${COLOR_IMAGES_DIR}/blue.png`,
    yellow: `${COLOR_IMAGES_DIR}/yellow.png`,
    green: `${COLOR_IMAGES_DIR}/green.png`,
    orange: `${COLOR_IMAGES_DIR}/orange.png`,
    purple: `${COLOR_IMAGES_DIR}/purple.png`,
});

const FARM_PHOTOS_DIR = "/public/assets/imagens/modulos/fazenda/animais_reais";

const CATEGORY_PHOTOS = Object.freeze({
    mammals: `${FARM_PHOTOS_DIR}/cow.png`,
    birds: `${FARM_PHOTOS_DIR}/duck.png`,
});

export function categoryPictogram(id) {
    const colorKey = String(id ?? "")
        .trim()
        .toLowerCase()
        .replace(/^(?:color|cor)[-_ ]/, "");
    const colorImage = COLOR_IMAGES[colorKey];

    if (colorImage) {
        return svg(`
            <image href="${colorImage}" xlink:href="${colorImage}" x="16" y="26" width="88" height="88" preserveAspectRatio="xMidYMid meet"/>
        `);
    }
    if (id === 'limbs') return bodyPictogram(['arm', 'hand', 'leg', 'foot']);
    if (id === 'head-torso') return bodyPictogram(['head', 'neck', 'torso']);

    /* Categorias com fotos reais: a imagem real do animal dentro do
       pictograma, no lugar do desenho vetorial. */
    if (CATEGORY_PHOTOS[id]) {
        const photo = CATEGORY_PHOTOS[id];

        return svg(`
            <image href="${photo}" xlink:href="${photo}" x="6" y="18" width="108" height="108" preserveAspectRatio="xMidYMid meet"/>
        `);
    }

    const drawings = {
        fruit: '<path d="M60 48 C18 15 7 85 39 116 Q60 125 62 117 Q94 127 105 80 C117 29 79 26 60 48" fill="#dc5151" stroke="#9b3030" stroke-width="3"/><path d="M60 47 Q55 24 65 14" stroke="#825224" stroke-width="6" fill="none"/><path d="M65 28 Q95 2 99 24 Q86 39 65 28" fill="#37824c"/>',
        vegetables: '<path d="M33 50 Q62 28 86 53 L44 125 Z" fill="#ed942c" stroke="#a45c16" stroke-width="3"/><path d="M55 43 L36 12 M63 40 L69 7 M72 43 L95 18" stroke="#37824c" stroke-width="8" stroke-linecap="round"/><path d="M43 66 L62 73 M48 88 L60 93" stroke="#a45c16" stroke-width="4"/>',
        'positive-feelings': '<circle cx="60" cy="70" r="38" fill="#ffd54f" stroke="#ffb300" stroke-width="4"/><circle cx="48" cy="62" r="5" fill="#2d3748"/><circle cx="72" cy="62" r="5" fill="#2d3748"/><path d="M44 78 Q60 98 76 78" stroke="#2d3748" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M60 18 L64 28 L74 30 L66 37 L69 47 L60 41 L51 47 L54 37 L46 30 L56 28 Z" fill="#ffb300"/>',
        'challenging-feelings': '<circle cx="60" cy="70" r="38" fill="#90caf9" stroke="#42a5f5" stroke-width="4"/><circle cx="48" cy="64" r="5" fill="#2d3748"/><circle cx="72" cy="64" r="5" fill="#2d3748"/><path d="M46 84 Q60 72 74 84" stroke="#2d3748" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M46 54 Q60 46 74 54" stroke="#42a5f5" stroke-width="3" fill="none" stroke-linecap="round"/>',
    };
    return svg(drawings[id] || '');
}

export function armHighlight(imageSource) {
    if (!imageSource.includes('/corpo_humano_vetor/arm.png')) return null;
    return svg('<path d="M920 153 Q868 149 803 242 Q747 326 691 414 Q624 468 573 557 L542 631 Q558 692 653 731 Q724 683 771 621 Q842 547 895 447 Q906 307 920 153 Z" fill="#ffce5433" stroke="#c57700" stroke-width="18" stroke-linejoin="round"/>', 'practice-arm-highlight', '0 0 1080 1080');
}
