import { v4 as uuidv4 } from 'uuid'

export interface Section {
  id: string
  title: string
  content: string
}

export function parseMarkdownToSections(markdown: string): Section[] {
  const lines = markdown.split('\n')
  const sections: Section[] = []
  let currentSection: Section | null = null

  lines.forEach((line) => {
    const headerMatch = line.match(/^(#{1,3})\s+(.*)$/)
    if (headerMatch) {
      if (currentSection) {
        sections.push(currentSection)
      }
      currentSection = {
        id: uuidv4(),
        title: headerMatch[2].trim(),
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
