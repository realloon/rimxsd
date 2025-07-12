/**
 * @note Requires browser environment.
 */
export function serializeXsd(doc: XMLDocument) {
  const serializer = new XMLSerializer()

  return (
    '<?xml version="1.0" encoding="UTF-8" ?>\n' +
    serializer.serializeToString(doc)
  )
}
