import { forwardRef } from 'react';
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
};

type IconComponent = React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>;

const createIcon = (name: string): IconComponent =>
  forwardRef<SVGSVGElement, IconProps>(({ size = 24, color, strokeWidth = 2, ...rest }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <circle cx="12" cy="12" r="10" opacity="0.1" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
      <title>{name}</title>
    </svg>
  ));

const iconNames = [
  'X',
  'Target',
  'Trophy',
  'Gamepad2',
  'Star',
  'Zap',
  'Eye',
  'Footprints',
  'Skull',
  'Dumbbell',
  'Layers',
  'Edit',
  'GraduationCap',
  'Info',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'TrendingUp',
  'BrainCircuit',
  'Play',
  'Clock',
  'CheckCircle',
  'XCircle',
  'CircleQuestionMarkIcon',
  'Bot',
  'RefreshCcw',
  'RefreshCw',
  'Save',
  'ChevronDown',
  'ChevronUp',
  'Flame',
  'Lock',
  'User',
  'LogOut',
] as const;

type IconName = (typeof iconNames)[number];

const icons = Object.fromEntries(iconNames.map((name) => [name, createIcon(name)])) as Record<IconName, IconComponent>;

export const {
  X,
  Target,
  Trophy,
  Gamepad2,
  Star,
  Zap,
  Eye,
  Footprints,
  Skull,
  Dumbbell,
  Layers,
  Edit,
  GraduationCap,
  Info,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  CircleQuestionMarkIcon,
  Bot,
  RefreshCcw,
  RefreshCw,
  Save,
  ChevronDown,
  ChevronUp,
  Flame,
  Lock,
  User,
  LogOut,
} = icons;

export default icons;
