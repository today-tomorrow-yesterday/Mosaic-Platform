import { UserButton } from "@clerk/nextjs"

export default function CalendarPage() {
  return (
    <main className="min-h-screen p-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <UserButton />
      </header>
      <p className="text-muted-foreground">Family schedule coming soon.</p>
    </main>
  )
}
