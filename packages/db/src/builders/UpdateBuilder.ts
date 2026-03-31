import type { IQueryable } from "../IQueryable"
import type { ITranslator } from "../ITranslator"

export class UpdateBuilder<T> {
  private state: IQueryable<T>
  private translator: ITranslator

  constructor(table: string, translator: ITranslator, data: Partial<T>) {
    this.translator = translator
    this.state = {
      table,
      operation: "update",
      columns: "*",
      conditions: [],
      whereIn: [],
      whereNot: [],
      whereNotIn: [],
      comparisons: [],
      nullChecks: [],
      orderBy: [],
      data,
    }
  }

  where(condition: Partial<T>): this {
    this.state.conditions.push(condition)
    return this
  }

  whereIn<K extends keyof T>(column: K, values: T[K][]): this {
    this.state.whereIn.push({ column, values })
    return this
  }

  whereNot<K extends keyof T>(column: K, value: T[K]): this {
    this.state.whereNot.push({ column, value })
    return this
  }

  async execute(): Promise<void> {
    return this.translator.executeUpdate(this.state)
  }

  async returning(): Promise<T[]> {
    return this.translator.executeUpdateReturning(this.state)
  }
}
