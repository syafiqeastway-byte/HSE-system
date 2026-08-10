const fs = require('fs');
let code = fs.readFileSync('src/components/MinuteMeetingPage.tsx', 'utf8');

if (!code.includes('formatToPreviewUrl')) {
  code = code.replace(
    /import \{ fetchDynamicMinuteMeetings \} from '\.\.\/utils\/gasBridge';/,
    "import { fetchDynamicMinuteMeetings } from '../utils/gasBridge';\nimport { formatToPreviewUrl } from '../utils/formatDriveUrl';"
  );
  
  code = code.replace(
    /href=\{m\.documentUrl\}/,
    "href={formatToPreviewUrl(m.documentUrl)}"
  );
  
  fs.writeFileSync('src/components/MinuteMeetingPage.tsx', code);
  console.log('patched MinuteMeetingPage');
}
