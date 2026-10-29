import argparse
import json
from pathlib import Path

import pymupdf

ROOT = Path(__file__).parent
NOTES_DIR = ROOT / "src" / "assets" / "notes"
NOTES_JSON = ROOT / "src" / "data" / "notes.json"
ZOOM = 1.5  # 108 DPI, matches the existing 918x1188 thumbnails


def render_missing_thumbs(force: bool) -> list[Path]:
    created = []
    for pdf_path in sorted(NOTES_DIR.glob("*.pdf")):
        png_path = pdf_path.with_suffix(".png")
        if png_path.exists() and not force:
            continue
        doc = pymupdf.open(pdf_path)
        try:
            pix = doc[0].get_pixmap(matrix=pymupdf.Matrix(ZOOM, ZOOM))
            pix.save(png_path)
        finally:
            doc.close()
        created.append(png_path)
    return created


def wire_images() -> None:
    notes = json.loads(NOTES_JSON.read_text(encoding="utf-8"))
    for note in notes:
        pdf = note.get("pdf", "")
        if not pdf:
            continue
        png = (ROOT / pdf).with_suffix(".png")
        if png.exists():
            note["image"] = "./" + png.relative_to(ROOT).as_posix()
    NOTES_JSON.write_text(
        json.dumps(notes, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Render page 1 of each notes PDF to a PNG thumbnail and wire it into notes.json."
    )
    parser.add_argument(
        "--force", action="store_true", help="Regenerate thumbnails that already exist."
    )
    args = parser.parse_args()

    created = render_missing_thumbs(args.force)
    for path in created:
        print(f"created {path.relative_to(ROOT)}")
    wire_images()
    print(f"updated {NOTES_JSON.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
