import { UserButton } from "@clerk/nextjs"
import { Card, CardHeader, CardTitle, CardContent } from "@mosaic/ui"

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Mosaic</h1>
        <UserButton />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Home</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Smart home controls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Family schedule</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Financial tracking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Baby</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Milestone tracker</p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
