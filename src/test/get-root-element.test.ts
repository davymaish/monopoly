import { describe, expect, it } from 'vitest'
import { getRootElement } from '../app/get-root-element'

describe('getRootElement', () => {
  it('returns the element with the root id', () => {
    const rootElement = document.createElement('div')
    rootElement.id = 'root'
    document.body.append(rootElement)

    expect(getRootElement()).toBe(rootElement)
  })
})
