import type { IQueryable } from "../IQueryable"
import type { ITranslator } from "../ITranslator"

export class DeleteBuilder<T> {
  private state: IQueryable<T>
  private translator: ITranslator

  constructor(table: string, translator: ITranslator) {
    this.translator = translator
    this.state = {
      table,
      operation: "delete",
      columns: "*",
      conditions: [],
      whereIn: [],
      whereNot: [],
      whereNotIn: [],
      comparisons: [],
      nullChecks: [],
      orderBy: [],
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
    const hasCondition =
      this.state.conditions.length > 0 ||
      this.state.whereIn.length > 0 ||
      this.state.whereNot.length > 0
    if (!hasCondition) {
      throw new Error(
        `[DbSet] delete on table "${this.state.table}" called with no conditions — this would affect every row. Add a .where() clause.`
      )
    }
    return this.translator.executeDelete(this.state)
  }
}
