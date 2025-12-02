.PHONY: css server md2html

css:
	npx @tailwindcss/cli -i ./style.css -o ./output.css --watch

server:
	npx live-server


md2html:
	node convert.js
