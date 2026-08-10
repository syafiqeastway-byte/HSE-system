const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Remove GSI
code = code.replace(/<!-- Google Identity Services -->\s*<script src="https:\/\/accounts.google.com\/gsi\/client" async defer><\/script>/, '');

fs.writeFileSync('index.html', code);
console.log('index.html patched successfully');
