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
    updatePromptInLibrary,
    removePromptFromLibrary,
    addContextToLibrary,
    type PromptContext,
    updateContextInLibrary,
    removeContextFromLibrary,
    completePromptWithContext,
    setPromptsInLibrary,
    setContextsInLibrary,
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

  //https://dev.to/elukuro/how-to-enable-communication-between-browser-windows-with-javascript-1675#:~:text=The%20postMessage%20API%20in%20JavaScript,documents%20originate%20from%20different%20sources.
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
      // console.log(event.detail.value, selectedPrompt);
    }
  }

  const deletePrompt = (prompt: Prompt | undefined) => {
    if (prompt) {
      if (confirm('Are you sure you want to delete this prompt?')) {
        removePromptFromLibrary(prompt.id)
        // console.log('delete', selectedPrompt);
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
      console.log('written to clipboard')
    } else {
      lastSelectedContextLabel = context.label
      selectedContext = context
      console.log('selectedContext', selectedContext)
    }
  }

  const updateContextValue = (event: CustomEvent) => {
    if (selectedContext) {
      selectedContext.content = event.detail.value
      updateContextInLibrary(selectedContext)
      // console.log(event.detail.value, selectedContext);
    }
  }

  const deleteContext = (context: PromptContext | undefined) => {
    if (context) {
      if (confirm('Are you sure you want to delete this context?')) {
        removeContextFromLibrary(context.label)
        // console.log('delete', selectedContext);
        selectedContext = undefined
      }
    }
  }

  //
  // upload and download stuff
  //
  const downloadProject = () => {
    downloadJSON({ prompts: $prompts, contexts: $contexts })
  }

  const uploadProject = async () => {
    const data = (await uploadJSON()) as {
      prompts: Prompt[]
      contexts: PromptContext[]
    }

    console.log('data', data)
    if (data.prompts && data.contexts) {
      setPromptsInLibrary(data.prompts)
      setContextsInLibrary(data.contexts)
      setToFirstPrompt()
    }
  }
</script>

<ion-header>
  <ion-toolbar>
    <ion-title>Prompt library</ion-title>
    <ion-buttons slot="end">
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <ion-button on:click={downloadProject}>
        <ion-icon slot="icon-only" icon={cloudDownload}></ion-icon>
      </ion-button>
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <ion-button on:click={uploadProject}>
        <ion-icon slot="icon-only" icon={cloudUpload}></ion-icon>
      </ion-button>
    </ion-buttons>
  </ion-toolbar>
</ion-header>

<ion-content class="ion-padding">
  <ion-list>
    {#each $prompts as prompt}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <ion-item on:click={() => selectPrompt(prompt)}>
        <ion-label>
          <h1>{prompt.title}</h1>
          <p>{prompt.prompt}</p>
        </ion-label>
      </ion-item>
    {/each}
  </ion-list>

  {#if selectedPrompt}
    <ion-card>
      <ion-card-header>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <ion-card-title on:click={() => updatePromptTitle(selectedPrompt)}
          >{selectedPrompt.title}</ion-card-title
        >
      </ion-card-header>

      <ion-card-content>
        <ion-textarea
          auto-grow={true}
          value={selectedPrompt.prompt}
          style="width: 100%"
          on:ionInput={updatePromptPromptValue}
        ></ion-textarea>
      </ion-card-content>
      <ion-fab vertical="top" horizontal="end">
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <ion-fab-button on:click={() => sendTextToContent(selectedPrompt)}>
          <ion-icon icon={send}></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <ion-fab vertical="bottom" horizontal="end">
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <ion-fab-button
          color="danger"
          on:click={() => deletePrompt(selectedPrompt)}
        >
          <ion-icon icon={trash}></ion-icon>
        </ion-fab-button>
      </ion-fab>
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
            }}>{context.label}</ion-chip
          >
        {/each}
        <br />
        {#if selectedContext}
          <ion-textarea
            auto-grow={true}
            value={selectedContext.content}
            style="width: 100%"
            on:ionInput={updateContextValue}
          ></ion-textarea>

          <ion-fab vertical="bottom" horizontal="end">
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <ion-fab-button
              color="danger"
              on:click={() => deleteContext(selectedContext)}
            >
              <ion-icon icon={trash}></ion-icon>
            </ion-fab-button>
          </ion-fab>
        {/if}
        <br />
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <ion-button
          expand="block"
          on:click={() => {
            addContext()
          }}>Add context</ion-button
        >
      </ion-card-content>
    </ion-card>
  {/if}

  <ion-fab vertical="top" horizontal="end" slot="fixed">
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <ion-fab-button on:click={addPrompt}>
      <ion-icon icon={add}></ion-icon>
    </ion-fab-button>
  </ion-fab>
</ion-content>
