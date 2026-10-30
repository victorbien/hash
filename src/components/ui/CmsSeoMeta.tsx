import { useEffect } from 'react'

export function CmsSeoMeta({ title, description }: { title: string; description: string | null }) {
  useEffect(() => {
    const previousTitle = document.title
    let descriptionElement = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const createdDescription = !descriptionElement
    if (!descriptionElement) {
      descriptionElement = document.createElement('meta')
      descriptionElement.name = 'description'
      document.head.append(descriptionElement)
    }
    const previousDescription = descriptionElement.content
    document.title = title
    if (description) descriptionElement.content = description

    return () => {
      document.title = previousTitle
      if (createdDescription) descriptionElement?.remove()
      else if (descriptionElement) descriptionElement.content = previousDescription
    }
  }, [description, title])

  return null
}
