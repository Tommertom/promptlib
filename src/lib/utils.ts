import { Clipboard } from '@capacitor/clipboard'
import { toastController } from 'ionic-svelte'

const showToast = async (text: string) => {
  const toast = await toastController.create({
    // color: 'danger',
    duration: 1000,
    message: text,
    // showCloseButton: true,
  })

  toast.present()
}

export const writeToClipboardAndToast = async (text: string) => {
  await Clipboard.write({
    string: text,
  })

  await showToast(text)
}

export const downloadJSON = (obj: object) => {
  const dataStr =
    'data:text/json;charset=utf-8,' +
    encodeURIComponent(JSON.stringify(obj, null, 2))
  const downloadAnchorNode = document.createElement('a')
  downloadAnchorNode.setAttribute('href', dataStr)
  downloadAnchorNode.setAttribute('download', 'download.json')
  document.body.appendChild(downloadAnchorNode)
  downloadAnchorNode.click()
  downloadAnchorNode.remove()
}

export const uploadJSON = (): Promise<object> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) {
        reject(new Error('No file selected'))
        return
      }
      const reader = new FileReader()
      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const json = JSON.parse(e.target?.result as string)
          resolve(json)
        } catch (error) {
          reject(new Error('Error parsing JSON'))
        }
      }
      reader.onerror = () => {
        reject(new Error('Error reading file'))
      }
      reader.readAsText(file)
    }
    input.click()
  })
}
