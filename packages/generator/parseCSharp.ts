import type { FieldIR, ClassIR, EnumIR, IR } from '../../types'

// #region helper
function preprocessCode(code: string): string {
  const noBlockComments = code.replace(/\/\*[\s\S]*?\*\//g, '')
  const noLineComments = noBlockComments.replace(/\/\/.*/g, '')
  return noLineComments
}

function parseClassFields(classBody: string) {
  const fields: Record<string, FieldIR> = {}
  const fieldRegex =
    /(?<attributes>(?:\[.*?\]\s*)*)\s*public\s+(?<type>[\w\.<>]+)\s+(?<name>\w+)\s*(?:=\s*(?<defaultValue>.*?))?\s*;/gs

  let match: RegExpExecArray | null
  while ((match = fieldRegex.exec(classBody)) !== null) {
    if (!match.groups) continue

    const { attributes, type, name, defaultValue } = match.groups

    const listTypeRegex = /^List<(.+)>$/
    const listMatch = type.match(listTypeRegex)

    const descriptionRegex = /\[Description\("(?<desc>.*?)"\)\]/
    const descMatch = attributes.match(descriptionRegex)

    fields[name] = {
      csharpType: type,
      isList: listMatch !== null,
      listElementType: listMatch ? listMatch[1] : null,
      documentation: descMatch?.groups?.desc ?? null,
      defaultValue: defaultValue?.trim() ?? null,
    }
  }
  return fields
}

function parseEnumMembers(enumBody: string) {
  const members: string[] = []
  const memberRegex = /(\w+)\s*(?:=.*?)?,?/g

  let match: RegExpExecArray | null
  while ((match = memberRegex.exec(enumBody)) !== null) {
    members.push(match[1])
  }
  return members
}

function findClosingBrace(code: string, startIndex: number) {
  let braceCount = 0
  for (let i = startIndex; i < code.length; i++) {
    if (code[i] === '{') {
      braceCount++
    } else if (code[i] === '}') {
      braceCount--
      if (braceCount === 0) {
        return i
      }
    }
  }
  return -1 // Not found
}
// #endregion

export function parseCSharp(content: string) {
  const definitions: Array<IR> = []
  const cleanCode = preprocessCode(content)

  const topLevelRegex =
    /public\s+(?:abstract\s+|static\s+)?(class|enum)\s+(?<name>\w+)(?:\s*:\s*(?<parentName>\w+))?/g

  let match
  while ((match = topLevelRegex.exec(cleanCode)) !== null) {
    if (!match.groups) continue

    const type = match[1] // "class" or "enum"
    const { name, parentName } = match.groups

    const bodyStartIndex = cleanCode.indexOf('{', match.index)
    if (bodyStartIndex === -1) continue

    const bodyEndIndex = findClosingBrace(cleanCode, bodyStartIndex)
    if (bodyEndIndex === -1) continue

    // Extract the part between curly brackets
    const bodyContent = cleanCode.substring(bodyStartIndex + 1, bodyEndIndex)

    if (type === 'class') {
      const classDef: ClassIR = {
        kind: 'class',
        className: name,
        parentClassName: parentName ?? null,
        fields: parseClassFields(bodyContent),
      }
      definitions.push(classDef)
    } else if (type === 'enum') {
      const enumDef: EnumIR = {
        kind: 'enum',
        enumName: name,
        members: parseEnumMembers(bodyContent),
      }
      definitions.push(enumDef)
    }
  }

  return definitions
}
