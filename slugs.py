import re
from bs4 import BeautifulSoup
import re


def generate_slug(text):
    # 1. Convert to lowercase and strip leading/trailing whitespace
    text = text.strip().lower()

    # 2. Replace non-alphanumeric characters (except hyphens) with a hyphen
    # This also handles spaces, converting them to hyphens.
    text = re.sub(r"[^a-z0-9\s-]", "", text)

    # 3. Replace one or more whitespace characters with a single hyphen
    text = re.sub(r"\s+", "-", text)

    # 4. Replace multiple hyphens with a single hyphen
    text = re.sub(r"-+", "-", text)

    # 5. Strip leading/trailing hyphens
    text = text.strip("-")

    return text


def create_id_from_heading(heading_text):
    """
    Generates a URL-friendly ID from heading text.
    E.g., "Static typing in Python" -> "static-typing-in-python"
    """
    # return "-".join(heading_text.strip().lower().split(" "))
    return generate_slug(heading_text)


def add_ids_to_headings(input_filepath, output_filepath):
    try:
        with open(input_filepath, "r") as f:
            html_content = f.read()
    except FileNotFoundError:
        print(f"Error: Input file '{input_filepath}' not found.")
        return

    soup = BeautifulSoup(html_content, "html.parser")

    # Find all heading tags (h1, h2, h3, h4)
    headings = soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"])

    for heading in headings:
        heading_text = heading.get_text()
        if heading_text:
            heading_id = create_id_from_heading(heading_text)
            heading["id"] = heading_id
            print(f"Added id='{heading_id}' to heading: '{heading_text}'")

    with open(output_filepath, "w", encoding="utf-8") as f:
        f.write(soup.prettify())

    print(f"\nModified HTML saved to '{output_filepath}'")


if __name__ == "__main__":
    input_html_file = "posts/python-type-hints-and-pydantic-rebuilds/index.html"
    output_html_file = "posts/python-type-hints-and-pydantic-rebuilds/index-slug.html"
    add_ids_to_headings(input_html_file, output_html_file)
