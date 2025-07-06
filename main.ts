// Assets
import classSample from './assets/Def.cs.txt'
import enumSample from './assets/ThingCategory.cs.txt'
// Modules
import { parseCSharp, buildXsdDom, serializeXsd } from './modules'

const sample = classSample + '\n\n' + enumSample

const irArr = parseCSharp(sample)
const dom = buildXsdDom(irArr)
const xsd = serializeXsd(dom)

console.log(xsd)