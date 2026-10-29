"""Compatibility entry point for the original Demolisher import command."""
from pathlib import Path
import runpy
import sys

script = Path(__file__).with_name("prepare-boss-assets.py")
sys.argv = [str(script), "demolisher", *sys.argv[1:]]
runpy.run_path(str(script), run_name="__main__")
