import { describe, it, expect } from 'vitest'
import { renderTemplate } from './template'

describe('renderTemplate', () => {
  it('substitutes variables', () => {
    expect(renderTemplate('مرحباً {{name}}', { name: 'أحمد' })).toBe('مرحباً أحمد')
    expect(renderTemplate('طلبك {{ref}} بقيمة {{amount}}$', { ref: 'ORD-1', amount: 150 }))
      .toBe('طلبك ORD-1 بقيمة 150$')
  })

  it('tolerates whitespace inside the braces', () => {
    expect(renderTemplate('{{ name }}', { name: 'X' })).toBe('X')
  })

  it('renders unknown or missing variables as empty', () => {
    expect(renderTemplate('مرحباً {{name}}', {})).toBe('مرحباً ')
    expect(renderTemplate('{{a}}-{{b}}', { a: 'x' })).toBe('x-')
  })

  it('leaves text without tokens unchanged and handles empty input', () => {
    expect(renderTemplate('نص ثابت', { a: '1' })).toBe('نص ثابت')
    expect(renderTemplate('', {})).toBe('')
  })

  it('does not recurse into substituted values', () => {
    expect(renderTemplate('{{x}}', { x: '{{y}}' })).toBe('{{y}}')
  })
})
