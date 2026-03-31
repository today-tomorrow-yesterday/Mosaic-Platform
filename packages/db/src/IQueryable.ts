export type SortDirection = "asc" | "desc"
export type ComparisonOperator = "gte" | "lte" | "gt" | "lt"

export interface WhereInClause<T> {
  column: keyof T
  values: unknown[]
}

export interface WhereNotClause<T> {
  column: keyof T
  value: unknown
}

export interface ComparisonClause<T> {
  column: keyof T
  operator: ComparisonOperator
  value: unknown
}

export interface NullCheckClause<T> {
  column: keyof T
  isNull: boolean
}

export interface OrderByClause<T> {
  column: keyof T
  direction: SortDirection
}

export interface IQueryable<T> {
  table: string
  operation: "select" | "insert" | "update" | "delete"
  columns: (keyof T)[] | "*"
  conditions: Partial<T>[]
  whereIn: WhereInClause<T>[]
  whereNot: WhereNotClause<T>[]
  whereNotIn: WhereInClause<T>[]
  comparisons: ComparisonClause<T>[]
  nullChecks: NullCheckClause<T>[]
  orderBy: OrderByClause<T>[]
  limit?: number
  data?: Partial<T> | Partial<T>[]
}
