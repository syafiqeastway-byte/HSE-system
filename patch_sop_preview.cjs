const fs = require('fs');
let code = fs.readFileSync('src/components/SOPPage.tsx', 'utf8');

if (!code.includes('formatToPreviewUrl')) {
  code = code.replace(
    /import \{ fetchDynamicSOP \} from '\.\.\/utils\/gasBridge';/,
    "import { fetchDynamicSOP } from '../utils/gasBridge';\nimport { formatToPreviewUrl } from '../utils/formatDriveUrl';"
  );
  
  code = code.replace(
    /href=\{r\.documentUrl\}/,
    "href={formatToPreviewUrl(r.documentUrl)}"
  );
  
  fs.writeFileSync('src/components/SOPPage.tsx', code);
  console.log('patched SOPPage');
}
