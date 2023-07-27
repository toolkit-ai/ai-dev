import indentString from 'indent-string';

import type { AgentResult } from '../../agent/AgentResult.js';

export function formatAgentResult(
  taskDescription: string,
  result: AgentResult
): string {
  const { chain } = result;
  const steps = chain.intermediateSteps
    .map(
      (step, index) => `### Step ${index + 1}: ${step.action.tool}
  
  ${step.action.log}
  
  \`\`\`json
  ${JSON.stringify(step.action.toolInput, null, 2)}
  \`\`\`
  
  **Observation:** ${step.observation}
  `
    )
    .join('\n\n\n');

  return `# Task: ${taskDescription}
  
  ${steps}
  
  ## Output
  
  \`\`\`json
  ${JSON.stringify(chain.output, null, 2)}
  \`\`\`

  ## Changed Files

  \`\`\`diff
${indentString(result.diff, 2)}
  \`\`\``;
}
