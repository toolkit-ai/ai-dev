import type { AgentResult } from '../AgentResult';

export function formatAsMarkdown(result: AgentResult): string {
  const task =
    result.intermediateSteps[0]?.action?.log?.split('\n')[0]?.substring(10) ||
    'Unknown Task';

  const steps = result.intermediateSteps
    .map((step, index) => {
      return `### Step ${index + 1}: ${step.action.tool}
  
  ${step.action.log}
  
  \`\`\`json
  ${JSON.stringify(step.action.toolInput, null, 2)}
  \`\`\`
  
  **Observation:** ${step.observation}
  `;
    })
    .join('\n\n\n');

  return `# Task: ${task}
  
  ${steps}
  
  ## Output
  
  \`\`\`json
  ${JSON.stringify(result.output, null, 2)}
  \`\`\``;
}
