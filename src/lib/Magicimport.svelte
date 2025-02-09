<script lang="ts">
  import { modalController } from 'ionic-svelte'
  import {
    add,
    trash,
    send,
    codeDownload,
    albumsOutline,
    createOutline,
    copyOutline,
    colorWandOutline,
    saveOutline,
    closeOutline,
    checkboxOutline,
    checkbox,
    stop,
  } from 'ionicons/icons'

  import { onMount } from 'svelte'
  import { writable, type Writable, derived } from 'svelte/store'
  import { Clipboard } from '@capacitor/clipboard'
  import { parseMarkdownToSections } from './magic' // Updated type
  import { sanitiseLabel, showToast, stringSlim, stuff } from './utils'
  import { addContextToLibrary, type PromptContext } from './prompts'

  export let clipboard: Writable<string>
  let rawClipboardData: string = ''
  let dataToParse: string = ''
  let foundParts: Writable<PromptContext[]> = writable([]) // Updated type
  let checkedItems = writable<{ [key: string]: boolean }>({})

  const selectedCount = derived(checkedItems, ($checkedItems) => {
    let count = 0
    for (const key in $checkedItems) {
      if ($checkedItems[key]) count++
    }
    return count
  })

  $: {
    rawClipboardData = $clipboard.trim() // stuff //
    dataToParse = rawClipboardData
    checkForSections()
  }

  const checkForSections = () => {
    const sections = parseMarkdownToSections(dataToParse)
    foundParts.set(sections)
    const initialCheckedItems: { [key: string]: boolean } = {}
    sections.forEach((section) => {
      if (initialCheckedItems[section.id] !== false) {
        initialCheckedItems[section.id] = true
      } else initialCheckedItems[section.id] = false
    })
    checkedItems.set(initialCheckedItems)
  }

  const closeModal = () => {
    modalController.dismiss()
  }

  const saveFoundContexts = () => {
    const selectedItemsCount =
      Object.values($checkedItems).filter(Boolean).length
    if (
      confirm(
        `Do you really want to import the ${selectedItemsCount} selected items?`,
      )
    ) {
      // Iterate through all selected items and print the content to the console
      for (const key in $checkedItems) {
        if ($checkedItems[key]) {
          const context: PromptContext | undefined = $foundParts.find(
            (part) => part.id === key,
          )
          if (context) {
            addContextToLibrary(context)
          }
        }
      }

      closeModal()
    }
  }

  const handleTextareaChange = (event: CustomEvent) => {
    dataToParse = event.detail.value
    checkForSections()
  }

  const toggleChecked = (id: string) => {
    checkedItems.update((items) => {
      items[id] = !items[id]
      return items
    })
  }
</script>

<ion-header>
  <ion-toolbar>
    <ion-title>
      Magic wand found {$foundParts.length} sections and {$selectedCount} are selected
    </ion-title>

    <ion-buttons slot="end">
      <div class="action-button-container">
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="action-button" on:click={saveFoundContexts}>
          <ion-icon icon={saveOutline}></ion-icon>
        </div>

        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="action-button" on:click={closeModal}>
          <ion-icon icon={closeOutline}></ion-icon>
        </div>
      </div>
    </ion-buttons>
  </ion-toolbar>
</ion-header>

<ion-content>
  <ion-card>
    <ion-card-content>
      <div style="text-align: left; font-size: 70%;padding-bottom: 10px;">
        Past LLM output in the textarea below and the magic wand will find the
        sections for you. Unselect the sections you don't want to import via the
        buttons below. If there is already text found on the clipboard, it will
        be automatically pasted here.
      </div>
      {#each $foundParts as part}
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <ion-chip
          on:click={() => toggleChecked(part.id)}
          class="ion-align-items-center ion-text-center"
        >
          <ion-icon
            class="chip-checkbox"
            icon={$checkedItems[part.id] ? checkbox : stop}
          ></ion-icon>
          {sanitiseLabel(part.label)}
        </ion-chip>
      {/each}
      <ion-textarea
        value={rawClipboardData}
        placeholder="Paste LLM output here"
        rows="20"
        on:ionInput={handleTextareaChange}
      ></ion-textarea>

      {#each $foundParts as part}
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <ion-chip
          on:click={() => toggleChecked(part.id)}
          class="ion-align-items-center ion-text-center"
        >
          <ion-icon
            class="chip-checkbox"
            icon={$checkedItems[part.id] ? checkbox : stop}
          ></ion-icon>
          {sanitiseLabel(part.label)}
        </ion-chip>
      {/each}
    </ion-card-content>
  </ion-card>
</ion-content>

<style>
  .chip-checkbox {
    margin-right: 5px;
  }

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

  ion-title {
    font-size: 80%;
    text-align: left;
  }

  ion-textarea {
    text-align: left;
    border: 1px solid lightgray;
    padding-left: 10px;
    padding-right: 10px;
    font-size: 90%;
    vertical-align: top;
    margin-bottom: 5px;
    margin-top: 5px;
  }
</style>
