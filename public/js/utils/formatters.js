export function formatPercentage(value) {
    const percentage = Number.isFinite(Number(value)) ? Number(value) : 0;
    return `${Math.round(percentage)}%`;
}

export function formatCpf(value) {
    return String(value)
        .replace(/\D/g, "")
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
