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

export interface Project {
  title: string
}

export const prompts = writable<Prompt[]>([])
export const contexts = writable<PromptContext[]>([])
export const project = writable<Project>({ title: '' })

export const loadContextsAndPrompts = async () => {
  // load all prompts from indexedDB using localforage
  const promptsFromIndexedDB = await localforage.getItem<Prompt[]>('prompts')
  console.log('loading promptsFromIndexedDB', promptsFromIndexedDB)

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
  const projectFromIndexedDB = await localforage.getItem<Project>('project')
  console.log('loading projectFromIndexedDB', projectFromIndexedDB)

  // if there is no project in indexedDB, set the project store to a default project
  if (!projectFromIndexedDB) {
    project.set({ title: 'Click to change project name' })
  } else {
    project.set(projectFromIndexedDB)
  }
}

//
// Prompts
//
export const setPromptsInLibrary = async (newPrompts: Prompt[]) => {
  prompts.set(newPrompts)
  await localforage.setItem('prompts', get(prompts))
}

export const addPromptToLibrary = async (newPrompt: Prompt) => {
  const currentPrompts = get(prompts)
  const newPrompts = [...currentPrompts, newPrompt]
  prompts.set(newPrompts)
  await localforage.setItem('prompts', get(prompts))
}
export const removePromptFromLibrary = async (promptId: number) => {
  const currentPrompts = get(prompts)
  const newPrompts = currentPrompts.filter((prompt) => prompt.id !== promptId)
  prompts.set(newPrompts)
  await localforage.setItem('prompts', get(prompts))
}

export const updatePromptInLibrary = async (updatedPrompt: Prompt) => {
  const currentPrompts = get(prompts)
  const index = currentPrompts.findIndex(
    (prompt) => prompt.id === updatedPrompt.id,
  )
  currentPrompts[index] = updatedPrompt
  prompts.set(currentPrompts)
  await localforage.setItem('prompts', get(prompts))
}

//
// Contexts
//
export const setContextsInLibrary = async (newContexts: PromptContext[]) => {
  contexts.set(newContexts)
  await localforage.setItem('contexts', get(contexts))
}

export const addContextToLibrary = async (newContext: PromptContext) => {
  const currentContexts = get(contexts)
  const newContexts = [...currentContexts, newContext]
  contexts.set(newContexts)
  await localforage.setItem('contexts', get(contexts))
}

export const removeContextFromLibrary = async (contextLabel: string) => {
  const currentContexts = get(contexts)
  const newContexts = currentContexts.filter(
    (context) => context.label !== contextLabel,
  )
  contexts.set(newContexts)
  await localforage.setItem('contexts', get(contexts))
}

export const updateContextInLibrary = async (updatedContext: PromptContext) => {
  const currentContexts = get(contexts)
  const index = currentContexts.findIndex(
    (context) => context.label === updatedContext.label,
  )
  currentContexts[index] = updatedContext
  contexts.set(currentContexts)
  await localforage.setItem('contexts', get(contexts))
}

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
// Title
//
export const updateTitle = async (newTitle: string) => {
  project.update((currentProject) => {
    currentProject.title = newTitle
    return currentProject
  })
  await localforage.setItem('project', get(project))

  // project.set({ ...get(project) })
}
