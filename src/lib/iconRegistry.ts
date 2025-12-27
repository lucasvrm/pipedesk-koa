/**
 * Central Icon Registry - Single Source of Truth
 * 
 * Este arquivo centraliza todos os ícones disponíveis no sistema,
 * garantindo consistência entre o IconPicker (customize) e o renderer (sidebar/rail).
 * 
 * NUNCA duplicar esta lista em outro lugar - sempre importar daqui.
 */

import {
  Home,
  LayoutDashboard,
  Menu,
  Navigation,
  MapPin,
  Compass,
  Route,
  Map as MapIcon,
  Briefcase,
  Building2,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  UserCircle,
  Contact,
  Phone,
  Mail,
  MessageCircle,
  FileText,
  Folder,
  FolderOpen,
  Archive,
  File,
  FileSpreadsheet,
  FileBarChart,
  Paperclip,
  Download,
  Upload,
  Settings,
  Wrench,
  Hammer,
  Zap,
  Bell,
  Calendar,
  Clock,
  Timer,
  Search,
  Filter,
  Flag,
  Star,
  Heart,
  Bookmark,
  Palette,
  Image,
  Shield,
  Lock,
  Key,
  User,
  BarChart3,
  PieChart,
  Activity,
  TrendingDown,
  Kanban,
  CheckSquare,
  ListTodo,
  Clipboard,
  Pencil,
  Plus,
  type LucideIcon,
} from 'lucide-react';

/**
 * Estrutura de cada opção de ícone
 */
export interface IconOption {
  value: string;
  label: string;
  Icon: LucideIcon;
  category: 'navigation' | 'business' | 'documents' | 'actions' | 'misc' | 'charts' | 'tasks';
}

/**
 * DEFAULT_ICON_KEY - Ícone padrão usado em fallbacks
 */
export const DEFAULT_ICON_KEY = 'Home';

/**
 * ICON_OPTIONS - Lista completa de ícones disponíveis (60 ícones)
 * 
 * Organizada por categorias para facilitar busca no UI
 */
export const ICON_OPTIONS: IconOption[] = [
  // Navegação (8)
  { value: 'Home', label: 'Home', Icon: Home, category: 'navigation' },
  { value: 'LayoutDashboard', label: 'Dashboard', Icon: LayoutDashboard, category: 'navigation' },
  { value: 'Menu', label: 'Menu', Icon: Menu, category: 'navigation' },
  { value: 'Navigation', label: 'Navigation', Icon: Navigation, category: 'navigation' },
  { value: 'MapPin', label: 'Map Pin', Icon: MapPin, category: 'navigation' },
  { value: 'Compass', label: 'Compass', Icon: Compass, category: 'navigation' },
  { value: 'Route', label: 'Route', Icon: Route, category: 'navigation' },
  { value: 'Map', label: 'Map', Icon: MapIcon, category: 'navigation' },
  
  // Negócios (12)
  { value: 'Briefcase', label: 'Briefcase', Icon: Briefcase, category: 'business' },
  { value: 'Building2', label: 'Building', Icon: Building2, category: 'business' },
  { value: 'TrendingUp', label: 'Trending Up', Icon: TrendingUp, category: 'business' },
  { value: 'DollarSign', label: 'Dollar', Icon: DollarSign, category: 'business' },
  { value: 'ShoppingCart', label: 'Shopping', Icon: ShoppingCart, category: 'business' },
  { value: 'Package', label: 'Package', Icon: Package, category: 'business' },
  { value: 'Users', label: 'Users', Icon: Users, category: 'business' },
  { value: 'UserCircle', label: 'User Circle', Icon: UserCircle, category: 'business' },
  { value: 'Contact', label: 'Contact', Icon: Contact, category: 'business' },
  { value: 'Phone', label: 'Phone', Icon: Phone, category: 'business' },
  { value: 'Mail', label: 'Mail', Icon: Mail, category: 'business' },
  { value: 'MessageCircle', label: 'Message', Icon: MessageCircle, category: 'business' },
  
  // Documentos (10)
  { value: 'FileText', label: 'File Text', Icon: FileText, category: 'documents' },
  { value: 'Folder', label: 'Folder', Icon: Folder, category: 'documents' },
  { value: 'FolderOpen', label: 'Folder Open', Icon: FolderOpen, category: 'documents' },
  { value: 'Archive', label: 'Archive', Icon: Archive, category: 'documents' },
  { value: 'File', label: 'File', Icon: File, category: 'documents' },
  { value: 'FileSpreadsheet', label: 'Spreadsheet', Icon: FileSpreadsheet, category: 'documents' },
  { value: 'FileBarChart', label: 'File Chart', Icon: FileBarChart, category: 'documents' },
  { value: 'Paperclip', label: 'Paperclip', Icon: Paperclip, category: 'documents' },
  { value: 'Download', label: 'Download', Icon: Download, category: 'documents' },
  { value: 'Upload', label: 'Upload', Icon: Upload, category: 'documents' },
  
  // Ações (10)
  { value: 'Settings', label: 'Settings', Icon: Settings, category: 'actions' },
  { value: 'Wrench', label: 'Wrench', Icon: Wrench, category: 'actions' },
  { value: 'Hammer', label: 'Hammer', Icon: Hammer, category: 'actions' },
  { value: 'Zap', label: 'Zap', Icon: Zap, category: 'actions' },
  { value: 'Bell', label: 'Bell', Icon: Bell, category: 'actions' },
  { value: 'Calendar', label: 'Calendar', Icon: Calendar, category: 'actions' },
  { value: 'Clock', label: 'Clock', Icon: Clock, category: 'actions' },
  { value: 'Timer', label: 'Timer', Icon: Timer, category: 'actions' },
  { value: 'Search', label: 'Search', Icon: Search, category: 'actions' },
  { value: 'Filter', label: 'Filter', Icon: Filter, category: 'actions' },
  
  // Diversos (10)
  { value: 'Flag', label: 'Flag', Icon: Flag, category: 'misc' },
  { value: 'Star', label: 'Star', Icon: Star, category: 'misc' },
  { value: 'Heart', label: 'Heart', Icon: Heart, category: 'misc' },
  { value: 'Bookmark', label: 'Bookmark', Icon: Bookmark, category: 'misc' },
  { value: 'Palette', label: 'Palette', Icon: Palette, category: 'misc' },
  { value: 'Image', label: 'Image', Icon: Image, category: 'misc' },
  { value: 'Shield', label: 'Shield', Icon: Shield, category: 'misc' },
  { value: 'Lock', label: 'Lock', Icon: Lock, category: 'misc' },
  { value: 'Key', label: 'Key', Icon: Key, category: 'misc' },
  { value: 'User', label: 'User', Icon: User, category: 'misc' },
  
  // Gráficos (5)
  { value: 'BarChart3', label: 'Bar Chart', Icon: BarChart3, category: 'charts' },
  { value: 'PieChart', label: 'Pie Chart', Icon: PieChart, category: 'charts' },
  { value: 'Activity', label: 'Activity', Icon: Activity, category: 'charts' },
  { value: 'TrendingDown', label: 'Trending Down', Icon: TrendingDown, category: 'charts' },
  { value: 'Kanban', label: 'Kanban', Icon: Kanban, category: 'charts' },
  
  // Tarefas (5)
  { value: 'CheckSquare', label: 'Check Square', Icon: CheckSquare, category: 'tasks' },
  { value: 'ListTodo', label: 'Todo List', Icon: ListTodo, category: 'tasks' },
  { value: 'Clipboard', label: 'Clipboard', Icon: Clipboard, category: 'tasks' },
  { value: 'Pencil', label: 'Pencil', Icon: Pencil, category: 'tasks' },
  { value: 'Plus', label: 'Plus', Icon: Plus, category: 'tasks' },
];

/**
 * ICON_MAP - Map otimizado para lookup O(1)
 * Gerado automaticamente a partir de ICON_OPTIONS
 */
const ICON_MAP = new Map<string, LucideIcon>(
  ICON_OPTIONS.map(opt => [opt.value, opt.Icon])
);

/**
 * ICON_CANONICAL_BY_LOWER - Map para lookup case-insensitive O(1)
 * Mapeia nome em lowercase para o nome canônico (PascalCase)
 */
const ICON_CANONICAL_BY_LOWER = new Map<string, string>(
  ICON_OPTIONS.map(opt => [opt.value.toLowerCase(), opt.value])
);

/**
 * ICON_ALIASES - Mapeamento de nomes legados/aliases para nomes canônicos
 * Usado para suportar configs antigas sem quebrar a aplicação
 */
const ICON_ALIASES: Record<string, string> = {
  'dashboard': 'LayoutDashboard',
  'kanban': 'Kanban',
  'clock': 'Clock',
  'home': 'Home',
  'user': 'User',
  'users': 'Users',
  'settings': 'Settings',
  'briefcase': 'Briefcase',
  'building': 'Building2',
  'building2': 'Building2',
};

/**
 * normalizeIconName - Normaliza nome de ícone para formato canônico
 * 
 * Aplica normalização case-insensitive e resolve aliases legados
 * para garantir que configs antigas continuem funcionando.
 * 
 * @param iconName - Nome do ícone (pode ser null/undefined/case incorreto)
 * @returns Nome canônico do ícone, ou DEFAULT_ICON_KEY se não encontrado
 * 
 * @example
 * normalizeIconName('clock') // => 'Clock'
 * normalizeIconName('KANBAN') // => 'Kanban'
 * normalizeIconName('dashboard') // => 'LayoutDashboard'
 * normalizeIconName('invalid') // => 'Home'
 */
export function normalizeIconName(iconName?: string | null): string {
  if (!iconName || typeof iconName !== 'string') {
    return DEFAULT_ICON_KEY;
  }
  
  const trimmed = iconName.trim();
  if (!trimmed) {
    return DEFAULT_ICON_KEY;
  }
  
  // Fast path: se já existe exatamente como está, retorna direto
  if (ICON_MAP.has(trimmed)) {
    return trimmed;
  }
  
  const lower = trimmed.toLowerCase();
  
  // Tentar resolver via alias
  if (ICON_ALIASES[lower]) {
    return ICON_ALIASES[lower];
  }
  
  // Tentar resolver via lookup case-insensitive
  const canonical = ICON_CANONICAL_BY_LOWER.get(lower);
  if (canonical) {
    return canonical;
  }
  
  // Fallback: retornar default
  return DEFAULT_ICON_KEY;
}

/**
 * getIconComponent - Resolver string de ícone para componente Lucide
 * 
 * @param iconName - Nome do ícone (ex: 'Clock', 'LayoutDashboard')
 * @returns Componente Lucide correspondente, ou Home como fallback
 * 
 * @example
 * const IconComponent = getIconComponent('Clock'); // Retorna Clock
 * const FallbackIcon = getIconComponent('InvalidIcon'); // Retorna Home
 * const CaseInsensitive = getIconComponent('clock'); // Retorna Clock (normalizado)
 */
export function getIconComponent(iconName: string | null | undefined): LucideIcon {
  if (!iconName) return Home;
  
  // Fast path: lookup direto (sem overhead de normalização)
  const directMatch = ICON_MAP.get(iconName);
  if (directMatch) return directMatch;
  
  // Slow path: normalizar e tentar novamente
  const normalized = normalizeIconName(iconName);
  return ICON_MAP.get(normalized) || Home;
}

/**
 * isValidIcon - Verificar se um nome de ícone é válido
 * 
 * @param iconName - Nome do ícone a validar
 * @returns true se o ícone existe no registro (após normalização)
 * 
 * @example
 * isValidIcon('Clock') // => true
 * isValidIcon('clock') // => true (normalizado)
 * isValidIcon('invalid') // => false
 */
export function isValidIcon(iconName: string): boolean {
  if (!iconName) return false;
  
  // Fast path: check direto
  if (ICON_MAP.has(iconName)) return true;
  
  // Slow path: normalizar e verificar
  const normalized = normalizeIconName(iconName);
  return normalized !== DEFAULT_ICON_KEY || iconName.toLowerCase() === DEFAULT_ICON_KEY.toLowerCase();
}

/**
 * getAllIconNames - Retornar lista de todos os nomes de ícones válidos
 * Útil para validação em schemas Zod ou testes
 */
export function getAllIconNames(): string[] {
  return ICON_OPTIONS.map(opt => opt.value);
}
