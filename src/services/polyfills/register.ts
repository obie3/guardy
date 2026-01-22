import { XMLHttpRequestPolyfill } from './XMLHttpRequest';

export function registerXMLHttpRequestPolyfill() {
  // Only replace if we're in React Native environment
  if (typeof window !== 'undefined' && !window.XMLHttpRequest) {
    (window as any).XMLHttpRequest = XMLHttpRequestPolyfill;
  }
}
