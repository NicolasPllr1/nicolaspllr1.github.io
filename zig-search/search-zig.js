class SearchEngine {
  constructor() {
    this.wasmInstance = null;
    this.memory = null;
    this.docMappings = null;
    this.ready = false;
  }

  async initialize(wasmPath, indexPath, mappingsPath) {
    // Load WASM
    const wasmResponse = await fetch(wasmPath);
    const wasmBytes = await wasmResponse.arrayBuffer();
    console.log("HERE 1");
    const wasmModule = await WebAssembly.instantiate(wasmBytes);
    console.log("HERE 2");
    this.wasmInstance = await WebAssembly.instantiate(wasmModule, {});
    console.log("HERE 3");
    this.wasmInstance = await WebAssembly.instantiate(wasmModule, {});
    this.memory = this.wasmInstance.exports.memory;

    console.log("1");
    // fetch('greet.wasm').then(response => 
    //             response.arrayBuffer()
    //         ).then(bytes => WebAssembly.instantiate(bytes, {}))
    //         .then(results => {
    //             const greet = results.instance.exports.greet;
    //             const greetingMessage = document.createTextNode(greet());
    //             document.body.appendChild(greetingMessage);
    //         });

    // Load pre-built index
    const indexResponse = await fetch(indexPath);
    const indexData = new Uint8Array(await indexResponse.arrayBuffer());
    const indexPtr = this.allocBytes(indexData);
    console.log("2");

    const success = this.wasmInstance.exports.load_index(indexPtr, indexData.length);
    console.log("3");
    this.freeBytes(indexPtr, indexData.length);

    if (!success) {
      throw new Error('Failed to load search index');
    }

    // Load document mappings
    const mappingsResponse = await fetch(mappingsPath);
    this.docMappings = await mappingsResponse.json();

    this.ready = true;
  }

  search(query) {
    if (!this.ready) throw new Error('Search engine not ready');

    const queryPtr = this.allocString(query);
    const resultPtr = this.wasmInstance.exports.wasm_alloc(8);

    const success = this.wasmInstance.exports.wasm_search(
      queryPtr, query.length, resultPtr, resultPtr + 4
    );

    this.freeString(queryPtr, query.length);

    if (!success) return [];

    const resultDataPtr = new Uint32Array(this.memory.buffer, resultPtr, 2);
    const jsonPtr = resultDataPtr[0];
    const jsonLen = resultDataPtr[1];

    const jsonStr = this.readString(jsonPtr, jsonLen);
    this.wasmInstance.exports.wasm_free(jsonPtr, jsonLen);
    this.wasmInstance.exports.wasm_free(resultPtr, 8);

    const docIds = JSON.parse(jsonStr);

    // Enhance with mapping data
    return docIds.map(docId => ({
      docId,
      link: this.docMappings[docId]?.link || null,
      title: this.docMappings[docId]?.title || `Document ${docId}`
    }));
  }

  getDocument(docId) {
    if (!this.initialized) {
      throw new Error('Search engine not initialized');
    }

    const resultPtr = this.wasmInstance.exports.wasm_alloc(8);
    const success = this.wasmInstance.exports.get_document(
      docId,
      resultPtr,
      resultPtr + 4
    );

    if (!success) {
      this.wasmInstance.exports.wasm_free(resultPtr, 8);
      return null;
    }

    const resultDataPtr = new Uint32Array(this.memory.buffer, resultPtr, 2);
    const textPtr = resultDataPtr[0];
    const textLen = resultDataPtr[1];

    const text = this.readString(textPtr, textLen);
    this.wasmInstance.exports.wasm_free(textPtr, textLen);
    this.wasmInstance.exports.wasm_free(resultPtr, 8);

    return text;
  }

  // Utility methods for string handling
  allocString(str) {
    const bytes = new TextEncoder().encode(str);
    const ptr = this.wasmInstance.exports.wasm_alloc(bytes.length);
    const mem = new Uint8Array(this.memory.buffer, ptr, bytes.length);
    mem.set(bytes);
    return ptr;
  }

  freeString(ptr, len) {
    this.wasmInstance.exports.wasm_free(ptr, len);
  }

  readString(ptr, len) {
    const bytes = new Uint8Array(this.memory.buffer, ptr, len);
    return new TextDecoder().decode(bytes);
  }

  cleanup() {
    if (this.initialized) {
      this.wasmInstance.exports.cleanup();
      this.initialized = false;
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SearchEngine;
} else {
  window.SearchEngine = SearchEngine;
}
