"""
Add IDs to all headings in an HTML file.
The IDs are generated from the heading texts.
"""

import sys
import re
from typing import Literal

from bs4 import BeautifulSoup
from pathlib import Path


def generate_slug(text: str):
    """
    Generates a URL-friendly 'slug' from heading text.
    E.g., "Static typing in Python" -> "static-typing-in-python"
    """
    # 1. Lowercase and strip leading/trailing whitespace
    text = text.strip().lower()

    # 2. Replace non-alphanumeric characters (except hyphens) with a hyphen
    # This also handles spaces, converting them to hyphens.
    text = re.sub(r"[^a-z0-9\s-]", "", text)

    # 3. Compact multiple whitespaces into a single hyphen
    text = re.sub(r"\s+", "-", text)

    # 4. Compact multiple hyphens into a single hyphen
    text = re.sub(r"-+", "-", text)

    # 5. Strip leading/trailing hyphens
    text = text.strip("-")

    return text


def add_ids_to_headings(input_html: str) -> str:
    try:
        soup = BeautifulSoup(input_html, "html.parser")
    except Exception as e:
        sys.stderr.write(f"[ERROR] Failed to parse HTML: {e}\n")
        sys.exit(1)

    # Find headings
    headings = soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"])
    sys.stderr.write(f"[INFO] Found {len(headings)} heading(s).\n")

    modified_count = 0
    for heading in headings:
        heading_text = heading.get_text()
        if heading_text:
            # ID <-- SLUG
            heading_id = generate_slug(heading_text)
            heading["id"] = heading_id

            sys.stderr.write(
                f"[DEBUG] Added id='{heading_id}' to heading: '{heading_text}'\n"
            )
            modified_count += 1

    sys.stderr.write(f"[INFO] Added IDs to {modified_count} new heading(s).\n")

    return soup.prettify()


if __name__ == "__main__":
    args = sys.argv[1:]

    input_filepath: Path
    output_filepath: Path

    match len(args):
        case 1:
            input_filepath = Path(args[0])
            output_filepath = Path(args[0])  # input = output
            sys.stderr.write(
                f"[INFO] Input file: '{input_filepath}', Output file: '{output_filepath}'.\n"
            )
        case 2:
            input_filepath = Path(args[0])
            output_filepath = Path(args[1])
            sys.stderr.write(
                f"[INFO] Input file: '{input_filepath}', Output file: '{output_filepath}'.\n"
            )
        case _:
            sys.stderr.write(
                f"Error: Incorrect number of arguments. Exptected 2 but got {len(args)}.\n"
                "Usage: python add_heading_ids.py input_file output_file"
            )
            sys.exit(1)

    # Read input HTML
    html_content = ""
    try:
        input_html = input_filepath.read_text(encoding="utf-8")
        sys.stderr.write(f"[INFO] Successfully read HTML from '{input_filepath}'.\n")
    except FileNotFoundError:
        sys.stderr.write(f"[ERROR] Input file '{input_filepath}' not found.\n")
        sys.exit(1)
    except Exception as e:
        sys.stderr.write(f"[ERROR] Failed to read input file '{input_filepath}': {e}\n")
        sys.exit(1)

    # Process HTML
    new_html = add_ids_to_headings(input_html)

    # Write output
    try:
        output_filepath.write_text(new_html, encoding="utf-8")
        sys.stderr.write(f"[INFO] Modified HTML saved to '{output_filepath}'.\n")
    except Exception as e:
        sys.stderr.write(
            f"[ERROR] Failed to write to output file '{output_filepath}': {e}\n"
        )
        sys.exit(1)
