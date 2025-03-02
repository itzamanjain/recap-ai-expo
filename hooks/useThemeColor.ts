import { Colors } from '@/constants/Colors';

export function useThemeColor(
  props: { light?: string },
  colorName: keyof typeof Colors
) {
  const colorFromProps = props.light;

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[colorName];
  }
}
