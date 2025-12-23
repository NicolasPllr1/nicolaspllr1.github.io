.PHONY: css server md2html

css:
	npx @tailwindcss/cli -i ./style.css -o ./output.css --watch

server:
	npx live-server


md2html:
	node scripts/convert.js

add-slugs: ## Add unique IDs (slugs) to headings in an HTML file
	@if [ -z "$(FILE)" ]; then \
		echo "Usage: make add-slugs FILE=<path_to_html_file>"; \
		exit 1; \
	fi
	@echo "Adding slugs to HTML file: $(FILE)"
	uv run --with bs4 scripts/slugs.py "$(FILE)"
	npx prettier "$(FILE)" --write
	@echo "Slugs added and file formatted."
