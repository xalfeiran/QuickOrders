// Where the app finds the QuickOrder backend.
//
// A phone running this app in Expo Go is a separate device from your
// computer, so "localhost" would mean the phone itself — not your computer.
// Instead the app needs your computer's LAN (Wi-Fi) IP address, e.g.
// "http://192.168.1.42:3000/api". You can change this any time from the
// Settings tab without reinstalling the app.
//
// These values are kept in AsyncStorage so they survive app restarts, and
// mirrored in a plain module variable so the API client (a set of plain
// functions, not a hook) can always read the latest value synchronously.
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL_KEY = 'quickorder.apiBaseUrl';
const STOREFRONT_BASE_URL_KEY = 'quickorder.storefrontBaseUrl';

// Placeholders only — every real deployment must set its own IP/domain from
// the Settings tab. Using the API's default dev port (3000) and the
// frontend's default dev port (8080) from docker-compose.yml as a hint.
export const DEFAULT_API_BASE_URL = 'http://192.168.1.100:3000/api';
export const DEFAULT_STOREFRONT_BASE_URL = 'http://192.168.1.100:8080';

let currentApiBaseUrl = DEFAULT_API_BASE_URL;
let currentStorefrontBaseUrl = DEFAULT_STOREFRONT_BASE_URL;

export function getApiBaseUrl() {
  return currentApiBaseUrl;
}

export function getStorefrontBaseUrl() {
  return currentStorefrontBaseUrl;
}

// Reads any previously-saved URLs from disk. Call this once, before the app
// renders anything that might call the API.
export async function loadStoredConfig() {
  const [savedApi, savedStorefront] = await Promise.all([
    AsyncStorage.getItem(API_BASE_URL_KEY),
    AsyncStorage.getItem(STOREFRONT_BASE_URL_KEY),
  ]);
  if (savedApi) currentApiBaseUrl = savedApi;
  if (savedStorefront) currentStorefrontBaseUrl = savedStorefront;
  return {
    apiBaseUrl: currentApiBaseUrl,
    storefrontBaseUrl: currentStorefrontBaseUrl,
  };
}

export async function setApiBaseUrl(url) {
  currentApiBaseUrl = url.trim().replace(/\/+$/, '');
  await AsyncStorage.setItem(API_BASE_URL_KEY, currentApiBaseUrl);
}

export async function setStorefrontBaseUrl(url) {
  currentStorefrontBaseUrl = url.trim().replace(/\/+$/, '');
  await AsyncStorage.setItem(STOREFRONT_BASE_URL_KEY, currentStorefrontBaseUrl);
}
