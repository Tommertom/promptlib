import { Clipboard } from '@capacitor/clipboard'

export const showToast = async (text: string) => {
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

export const stuff = `
### ASSUMPTIONS (RAW)  
- People in Africa want a car made from wood and nuclear waste for transportation.  
- Customers perceive wooden and nuclear waste-based cars as safe and reliable for daily use.  
- There is sufficient demand for such cars in African markets to justify production.  
- African governments will allow the sale and registration of wooden and nuclear waste-based vehicles.  
- Environmental regulations permit the use of nuclear waste in vehicle production in target markets.  
- The bank's brand reputation will not be harmed by financing such an unconventional product.  
- There are cost-effective methods to safely integrate nuclear waste into vehicle construction.  
- The vehicle's wooden structure will be durable enough to handle road conditions in African regions.  
- Insurance companies will provide coverage for cars made from wood and nuclear waste.  
- Customers will trust the bank's financing options for purchasing this new type of vehicle.  
- Adequate supply chains exist for sourcing wood and nuclear waste at scale.  
- Skilled labor is available to manufacture wooden and nuclear waste-based cars efficiently.  
- The bank can create financial products tailored to customers purchasing these unconventional cars.  
- Transporting and distributing these vehicles to African markets is logistically feasible and cost-effective.  
- The resale value of such vehicles will be high enough to encourage loan repayment.  

### DESIRABILITY ASSUMPTIONS  
- People in African markets view wooden and nuclear waste-based cars as desirable, safe, and innovative transportation solutions.  
- Consumers believe these vehicles offer advantages over traditional cars in cost, performance, and environmental impact.  
- African customers trust the structural integrity and radiation safety of cars containing nuclear waste components.  
- Buyers will consider these cars an upgrade over existing transportation methods in their regions.  
- Governments and regulatory bodies will approve these vehicles for road use without significant legal barriers.  
- Customers will embrace financing options from banks for purchasing this unconventional car model.  

### FEASIBILITY ASSUMPTIONS  
- There are scalable, safe, and cost-effective methods to integrate nuclear waste into car manufacturing.  
- Engineering solutions exist to ensure wooden structures can withstand common road conditions and climate variations.  
- The supply chain for sourcing wood and nuclear waste is stable, affordable, and legally compliant.  
- Skilled workers and manufacturers can be trained to build these vehicles efficiently at scale.  
- The bank has risk mitigation strategies if regulations, logistics, or supply chains become problematic.  
- Insurance companies will support policies covering wooden and nuclear waste-based cars in African markets.  

### VIABILITY ASSUMPTIONS  
- The cost of production and financing structures will make this vehicle profitable for the bank and customers.  
- The total addressable market is large enough to generate sustainable revenue and repayment rates.  
- The resale value of these cars will be sufficient to support long-term financing models.  
- Loan default rates for customers purchasing these vehicles will remain within acceptable risk levels.  
- The bank’s reputation and public trust will not be significantly harmed by financing such vehicles.  
- Distribution and logistics costs will not make these cars prohibitively expensive for African consumers.
`
