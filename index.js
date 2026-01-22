import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { registerRootComponent } from 'expo';
import App from './src/App';

import { decode, encode } from 'base-64';
if (!global.btoa) global.btoa = encode;
if (!global.atob) global.atob = decode;

// Register the root component
registerRootComponent(App);
