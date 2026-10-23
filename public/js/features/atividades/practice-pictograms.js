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

export function categoryPictogram(id) {
    if (id === 'limbs') return bodyPictogram(['arm', 'hand', 'leg', 'foot']);
    if (id === 'head-torso') return bodyPictogram(['head', 'neck', 'torso']);
    const drawings = {
        birds: '<ellipse cx="57" cy="80" rx="34" ry="25" fill="#f0c34a"/><circle cx="82" cy="49" r="18" fill="#f0c34a"/><path d="M98 48 L115 55 L98 61" fill="#cb691a"/><path d="M29 77 L9 58 L17 88 M48 104 L45 123 M65 104 L69 123" stroke="#825224" stroke-width="5" fill="none"/><path d="M41 76 Q64 61 72 86 Q52 98 41 76" fill="#cc9c2a"/><circle cx="85" cy="45" r="3" fill="#17243c"/>',
        mammals: '<path d="M27 68 L14 41 L41 54 M79 54 L106 41 L93 69" fill="#b78759" stroke="#825224" stroke-width="3"/><rect x="28" y="48" width="64" height="72" rx="28" fill="#d4ad7d"/><ellipse cx="60" cy="98" rx="26" ry="18" fill="#efdbc0"/><circle cx="44" cy="76" r="4"/><circle cx="76" cy="76" r="4"/><ellipse cx="60" cy="94" rx="7" ry="5" fill="#513a2b"/>',
        fruit: '<path d="M60 48 C18 15 7 85 39 116 Q60 125 62 117 Q94 127 105 80 C117 29 79 26 60 48" fill="#dc5151" stroke="#9b3030" stroke-width="3"/><path d="M60 47 Q55 24 65 14" stroke="#825224" stroke-width="6" fill="none"/><path d="M65 28 Q95 2 99 24 Q86 39 65 28" fill="#37824c"/>',
        vegetables: '<path d="M33 50 Q62 28 86 53 L44 125 Z" fill="#ed942c" stroke="#a45c16" stroke-width="3"/><path d="M55 43 L36 12 M63 40 L69 7 M72 43 L95 18" stroke="#37824c" stroke-width="8" stroke-linecap="round"/><path d="M43 66 L62 73 M48 88 L60 93" stroke="#a45c16" stroke-width="4"/>',
    };
    return svg(drawings[id] || '');
}

export function armHighlight(imageSource) {
    if (!imageSource.includes('/corpo_humano_vetor/arm.png')) return null;
    return svg('<path d="M920 153 Q868 149 803 242 Q747 326 691 414 Q624 468 573 557 L542 631 Q558 692 653 731 Q724 683 771 621 Q842 547 895 447 Q906 307 920 153 Z" fill="#ffce5433" stroke="#c57700" stroke-width="18" stroke-linejoin="round"/>', 'practice-arm-highlight', '0 0 1080 1080');
}
