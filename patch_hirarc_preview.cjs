const fs = require('fs');
let code = fs.readFileSync('src/components/HIRARCPage.tsx', 'utf8');

if (!code.includes('formatToPreviewUrl')) {
  code = code.replace(
    /import \{ fetchDynamicHIRARC \} from '\.\.\/utils\/gasBridge';/,
    "import { fetchDynamicHIRARC } from '../utils/gasBridge';\nimport { formatToPreviewUrl } from '../utils/formatDriveUrl';"
  );
  
  code = code.replace(
    /href=\{r\.documentUrl\}/,
    "href={formatToPreviewUrl(r.documentUrl)}"
  );
  
  fs.writeFileSync('src/components/HIRARCPage.tsx', code);
  console.log('patched HIRARCPage');
}
