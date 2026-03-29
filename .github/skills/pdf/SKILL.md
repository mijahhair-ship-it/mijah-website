---
name: pdf
description: "Use when tasks involve reading, creating, or reviewing PDF files where rendering and layout matter; prefer visual checks by rendering pages (Poppler) and use Python tools such as reportlab, pdfplumber, and pypdf for generation and extraction."
---

# PDF Skill

## When to use

- Read or review PDF content where layout and visuals matter
- Create PDFs programmatically with reliable formatting
- Validate final rendering before delivery

## Workflow

1. **Prefer visual review**: Render PDF pages to PNGs and inspect them
   - Use `pdftoppm` if available
   - If unavailable, install Poppler or ask the user to review the output locally

2. **Use `reportlab`** to generate PDFs when creating new documents

3. **Use `pdfplumber`** (or `pypdf`) for text extraction and quick checks; do not rely on it for layout fidelity

4. **After each meaningful update**, re-render pages and verify alignment, spacing, and legibility

## Temp and output conventions

- Use `tmp/pdfs/` for intermediate files; delete when done
- Write final artifacts under `output/pdf/` when working in this repo
- Keep filenames stable and descriptive

## Dependencies (install if missing)

### Python packages

Prefer `uv` for dependency management:

```bash
uv pip install reportlab pdfplumber pypdf
```

If `uv` is unavailable:

```bash
python3 -m pip install reportlab pdfplumber pypdf
```

### System tools (for rendering)

```bash
# macOS (Homebrew)
brew install poppler

# Ubuntu/Debian
sudo apt-get install -y poppler-utils

# Windows (with Chocolatey)
choco install poppler
```

If installation isn't possible in this environment, the system will tell you which dependency is missing and how to install it locally.

## Environment

No required environment variables.

## Rendering command

```bash
pdftoppm -png $INPUT_PDF $OUTPUT_PREFIX
```

## Quality expectations

- **Maintain polished visual design**: consistent typography, spacing, margins, and section hierarchy
- **Avoid rendering issues**: clipped text, overlapping elements, broken tables, black squares, or unreadable glyphs
- **Charts, tables, and images** must be sharp, aligned, and clearly labeled
- **Use ASCII hyphens only** - avoid U+2011 (non-breaking hyphen) and other Unicode dashes
- **Citations and references** must be human-readable; never leave tool tokens or placeholder strings

## Final checks

- Do not deliver until the latest PNG inspection shows zero visual or formatting defects
- Confirm headers/footers, page numbering, and section transitions look polished
- Keep intermediate files organized or remove them after final approval

## Quick Reference

| Task | Tool | Command |
|------|------|---------|
| Extract text | pdfplumber | `pdfplumber.open('file.pdf')` |
| Create PDF | reportlab | `from reportlab.lib.pagesizes import letter` |
| Convert to PNG | pdftoppm | `pdftoppm -png input.pdf output` |
| Split/Merge | pypdf | `from pypdf import PdfReader, PdfWriter` |

## Python Examples

### Extract text from PDF
```python
import pdfplumber

with pdfplumber.open("file.pdf") as pdf:
    for page in pdf.pages:
        print(page.extract_text())
```

### Create a PDF with reportlab
```python
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

c = canvas.Canvas("output.pdf", pagesize=letter)
c.drawString(100, 750, "Hello World")
c.save()
```

### Render PDF to images
```bash
pdftoppm -png input.pdf output_page
```

This creates `output_page-1.png`, `output_page-2.png`, etc.
