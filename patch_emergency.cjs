const fs = require('fs');
let code = fs.readFileSync('src/components/EmergencyPlanPage.tsx', 'utf8');

// Remove needsAuth
code = code.replace(/const \[needsAuth, setNeedsAuth\] = useState\(false\);\n/, '');

// Fix fetchFirstAidCertData calls inside useEffect
code = code.replace(/fetchFirstAidCertData\(false\)/g, 'fetchFirstAidCertData()');

// Remove the handleLoadLiveData function
code = code.replace(/const handleLoadLiveData = \(\) => \{[\s\S]*?catch \(\(\) => \{\s*setLoading\(false\);\s*\}\);\s*\};\s*/g, '');

// Clean up useEffect logic
code = code.replace(/if \(data\.length === 0\) \{\s*setNeedsAuth\(true\);\s*\} else \{\s*setCerts\(data\);\s*\}/g, 'setCerts(data);');

// Remove the rendering of needsAuth
code = code.replace(/\{needsAuth \? \([\s\S]*?\) : filteredCerts\.length === 0 \? \(/g, `{filteredCerts.length === 0 ? (`);

fs.writeFileSync('src/components/EmergencyPlanPage.tsx', code);
console.log('emergency plan patched successfully');
