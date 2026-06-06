/**
 * Replaces {{1}}, {{2}}, etc. placeholders in a template string with values from an array.
 * Example: replaceTemplateVariables("Hello {{1}}, your code is {{2}}", ["John", "1234"]) => "Hello John, your code is 1234"
 */
export function replaceTemplateVariables(template: string, variables: string[]): string {
  return template.replace(/\{\{(\d+)\}\}/g, (_match, index) => variables[Number(index) - 1] ?? _match)
}
