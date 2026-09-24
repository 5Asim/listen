import Svg, { Circle, Rect } from 'react-native-svg';
import { colors } from '@/theme';

export function ProgressRing({ progress, size = 24 }: { progress: number; size?: number }) {
  const stroke = size * 0.1;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const center = size / 2;

  return (
    <Svg width={size} height={size}>
      <Circle cx={center} cy={center} r={r} stroke={colors.surface2} strokeWidth={stroke} fill="none" />
      <Circle
        cx={center}
        cy={center}
        r={r}
        stroke={colors.accent}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={circumference * (1 - progress)}
        transform={`rotate(-90 ${center} ${center})`}
      />
      <Rect x={center - 4} y={center - 4} width={8} height={8} rx={1.5} fill={colors.accent} />
    </Svg>
  );
}
