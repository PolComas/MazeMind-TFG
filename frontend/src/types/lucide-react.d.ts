declare module 'lucide-react' {
  import type { FC, SVGProps } from 'react';

  type IconProps = SVGProps<SVGSVGElement> & {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
  };

  type IconComponent = FC<IconProps>;

  export type LucideIcon = IconComponent;

  export const X: IconComponent;
  export const Target: IconComponent;
  export const Trophy: IconComponent;
  export const Gamepad2: IconComponent;
  export const Star: IconComponent;
  export const Zap: IconComponent;
  export const Eye: IconComponent;
  export const Footprints: IconComponent;
  export const Skull: IconComponent;
  export const Dumbbell: IconComponent;
  export const Layers: IconComponent;
  export const Edit: IconComponent;
  export const GraduationCap: IconComponent;
  export const Info: IconComponent;
  export const ArrowUp: IconComponent;
  export const ArrowDown: IconComponent;
  export const ArrowLeft: IconComponent;
  export const ArrowRight: IconComponent;
  export const TrendingUp: IconComponent;
  export const BrainCircuit: IconComponent;
  export const Play: IconComponent;
  export const Clock: IconComponent;
  export const CheckCircle: IconComponent;
  export const XCircle: IconComponent;
  export const CircleQuestionMarkIcon: IconComponent;
  export const Bot: IconComponent;
  export const RefreshCcw: IconComponent;
  export const RefreshCw: IconComponent;
  export const Save: IconComponent;
  export const ChevronDown: IconComponent;
  export const ChevronUp: IconComponent;
  export const Flame: IconComponent;
  export const Lock: IconComponent;
  export const User: IconComponent;
  export const LogOut: IconComponent;

  const icons: Record<string, IconComponent>;
  export default icons;
}
