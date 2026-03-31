import { UserButton } from "@clerk/nextjs"

export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Home</h1>
        <UserButton />
      </header>
      <p className="text-muted-foreground">Smart home controls coming soon.</p>
    </main>
  )
}
