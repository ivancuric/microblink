import './style.css';
import * as BlinkIDSDK from '@microblink/blinkid-in-browser-sdk';
import licenseKey from './localhost.key?raw';

const app = document.querySelector<HTMLDivElement>('#app')!;

const loadSettings = new BlinkIDSDK.WasmSDKLoadSettings(licenseKey);
loadSettings.allowHelloMessage = true;
loadSettings.engineLocation = window.location.origin;

BlinkIDSDK.loadWasmModule(loadSettings).then(
  () => {
    //
  },
  (error: any) => {
    console.error('Failed to load SDK!', error);
  },
);

app.innerHTML = `
  <h1>Hello Vite!</h1>
  <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
`;
