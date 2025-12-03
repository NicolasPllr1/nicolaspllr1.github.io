class DocumentMapper {
  constructor() {
    this.docIdToLink = new Map();
  }

  // Map doc IDs to blog post links
  addMapping(docId, link) {
    this.docIdToLink.set(docId, link);
  }

  // Bulk add mappings from your blog structure
  addBlogMappings(blogStructure) {
    // Example structure:
    // { "posts/post1.md": "./posts/post1.html#hello-heading2" }
    Object.entries(blogStructure).forEach(([sourcePath, link], index) => {
      // You'd need to map this to actual doc IDs from your index
      // This is a simplified example
      this.addMapping(index + 1, link);
    });
  }

  getLink(docId) {
    return this.docIdToLink.get(docId) || null;
  }

  // Generate mappings for a typical blog structure
  static generateBlogMappings(posts) {
    const mappings = {};
    posts.forEach(post => {
      // Convert markdown path to HTML link
      const htmlPath = post.path.replace(/\.md$/, '.html');
      const anchor = post.heading ? `#${post.heading}` : '';
      mappings[post.sourcePath] = `${htmlPath}${anchor}`;
    });
    return mappings;
  }
}
