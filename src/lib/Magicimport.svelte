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
  import { parseMarkdownToSections, type Section } from './magic'
  import { sanitiseLabel, showToast, stringSlim } from './utils'

  export let clipboard: Writable<string>
  let rawClipboardData: string = ''
  let foundParts: Writable<Section[]> = writable([])
  let checkedItems = writable<{ [key: string]: boolean }>({})

  const selectedCount = derived(checkedItems, ($checkedItems) => {
    let count = 0
    for (const key in $checkedItems) {
      if ($checkedItems[key]) count++
    }
    return count
  })

  $: {
    rawClipboardData = $clipboard.trim()
    checkForSections()
  }

  const checkForSections = () => {
    const sections = parseMarkdownToSections(rawClipboardData)
    foundParts.set(sections)
    const initialCheckedItems: { [key: string]: boolean } = {}
    sections.forEach((section) => {
      if (initialCheckedItems[section.id] !== false) {
        initialCheckedItems[section.id] = true
      } else initialCheckedItems[section.id] = false
    })
    console.log('initialCheckedItems', initialCheckedItems)
    checkedItems.set(initialCheckedItems)
  }

  const closeModal = () => {
    console.log('closeModal')
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
      console.log('saveFoundContexts')
      closeModal()
    }
  }

  const handleTextareaChange = (event: CustomEvent) => {
    rawClipboardData = event.detail.value

    checkForSections()
  }

  const toggleChecked = (id: string) => {
    checkedItems.update((items) => {
      items[id] = !items[id]
      return items
    })

    console.log('checkedItems', $checkedItems)
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
      <ion-textarea
        value={rawClipboardData}
        placeholder="Enter some text here"
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
          {sanitiseLabel(part.title)}
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
    margin-bottom: 10px;
  }
</style>
