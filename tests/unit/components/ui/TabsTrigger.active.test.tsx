import { render, screen } from '@testing-library/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { describe, expect, it } from 'vitest'

describe('TabsTrigger active styles', () => {
  it('applies semantic destructive styling on active tab', () => {
    render(
      <Tabs defaultValue="one">
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">Content</TabsContent>
        <TabsContent value="two">Content 2</TabsContent>
      </Tabs>
    )

    const activeTrigger = screen.getByRole('tab', { name: 'One' })
    expect(activeTrigger.className).toContain('data-[state=active]:text-destructive')
    expect(activeTrigger.className).toContain('data-[state=active]:bg-destructive/10')
  })
})
