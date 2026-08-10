const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/const \[showSplash, setShowSplash\] = useState\(true\);/, "const [showSplash, setShowSplash] = useState(false);");

fs.writeFileSync('src/App.tsx', code);
console.log('SplashScreen disabled');
