import indentString from 'indent-string';

import type { AgentResult } from '../../agent/AgentResult';

export function formatAgentResult(result: AgentResult): string {
  const { chain } = result;
  const task =
    chain.intermediateSteps[0]?.action?.log?.split('\n')[0]?.substring(10) ||
    'Unknown Task';

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

  return `# Task: ${task}
  
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
