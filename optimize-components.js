// Script لتحسين أداء المكونات بإضافة React.memo
// سيتم تنفيذه تلقائياً لجميع المكونات في مجلد AddProperty

const fs = require('fs');
const path = require('path');

const componentsDir = 'src/components/Property/AddProperty';
const components = [
  'PropertyDetailsSection.tsx',
  'FloorAndRoomsSection.tsx', 
  'PriceAndLocationSection.tsx',
  'AdditionalDetailsSection.tsx',
  'LocationMapSection.tsx',
  'PropertyImagesSection.tsx',
  'SubmitSection.tsx',
  'UserStatusHeader.tsx'
];

function addReactMemoToComponent(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // إضافة React import إذا لم يكن موجوداً
  if (!content.includes('import React')) {
    content = content.replace(/^(import .*)$/m, 'import React from "react";\n$1');
  }
  
  // البحث عن تعريف المكون وإضافة React.memo
  const componentRegex = /export const (\w+) = \(/;
  const match = content.match(componentRegex);
  
  if (match) {
    const componentName = match[1];
    content = content.replace(
      `export const ${componentName} = (`,
      `export const ${componentName} = React.memo((`
    );
    
    // إصلاح النهاية
    content = content.replace(/\}\;\s*$/, '});');
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ تم تحديث ${path.basename(filePath)}`);
}

// تنفيذ التحديث لجميع المكونات
components.forEach(component => {
  const fullPath = path.join(componentsDir, component);
  if (fs.existsSync(fullPath)) {
    try {
      addReactMemoToComponent(fullPath);
    } catch (error) {
      console.error(`❌ خطأ في تحديث ${component}:`, error.message);
    }
  }
});

console.log('\n🚀 تم إنجاز تحسين أداء جميع المكونات!');