export interface FieldIR {
  csharpType: string
  isList: boolean
  listElementType: string | null
  documentation: string | null
  defaultValue: string | null
}

export interface ClassIR {
  kind: 'class'
  className: string
  parentClassName: string | null
  fields: Record<string, FieldIR>
}

export interface EnumIR {
  kind: 'enum'
  enumName: string
  members: string[]
}

export type IR = ClassIR | EnumIR
