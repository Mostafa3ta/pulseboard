export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:px-6">
        <p>
          Pulseboard is a portfolio demo by Mostafa Mahmoud. The data is generated in your browser from a fixed seed; nothing is fetched or
          stored.
        </p>
        <a
          href="https://github.com/Mostafa3ta/pulseboard"
          className="underline-offset-4 hover:text-foreground hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          Source on GitHub
        </a>
      </div>
    </footer>
  )
}
