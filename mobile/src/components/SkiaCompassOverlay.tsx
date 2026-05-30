import React, { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { Canvas, Circle, Group, Path, Skia } from '@shopify/react-native-skia';
import { appTheme } from '../theme/tokens';

interface Props {
  relativeBearing: number;
  visible: boolean;
}

export const SkiaCompassOverlay: React.FC<Props> = ({ relativeBearing, visible }) => {
  const { width, height } = useWindowDimensions();

  const centerX = width / 2;
  const centerY = height / 2;
  const arrowLength = Math.min(width, height) * 0.14;

  const arrowPath = useMemo(() => {
    const angleDeg = relativeBearing - 90;
    const angle = (angleDeg * Math.PI) / 180;
    const headSpread = 0.52;
    const shaftBack = arrowLength * 0.38;

    const tipX = centerX + arrowLength * Math.cos(angle);
    const tipY = centerY + arrowLength * Math.sin(angle);
    const leftX = centerX + shaftBack * Math.cos(angle + headSpread);
    const leftY = centerY + shaftBack * Math.sin(angle + headSpread);
    const rightX = centerX + shaftBack * Math.cos(angle - headSpread);
    const rightY = centerY + shaftBack * Math.sin(angle - headSpread);

    const path = Skia.Path.Make();
    path.moveTo(tipX, tipY);
    path.lineTo(leftX, leftY);
    path.lineTo(centerX, centerY);
    path.lineTo(rightX, rightY);
    path.close();
    return path;
  }, [arrowLength, centerX, centerY, relativeBearing]);

  if (!visible) return null;

  return (
    <Canvas style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <Group>
        <Circle cx={centerX} cy={centerY} r={48} color={appTheme.colors.glowWarm} />
        <Circle cx={centerX} cy={centerY} r={28} color="#00000090" />
        <Circle cx={centerX} cy={centerY} r={30} color={appTheme.colors.accentWarm} style="stroke" strokeWidth={2.4} />
        <Circle cx={centerX} cy={centerY} r={54} color={appTheme.colors.accent} style="stroke" strokeWidth={1.2} />
        <Path path={arrowPath} color="#FF7D2CE0" style="fill" />
        <Path path={arrowPath} color="#FFD191" style="stroke" strokeWidth={2} />
      </Group>
    </Canvas>
  );
};
