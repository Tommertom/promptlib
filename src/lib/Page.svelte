<script context="module" lang="ts">
  declare const chrome: any
</script>

<script lang="ts">
  import {
    loadContextsAndPrompts,
    addPromptToLibrary,
    prompts,
    type Prompt,
    contexts,
    projectInfo,
    updatePromptInLibrary,
    removePromptFromLibrary,
    addContextToLibrary,
    type PromptContext,
    updateContextInLibrary,
    removeContextFromLibrary,
    completePromptWithContext,
    setPromptsInLibrary,
    setContextsInLibrary,
    setProjectTitle,
    projects_available,
    type Project,
    startNewProject,
    selectProjectFromLibrary,
  } from './prompts'

  import { lastUsedSettings, setLastUsedPromptId } from './userSettings'
  import { add, trash, send, codeDownload, albumsOutline } from 'ionicons/icons'
  import { downloadJSON, uploadJSON, writeToClipboardAndToast } from './utils'
  import { popoverController } from 'ionic-svelte'
  import Counter from './Counter.svelte'
  import { writable } from 'svelte/store'

  //
  // All init routines
  //
  async function sendTextToContent(promptToPaste: Prompt | undefined) {
    if (!promptToPaste) {
      return
    }
    console.log(
      'Sending text to content',
      promptToPaste,
      completePromptWithContext(promptToPaste, $contexts),
    )

    await writeToClipboardAndToast(
      completePromptWithContext(promptToPaste, $contexts),
    )
  }

  const setToFirstPrompt = () => {
    if ($prompts.length > 0) {
      selectPrompt($prompts[0])
    } else selectedPrompt = undefined
  }
  loadContextsAndPrompts().then(async () => {
    //set the first prompt as selected - if there is one
    setToFirstPrompt()

    // use lastUsedSettings to set the selected prompt
    if ($lastUsedSettings.lastUsedPromptId) {
      const selectedPromptSearch = $prompts.find(
        (prompt) => prompt.id === $lastUsedSettings.lastUsedPromptId,
      )
      if (selectedPromptSearch) {
        selectedPrompt = selectedPromptSearch
      }
    }
  })

  //
  // local state
  //
  let selectedPrompt: Prompt | undefined = undefined
  let selectedContext: PromptContext | undefined = undefined
  let lastSelectedContextLabel = ''

  //
  // methods
  //
  const addPrompt = () => {
    const title = prompt('Enter the title of the prompt')
    const promptText = ''
    console.log(title, promptText)

    if (!title) {
      return
    }

    const newPrompt = { title, prompt: promptText, id: Date.now() }

    addPromptToLibrary(newPrompt)
    selectedPrompt = newPrompt
    setLastUsedPromptId(newPrompt.id)
  }

  const updatePromptTitle = (promptToChange: Prompt | undefined) => {
    if (!promptToChange) {
      return
    }

    const title = prompt('Enter the title of the prompt', promptToChange.title)
    if (title) {
      promptToChange.title = title
      updatePromptInLibrary(promptToChange)

      selectedPrompt = { ...promptToChange }
    }
  }

  const selectPrompt = (prompt: Prompt) => {
    selectedPrompt = prompt
    setLastUsedPromptId(prompt.id)
  }

  const updatePromptPromptValue = (event: CustomEvent) => {
    if (selectedPrompt) {
      selectedPrompt.prompt = event.detail.value
      updatePromptInLibrary(selectedPrompt)
    }
  }

  const deletePrompt = (prompt: Prompt | undefined) => {
    if (prompt) {
      if (confirm('Are you sure you want to delete this prompt?')) {
        removePromptFromLibrary(prompt.id)
        setToFirstPrompt()
      }
    }
  }

  //
  // Context methods
  //
  const addContext = () => {
    const label = prompt('Enter the label for the context')
    const content = ''

    if (label) {
      const sanitizedLabel = label
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLocaleUpperCase()
      addContextToLibrary({ label: sanitizedLabel, content })
    }
  }

  const selectContext = async (context: PromptContext) => {
    console.log('state', lastSelectedContextLabel, context)
    // if this is a first click, we just copy the label to clipboard
    if (selectedContext && context.label !== lastSelectedContextLabel) {
      lastSelectedContextLabel = context.label
      await writeToClipboardAndToast('[' + context.label + ']')
    } else {
      lastSelectedContextLabel = context.label
      selectedContext = context
    }
  }

  const updateContextValue = (event: CustomEvent) => {
    if (selectedContext) {
      selectedContext.content = event.detail.value
      updateContextInLibrary(selectedContext)
    }
  }

  const deleteContext = (context: PromptContext | undefined) => {
    if (context) {
      if (confirm('Are you sure you want to delete this context?')) {
        removeContextFromLibrary(context.label)
        selectedContext = undefined
      }
    }
  }

  //
  // upload and download stuff
  //
  const downloadProject = () => {
    downloadJSON(
      { prompts: $prompts, contexts: $contexts, title: $projectInfo.title },
      $projectInfo.title,
    )
  }

  const uploadProject = async () => {
    const data = (await uploadJSON()) as {
      prompts: Prompt[]
      contexts: PromptContext[]
      title: string
    }

    if (data.prompts && data.contexts) {
      setPromptsInLibrary(data.prompts)
      setContextsInLibrary(data.contexts)
      setProjectTitle(data.title)
      setToFirstPrompt()
    }
  }

  //
  // Project
  //
  const changeTitle = () => {
    const title = prompt(
      'Change the name for the project (or leave empty to start a new one)',
      $projectInfo.title,
    )

    if (title && title.length > 2) {
      setProjectTitle(title)
    }

    if (title === '') {
      startNewProject()
      setToFirstPrompt()
    }
  }

  const showProjectPopover = writable<boolean>(false)
  const selectProject = async (project: Project) => {
    selectProjectFromLibrary(project.projectInfo.id)
    setToFirstPrompt()
    showProjectPopover.set(false)
  }

  const deleteProject = (project: any) => {
    if (confirm('Are you sure you want to delete this project?')) {
      // remove the project from the list
      const newProjects = $projects_available.filter(
        (p) => p.projectInfo.title !== project.projectInfo.title,
      )
      projects_available.set(newProjects)

      if (newProjects.length === 1) {
        selectProject(newProjects[0])
      }
    }
  }
</script>

<ion-popover
  is-open={$showProjectPopover}
  on:didDismiss={() => {
    showProjectPopover.set(false)
  }}
>
  <ion-list>
    <ion-item>
      <ion-label>Available projects</ion-label>
    </ion-item>
    {#each $projects_available as project}
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <ion-item
        on:click={() => {
          selectProject(project)
        }}
      >
        <ion-label>
          {project.projectInfo.title}
        </ion-label>
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="action-button" on:click={() => deleteProject(project)}>
          <ion-icon icon={trash}></ion-icon>
        </div>
      </ion-item>
    {/each}
  </ion-list>
</ion-popover>

<ion-header>
  <ion-toolbar>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <ion-title on:click={changeTitle}>{$projectInfo.title}</ion-title>

    <ion-buttons slot="end">
      <div class="action-button-container">
        {#if $projects_available.length > 1}
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            class="action-button"
            on:click={() => {
              showProjectPopover.set(true)
            }}
          >
            <ion-icon icon={albumsOutline}></ion-icon>
          </div>
        {/if}
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="action-button" on:click={downloadProject}>
          <ion-icon icon={codeDownload}></ion-icon>
        </div>
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="action-button" on:click={uploadProject}>
          <ion-icon
            style="transform: scaleY(-1);"
            icon={codeDownload}
          ></ion-icon>
        </div>
      </div>
    </ion-buttons>
  </ion-toolbar>
</ion-header>

<ion-content class="ion-padding">
  <ion-card>
    <ion-card-content>
      <ion-list>
        {#each $prompts as prompt}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <ion-item on:click={() => selectPrompt(prompt)}>
            <ion-label>
              <h3>{prompt.title}</h3>
              <p>{prompt.prompt}</p>
            </ion-label>
          </ion-item>
        {/each}
        {#if $prompts.length === 0}
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <ion-item on:click={() => addPrompt()}>
            <ion-label>
              <h3>Click here to enter your first prompt</h3>
            </ion-label>
          </ion-item>
        {/if}
        <div class="action-button-container">
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div class="action-button" on:click={() => addPrompt()}>
            <ion-icon icon={add}></ion-icon>
          </div>
        </div>
      </ion-list>
    </ion-card-content>
  </ion-card>

  {#if selectedPrompt}
    <ion-card>
      <ion-card-header>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <ion-card-title on:click={() => updatePromptTitle(selectedPrompt)}>
          {selectedPrompt.title}
        </ion-card-title>
      </ion-card-header>

      <ion-card-content>
        <ion-textarea
          placeholder="Enter the prompt here"
          auto-grow={true}
          value={selectedPrompt.prompt}
          on:ionInput={updatePromptPromptValue}
        ></ion-textarea>

        <div class="action-button-container">
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            class="action-button"
            on:click={() => sendTextToContent(selectedPrompt)}
          >
            <ion-icon icon={send}></ion-icon>
          </div>
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            class="action-button"
            on:click={() => deletePrompt(selectedPrompt)}
          >
            <ion-icon icon={trash}></ion-icon>
          </div>
        </div>
      </ion-card-content>
    </ion-card>

    <ion-card>
      <ion-card-header>
        <ion-card-title>Contexts</ion-card-title>
      </ion-card-header>

      <ion-card-content>
        {#each $contexts as context}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <ion-chip
            on:click={() => {
              selectContext(context)
            }}
          >
            {context.label}
          </ion-chip>
        {/each}
        <br />
        {#if selectedContext}
          <ion-textarea
            placeholder="Enter the context here"
            auto-grow={true}
            value={selectedContext.content}
            on:ionInput={updateContextValue}
          ></ion-textarea>
          <br />
          <div class="action-button-container" style="">
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div class="action-button" on:click={() => addContext()}>
              <ion-icon icon={add}></ion-icon>
            </div>
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div
              class="action-button"
              on:click={() => deleteContext(selectedContext)}
            >
              <ion-icon icon={trash}></ion-icon>
            </div>
          </div>
        {/if}
        {#if !selectedContext}
          <br />
          <div style="float: right; display: flex; gap: 5px;">
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div class="action-button" on:click={() => addContext()}>
              <ion-icon icon={add}></ion-icon>
            </div>
          </div>
        {/if}
      </ion-card-content>
    </ion-card>
  {/if}
</ion-content>

<style>
  .action-button {
    color: lightgray;
    background: #090909;
    border-radius: 8px;
    padding: 5px;
    margin-top: 5px;
    margin-bottom: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .action-button-container {
    float: right;
    display: flex;
    gap: 5px;
  }

  .action-button-container > * {
    margin-right: 5px;
  }

  ion-chip {
    transform: scale(0.8);
  }

  ion-card-title,
  ion-title {
    font-size: 80%;
    text-align: left;
  }

  ion-textarea {
    width: 100%;
    text-align: left;
    border: 1px solid lightgray;
    padding-left: 10px;
    padding-right: 10px;
    font-size: 90%;
    vertical-align: top;
  }
</style>
