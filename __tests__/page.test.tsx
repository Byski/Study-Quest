import { render, screen } from '@testing-library/react'
import Home from '@/app/page'
import { useRouter } from 'next/navigation'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('Home Page', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    })
  })

  it('should render the main heading', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { name: /study quest/i })).toBeInTheDocument()
  })

  it('should render the welcome message', () => {
    render(<Home />)
    expect(screen.getByText(/your academic adventure awaits/i)).toBeInTheDocument()
  })

  it('should render begin quest link', () => {
    render(<Home />)
    const link = screen.getByRole('link', { name: /begin your quest/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/auth')
  })

  it('should render explore courses link', () => {
    render(<Home />)
    const link = screen.getByRole('link', { name: /explore courses/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/courses')
  })

  it('should have quest-themed features', () => {
    render(<Home />)
    expect(screen.getByText(/browse quests/i)).toBeInTheDocument()
    expect(screen.getByText(/track progress/i)).toBeInTheDocument()
    // "Level Up" appears in both description and feature card, so use getAllByText
    const levelUpElements = screen.getAllByText(/level up/i)
    expect(levelUpElements.length).toBeGreaterThan(0)
  })

  it('should have correct styling classes', () => {
    const { container } = render(<Home />)
    const main = container.querySelector('main')
    expect(main).toHaveClass('flex', 'min-h-screen')
  })
})

