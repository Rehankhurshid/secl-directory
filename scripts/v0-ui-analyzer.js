#!/usr/bin/env node

const { readFile, writeFile, mkdir } = require('fs/promises');
const { existsSync } = require('fs');
const path = require('path');
const chalk = require('chalk');
const { Command } = require('commander');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

const V0_API_URL = 'https://api.v0.dev/v1/chat/completions';

async function ensureOutputDir(outputPath) {
  const dir = path.dirname(outputPath);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

async function callV0Api(messages) {
  const apiKey = process.env.V0_API_KEY;
  if (!apiKey) {
    throw new Error('V0_API_KEY not found in environment variables');
  }

  const response = await fetch(V0_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'v0-1.5-md',
      messages: messages,
      temperature: 0.7,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API request failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function buildPromptWithFiles(prompt, files) {
  let fullPrompt = `UI Design Request:\n${prompt}\n\n`;

  if (files && files.length > 0) {
    fullPrompt += 'Context Files:\n\n';
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const content = await readFile(file, 'utf-8');
        fullPrompt += `--- File ${i + 1}: ${path.basename(file)} ---\n`;
        fullPrompt += `${content}\n\n`;
      } catch (error) {
        console.warn(chalk.yellow(`Warning: Could not read file ${file}`));
      }
    }
  }

  fullPrompt += `
Please provide a comprehensive UI structure analysis including:
- Component breakdown with clear hierarchy
- Specific Tailwind CSS classes for styling
- Code examples using React/Next.js
- Accessibility features (ARIA labels, keyboard navigation)
- Mobile-first responsive approach
- Performance optimization suggestions
- State management recommendations
- Example implementation code
`;

  return fullPrompt;
}

async function analyzeUI(options) {
  console.log(chalk.cyan('🚀 Starting V0 UI Analysis...\n'));

  try {
    let result;
    const systemPrompt = `You are a UI/UX expert helping to design and structure user interfaces. 
    Analyze the provided files and requirements, then suggest:
    1. Component structure and hierarchy
    2. UI patterns and best practices
    3. Tailwind CSS styling approach
    4. Accessibility considerations
    5. Responsive design strategy
    6. State management needs
    7. User interaction flows
    8. Example implementation code`;

    if (options.screenshot) {
      // For screenshot analysis
      const imageData = await readFile(options.screenshot, 'base64');
      const prompt = `Analyze this UI screenshot and generate:
      1. React component structure
      2. Tailwind CSS styling
      3. Responsive design approach
      4. Accessibility improvements
      
      ${options.prompt ? `Additional Requirements: ${options.prompt}` : ''}`;

      result = await callV0Api([
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: [
            { type: 'text', text: prompt },
            { 
              type: 'image', 
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: imageData
              }
            }
          ]
        }
      ]);
    } else if (options.component) {
      // Analyze existing component
      const componentContent = await readFile(options.component, 'utf-8');
      const prompt = `Analyze this existing UI component and suggest:
      1. Improvements to component structure
      2. Better Tailwind CSS usage
      3. Performance optimizations
      4. Accessibility enhancements
      5. Code refactoring opportunities
      
      Component code:
      ${componentContent}`;

      result = await callV0Api([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]);
    } else {
      // Process prompt with files
      const fullPrompt = await buildPromptWithFiles(
        options.prompt || 'Analyze the provided files and suggest UI structure',
        options.files || []
      );

      result = await callV0Api([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: fullPrompt }
      ]);
    }

    console.log(chalk.green('✅ Analysis complete!\n'));
    console.log(chalk.cyan('=== V0 UI Analysis Results ===\n'));
    console.log(result);

    // Save to file if requested
    if (options.save && options.output) {
      await ensureOutputDir(options.output);
      await writeFile(options.output, result, 'utf-8');
      console.log(chalk.green(`\n✅ Results saved to: ${options.output}`));
    }

  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
    process.exit(1);
  }
}

// CLI setup
const program = new Command();

program
  .name('v0-ui-analyzer')
  .description('Analyze UI designs and generate component structures using V0 API')
  .version('1.0.0');

// Analyze command
program
  .command('analyze')
  .description('Analyze UI with custom prompt and files')
  .option('-p, --prompt <prompt>', 'Custom prompt for analysis')
  .option('-f, --files <files...>', 'Files to include in analysis')
  .option('-o, --output <path>', 'Output file path')
  .option('-s, --save', 'Save results to file', false)
  .action(async (options) => {
    await analyzeUI(options);
  });

// Screenshot command
program
  .command('screenshot <path>')
  .description('Analyze a UI screenshot and generate component structure')
  .option('-r, --requirements <text>', 'Additional requirements')
  .option('-o, --output <path>', 'Output file path', './v0-output/screenshot-analysis.md')
  .option('-s, --save', 'Save results to file', true)
  .action(async (screenshotPath, options) => {
    await analyzeUI({
      screenshot: screenshotPath,
      prompt: options.requirements,
      output: options.output,
      save: options.save
    });
  });

// Component command
program
  .command('component <path>')
  .description('Analyze existing component and suggest improvements')
  .option('-o, --output <path>', 'Output file path', './v0-output/component-analysis.md')
  .option('-s, --save', 'Save results to file', true)
  .action(async (componentPath, options) => {
    await analyzeUI({
      component: componentPath,
      output: options.output,
      save: options.save
    });
  });

// Quick prompt command
program
  .command('prompt <text>')
  .description('Quick UI analysis with a text prompt')
  .option('-f, --files <files...>', 'Reference files')
  .option('-o, --output <path>', 'Output file path')
  .action(async (promptText, options) => {
    await analyzeUI({
      prompt: promptText,
      files: options.files,
      output: options.output,
      save: !!options.output
    });
  });

// Examples command
program
  .command('examples')
  .description('Show example prompts and usage')
  .action(() => {
    console.log(chalk.cyan('\n=== V0 UI Analyzer Examples ===\n'));
    
    console.log(chalk.yellow('1. Analyze a screenshot:'));
    console.log('   npm run v0:ui screenshot ./screenshots/dashboard.png -r "Make it more modern"\n');
    
    console.log(chalk.yellow('2. Analyze existing component:'));
    console.log('   npm run v0:ui component ./src/components/EmployeeCard.tsx\n');
    
    console.log(chalk.yellow('3. Custom prompt with files:'));
    console.log('   npm run v0:ui analyze -p "Create a messaging interface" -f ./docs/requirements.md ./examples/chat.tsx\n');
    
    console.log(chalk.yellow('4. Quick prompt:'));
    console.log('   npm run v0:ui prompt "Design a user profile page with activity feed"\n');
    
    console.log(chalk.gray('Pro tip: Use -s flag to save results to a file'));
  });

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}