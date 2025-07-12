export function typeMapper(csharpType: string): string {
  switch (csharpType.toLowerCase()) {
    case 'string':
      return 'xs:string'
    case 'int':
    case 'int32':
    case 'short':
    case 'int16':
    case 'long':
    case 'int64':
      return 'xs:integer'
    case 'float':
    case 'single':
      return 'xs:float'
    case 'double':
      return 'xs:double'
    case 'decimal':
      return 'xs:decimal'
    case 'bool':
    case 'boolean':
      return 'xs:boolean'
    case 'color':
    case 'intvec3':
    case 'intvec2':
    case 'vector3':
    case 'vector2':
    case 'rot4':
      return 'xs:string'
    default:
      return `${csharpType}Type`
  }
}
