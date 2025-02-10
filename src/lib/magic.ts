import { v4 as uuidv4 } from 'uuid'
import type { PromptContext } from './prompts'

export function parseMarkdownToSections(markdown: string): PromptContext[] {
  const lines = markdown.split('\n')
  const sections: PromptContext[] = []
  let currentSection: PromptContext | null = null

  lines.forEach((line) => {
    const headerMatch = line.match(/^(#{1,3})\s+(.*)$/)
    if (headerMatch) {
      if (currentSection) {
        sections.push(currentSection)
      }
      currentSection = {
        id: uuidv4(),
        label: line
          .replace(/^#+\s*/, '')
          .replace(/\*\*/g, '')
          .trim(),
        content: '',
      }
    } else if (currentSection && line.trim()) {
      currentSection.content += line.trim() + '\n'
    }
  })

  if (currentSection) {
    sections.push(currentSection)
  }
  return sections
}
