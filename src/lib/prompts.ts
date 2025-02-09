import localforage from 'localforage'
import { derived, get, readable, readonly, writable } from 'svelte/store'
import { v4 as uuidv4 } from 'uuid'

export interface PromptContext {
  id: string
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
  id: string
}

export interface Project {
  projectInfo: ProjectInfo
  prompts: Prompt[]
  contexts: PromptContext[]
}

export const prompts = writable<Prompt[]>([])
export const contexts = writable<PromptContext[]>([])
export const projectInfo = writable<ProjectInfo>({ title: '', id: uuidv4() })
export const projects_available = writable<Project[]>([])
export const selected_project = writable<string>('')

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
    projectInfo.set({ title: 'Click to change project name', id: uuidv4() })
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
  newContext.id = uuidv4()
  const currentContexts = get(contexts)
  const newContexts = [...currentContexts, newContext]
  contexts.set(newContexts)
  saveAllProjectData()
  return newContext
}

export const removeContextFromLibrary = async (contextId: string) => {
  const currentContexts = get(contexts)
  const newContexts = currentContexts.filter(
    (context) => context.id !== contextId,
  )
  contexts.set(newContexts)
  saveAllProjectData()
}

export const updateContextInLibrary = async (updatedContext: PromptContext) => {
  const currentContexts = get(contexts)
  const index = currentContexts.findIndex(
    (context) => context.id === updatedContext.id,
  )
  currentContexts[index] = updatedContext
  contexts.set(currentContexts)
  saveAllProjectData()
}

export const updateContextLabelInProject = (
  context: PromptContext,
  newLabel: string,
) => {
  // let's update the label first
  const currentContexts = get(contexts)
  const index = currentContexts.findIndex((c) => c.id === context.id)
  const oldLabel = context.label

  // Check if the sanitizedLabel new is already being used. If not, change the label
  const isLabelUsed = currentContexts.some((c) => c.label === newLabel)
  if (isLabelUsed) {
    return
  }
  currentContexts[index].label = newLabel

  // then we are going to update all the prompts that use this context
  const currentPrompts = get(prompts)
  for (const prompt of currentPrompts) {
    while (prompt.prompt.includes('[' + oldLabel + ']')) {
      prompt.prompt = prompt.prompt.replace(
        '[' + oldLabel + ']',
        '[' + newLabel + ']',
      )
    }
  }
  prompts.set(currentPrompts)

  // and we are going to replace all content of all contexts that contain the old label
  for (const context of currentContexts) {
    while (context.content.includes('[' + oldLabel + ']')) {
      context.content = context.content.replace(
        '[' + oldLabel + ']',
        '[' + newLabel + ']',
      )
    }
  }
  contexts.set(currentContexts)

  // save stuff and we are done
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
  projectInfo.set({ title: 'Click to change project name', id: uuidv4() })
  prompts.set([])
  contexts.set([])

  // save the new project
  saveAllProjectData()
}

export const copyProject = async (projectId: string, newTitle: string) => {
  console.log('copyProject', projectId, newTitle)
  // ensure a save of the current project
  saveAllProjectData()

  // load the project from the library
  const project = get(projects_available).find(
    (p) => p.projectInfo.id === projectId,
  )
  console.log('Found project to copy', project, get(projects_available))

  if (project) {
    const newProject = {
      projectInfo: { title: newTitle, id: uuidv4() },
      prompts: project.prompts,
      contexts: project.contexts,
    }
    projects_available.update((projects) => [...projects, newProject])
    projectInfo.set(newProject.projectInfo)
    prompts.set(newProject.prompts)
    contexts.set(newProject.contexts)
  }

  // save the new project
  saveAllProjectData()
}

export const selectProjectFromLibrary = async (projectId: string) => {
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
    selected_project.set(projectId)
  }

  // save the new project
  saveAllProjectData()
}

export const deleteProjectFromLibrary = async (projectId: string) => {
  const currentProjects = get(projects_available)
  const newProjects = currentProjects.filter(
    (project) => project.projectInfo.id !== projectId,
  )
  projects_available.set(newProjects)
  saveAllProjectData()
}
