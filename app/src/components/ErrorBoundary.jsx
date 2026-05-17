import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error('[Mora] Render error caught by boundary:', error)
  }

  render() {
    if (this.state.failed) {
      return (
        <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--mora-ink-4, #888)' }}>
          <p style={{ marginBottom: 16 }}>Something went quiet here. Try refreshing the page.</p>
          <button
            onClick={() => this.setState({ failed: false })}
            style={{ padding: '8px 20px', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
