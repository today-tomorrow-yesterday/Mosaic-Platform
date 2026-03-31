import type { IQueryable } from "./IQueryable"

export interface UpsertOptions {
  onConflict: string
}

export interface ITranslator {
  executeSelect<T>(query: IQueryable<T>): Promise<T[]>
  executeSelectFirst<T>(query: IQueryable<T>): Promise<T | null>
  executeCount<T>(query: IQueryable<T>): Promise<number>
  executeExists<T>(query: IQueryable<T>): Promise<boolean>
  executeInsert<T>(table: string, data: Omit<T, "_id" | "_creationTime">): Promise<T>
  executeUpdate<T>(query: IQueryable<T>): Promise<void>
  executeUpdateReturning<T>(query: IQueryable<T>): Promise<T[]>
  executeDelete<T>(query: IQueryable<T>): Promise<void>
  executeUpsert<T>(table: string, data: T, options: UpsertOptions): Promise<void>
}
