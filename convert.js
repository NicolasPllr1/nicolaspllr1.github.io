import fs from 'fs';
import path from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeStringify from 'rehype-stringify';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dir = 'http-server-rust';
const inputPath = path.join(__dirname, 'posts', dir, 'raw_post.md');
const outputPath = path.join(__dirname, 'posts', dir, 'raw_post.html');

const markdownContent = fs.readFileSync(inputPath, 'utf8');

async function convert() {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypePrettyCode, {
      theme: 'tokyo-night',
      keepBackground: false,
      showLineNumbers: true,
      defaultLang: { block: 'rust', inline: 'rust' }
    })
    .use(rehypeStringify)
    .process(markdownContent);

  fs.writeFileSync(outputPath, String(file));
  console.log(`✅ Converted ${inputPath} → ${outputPath}`);
}

convert().catch((err) => {
  console.error('❌ Error during conversion:', err);
});
