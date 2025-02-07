import { Clipboard } from '@capacitor/clipboard'

const showToast = async (text: string) => {
  const toast = document.createElement('ion-toast')
  toast.message = text
  toast.duration = 2000
  toast.isOpen = true

  document.body.appendChild(toast)

  toast.onDidDismiss().then(() => {
    // leaking dom elements..
  })
}

export const writeToClipboardAndToast = async (text: string) => {
  await Clipboard.write({
    string: text,
  })

  await showToast(stringSlim(text, 400))
}

export const downloadJSON = (obj: object, name: string) => {
  // normalise the name to remove spaces and special characters
  name = name.replace(/[^a-zA-Z0-9]/g, '_').toLocaleLowerCase()

  const dataStr =
    'data:text/json;charset=utf-8,' +
    encodeURIComponent(JSON.stringify(obj, null, 2))
  const downloadAnchorNode = document.createElement('a')
  downloadAnchorNode.setAttribute('href', dataStr)
  downloadAnchorNode.setAttribute('download', `${name}.json`)
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

export const sanitiseLabel = (label: string | null) => {
  return (label ? label : '').replace(/[^a-zA-Z0-9]/g, '_').toLocaleUpperCase()
}

export const stringSlim = (str: string, maxLength: number) => {
  if (str.length > maxLength) {
    return str.substring(0, maxLength) + '...'
  }
  return str
}
