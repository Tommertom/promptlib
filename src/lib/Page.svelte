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
    project,
    updatePromptInLibrary,
    removePromptFromLibrary,
    addContextToLibrary,
    type PromptContext,
    updateContextInLibrary,
    removeContextFromLibrary,
    completePromptWithContext,
    setPromptsInLibrary,
    setContextsInLibrary,
    updateTitle,
  } from './prompts'

  import { lastUsedSettings, setLastUsedPromptId } from './userSettings'
  import {
    add,
    copy,
    trash,
    send,
    chatbox,
    cloudDownload,
    cloudUpload,
    codeDownload,
  } from 'ionicons/icons'
  import { downloadJSON, uploadJSON, writeToClipboardAndToast } from './utils'

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

    // if (chrome && chrome.tabs && chrome.tabs.query)
    //   console.log('chrome.tabs.query', chrome.tabs)
    // chrome.tabs.query(
    //   { active: true, currentWindow: true },
    //   function (tabs: any) {
    //     chrome.tabs.sendMessage(tabs[0].id, {
    //       action: 'paste_text',
    //       text: textToPaste,
    //     })
    //   },
    // )

    // if (chrome && chrome.runtime && chrome.runtime.connect) {
    //   const port = chrome.runtime.connect({ name: 'index' })
    //   port.postMessage({ from: 'index', data: 'red' }) // Example: Change background color
    // }
  }

  // https://dev.to/elukuro/how-to-enable-communication-between-browser-windows-with-javascript-1675#:~:text=The%20postMessage%20API%20in%20JavaScript,documents%20originate%20from%20different%20sources.
  // https://blog.bitsrc.io/4-ways-to-communicate-across-browser-tabs-in-realtime-e4f5f6cbedca

  const setToFirstPrompt = () => {
    if ($prompts.length > 0) {
      selectedPrompt = $prompts[0]
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

    const title = prompt('Enter the title of the prompt', promptToChange?.title)
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
      { prompts: $prompts, contexts: $contexts, title: $project.title },
      $project.title,
    )
  }

  const uploadProject = async () => {
    const data = (await uploadJSON()) as {
      prompts: Prompt[]
      contexts: PromptContext[]
      title: string
    }

    console.log('data', data)
    if (data.prompts && data.contexts) {
      setPromptsInLibrary(data.prompts)
      setContextsInLibrary(data.contexts)
      updateTitle(data.title)
      setToFirstPrompt()
    }
  }

  //
  // Title
  //
  const changeTitle = () => {
    const title = prompt(
      'Enter the name for the project (or leave empty to start a clean one)',
    )

    if (title && title.length > 2) {
      updateTitle(title)
    }

    if (title === '') {
      updateTitle('New Project')
      setPromptsInLibrary([])
      setContextsInLibrary([])
      setToFirstPrompt()
    }
  }
</script>

<ion-header>
  <ion-toolbar>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <ion-title on:click={changeTitle}>{$project.title}</ion-title>

    <ion-buttons slot="end">
      <div class="action-button-container">
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
    padding-left: 3px;
    padding-right: 3px;
    font-size: 90%;
    vertical-align: top;
  }
</style>
