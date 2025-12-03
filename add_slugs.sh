#!/usr/bin/env bash

set -euo pipefail

# Check that the file name was passed as the first arg
if [ -z "$1" ]; then
    echo "Missing argument: Please provide the path to the HTML file."
    echo "Usage: $0 <html_file_path>"
    exit 1
fi

post_html_file="$1"

# Check that the file exists
if [ ! -f "$post_html_file" ]; then
    echo "File not found or not a regular file: '$post_html_file'"
    exit 1
fi


uv run --with bs4 slugs.py $post_html_file
npx prettier $post_html_file --write
