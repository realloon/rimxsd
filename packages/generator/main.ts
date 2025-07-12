// Assets
import code from '../../code.tmpl.txt'
// Modules
import { parseCSharp } from './parseCSharp'
import { buildXsdDom } from './buildXsdDom'
import { serializeXsd } from './serializeXsd'

const irArr = parseCSharp(code)
const dom = buildXsdDom(irArr)
const xsd = serializeXsd(dom)
console.log(xsd)
