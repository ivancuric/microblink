import * as BlinkIDSDK from '@microblink/blinkid-in-browser-sdk';
import licenseKey from './localhost.key?raw';

const progressEl = document.getElementById(
  'load-progress',
) as HTMLProgressElement;
const loadScreenEl = document.getElementById(
  'screen-loading',
) as HTMLDivElement;
const startScreenEl = document.getElementById('screen-start') as HTMLDivElement;

const loadSettings = new BlinkIDSDK.WasmSDKLoadSettings(licenseKey);

loadSettings.loadProgressCallback = (progress: number) =>
  (progressEl!.value = progress);

(async () => {
  try {
    await BlinkIDSDK.loadWasmModule(loadSettings);

    loadScreenEl.classList.add('hidden');
    startScreenEl.classList.remove('hidden');
  } catch (error) {
    console.error('Failed to load SDK!', error);
  }
})();

console.log(import.meta.env);
