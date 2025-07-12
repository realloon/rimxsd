import { existsSync } from 'fs'
import { file, write } from 'bun'
import { resolve, basename, dirname } from 'path'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'

const FXML_PARSER_OPTIONS = {
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  preserveOrder: true, // important for xsd
}

const FXML_BUILDER_OPTIONS = {
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  preserveOrder: true,
  commentPropName: '#comment',
  format: false, // minimize Output
}

export class XsdBundler {
  private readonly entryFilePath: string
  // Solving the diamond dependency problem
  private processedFiles = new Set<string>()
  private finalSchemaElements: any[] = []
  private rootSchemaAttributes: any = {}

  constructor(entryFilePath: string) {
    if (!existsSync(entryFilePath)) {
      throw new Error(`Entry file not found: ${entryFilePath}`)
    }

    this.entryFilePath = resolve(entryFilePath)
  }

  public async bundle() {
    console.log(`🚀 Starting bundling process for: ${this.entryFilePath}`)

    await this.processFile(this.entryFilePath)

    const finalSchemaObject = [
      {
        // root
        'xs:schema': [
          { ':@': this.rootSchemaAttributes },
          ...this.finalSchemaElements,
        ],
      },
    ]

    const builder = new XMLBuilder(FXML_BUILDER_OPTIONS)
    const bundledXml = builder.build(finalSchemaObject)

    return '<?xml version="1.0" encoding="UTF-8"?>' + bundledXml
  }

  private async processFile(filePath: string) {
    const absolutePath = resolve(filePath)

    if (this.processedFiles.has(absolutePath)) {
      console.log(
        `- Skipping already processed file: ${basename(absolutePath)}`
      )
      return // skip duplicates
    }

    console.log(`+ Processing: ${basename(absolutePath)}`)
    this.processedFiles.add(absolutePath)

    const fileContent = await file(absolutePath).text()
    const parser = new XMLParser(FXML_PARSER_OPTIONS)
    const parsedXml = parser.parse(fileContent)

    const schemaNode = parsedXml.find((node: any) => node['xs:schema'])
    if (!schemaNode) {
      throw new Error(`No <xs:schema> tag found in ${absolutePath}`)
    }

    if (absolutePath === this.entryFilePath) {
      this.rootSchemaAttributes = schemaNode[':@'] || {}
    }

    const schemaChildren = schemaNode['xs:schema']

    for (const child of schemaChildren) {
      if (child['xs:include']) {
        const includeLocation = child[':@']['@schemaLocation']
        if (!includeLocation) {
          console.warn(
            `⚠️ Found <xs:include> without schemaLocation in ${absolutePath}. Skipping.`
          )
          continue
        }
        const includedFilePath = resolve(
          dirname(absolutePath),
          includeLocation
        )

        await this.processFile(includedFilePath)
      } else if (child[':@']) {
        // node (e.g., xs:element, xs:complexType, etc.)
        this.finalSchemaElements.push(child)
      } else if (child['#comment']) {
        this.finalSchemaElements.push(child)
      }
    }
  }
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length !== 2) {
    console.error(
      '❌ Usage: ts-node src/bundler.ts <entry-file.xsd> <output-file.xsd>'
    )
    process.exit(1)
  }

  const [entryFile, outputFile] = args

  try {
    const bundler = new XsdBundler(entryFile)
    const bundledContent = await bundler.bundle()
    await write(outputFile, bundledContent)
    console.log(`\n✅ Successfully bundled schema to ${outputFile}`)
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n🔥 Bundling failed: ${error.message}`)
    } else {
      console.error(
        '\n🔥 An unknown error occurred during bundling.',
        error
      )
    }
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
