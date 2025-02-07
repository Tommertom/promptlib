import localforage from 'localforage'
import { derived, get, readable, readonly, writable } from 'svelte/store'

export interface PromptContext {
  label: string
  content: string
}

export interface Prompt {
  title: string
  id: number
  prompt: string
}

export interface ProjectInfo {
  title: string
  id: number
}

export interface Project {
  projectInfo: ProjectInfo
  prompts: Prompt[]
  contexts: PromptContext[]
}

export const prompts = writable<Prompt[]>([])
export const contexts = writable<PromptContext[]>([])
export const projectInfo = writable<ProjectInfo>({ title: '', id: Date.now() })
export const projects_available = writable<Project[]>([])

export const loadContextsAndPrompts = async () => {
  // load all prompts from indexedDB using localforage
  const promptsFromIndexedDB = await localforage.getItem<Prompt[]>('prompts')

  // if there are no prompts in indexedDB, set the prompts store to an empty array
  if (!promptsFromIndexedDB) {
    prompts.set([])
  } else {
    prompts.set(promptsFromIndexedDB)
  }

  // load all contexts from indexedDB using localforage
  const contextsFromIndexedDB =
    await localforage.getItem<PromptContext[]>('contexts')
  console.log('loading contextsFromIndexedDB', contextsFromIndexedDB)

  // if there are no contexts in indexedDB, set the contexts store to an empty array
  if (!contextsFromIndexedDB) {
    contexts.set([])
  } else {
    contexts.set(contextsFromIndexedDB)
  }

  // load the project from indexedDB using localforage
  const projectFromIndexedDB = await localforage.getItem<ProjectInfo>('project')
  console.log('loading projectFromIndexedDB', projectFromIndexedDB)

  // if there is no project in indexedDB, set the project store to a default project
  if (!projectFromIndexedDB) {
    projectInfo.set({ title: 'Click to change project name', id: Date.now() })
  } else {
    projectInfo.set(projectFromIndexedDB)
  }

  // load all available projects from indexedDB using localforage
  const projectsAvailableFromIndexedDB =
    await localforage.getItem<Project[]>('projects_available')
  console.log(
    'loading projectsAvailableFromIndexedDB',
    projectsAvailableFromIndexedDB,
  )
  if (!projectsAvailableFromIndexedDB) {
    projects_available.set([])
  } else {
    projects_available.set(projectsAvailableFromIndexedDB)
  }
}

export const setProjectsAvailable = async (projects: Project[]) => {
  projects_available.set(projects)
  await localforage.setItem('projects_available', projects)
}

const saveAllProjectData = async () => {
  // just brute force save all stuff
  await localforage.setItem('prompts', get(prompts))
  await localforage.setItem('contexts', get(contexts))
  await localforage.setItem('project', get(projectInfo))

  // upsert the project in the projects_available store
  const currentProjects = get(projects_available)
  const index = currentProjects.findIndex(
    (p) => p.projectInfo.id === get(projectInfo).id,
  )
  const currentProject = {
    projectInfo: get(projectInfo),
    prompts: get(prompts),
    contexts: get(contexts),
  }
  if (index === -1) {
    projects_available.set([...currentProjects, currentProject])
    console.log('Project not found in projects_available, adding it')
  } else {
    currentProjects[index] = { ...currentProject }
    projects_available.set(currentProjects)
  }

  await localforage.setItem('projects_available', get(projects_available))
}

//
// Prompts
//
export const setPromptsInLibrary = async (newPrompts: Prompt[]) => {
  prompts.set(newPrompts)
  saveAllProjectData()
}

export const addPromptToLibrary = async (newPrompt: Prompt) => {
  const currentPrompts = get(prompts)
  const newPrompts = [...currentPrompts, newPrompt]
  prompts.set(newPrompts)
  saveAllProjectData()
}
export const removePromptFromLibrary = async (promptId: number) => {
  const currentPrompts = get(prompts)
  const newPrompts = currentPrompts.filter((prompt) => prompt.id !== promptId)
  prompts.set(newPrompts)
  saveAllProjectData()
}

export const updatePromptInLibrary = async (updatedPrompt: Prompt) => {
  const currentPrompts = get(prompts)
  const index = currentPrompts.findIndex(
    (prompt) => prompt.id === updatedPrompt.id,
  )
  currentPrompts[index] = updatedPrompt
  prompts.set(currentPrompts)
  saveAllProjectData()
}

//
// Contexts
//
export const setContextsInLibrary = async (newContexts: PromptContext[]) => {
  contexts.set(newContexts)
  saveAllProjectData()
}

export const addContextToLibrary = (newContext: PromptContext) => {
  const currentContexts = get(contexts)
  const newContexts = [...currentContexts, newContext]
  contexts.set(newContexts)
  saveAllProjectData()
  return newContext
}

export const removeContextFromLibrary = async (contextLabel: string) => {
  const currentContexts = get(contexts)
  const newContexts = currentContexts.filter(
    (context) => context.label !== contextLabel,
  )
  contexts.set(newContexts)
  saveAllProjectData()
}

export const updateContextInLibrary = async (updatedContext: PromptContext) => {
  const currentContexts = get(contexts)
  const index = currentContexts.findIndex(
    (context) => context.label === updatedContext.label,
  )
  currentContexts[index] = updatedContext
  contexts.set(currentContexts)
  saveAllProjectData()
}

export const updateContextLabelInProject = (
  context: PromptContext,
  newLabel: string,
) => {
  const currentContexts = get(contexts)
  const index = currentContexts.findIndex((c) => c.label === context.label)

  // Check if the sanitizedLabel is already being used
  const isLabelUsed = currentContexts.some((c) => c.label === newLabel)
  if (isLabelUsed) {
    return
  }

  currentContexts[index].label = newLabel
  contexts.set(currentContexts)
  saveAllProjectData()
}

//
//
//
export const completePromptWithContext = (
  prompt: Prompt,
  contexts: PromptContext[],
) => {
  let returnValue = prompt.prompt
  let hasFoundContext = false
  let iterations = 0
  do {
    hasFoundContext = false
    iterations = iterations + 1
    for (const context of contexts) {
      if (returnValue.includes('[' + context.label + ']')) {
        hasFoundContext = true
        returnValue = returnValue
          .split('[' + context.label + ']')
          .join(context.content)
      }
    }

    if (iterations > 1000) {
      returnValue = 'Error in prompt- recursion suspected'
      hasFoundContext = false
    }
  } while (hasFoundContext)

  return returnValue
}

//
// Project
//
export const setProjectTitle = async (newTitle: string) => {
  projectInfo.update((currentProject) => {
    console.log('Updating project title', currentProject)
    currentProject.title = newTitle
    return currentProject
  })
  saveAllProjectData()
}

export const startNewProject = async () => {
  // ensure a save of the current project
  saveAllProjectData()

  // set the project to a new project
  projectInfo.set({ title: 'Click to change project name', id: Date.now() })
  prompts.set([])
  contexts.set([])

  // save the new project
  saveAllProjectData()
}

export const selectProjectFromLibrary = async (projectId: number) => {
  console.log('selectProjectFromLibrary', projectId)
  // ensure a save of the current project
  saveAllProjectData()

  // load the project from the library
  const project = get(projects_available).find(
    (p) => p.projectInfo.id === projectId,
  )
  console.log('Found project', project, get(projects_available))

  if (project) {
    projectInfo.set(project.projectInfo)
    prompts.set(project.prompts)
    contexts.set(project.contexts)
  }

  // save the new project
  saveAllProjectData()
}

export const deleteProjectFromLibrary = async (projectId: number) => {
  const currentProjects = get(projects_available)
  const newProjects = currentProjects.filter(
    (project) => project.projectInfo.id !== projectId,
  )
  projects_available.set(newProjects)
  saveAllProjectData()
}
