import type { ClassIR, EnumIR, IR } from '../../types'
import { typeMapper } from './typeMapper'

const XSD_NS = 'http://www.w3.org/2001/XMLSchema'

// #region healper
function appendDocumentation(
  parent: Element,
  docText: string,
  doc: XMLDocument
) {
  if (!docText) return
  const annotation = doc.createElementNS(XSD_NS, 'xs:annotation')
  const documentation = doc.createElementNS(XSD_NS, 'xs:documentation')
  documentation.textContent = docText
  annotation.append(documentation)
  parent.append(annotation)
}

function createClassNode(def: ClassIR, doc: XMLDocument) {
  const complexType = doc.createElementNS(XSD_NS, 'xs:complexType')
  complexType.setAttribute('name', `${def.className}Type`)
  appendDocumentation(
    complexType,
    `XML definition for RimWorld's ${def.className} type.`,
    doc
  )

  const choice = doc.createElementNS(XSD_NS, 'xs:choice')
  choice.setAttribute('minOccurs', '0')
  choice.setAttribute('maxOccurs', 'unbounded')

  for (const fieldName in def.fields) {
    const field = def.fields[fieldName]
    const element = doc.createElementNS(XSD_NS, 'xs:element')
    element.setAttribute('name', fieldName)

    const docLines: Array<string> = []
    if (field.documentation) docLines.push(field.documentation)
    if (field.defaultValue !== null)
      docLines.push(`Default: ${field.defaultValue}`)
    appendDocumentation(element, docLines.join(' '), doc)

    if (field.isList && field.listElementType) {
      const listComplexType = doc.createElementNS(XSD_NS, 'xs:complexType')
      const sequence = doc.createElementNS(XSD_NS, 'xs:sequence')
      const li = doc.createElementNS(XSD_NS, 'xs:element')
      li.setAttribute('name', 'li')
      li.setAttribute('type', typeMapper(field.listElementType))
      li.setAttribute('minOccurs', '0')
      li.setAttribute('maxOccurs', 'unbounded')
      sequence.appendChild(li)
      listComplexType.appendChild(sequence)
      element.appendChild(listComplexType)
    } else {
      element.setAttribute('type', typeMapper(field.csharpType))
    }
    choice.appendChild(element)
  }

  if (def.parentClassName) {
    const complexContent = doc.createElementNS(XSD_NS, 'xs:complexContent')
    const extension = doc.createElementNS(XSD_NS, 'xs:extension')
    extension.setAttribute('base', `${def.parentClassName}Type`)
    if (Object.keys(def.fields).length > 0) {
      extension.appendChild(choice)
    }
    complexContent.appendChild(extension)
    complexType.appendChild(complexContent)
  } else {
    if (Object.keys(def.fields).length > 0) {
      complexType.appendChild(choice)
    }
  }

  return complexType
}

function createEnumNode(def: EnumIR, doc: XMLDocument) {
  const simpleType = doc.createElementNS(XSD_NS, 'xs:simpleType')
  simpleType.setAttribute('name', `${def.enumName}Type`)
  appendDocumentation(
    simpleType,
    `Enumeration of values for ${def.enumName}.`,
    doc
  )

  const restriction = doc.createElementNS(XSD_NS, 'xs:restriction')
  restriction.setAttribute('base', 'xs:string')

  def.members.forEach(memberName => {
    const enumeration = doc.createElementNS(XSD_NS, 'xs:enumeration')
    enumeration.setAttribute('value', memberName)
    restriction.appendChild(enumeration)
  })

  simpleType.appendChild(restriction)
  return simpleType
}
// #endregion

/**
 * @note Requires browser environment.
 */
export function buildXsdDom(definitions: Array<IR>) {
  const dom = document.implementation.createDocument(XSD_NS, 'xs:schema', null)
  const schemaRoot = dom.documentElement

  definitions.forEach(def => {
    let node: Element | null = null
    if (def.kind === 'class') {
      node = createClassNode(def, dom)
    } else if (def.kind === 'enum') {
      node = createEnumNode(def, dom)
    }
    if (node) {
      schemaRoot.appendChild(node)
    }
  })

  return dom
}
