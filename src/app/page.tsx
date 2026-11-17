// Stage 1 placeholder. The real landing page (input + validation) comes in Stage 2.
export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-4 py-4">
        <span className="text-xl font-bold">Forkcast</span>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          What&apos;s for dinner?
        </h1>
        <p className="mt-4 text-base opacity-70">Coming soon: spin to pick a restaurant near you.</p>
      </main>
    </div>
  );
}
