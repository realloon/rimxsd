// Assets
import code from './assets/code.txt'
// Modules
import { parseCSharp, buildXsdDom, serializeXsd } from './modules'

export function main() {
  const irArr = parseCSharp(code)
  const dom = buildXsdDom(irArr)
  const xsd = serializeXsd(dom)
  console.log(xsd)
}
main()