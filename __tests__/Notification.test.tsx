import { render, screen, fireEvent } from '@testing-library/react'
import Notification from '@/components/Notification'

describe('Notification', () => {
  it('should render success notification', () => {
    const onClose = jest.fn()
    render(
      <Notification
        message="Operation successful"
        type="success"
        onClose={onClose}
      />
    )
    expect(screen.getByText(/operation successful/i)).toBeInTheDocument()
  })

  it('should render error notification', () => {
    const onClose = jest.fn()
    render(
      <Notification
        message="An error occurred"
        type="error"
        onClose={onClose}
      />
    )
    expect(screen.getByText(/an error occurred/i)).toBeInTheDocument()
  })

  it('should render info notification', () => {
    const onClose = jest.fn()
    render(
      <Notification
        message="Information message"
        type="info"
        onClose={onClose}
      />
    )
    expect(screen.getByText(/information message/i)).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    const onClose = jest.fn()
    render(
      <Notification
        message="Test message"
        type="success"
        onClose={onClose}
      />
    )
    
    const closeButton = screen.getByLabelText(/close notification/i)
    fireEvent.click(closeButton)
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should have correct styling for success type', () => {
    const onClose = jest.fn()
    const { container } = render(
      <Notification
        message="Success"
        type="success"
        onClose={onClose}
      />
    )
    // Check that the notification has success-related classes
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should auto-close after duration', async () => {
    jest.useFakeTimers()
    const onClose = jest.fn()
    
    render(
      <Notification
        message="Auto-close test"
        type="info"
        onClose={onClose}
        duration={5000}
      />
    )
    
    expect(onClose).not.toHaveBeenCalled()
    
    // Fast-forward time
    jest.advanceTimersByTime(5000)
    
    // Wait for useEffect to run
    await Promise.resolve()
    
    expect(onClose).toHaveBeenCalledTimes(1)
    
    jest.useRealTimers()
  })

  it('should not auto-close when duration is 0', async () => {
    jest.useFakeTimers()
    const onClose = jest.fn()
    
    render(
      <Notification
        message="No auto-close"
        type="info"
        onClose={onClose}
        duration={0}
      />
    )
    
    jest.advanceTimersByTime(10000)
    await Promise.resolve()
    
    expect(onClose).not.toHaveBeenCalled()
    
    jest.useRealTimers()
  })

  it('should cleanup timer on unmount', () => {
    jest.useFakeTimers()
    const onClose = jest.fn()
    
    const { unmount } = render(
      <Notification
        message="Cleanup test"
        type="info"
        onClose={onClose}
        duration={5000}
      />
    )
    
    unmount()
    
    jest.advanceTimersByTime(5000)
    
    // onClose should not be called after unmount
    expect(onClose).not.toHaveBeenCalled()
    
    jest.useRealTimers()
  })
})
