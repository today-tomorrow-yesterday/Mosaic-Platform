import { UserButton } from "@clerk/nextjs"

export default function BabyPage() {
  return (
    <main className="min-h-screen p-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Baby</h1>
        <UserButton />
      </header>
      <p className="text-muted-foreground">Milestone tracker coming soon.</p>
    </main>
  )
}
