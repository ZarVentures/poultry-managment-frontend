const fs = require('fs');

// Read the files
const pageContent = fs.readFileSync('app/purchases/page.tsx', 'utf8');
const newFormContent = fs.readFileSync('FORM_COMPLETE.txt', 'utf8');

// Find the start marker - right after </DialogHeader>
const startMarker = '</DialogHeader>';
const startIndex = pageContent.indexOf(startMarker);
if (startIndex === -1) {
  console.error('Could not find </DialogHeader>!');
  process.exit(1);
}

// Find where the old form content starts (after the closing tag and newline)
const formStartPos = pageContent.indexOf('<div className="space-y-4">', startIndex);
if (formStartPos === -1) {
  console.error('Could not find form start!');
  process.exit(1);
}

// Find the end marker - the closing </div> before </DialogContent>
const endMarker = '</DialogContent>';
const endIndex = pageContent.indexOf(endMarker, formStartPos);
if (endIndex === -1) {
  console.error('Could not find </DialogContent>!');
  process.exit(1);
}

// Find the last </div> before </DialogContent>
const formEndPos = pageContent.lastIndexOf('</div>', endIndex);
if (formEndPos === -1) {
  console.error('Could not find form end!');
  process.exit(1);
}

// Calculate the actual end position (after the </div> and newline)
const actualEndPos = formEndPos + '</div>'.length + 1; // +1 for newline

// Replace the content
const before = pageContent.substring(0, formStartPos);
const after = pageContent.substring(actualEndPos);
const newContent = before + newFormContent.trim() + '\n' + after;

// Write the new content
fs.writeFileSync('app/purchases/page.tsx', newContent, 'utf8');

console.log('✅ Form content replaced successfully!');
console.log(`Replaced ${actualEndPos - formStartPos} characters with ${newFormContent.trim().length} characters`);
console.log(`Form starts at position: ${formStartPos}`);
console.log(`Form ends at position: ${actualEndPos}`);
