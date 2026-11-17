import LocationForm from "@/components/LocationForm";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 pt-24 pb-16 text-center sm:justify-center sm:pt-0">
      <h1 className="font-display text-6xl font-medium tracking-tight sm:text-8xl">Forkcast</h1>
      <p className="mt-3 mb-10 text-lg text-zinc-600 dark:text-zinc-400">What&apos;s for dinner?</p>
      <LocationForm />
    </main>
  );
}
