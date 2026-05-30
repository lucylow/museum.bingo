import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Region } from 'react-native-maps';
import MapViewCluster from 'react-native-maps-clustering';
import { HistoricalMuseum } from '../types/museums';
import { MuseumMarker } from './MuseumMarker';

interface ClusteredMapViewProps {
  museums: HistoricalMuseum[];
  region: Region;
  onMarkerPress: (museumId: string) => void;
  onRegionChangeComplete?: (region: Region) => void;
}

interface ClusterProps {
  pointCount: number;
}

const ClusterMarker: React.FC<ClusterProps> = ({ pointCount }) => (
  <View style={styles.clusterContainer}>
    <Text style={styles.clusterText}>{pointCount}</Text>
  </View>
);

export const ClusteredMapView: React.FC<ClusteredMapViewProps> = ({
  museums,
  region,
  onMarkerPress,
  onRegionChangeComplete,
}) => {
  return (
    <MapViewCluster
      style={styles.map}
      region={region}
      clusterColor="#9C27B0"
      clusterTextColor="#fff"
      renderCluster={(cluster) => <ClusterMarker pointCount={cluster.pointCount} />}
      radius={40}
      extent={512}
      preserveClusterPressBehavior={false}
      showsUserLocation
      showsMyLocationButton
      onRegionChangeComplete={onRegionChangeComplete}
    >
      {museums.map((museum) => (
        <MuseumMarker key={museum.id} museum={museum} onPress={onMarkerPress} />
      ))}
    </MapViewCluster>
  );
};

const styles = StyleSheet.create({
  map: { width: '100%', height: '100%' },
  clusterContainer: {
    backgroundColor: '#9C27B0',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  clusterText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
