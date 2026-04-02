import { BaseRepository } from "@mosaic/db"
import type { ITranslator } from "@mosaic/db"

export type PrototypeApp = {
  _id?: string
  _creationTime?: number
  name: string
  code: string
  conversationJson: string
  status: "draft" | "saved" | "archived"
  tokenIdentifier: string
  updatedAt: number
}

export class PrototypeRepository extends BaseRepository<PrototypeApp> {
  constructor(db: ITranslator) {
    super("prototypeApps", db)
  }

  async getByUser(tokenIdentifier: string): Promise<PrototypeApp[]> {
    return this.db
      .select()
      .where({ tokenIdentifier })
      .orderBy("updatedAt", "desc")
      .returnAll()
  }

  async getSaved(tokenIdentifier: string): Promise<PrototypeApp[]> {
    return this.db
      .select()
      .where({ tokenIdentifier, status: "saved" })
      .orderBy("updatedAt", "desc")
      .returnAll()
  }
}
