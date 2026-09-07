export function shuffle(items) {
    return [...items].sort(
        () => Math.random() - 0.5,
    );
}

export function imageForLevel(
    item,
    level,
) {
    if (
        !item ||
        typeof item !== "object"
    ) {
        return "";
    }

    const source =
        level === 1
            ? item.realImage
            : item.vectorImage ||
              item.realImage;

    return typeof source === "string"
        ? source.trim()
        : "";
}

export function createButton(
    label,
    className = "choice-card",
) {
    const button =
        document.createElement("button");

    button.type = "button";
    button.className = className;
    button.textContent =
        String(label ?? "").trim();

    return button;
}

export function createImage(
    item,
    level,
) {
    const image =
        document.createElement("img");

    const source =
        imageForLevel(item, level);

    if (!source) {
        throw new Error(
            `O item ${
                item?.en ||
                item?.id ||
                "desconhecido"
            } não possui uma imagem válida.`,
        );
    }

    image.src = source;

    image.alt =
        item?.pt ||
        item?.en ||
        "Imagem da atividade";

    image.className =
        "prompt-image";

    return image;
}