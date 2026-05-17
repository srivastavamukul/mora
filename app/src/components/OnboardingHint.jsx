import { useOnboarding } from '../hooks/useOnboarding'

export function OnboardingHint({ hintKey, children }) {
  const { isVisible, dismissHint } = useOnboarding()
  if (!isVisible(hintKey)) return null

  return (
    <div className="m-hint">
      <span className="m-hint-text">{children}</span>
      <button
        type="button"
        className="m-hint-dismiss"
        onClick={() => dismissHint(hintKey)}
        aria-label="Dismiss hint"
      >
        ×
      </button>
    </div>
  )
}
