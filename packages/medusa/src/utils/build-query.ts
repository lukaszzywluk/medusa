import { ExtendedFindConfig, FindConfig } from "../types/common"
import {
  FindManyOptions,
  FindOperator,
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  In,
  IsNull,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
} from "typeorm"

/**
 * Used to build TypeORM queries.
 * @param selector The selector
 * @param config The config
 * @return The QueryBuilderConfig
 */
export function buildQuery<TWhereKeys, TEntity = unknown>(
  selector: TWhereKeys,
  config: FindConfig<TEntity> = {}
): ExtendedFindConfig<TEntity> {
  const query: ExtendedFindConfig<TEntity> = {
    where: buildWhere<TWhereKeys, TEntity>(selector),
  }

  if ("deleted_at" in selector) {
    query.withDeleted = true
  }

  if ("skip" in config) {
    ;(query as FindManyOptions<TEntity>).skip = config.skip
  }

  if ("take" in config) {
    ;(query as FindManyOptions<TEntity>).take = config.take
  }

  if ("relations" in config && config.relations) {
    query.relations = buildRelations<TEntity>(config.relations)
  }

  if ("select" in config) {
    query.select = buildSelects(config.select as string[])
  }

  if ("order" in config) {
    query.order = config.order
  }

  return query
}

function buildWhere<TWhereKeys, TEntity>(constraints: TWhereKeys): any {
  const where: FindOptionsWhere<TEntity> = {}
  for (const [key, value] of Object.entries(constraints)) {
    if (value === undefined) {
      continue
    }

    if (value === null) {
      where[key] = IsNull()
      continue
    }

    if (value instanceof FindOperator) {
      where[key] = value
      continue
    }

    if (Array.isArray(value)) {
      where[key] = In(value)
      continue
    }

    if (typeof value === "object") {
      where[key] = buildWhere<TWhereKeys[keyof TWhereKeys], TEntity>(value)
      continue
    }

    const allowedModifiers = ["lt", "gt", "lte", "gte"]
    if (allowedModifiers.indexOf(key.toLowerCase()) > -1) {
      switch (key) {
        case "lt":
          where[key] = LessThan(value)
          break
        case "gt":
          where[key] = MoreThan(value)
          break
        case "lte":
          where[key] = LessThanOrEqual(value)
          break
        case "gte":
          where[key] = MoreThanOrEqual(value)
          break
      }
      continue
    }

    where[key] = value
  }

  return where
}

function buildSelects<TEntity>(
  selectCollection: string[]
): FindOptionsSelect<TEntity> {
  return buildRelationsOrSelect(selectCollection) as FindOptionsSelect<TEntity>
}

function buildRelations<TEntity>(
  relationCollection: string[]
): FindOptionsRelations<TEntity> {
  return buildRelationsOrSelect(
    relationCollection
  ) as FindOptionsRelations<TEntity>
}

function buildRelationsOrSelect<TEntity>(
  collection: string[]
): FindOptionsRelations<TEntity> | FindOptionsSelect<TEntity> {
  const output: FindOptionsRelations<TEntity> = {}

  for (const relation of collection) {
    if (relation.indexOf(".") > -1) {
      const nestedRelations = relation.split(".")
      nestedRelations.reduce(
        (acc: FindOptionsRelations<TEntity>, nestedRelation: string) => {
          if (acc[nestedRelation]) {
            return acc
          }

          acc[relation] = true
          return acc
        },
        output
      )
      continue
    }

    output[relation] = true
  }

  return output
}
