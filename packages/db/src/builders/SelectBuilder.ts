import type { IQueryable, SortDirection } from "../IQueryable"
import type { ITranslator } from "../ITranslator"

export class SelectBuilder<T> {
  private state: IQueryable<T>
  private translator: ITranslator

  constructor(
    table: string,
    translator: ITranslator,
    columns: (keyof T)[] | "*" = "*",
  ) {
    this.translator = translator
    this.state = {
      table,
      operation: "select",
      columns,
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

  whereNotIn<K extends keyof T>(column: K, values: T[K][]): this {
    this.state.whereNotIn.push({ column, values })
    return this
  }

  whereNot<K extends keyof T>(column: K, value: T[K]): this {
    this.state.whereNot.push({ column, value })
    return this
  }

  whereGte<K extends keyof T>(column: K, value: T[K]): this {
    this.state.comparisons.push({ column, operator: "gte", value })
    return this
  }

  whereLte<K extends keyof T>(column: K, value: T[K]): this {
    this.state.comparisons.push({ column, operator: "lte", value })
    return this
  }

  whereGt<K extends keyof T>(column: K, value: T[K]): this {
    this.state.comparisons.push({ column, operator: "gt", value })
    return this
  }

  whereLt<K extends keyof T>(column: K, value: T[K]): this {
    this.state.comparisons.push({ column, operator: "lt", value })
    return this
  }

  whereNull<K extends keyof T>(column: K): this {
    this.state.nullChecks.push({ column, isNull: true })
    return this
  }

  whereNotNull<K extends keyof T>(column: K): this {
    this.state.nullChecks.push({ column, isNull: false })
    return this
  }

  orderBy<K extends keyof T>(column: K, direction: SortDirection = "asc"): this {
    this.state.orderBy.push({ column, direction })
    return this
  }

  limit(count: number): this {
    this.state.limit = count
    return this
  }

  async returnAll(): Promise<T[]> {
    return this.translator.executeSelect(this.state)
  }

  async returnFirst(): Promise<T | null> {
    this.state.limit = 1
    return this.translator.executeSelectFirst(this.state)
  }

  async returnCount(): Promise<number> {
    return this.translator.executeCount(this.state)
  }

  async checkIfExists(): Promise<boolean> {
    return this.translator.executeExists(this.state)
  }
}
