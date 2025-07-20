const https = require('https');
const fs = require('fs');

const prompt = `Create a comprehensive employee selection drawer component for group member selection with:

STRUCTURE:
- Mobile-first drawer that slides up from bottom (95vh max height)
- Sticky header with title "Select Team Members" and close button
- Search bar with debounced real-time search
- Filter button showing active filter count as badge
- Scrollable employee list with card-based selection
- Sticky footer with Cancel and "Add Selected (count)" buttons

FEATURES:
- Real-time search across name, ID, designation, department
- Advanced filters: Department, Location, Grade, Category, Gender, Blood Group
- Each filter shows item count (e.g., "IT Department (45)")
- Bulk selection with "Select all visible" checkbox
- Individual employee cards showing:
  - Checkbox for selection
  - Avatar with fallback initials
  - Name, Employee ID, Designation
  - Department and Location badges
  - Selected state with checkmark icon
- Filter summary showing results count and active filters
- Clear all filters button

INTERACTIONS:
- Click anywhere on card to toggle selection
- Visual feedback for selected state (primary color background)
- Indeterminate state for partial "select all"
- Smooth scrolling with preserved position
- Loading skeletons during data fetch

TECHNICAL:
- TypeScript interfaces for Employee type
- React Query for data fetching
- Set/Map for efficient selection state
- Debounced search (300ms)
- Memoized filter calculations
- Support initial selected employees

Use shadcn/ui components (Drawer, ScrollArea, Input, Button, Checkbox, Badge, Avatar, Card), Tailwind CSS, and TypeScript.`;

const data = JSON.stringify({
  model: 'v0',
  messages: [
    {
      role: 'user',
      content: prompt
    }
  ]
});

const options = {
  hostname: 'v0.dev',
  path: '/api/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer v1:DIZInQlYYZsmvY2R4cBJXfIo:j92kttIxsHfiXSnKQJmlhrwk'
  }
};

console.log('Generating employee selection component with V0...\n');

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    process.stdout.write(chunk);
    responseData += chunk;
  });

  res.on('end', () => {
    try {
      // Save the response
      const timestamp = new Date().toISOString().split('.')[0].replace(/:/g, '-');
      const filename = `v0-ui-suggestions/employeeSelection-${timestamp}.tsx`;
      
      // Extract code if it's in the response
      const lines = responseData.split('\n');
      let code = '';
      let inCodeBlock = false;
      
      for (const line of lines) {
        if (line.includes('```tsx') || line.includes('```typescript')) {
          inCodeBlock = true;
          continue;
        }
        if (line.includes('```') && inCodeBlock) {
          inCodeBlock = false;
          continue;
        }
        if (inCodeBlock) {
          code += line + '\n';
        }
      }
      
      if (code) {
        fs.writeFileSync(filename, code);
        console.log(`\n\nGenerated code saved to: ${filename}`);
      } else {
        fs.writeFileSync(filename + '.raw', responseData);
        console.log(`\n\nRaw response saved to: ${filename}.raw`);
      }
    } catch (error) {
      console.error('\nError processing response:', error);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(data);
req.end();