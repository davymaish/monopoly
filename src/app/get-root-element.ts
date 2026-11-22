export function getRootElement(): HTMLElement {
  const rootElement = document.getElementById('root')

  if (!rootElement) {
    throw new Error('Expected the #root element to exist in index.html.')
  }

  return rootElement
}
