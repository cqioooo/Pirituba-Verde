import fs from 'fs';
import path from 'path';

const iconMap = {
  MapPin: 'MapPin',
  Tag: 'Tag',
  Clock: 'Clock',
  Ruler: 'Ruler',
  FileText: 'FileText',
  CheckCircle: 'CheckCircle',
  CheckCircle2: 'CheckCircle',
  'Image as ImageIcon': 'Image',
  Navigation: 'NavigationArrow',
  Lock: 'Lock',
  ArrowRight: 'ArrowRight',
  ArrowLeft: 'ArrowLeft',
  Info: 'Info',
  Eye: 'Eye',
  BarChart3: 'ChartBar',
  Settings: 'Gear',
  ChevronRight: 'CaretRight',
  ChevronLeft: 'CaretLeft',
  ChevronDown: 'CaretDown',
  ArrowUpDown: 'ArrowsVertical',
  AlertCircle: 'WarningCircle',
  AlertTriangle: 'Warning',
  User: 'User',
  Filter: 'Funnel',
  XCircle: 'XCircle',
  Search: 'MagnifyingGlass',
  X: 'X',
  Lightbulb: 'Lightbulb',
  Crown: 'Crown',
  RotateCcw: 'ClockCounterClockwise',
  AlertOctagon: 'Octagon',
  ExternalLink: 'ArrowSquareOut',
  Check: 'Check',
  Trophy: 'Trophy',
  Sparkles: 'Sparkle',
  Target: 'Crosshair',
  Shield: 'Shield',
  TrendingDown: 'TrendDown',
  Brain: 'Brain',
  Users: 'Users',
  UserCircle: 'UserCircle',
  Mail: 'Envelope',
  Phone: 'Phone',
  Calendar: 'Calendar',
  Camera: 'Camera',
  Bell: 'Bell',
  Plus: 'Plus',
  List: 'List',
  Crosshair: 'Crosshair',
  'History as HistoryIcon': 'ClockCounterClockwise',
  Home: 'House',
  ShieldAlert: 'ShieldWarning',
  Loader2: 'CircleNotch',
  Map: 'MapTrifold',
  Menu: 'List',
  Leaf: 'Leaf',
  LayoutDashboard: 'SquaresFour',
  'Map as MapIcon': 'MapTrifold',
  ShieldCheck: 'ShieldCheck',
  LogOut: 'SignOut',
  'User as UserIcon': 'User',
  ThumbsUp: 'ThumbsUp',
};

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const lucideImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/g;
  let changed = false;

  content = content.replace(lucideImportRegex, (match, importsStr) => {
    const imports = importsStr.split(',').map(s => s.trim()).filter(Boolean);
    const phosphorImports = [];
    const unmappedImports = [];

    for (let imp of imports) {
      if (iconMap[imp]) {
        if (imp.includes(' as ')) {
            const parts = imp.split(' as ');
            const alias = parts[1].trim();
            phosphorImports.push(`${iconMap[imp]} as ${alias}`);
        } else {
            phosphorImports.push(iconMap[imp]);
        }
      } else {
        unmappedImports.push(imp);
      }
    }

    changed = true;
    let newImport = '';
    
    // De-duplicate imports
    const uniquePhosphorImports = [...new Set(phosphorImports)];

    if (uniquePhosphorImports.length > 0) {
      newImport += `import { ${uniquePhosphorImports.join(', ')} } from '@phosphor-icons/react';\n`;
    }
    
    if (unmappedImports.length > 0) {
      console.warn(`Unmapped icons in ${filePath}: ${unmappedImports.join(', ')}`);
      newImport += `// TODO: Unmapped lucide-react imports: import { ${unmappedImports.join(', ')} } from 'lucide-react';\n`;
    }
    
    return newImport.trim();
  });

  if (changed) {
    // Some icons are used as <IconName /> in JSX. We need to update those names if they changed.
    for (const [lucideName, phosphorName] of Object.entries(iconMap)) {
      if (lucideName.includes(' as ')) continue;
      if (lucideName !== phosphorName) {
        // Safe regex to replace JSX tags <IconName and </IconName
        const jsxRegexOpen = new RegExp(`<${lucideName}(\\s|>)`, 'g');
        const jsxRegexClose = new RegExp(`</${lucideName}>`, 'g');
        content = content.replace(jsxRegexOpen, `<${phosphorName}$1`);
        content = content.replace(jsxRegexClose, `</${phosphorName}>`);
      }
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
}

processDirectory(path.join(process.cwd(), 'src'));
