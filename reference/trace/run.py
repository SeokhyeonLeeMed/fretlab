"""Reproduce the whole tracing pipeline. Run from the project root."""
import subprocess, sys, pathlib
here = pathlib.Path(__file__).parent
for step in ["step1.py", "step2.py", "step3.py", "guard_strat.py", "parts_strat.py", "parts_jazz.py"]:
    print(f"--- {step} ---")
    subprocess.run([sys.executable, str(here / step)], check=True)
print("--- artwork.ts ---")
subprocess.run(["node", "tools/extract-artwork.mjs"], check=True)
