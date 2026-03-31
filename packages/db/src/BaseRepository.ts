import type { ITranslator } from "./ITranslator"
import { DbSet } from "./DbSet"

export abstract class BaseRepository<T extends object> {
  protected db: DbSet<T>

  constructor(table: string, translator: ITranslator) {
    this.db = DbSet.from<T>(table, translator)
  }

  async getAll(): Promise<T[]> {
    return this.db.select().returnAll()
  }

  async getById(id: string): Promise<T | null> {
    return this.db
      .select()
      .where({ _id: id } as unknown as Partial<T>)
      .returnFirst()
  }

  async getBy(criteria: Partial<T>): Promise<T[]> {
    return this.db.select().where(criteria).returnAll()
  }

  async getFirstBy(criteria: Partial<T>): Promise<T | null> {
    return this.db.select().where(criteria).returnFirst()
  }

  async exists(criteria: Partial<T>): Promise<boolean> {
    return this.db.select().where(criteria).checkIfExists()
  }

  async count(): Promise<number> {
    return this.db.select().returnCount()
  }

  async countBy(criteria: Partial<T>): Promise<number> {
    return this.db.select().where(criteria).returnCount()
  }

  async insert(data: Omit<T, "_id" | "_creationTime">): Promise<T> {
    return this.db.insert(data)
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    return this.db
      .update(data)
      .where({ _id: id } as unknown as Partial<T>)
      .execute()
  }

  async updateBy(criteria: Partial<T>, data: Partial<T>): Promise<void> {
    return this.db.update(data).where(criteria).execute()
  }

  async delete(id: string): Promise<void> {
    return this.db
      .delete()
      .where({ _id: id } as unknown as Partial<T>)
      .execute()
  }

  async deleteBy(criteria: Partial<T>): Promise<void> {
    return this.db.delete().where(criteria).execute()
  }
}
