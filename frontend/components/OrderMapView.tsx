import { Platform } from 'react-native';
import WebMapView from './OrderMapView.web';

let MapComponent: any = WebMapView;

if (Platform.OS !== 'web') {
  try {
    MapComponent = require('./OrderMapView.native').default;
  } catch {
    MapComponent = WebMapView;
  }
}

export default MapComponent;
