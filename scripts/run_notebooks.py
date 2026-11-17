"""Run notebooks in order, in place, saving their outputs (so GitHub shows the results).
Usage: python scripts/run_notebooks.py 01 02 03 ..."""
import sys
import time
from pathlib import Path

import nbformat
from nbclient import NotebookClient

folder = Path(__file__).resolve().parent.parent / "notebooks"
for prefix in sys.argv[1:]:
    path = next(folder.glob(f"{prefix}_*.ipynb"))
    nb = nbformat.read(path, as_version=4)
    start = time.time()
    try:
        NotebookClient(nb, timeout=None, kernel_name="python3", resources={"metadata": {"path": str(folder)}}).execute()
    finally:
        nbformat.write(nb, path)  # keep outputs even if a cell failed, so the error is visible
    print(f"ran {path.name} in {time.time() - start:,.0f}s", flush=True)
