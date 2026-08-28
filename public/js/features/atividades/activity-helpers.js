export function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

export function imageForLevel(item, level) {
    return level === 1 ? item.realImage : item.vectorImage || item.realImage;
}

export function createButton(label, className = "choice-card") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    return button;
}

export function createImage(item, level) {
    const image = document.createElement("img");
    image.src = imageForLevel(item, level);
    image.alt = item.pt;
    image.className = "prompt-image";
    return image;
}
