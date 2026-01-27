# Personal Blog

My personal [blog](https://nicolaspllr1.github.io/).

## Compiling posts

Every command is in the `./Makefile`.

Currently, steps to go from raw Markdown to an HTML post are:

1. Markdown text file --> HTML file with `make md2html` (Node script)
2. Manually add tags for the header and footer
3. Add slugs to headings with `make add-slugs <html-file>` (Python script)
4. Re-build the search index, including the new post in the index corpus (see
   [search](#search))

### Developement

- Launch the server (hot-reloads) with `make server`
- Launch the tailwind compiler in --watch with `make css`

## Search

The keyword search engine ([code](https://github.com/NicolasPllr1/kwsearch)) is
implemented in Zig and compiled to WASM. The WASM assets (a serialized index, a
JSON metadata file, and a WASM binary) are in the `./wasm/` dir alongside the
glue javascript code in `./wasm/SearchEngine.js`.
