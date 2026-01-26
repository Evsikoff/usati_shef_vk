
const fs = require('fs');

try {
    const dataContent = fs.readFileSync('data.js', 'utf8');
    // data.js usually starts with "gdjs.projectData = {..." and ends with "}; gdjs.runtimeGameOptions = {..." or similar.
    // We strictly want the JSON object.

    let jsonStr = dataContent;
    const startMarker = 'gdjs.projectData = ';
    const startIndex = jsonStr.indexOf(startMarker);

    if (startIndex !== -1) {
        jsonStr = jsonStr.substring(startIndex + startMarker.length);
    }

    // It might end with "; gdjs.runtimeGameOptions = {};" or just ";"
    // We'll traverse backwards to find the last closing brace.
    const lastBrace = jsonStr.lastIndexOf('}');
    if (lastBrace !== -1) {
        jsonStr = jsonStr.substring(0, lastBrace + 1);
    }

    const data = JSON.parse(jsonStr);

    // Function to traverse and find strings
    function findStrings(obj, path = '') {
        if (!obj || typeof obj !== 'object') return;

        // Check if this object looks like a Text Object definition
        // GDevelop Text Object structure: "type": "TextObject::Text", "content": { "text": "THE TEXT" }
        if (obj.type === 'TextObject::Text' && obj.content && typeof obj.content.text === 'string') {
            console.log(`[TextObject] ${path}.content.text: "${obj.content.text}"`);
        }

        // Also check "Text" behaviors or other string properties if generic
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                // heuristic: if it looks like a user visible string (contains spaces, not a filepath)
                // This is noisy, so maybe only specifically look for "text" keys in other contexts?
                if (key === 'text' || key === 'string') {
                    // console.log(`[Generic] ${path}.${key}: "${obj[key]}"`);
                }
            } else if (typeof obj[key] === 'object') {
                findStrings(obj[key], `${path}.${key}`);
            }
        }
    }

    findStrings(data);

} catch (e) {
    console.error("Error:", e.message);
}
