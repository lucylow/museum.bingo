import { ImmersiveSceneMode } from './immersiveSystem';

export interface ImmersiveDebugScene {
  id: string;
  label: string;
  sceneMode: ImmersiveSceneMode;
  cameraTilt: { x: number; y: number };
  targetState: 'idle' | 'focused' | 'scanSuccess' | 'lineComplete' | 'roomVictory';
  lowLight: boolean;
  reducedMotion: boolean;
}

export const IMMERSIVE_DEBUG_SCENES: ImmersiveDebugScene[] = [
  {
    id: 'stationary-view',
    label: 'Stationary view',
    sceneMode: 'classicGallery',
    cameraTilt: { x: 0, y: 0 },
    targetState: 'idle',
    lowLight: false,
    reducedMotion: false,
  },
  {
    id: 'motion-view',
    label: 'Motion view',
    sceneMode: 'modernGallery',
    cameraTilt: { x: 0.4, y: -0.2 },
    targetState: 'focused',
    lowLight: false,
    reducedMotion: false,
  },
  {
    id: 'scan-success',
    label: 'Scan success',
    sceneMode: 'classicGallery',
    cameraTilt: { x: 0.1, y: 0.12 },
    targetState: 'scanSuccess',
    lowLight: false,
    reducedMotion: false,
  },
  {
    id: 'line-completion',
    label: 'Line completion',
    sceneMode: 'challenge',
    cameraTilt: { x: -0.12, y: 0.15 },
    targetState: 'lineComplete',
    lowLight: false,
    reducedMotion: false,
  },
  {
    id: 'room-victory',
    label: 'Room victory',
    sceneMode: 'familyFun',
    cameraTilt: { x: 0.08, y: -0.08 },
    targetState: 'roomVictory',
    lowLight: false,
    reducedMotion: false,
  },
  {
    id: 'low-light',
    label: 'Low light mode',
    sceneMode: 'nightMuseum',
    cameraTilt: { x: 0.04, y: -0.05 },
    targetState: 'focused',
    lowLight: true,
    reducedMotion: false,
  },
  {
    id: 'reduced-motion',
    label: 'Reduced motion',
    sceneMode: 'modernGallery',
    cameraTilt: { x: 0.02, y: 0.01 },
    targetState: 'idle',
    lowLight: false,
    reducedMotion: true,
  },
];
