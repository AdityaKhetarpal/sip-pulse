"""Turn the plain-text notebook sources in nbsrc/ into .ipynb notebooks in notebooks/ (jupytext percent format)."""
from pathlib import Path
import hashlib
import sys

import jupytext

root = Path(__file__).resolve().parent.parent
only = sys.argv[1:]  # e.g. "04 06" to rebuild just those (rebuilding wipes a notebook's saved outputs)
for src in sorted((root / "nbsrc").glob("*.py")):
    if only and src.stem[:2] not in only:
        continue
    nb = jupytext.read(src)
    for i, cell in enumerate(nb.cells):  # stable cell ids, so rebuilding doesn't change every line
        cell["id"] = hashlib.md5(f"{src.stem}-{i}-{cell.source}".encode()).hexdigest()[:8]
    nb.metadata["kernelspec"] = {"name": "python3", "display_name": "Python 3", "language": "python"}
    jupytext.write(nb, root / "notebooks" / (src.stem + ".ipynb"))
    print("built", src.stem)
