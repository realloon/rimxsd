// Assets
import code from '../../assets/code.txt'
// Modules
import { parseCSharp } from './parseCSharp'
import { buildXsdDom } from './buildXsdDom'
import { serializeXsd } from './serializeXsd'

export function main() {
  const irArr = parseCSharp(code)
  const dom = buildXsdDom(irArr)
  const xsd = serializeXsd(dom)
  console.log(xsd)
}
main()
