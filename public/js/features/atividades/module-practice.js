// Explicit vocabulary groups: unknown words are never assigned a guessed category.
const CATEGORY_SETS = [
    [
        { id: "birds", en: "Birds", pt: "Aves", words: ["DUCK", "HEN", "CHICKEN", "ROOSTER", "GOOSE", "TURKEY"] },
        { id: "mammals", en: "Mammals", pt: "Mamíferos", words: ["COW", "HORSE", "PIG", "SHEEP", "GOAT", "DOG", "CAT", "RABBIT"] },
    ],
    [
        { id: "limbs", en: "Limbs", pt: "Membros: braços e pernas", words: ["ARM", "HAND", "LEG", "FOOT", "FEET", "KNEE", "ELBOW"] },
        { id: "head-torso", en: "Head and torso", pt: "Cabeça e tronco", words: ["HEAD", "BELLY", "CHEST", "BACK", "NECK"] },
    ],
    [
        { id: "fruit", en: "Fruit", pt: "Frutas", words: ["APPLE", "BANANA", "ORANGE", "GRAPE", "GRAPES", "PEAR", "STRAWBERRY", "WATERMELON"] },
        { id: "vegetables", en: "Vegetables", pt: "Verduras e legumes", words: ["CARROT", "BROCCOLI", "LETTUCE", "POTATO", "ONION", "CABBAGE"] },
    ],
];

export function getModulePracticePhases({ activity, module }) {
    const usable = module.items.filter(item => item.en && (item.realImage || item.vectorImage));
    const unique = [...new Map(usable.map(item => [item.en.trim().toUpperCase(), item])).values()];
    if (!unique.length) return [];
    const phases = [];
    for (const groups of CATEGORY_SETS) {
        const members = groups.map(group => unique.filter(item => group.words.includes(item.en.trim().toUpperCase())));
        if (members.some(items => !items.length)) continue;
        // Interleave the groups, using at most two real vocabulary cards per group.
        const cards = [];
        for (let index = 0; index < 2; index++) {
            members.forEach((items, groupIndex) => {
                if (items[index]) cards.push({ item: items[index], category: groups[groupIndex].id });
            });
        }
        phases.push({ ...activity, type: "categories", groups, cards,
            instruction: "Separe por categorias. Escolha o grupo de cada cartão." });
        break;
    }
    // Every theme shares the same puzzle, controls and progression. Only its
    // registered vocabulary/images and heading change.
    const theme = String(module.title || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const puzzleTitle = /corpo|body/.test(theme) ? "Monte o corpo"
        : /animais|fazenda|animals|farm/.test(theme) ? "Monte os animais"
            : "Monte as imagens";
    phases.push({ ...activity, type: "bodyPuzzle", puzzleTitle,
        cards: unique.map(item => ({ item })),
        instruction: `${puzzleTitle}. Arraste cada peça até sua sombra para completar a imagem.` });
    return phases;
}
