const fs = require('fs');
let code = fs.readFileSync('src/components/AllIncidentRecordModal.tsx', 'utf8');

// Remove needsAuth
code = code.replace(/const \[needsAuth, setNeedsAuth\] = useState\(false\);\n/, '');

// Replace fetchIncidents
code = code.replace(/const fetchIncidents = async.*?finally {\s*setLoading\(false\);\s*}\s*};/s, `const fetchIncidents = async () => {
    setLoading(true);
    try {
      const data = await fetchLiveIncidentRecords();
      if (data && data.length > 0) {
        setIncidents(data as IncidentRecord[]);
        setSource('Google Sheets Live');
      } else {
        setIncidents(MOCK_INCIDENT_RECORDS);
        setSource('Local Cache Fallback');
      }
    } catch (err) {
      console.warn('Error fetching live incidents:', err);
      setIncidents(MOCK_INCIDENT_RECORDS);
      setSource('Local Cache Fallback');
    } finally {
      setLoading(false);
    }
  };`);
  
// Replace handleLoadLiveData
code = code.replace(/const handleLoadLiveData = \(\) => {\s*fetchIncidents\(true\);\s*};\s*/s, `const handleLoadLiveData = () => {
    fetchIncidents();
  };
`);

// Replace needsAuth rendering
code = code.replace(/\} else if \(requireAuth === false\) \{\s*setNeedsAuth\(true\);\s*\}/g, ``);
code = code.replace(/if \(requireAuth\) setNeedsAuth\(false\);/g, ``);

code = code.replace(/ onClick=\{\(\) => fetchIncidents\(source === 'Google Sheets Live'\)\}/g, ` onClick={() => fetchIncidents()}`);
code = code.replace(/ fetchIncidents\(false\);/g, ` fetchIncidents();`);

code = code.replace(/\) : needsAuth \? \([\s\S]*?\) : filteredIncidents\.length === 0 \? \(/g, `) : filteredIncidents.length === 0 ? (`);

fs.writeFileSync('src/components/AllIncidentRecordModal.tsx', code);
console.log('modal patched successfully');
