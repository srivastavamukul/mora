import { Link } from 'react-router-dom'

export default function EmptyState() {
  return (
    <div className="pt-8 pb-24 px-6 min-h-screen flex flex-col items-center justify-center relative">
      <div className="max-w-3xl w-full flex flex-col items-center text-center space-y-12 relative z-20">
        <div className="space-y-4">
          <h1 className="font-display-xl text-display-xl text-transparent bg-clip-text bg-gradient-to-r from-primary via-tertiary to-secondary">
            Your creative archive starts here.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto">
            Connect sources or manually add content to begin weaving your digital tapestry.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-6 mt-8">
          <Link
            to="/moodboard"
            className="px-8 py-4 bg-primary-container text-on-primary-container font-headline-md text-headline-md rounded-lg shadow-[0_0_20px_rgba(255,71,156,0.2)] hover:shadow-[0_0_30px_rgba(255,71,156,0.4)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-3"
          >
            <span className="material-symbols-outlined">add</span> Add Content
          </Link>
          <Link
            to="/sources"
            className="px-8 py-4 bg-surface-container border border-white/10 text-on-surface font-headline-md text-headline-md rounded-lg hover:bg-surface-container-high hover:-translate-y-1 transition-all duration-300 flex items-center gap-3"
          >
            <span className="material-symbols-outlined">hub</span> Connect Sources
          </Link>
        </div>
      </div>
    </div>
  )
}
