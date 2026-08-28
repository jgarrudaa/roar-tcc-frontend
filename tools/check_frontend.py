from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
HTML_URL = re.compile(r"\b(?:href|src)\s*=\s*[\"']([^\"']+)[\"']", re.I)
CSS_URL = re.compile(r"url\(\s*[\"']?([^\"')]+)", re.I)


def is_external(value: str) -> bool:
    return value.startswith(("http://", "https://", "//", "data:", "mailto:", "tel:", "#", "${"))


def resolve(source: Path, value: str) -> Path | None:
    if is_external(value):
        return None
    path = urlsplit(value).path
    if not path or "${" in path:
        return None
    return (ROOT / path.lstrip("/")) if path.startswith("/") else (source.parent / path)


def main() -> int:
    failures: list[str] = []
    for source in ROOT.rglob("*.html"):
        content = source.read_text(encoding="utf-8")
        for value in HTML_URL.findall(content):
            target = resolve(source, value)
            if target is not None and not target.exists():
                failures.append(f"{source.relative_to(ROOT)} -> {value}")
    for source in (ROOT / "public" / "css").rglob("*.css"):
        content = source.read_text(encoding="utf-8")
        for value in CSS_URL.findall(content):
            target = resolve(source, value)
            if target is not None and not target.exists():
                failures.append(f"{source.relative_to(ROOT)} -> {value}")
    if failures:
        print("Referências locais inválidas:")
        print("\n".join(f"- {failure}" for failure in failures))
        return 1
    print("Todas as referências locais de HTML e CSS são válidas.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
