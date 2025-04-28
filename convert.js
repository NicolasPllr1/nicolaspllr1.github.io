import fs from 'fs';
import path from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkHtml from 'remark-html';
import { fileURLToPath } from 'url';

// Workaround to replace __dirname (not available in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define input/output paths
const inputPath = path.join(__dirname, 'posts', 'networks-intro', 'post.md');
const outputPath = path.join(__dirname, 'posts', 'networks-intro', 'post.html');

// Read the markdown file
const markdownContent = fs.readFileSync(inputPath, 'utf8');

// Convert markdown to HTML
unified()
  .use(remarkParse)
  .use(remarkHtml)
  .process(markdownContent)
  .then((file) => {
    fs.writeFileSync(outputPath, String(file));
    console.log(`✅ Converted ${inputPath} → ${outputPath}`);
  })
  .catch((err) => {
    console.error('❌ Error during conversion:', err);
  });
