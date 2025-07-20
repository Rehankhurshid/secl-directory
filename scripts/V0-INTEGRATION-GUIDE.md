# V0 API Integration Guide for SECL Employee Directory

## 🚀 Quick Start

### 1. Set Up Your V0 API Key
```bash
# Set as environment variable
export V0_API_KEY="your-v0-api-key-here"

# Or add to .env.local
echo "V0_API_KEY=your-v0-api-key-here" >> .env.local
```

### 2. Generate UI Suggestions

```bash
# View available components
node scripts/v0-api-client.js

# Generate specific component
node scripts/v0-api-client.js employeeCard
node scripts/v0-api-client.js employeeDirectory
node scripts/v0-api-client.js loginPage
node scripts/v0-api-client.js filterDrawer
```

### 3. Analyze Generated UI

```bash
# Run the analyzer on V0 output
npx tsx scripts/v0-ui-analyzer.ts
```

## 📋 Available UI Components

### 1. **Employee Card** (`employeeCard`)
- Modern card design for employee information
- Responsive layout with avatar, badges, and actions
- Color-coded categories and grades
- Quick action buttons

### 2. **Employee Directory** (`employeeDirectory`)
- Full page layout with search and filters
- Desktop: 2-column grid with pagination
- Mobile: Single column with infinite scroll
- Advanced filtering system

### 3. **Login Page** (`loginPage`)
- Two-step OTP authentication flow
- Employee ID input
- Modern, secure design
- Biometric and SSO options

### 4. **Filter Drawer** (`filterDrawer`)
- Mobile-optimized bottom sheet
- Multi-select filters
- Search within filters
- Active filter chips

## 🔄 Workflow

### Step 1: Generate with V0
```bash
# Generate UI suggestion
node scripts/v0-api-client.js employeeCard

# Output saved to: v0-ui-suggestions/employeeCard-[timestamp].json
```

### Step 2: Share with Claude
1. Open the generated JSON file
2. Copy the `code` section
3. Share with Claude: "Here's the V0 UI suggestion for the employee card. Please analyze this and adapt it for our SECL requirements."

### Step 3: Claude's Analysis
Claude will:
- Extract design patterns and color schemes
- Identify shadcn/ui components used
- Analyze responsive features
- Suggest improvements specific to SECL
- Adapt the code to match your existing patterns

## 📊 Example Analysis Output

```json
{
  "componentName": "employeeCard",
  "designPatterns": [
    "Card-based layout",
    "Grid layout",
    "Hover interactions"
  ],
  "colorScheme": ["blue", "gray", "green", "red"],
  "layoutStructure": "Grid with responsive columns",
  "responsiveFeatures": [
    "Responsive grid",
    "Responsive visibility"
  ],
  "accessibilityFeatures": [
    "ARIA attributes",
    "Semantic roles"
  ],
  "shadcnComponents": [
    "card",
    "button",
    "badge",
    "avatar"
  ],
  "customizations": [
    "Add SECL branding colors",
    "Include employee ID field",
    "Add department hierarchy"
  ]
}
```

## 🎨 Customization Guidelines

### When Adapting V0 Suggestions:

1. **Keep What Works**
   - Clean layout patterns
   - Responsive breakpoints
   - Accessibility features
   - Animation/transition styles

2. **Adapt for SECL**
   - Use SECL color scheme
   - Add required fields (Employee ID, Grade, etc.)
   - Implement security features
   - Add offline support

3. **Ignore V0 Suggestions For**
   - Generic styling that doesn't match SECL brand
   - Features not needed in employee directory
   - Complex animations that impact performance

## 🛠️ Advanced Usage

### Custom Prompts
Edit `UI_PROMPTS` in `v0-api-client.js`:

```javascript
const UI_PROMPTS = {
  customComponent: {
    prompt: `Your custom prompt here...`,
    type: 'component'
  }
};
```

### Batch Generation
```bash
# Generate all components
for component in employeeCard employeeDirectory loginPage filterDrawer; do
  node scripts/v0-api-client.js $component
  sleep 2 # Rate limiting
done
```

### Integration with Build Process
```json
// package.json
{
  "scripts": {
    "v0:generate": "node scripts/v0-api-client.js",
    "v0:analyze": "npx tsx scripts/v0-ui-analyzer.ts"
  }
}
```

## 📝 Notes

1. **API Rate Limits**: V0 API may have rate limits. Add delays between requests.
2. **Cost**: Check V0 pricing for API usage.
3. **Security**: Never commit your API key. Use environment variables.
4. **Adaptation**: V0 suggestions are starting points - always adapt for your specific needs.

## 🤝 Collaboration Flow

1. **You**: Run V0 API to generate UI suggestions
2. **You**: Share the generated code with Claude
3. **Claude**: Analyzes and adapts the UI for SECL requirements
4. **Claude**: Implements the adapted version in your codebase
5. **You**: Review and test the implementation

This workflow combines V0's AI-powered UI generation with Claude's understanding of your specific project requirements for the best results.