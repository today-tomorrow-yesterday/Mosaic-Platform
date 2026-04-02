import { currentUser } from "@clerk/nextjs/server"
import { DashboardClient } from "@/components/DashboardClient"

export default async function DashboardPage(): Promise<React.ReactElement> {
  const user = await currentUser()
  return (
    <DashboardClient
      userName={user?.firstName ?? "there"}
      userImageUrl={user?.imageUrl ?? null}
    />
  )
}
