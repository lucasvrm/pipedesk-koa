import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Regression test for LeadsListPage TDZ (Temporal Dead Zone) crash.
 * 
 * This test guards against the ReferenceError introduced in PR #384 (commit fb086be)
 * where `gridCurrentPage` was being accessed before its useState declaration,
 * causing a Temporal Dead Zone (TDZ) error during render.
 * 
 * Root cause: The dependency array of useMemo/const expressions evaluated
 * variables declared via useState that were defined later in the component.
 * 
 * Fix: Reorder useState declarations to appear before any useMemo/const
 * that references them.
 */

describe('LeadsListPage - TDZ Regression Guard', () => {
  const leadsListPagePath = path.join(__dirname, '../../../src/features/leads/pages/LeadsListPage.tsx')
  
  it('should have gridCurrentPage useState declared before its first usage', () => {
    // Read the source file
    const source = fs.readFileSync(leadsListPagePath, 'utf-8')
    const lines = source.split('\n')
    
    // Find the line number where gridCurrentPage is declared with useState
    const declarationLineIndex = lines.findIndex(line => 
      line.includes('const [gridCurrentPage, setGridCurrentPage] = useState')
    )
    
    // Find the first usage of gridCurrentPage (excluding the declaration itself)
    // Use word boundary regex to avoid false positives from comments or partial matches
    const gridCurrentPageUsagePattern = /\bgridCurrentPage\b/
    const setGridCurrentPageUsagePattern = /\bsetGridCurrentPage\b/
    
    const firstUsageIndex = lines.findIndex((line, index) => {
      if (index === declarationLineIndex) return false
      if (line.includes('useState')) return false
      // Skip comment lines
      if (line.trim().startsWith('//')) return false
      return gridCurrentPageUsagePattern.test(line) || setGridCurrentPageUsagePattern.test(line)
    })
    
    expect(declarationLineIndex).toBeGreaterThan(-1)
    expect(firstUsageIndex).toBeGreaterThan(-1)
    
    // The declaration MUST come before any usage
    // This prevents TDZ (Temporal Dead Zone) errors
    expect(declarationLineIndex).toBeLessThan(firstUsageIndex)
  })
  
  it('should not have duplicate useState declarations for gridCurrentPage', () => {
    const source = fs.readFileSync(leadsListPagePath, 'utf-8')
    const matches = source.match(/const \[gridCurrentPage, setGridCurrentPage\] = useState/g)
    
    // Should only have exactly one declaration
    expect(matches).not.toBeNull()
    expect(matches?.length).toBe(1)
  })
  
  it('should declare pagination state variables in the pagination section', () => {
    const source = fs.readFileSync(leadsListPagePath, 'utf-8')
    
    // gridCurrentPage should be in the "Grid/Kanban pagination state" section
    // which is located within the broader "Pagination and UI state" area
    const gridPaginationSectionIndex = source.indexOf('// Grid/Kanban pagination state')
    const paginationUiStateIndex = source.indexOf('// Pagination and UI state')
    const gridCurrentPageIndex = source.indexOf('const [gridCurrentPage, setGridCurrentPage] = useState')
    
    expect(paginationUiStateIndex).toBeGreaterThan(-1)
    expect(gridPaginationSectionIndex).toBeGreaterThan(-1)
    expect(gridCurrentPageIndex).toBeGreaterThan(-1)
    
    // gridCurrentPage should be declared after the pagination section comment
    // and specifically after its own section comment
    expect(gridCurrentPageIndex).toBeGreaterThan(paginationUiStateIndex)
    expect(gridCurrentPageIndex).toBeGreaterThan(gridPaginationSectionIndex)
  })
})
