/**
 * Type declarations for lucide-react internal icon imports
 * 
 * Os componentes em src/components/ui/ usam imports do path interno
 * lucide-react/dist/esm/icons/* para otimização de bundle. 
 * Este arquivo fornece os tipos necessários para esses imports.
 */

declare module "lucide-react/dist/esm/icons/*" {
  import { LucideIcon } from "lucide-react";
  const icon: LucideIcon;
  export default icon;
}
