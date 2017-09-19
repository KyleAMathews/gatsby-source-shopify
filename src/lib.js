import ExtendableError from 'es6-error'
import { get, last } from 'lodash/fp'

export class GraphQLError extends ExtendableError {
  constructor({ message, locations, fields }) {
    let str = message

    if (locations)
      str += ` at ${locations.map(l => Object.values(l).join(':')).join(', ')}`

    if (fields) str += ` (${fields.join(' > ')})`

    super(str)
  }
}

export const queryAll = async (
  client,
  path,
  query,
  first = 250,
  after,
  aggregatedResponse,
) => {
  const { data, errors } = await client.query(
    query,
    { first, after },
    (_req, res) => {
      if (res.status === 401) throw new Error('Not authorized')
    },
  )

  if (errors) throw new GraphQLError(errors[0])

  const edges = get([...path, 'edges'], data)
  const nodes = edges.map(edge => edge.node)

  aggregatedResponse
    ? (aggregatedResponse = aggregatedResponse.concat(nodes))
    : (aggregatedResponse = nodes)

  if (get([...path, 'pageInfo', 'hasNextPage'], false, data))
    return getProducts(
      client,
      path,
      query,
      first,
      last(edges).cursor,
      aggregatedResponse,
    )

  return aggregatedResponse
}