import type { ITranslator, UpsertOptions } from "./ITranslator"
import { SelectBuilder } from "./builders/SelectBuilder"
import { UpdateBuilder } from "./builders/UpdateBuilder"
import { DeleteBuilder } from "./builders/DeleteBuilder"

export class DbSet<T extends object> {
  private constructor(
    private readonly table: string,
    private readonly translator: ITranslator,
  ) {}

  static from<T extends object>(table: string, translator: ITranslator): DbSet<T> {
    return new DbSet<T>(table, translator)
  }

  select(): SelectBuilder<T>
  select<K extends keyof T>(columns: K[]): SelectBuilder<Pick<T, K>>
  select<K extends keyof T>(
    columns?: K[],
  ): SelectBuilder<T> | SelectBuilder<Pick<T, K>> {
    if (columns !== undefined) {
      return new SelectBuilder<Pick<T, K>>(
        this.table,
        this.translator,
        columns as unknown as (keyof Pick<T, K>)[],
      )
    }
    return new SelectBuilder<T>(this.table, this.translator)
  }

  update(data: Partial<T>): UpdateBuilder<T> {
    return new UpdateBuilder<T>(this.table, this.translator, data)
  }

  delete(): DeleteBuilder<T> {
    return new DeleteBuilder<T>(this.table, this.translator)
  }

  async insert(data: Omit<T, "_id" | "_creationTime">): Promise<T> {
    return this.translator.executeInsert<T>(this.table, data as Omit<T, "_id">)
  }

  async upsert(data: T, options: UpsertOptions): Promise<void> {
    return this.translator.executeUpsert<T>(this.table, data, options)
  }
}
