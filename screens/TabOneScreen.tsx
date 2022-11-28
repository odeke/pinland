import React, { useState, useEffect } from 'react';
import { StyleSheet, Dimensions, Pressable } from 'react-native';

import { Text, View } from '../components/Themed';
import { RootTabScreenProps } from '../types';

import MapView, { Marker, Callout, Polygon, MAP_TYPES } from 'react-native-maps';
import * as Location from 'expo-location';

export default function TabOneScreen({ navigation }: RootTabScreenProps<'TabOne'>) {
  const { width, height } = Dimensions.get('window');
  const ASPECT_RATIO = width / height;
  const LATITUDE = 37.78825;
  const LONGITUDE = -122.4324;
  const LATITUDE_DELTA = 0.0922;
  const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
  let id = 0;
  const [polygons, setPolygons] = useState([]);
  const [editing, setEditing] = useState(null);
  const [creatingHole, setCreatingHole] = useState(false);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 0.327305,
    longitude: 32.593260,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const finish = () => {
    setPolygons([...polygons, editing]);
    setEditing(null);
    setCreatingHole(false);
  }

  const createHole = () => {
    if (!creatingHole) {
      setCreatingHole(true);
      setEditing({
        ...editing,
        holes: [...editing.holes, []],
      })
    } else {
      const holes = [...editing.holes];
      if (holes[holes.length - 1].length === 0) {
        holes.pop();
        setEditing({ ...editing, holes });
        setCreatingHole(false);
      }
    }
  }

  const onPress = (e) => {
    if (!editing) {
      setEditing({
        id: id++,
        coordinates: [e.nativeEvent.coordinate],
        holes: [],
      });
    } else if (!creatingHole) {
      setEditing({
        ...editing,
        coordinates: [...editing.coordinates, e.nativeEvent.coordinate],
      });
    } else {
      const holes = [...editing.holes];
      holes[holes.length - 1] = [
        ...holes[holes.length - 1],
        e.nativeEvent.coordinate,
      ];
      setEditing({
        ...editing,
        id: id++, // keep incrementing id to trigger display refresh
        coordinates: [...editing.coordinates],
        holes,
      });
    }
  }

  const currentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      return;
    }
    let location = await Location.getCurrentPositionAsync({ enableHighAccuracy: true });
    setLocation(location);
    setMapRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
  }

  useEffect(() => {
    (async () => {

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  let text = 'Waiting..';
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = JSON.stringify(location);
    // console.warn(text);
  }

  const mapOptions = {
    scrollEnabled: true,
  };

  if (editing) {
    mapOptions.scrollEnabled = false;
    mapOptions.onPanDrag = (e: any) => onPress(e);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New PinLand</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <MapView
        style={styles.map}
        showsUserLocation={true}
        initialRegion={mapRegion}
        onPress={e => onPress(e)} >
        {polygons.map((polygon: any) => (
          <Polygon
            key={polygon.id}
            coordinates={polygon.coordinates}
            holes={polygon.holes}
            strokeColor="#F00"
            fillColor="rgba(255,0,0,0.3)"
            strokeWidth={1}
          />
        ))}
        {editing && (
          <Polygon
            key={editing.id}
            coordinates={editing.coordinates}
            holes={editing.holes}
            strokeColor="#000"
            fillColor="rgba(255,0,0,0.3)"
            strokeWidth={1}
          />
        )}

        <Marker
          coordinate={{
            latitude: 0.327305,
            longitude: 32.593260,
          }} pinColor={"blue"} key={"123"}>
          <Callout>
            <Text>Added Border</Text>
          </Callout>
        </Marker>

      </MapView>

      <View style={styles.buttonContainer}>
          {editing && (
            <Pressable
              onPress={() => createHole()}
              style={[styles.bubble, styles.button]}>
              <Text>
                {creatingHole ? 'Finish Hole' : 'Create Hole'}
              </Text>
            </Pressable>
          )}
          {editing && (
            <Pressable
              onPress={() => finish()}
              style={[styles.bubble, styles.button]}>
              <Text>Finish</Text>
            </Pressable>
          )}
        </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  map: {
    width: '100%',
    height: '100%',
    ...StyleSheet.absoluteFillObject,
  },
  bubble: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
  },
  latlng: {
    width: 200,
    alignItems: 'stretch',
  },
  button: {
    width: 80,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginVertical: 20,
    backgroundColor: 'transparent',
  },
});
