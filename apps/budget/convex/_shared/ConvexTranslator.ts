import type { GenericDatabaseReader, GenericDatabaseWriter, GenericDataModel } from "convex/server"
import type { ITranslator, UpsertOptions, IQueryable } from "@mosaic/db"

type Reader = GenericDatabaseReader<GenericDataModel>
type Writer = GenericDatabaseWriter<GenericDataModel>

/**
 * ConvexTranslator — the ONLY place ctx.db appears in the platform app.
 * Inject per-function: new ConvexTranslator(ctx.db)
 */
export class ConvexTranslator implements ITranslator {
  constructor(private readonly db: Reader | Writer) {}

  private buildFilter<T>(q: any, state: IQueryable<T>): any {
    const clauses: any[] = []

    for (const condition of state.conditions) {
      for (const [key, value] of Object.entries(condition as object)) {
        clauses.push(q.eq(q.field(key), value))
      }
    }
    for (const { column, value } of state.whereNot) {
      clauses.push(q.neq(q.field(String(column)), value))
    }
    for (const { column, operator, value } of state.comparisons) {
      switch (operator) {
        case "gte": clauses.push(q.gte(q.field(String(column)), value)); break
        case "lte": clauses.push(q.lte(q.field(String(column)), value)); break
        case "gt":  clauses.push(q.gt(q.field(String(column)), value));  break
        case "lt":  clauses.push(q.lt(q.field(String(column)), value));  break
      }
    }
    for (const { column, isNull } of state.nullChecks) {
      const check = q.eq(q.field(String(column)), null)
      clauses.push(isNull ? check : q.not(check))
    }
    for (const { column, values } of state.whereIn) {
      if (values.length > 0) {
        clauses.push(q.or(...values.map((v) => q.eq(q.field(String(column)), v))))
      }
    }
    for (const { column, values } of state.whereNotIn) {
      for (const value of values) {
        clauses.push(q.neq(q.field(String(column)), value))
      }
    }

    if (clauses.length === 0) return undefined
    if (clauses.length === 1) return clauses[0]
    return q.and(...clauses)
  }

  async executeSelect<T>(state: IQueryable<T>): Promise<T[]> {
    const reader = this.db as Reader
    let query = reader.query(state.table as any).filter((q) => {
      const condition = this.buildFilter(q, state)
      return condition ?? true
    })
    if (state.orderBy.length > 0) query = (query as any).order(state.orderBy[0]!.direction)
    if (state.limit !== undefined) return (await (query as any).take(state.limit)) as T[]
    return (await query.collect()) as T[]
  }

  async executeSelectFirst<T>(state: IQueryable<T>): Promise<T | null> {
    const reader = this.db as Reader
    return await reader.query(state.table as any).filter((q) => {
      const condition = this.buildFilter(q, state)
      return condition ?? true
    }).first() as T | null
  }

  async executeCount<T>(state: IQueryable<T>): Promise<number> {
    return (await this.executeSelect(state)).length
  }

  async executeExists<T>(state: IQueryable<T>): Promise<boolean> {
    return (await this.executeSelectFirst(state)) !== null
  }

  async executeInsert<T>(table: string, data: Omit<T, "_id" | "_creationTime">): Promise<T> {
    const writer = this.db as Writer
    const id = await writer.insert(table as any, data as any)
    return { ...data, _id: id } as unknown as T
  }

  async executeUpdate<T>(state: IQueryable<T>): Promise<void> {
    const writer = this.db as Writer
    const records = await this.executeSelect(state)
    await Promise.all(records.map((r) => writer.patch((r as any)._id, state.data as any)))
  }

  async executeUpdateReturning<T>(state: IQueryable<T>): Promise<T[]> {
    await this.executeUpdate(state)
    return this.executeSelect(state)
  }

  async executeDelete<T>(state: IQueryable<T>): Promise<void> {
    const writer = this.db as Writer
    const records = await this.executeSelect(state)
    await Promise.all(records.map((r) => writer.delete((r as any)._id)))
  }

  async executeUpsert<T>(table: string, data: T, options: UpsertOptions): Promise<void> {
    const reader = this.db as Reader
    const writer = this.db as Writer
    const existing = await reader.query(table as any)
      .filter((q) => q.eq(q.field(options.onConflict), (data as any)[options.onConflict]))
      .first()
    if (existing?._id) {
      await writer.patch(existing._id as any, data as any)
    } else {
      await writer.insert(table as any, data as any)
    }
  }
}
