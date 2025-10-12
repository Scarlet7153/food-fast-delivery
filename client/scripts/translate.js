const fs = require('fs')
const path = require('path')

// Import translations
const { translations } = require('../src/utils/translations.js')

// Function to translate a file
function translateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let hasChanges = false
    
    // Replace all translation keys with Vietnamese values
    Object.entries(translations).forEach(([english, vietnamese]) => {
      // Replace in strings (both single and double quotes)
      const patterns = [
        new RegExp(`"${english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'),
        new RegExp(`'${english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`, 'g'),
        new RegExp(`\`${english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\``, 'g'),
        // Replace in JSX text content (between > and <)
        new RegExp(`>${english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<`, 'g'),
        // Replace placeholder text
        new RegExp(`placeholder="${english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'),
        new RegExp(`placeholder='${english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`, 'g'),
      ]
      
      patterns.forEach(pattern => {
        if (pattern.test(content)) {
          content = content.replace(pattern, pattern.source.replace(english, vietnamese))
          hasChanges = true
        }
      })
    })
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ Translated: ${filePath}`)
    }
    
  } catch (error) {
    console.error(`❌ Error translating ${filePath}:`, error.message)
  }
}

// Function to recursively find JSX files
function findJSXFiles(dir) {
  const files = []
  const items = fs.readdirSync(dir)
  
  items.forEach(item => {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findJSXFiles(fullPath))
    } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
      files.push(fullPath)
    }
  })
  
  return files
}

// Main function
function main() {
  const srcDir = path.join(__dirname, '../src')
  const jsxFiles = findJSXFiles(srcDir)
  
  console.log(`🔄 Found ${jsxFiles.length} files to translate...`)
  
  jsxFiles.forEach(file => {
    translateFile(file)
  })
  
  console.log('✨ Translation completed!')
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { translateFile, findJSXFiles }
