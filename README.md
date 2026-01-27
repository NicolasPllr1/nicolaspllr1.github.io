My personal [blog](https://nicolaspllr1.github.io/)

## Commands

Compiling tailwind --> css:

```sh
npx @tailwindcss/cli -i ./style.css -o ./output.css --watch
```

Running the live server:

```sh
live-server
```

## Markdown --> HTML/CSS

```sh
node convert.js
```

## Search

The keyword search engine ([code](https://github.com/NicolasPllr1/kwsearch)) is
implemented in Zig and compiled to WASM. The WASM assets (a serialized index, a
JSON metadata file, and a WASM binary) are in the `./wasm/` dir alongside the glue
javascript code in `./wasm/SearchEngine.js`.
