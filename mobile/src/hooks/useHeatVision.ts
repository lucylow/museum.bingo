import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BeaconRegion, BeaconService } from '../services/BeaconService';
import { CompassReading, CompassService } from '../services/CompassService';
import {
  ArtworkLocation,
  HeatVisionTarget,
  HeatVisionTargetService,
} from '../services/HeatVisionTargetService';
import { PositioningService, UserPosition } from '../services/PositioningService';
import { WifiRTTService } from '../services/WifiRTTService';

export interface ArtworkWithIndoorPosition extends ArtworkLocation {
  beaconId?: string;
  apBssid?: string;
}

interface HeatVisionConfig {
  museumId: string;
  artworks: ArtworkWithIndoorPosition[];
  beaconRegions?: BeaconRegion[];
  enableWifiRTT?: boolean;
}

export const useHeatVision = (config: HeatVisionConfig) => {
  const [heatVisionActive, setHeatVisionActive] = useState(false);
  const [currentTarget, setCurrentTarget] = useState<HeatVisionTarget | null>(null);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [compassHeading, setCompassHeading] = useState<CompassReading | null>(null);
  const [indoorReady, setIndoorReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetServiceRef = useRef(new HeatVisionTargetService());
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasBeaconRegions = useMemo(
    () => Boolean(config.beaconRegions && config.beaconRegions.length > 0),
    [config.beaconRegions],
  );

  const refreshTarget = useCallback(() => {
    if (!heatVisionActive || !userPosition || !indoorReady) {
      setCurrentTarget(null);
      return;
    }
    setCurrentTarget(targetServiceRef.current.getNearestUnvalidatedTarget(userPosition));
  }, [heatVisionActive, indoorReady, userPosition]);

  const markTileCompleted = useCallback(
    (tileId: string) => {
      targetServiceRef.current.markTileCompleted(tileId);
      refreshTarget();
    },
    [refreshTarget],
  );

  const toggleHeatVision = useCallback(() => {
    setHeatVisionActive((prev) => !prev);
  }, []);

  useEffect(() => {
    targetServiceRef.current.setMuseumArtworks(config.artworks);
  }, [config.artworks, config.museumId]);

  useEffect(() => {
    let canceled = false;
    let unsubPosition: (() => void) | null = null;
    let unsubCompass: (() => void) | null = null;

    const initialize = async () => {
      try {
        setError(null);
        const compass = CompassService.getInstance();
        await compass.initialize();
        unsubCompass = compass.addListener((reading) => setCompassHeading(reading));

        if (hasBeaconRegions && config.beaconRegions) {
          await BeaconService.getInstance().initialize(config.beaconRegions);
          for (const artwork of config.artworks) {
            if (!artwork.beaconId) continue;
            BeaconService.getInstance().registerBeaconMapping(artwork.beaconId, artwork.lat, artwork.lng, 0);
          }
        }

        if (config.enableWifiRTT) {
          const wifiRTT = WifiRTTService.getInstance();
          const available = await wifiRTT.initialize();
          if (available) {
            for (const artwork of config.artworks) {
              if (!artwork.apBssid) continue;
              wifiRTT.registerAccessPoint(artwork.apBssid, artwork.lat, artwork.lng, 0);
            }
            await wifiRTT.startRanging();
          }
        }

        const positioning = PositioningService.getInstance();
        await positioning.initialize({
          enableBeacons: hasBeaconRegions,
          enableWifiRTT: config.enableWifiRTT,
        });

        unsubPosition = positioning.addListener((position) => {
          setUserPosition(position);
        });

        if (!canceled) {
          setIndoorReady(true);
        }
      } catch (unknownError) {
        if (!canceled) {
          const message = unknownError instanceof Error ? unknownError.message : 'Failed to initialize heat vision';
          setError(message);
        }
      }
    };

    void initialize();

    return () => {
      canceled = true;
      unsubPosition?.();
      unsubCompass?.();
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [
    config.artworks,
    config.beaconRegions,
    config.enableWifiRTT,
    config.museumId,
    hasBeaconRegions,
  ]);

  useEffect(() => {
    if (!heatVisionActive || !indoorReady) {
      setCurrentTarget(null);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    refreshTarget();
    pollingIntervalRef.current = setInterval(refreshTarget, 500);
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [heatVisionActive, indoorReady, refreshTarget]);

  return {
    heatVisionActive,
    toggleHeatVision,
    currentTarget,
    userPosition,
    compassHeading,
    indoorReady,
    error,
    markTileCompleted,
    refreshTarget,
  };
};
