import * as BlinkIDSDK from '@microblink/blinkid-in-browser-sdk';
import { NotSupportedReason } from '@microblink/blinkid-in-browser-sdk';
import localhostLicenceKey from './localhost.key?raw';
import { startScan } from './startScan';

// choose either the localhost licence key or the netlify hosted one
const licencekey =
  (import.meta.env.VITE_LICENCE_KEY as string) || localhostLicenceKey;

const progressEl = document.getElementById(
  'load-progress',
) as HTMLProgressElement;
const loadScreenEl = document.getElementById(
  'screen-loading',
) as HTMLDivElement;

const startScreenEl = document.getElementById('screen-start') as HTMLDivElement;
const startScanButton = document.getElementById(
  'start-scan',
) as HTMLButtonElement;

const loadSettings = new BlinkIDSDK.WasmSDKLoadSettings(licencekey);

loadSettings.loadProgressCallback = (progress: number) =>
  (progressEl!.value = progress);

(async () => {
  try {
    const sdk = await BlinkIDSDK.loadWasmModule(loadSettings);

    loadScreenEl.classList.add('hidden');
    startScreenEl.classList.remove('hidden');

    startScanButton.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        // Actual work starts here
        await startScan(sdk);
      } catch (error) {
        if ((error as any)?.name === 'VideoRecognizerError') {
          const reason = (error as BlinkIDSDK.VideoRecognizerError).reason;
          console.error(error);
          alert(getErrorMessage(reason));
        }
      }
    });
  } catch (error) {
    console.error('Failed to load SDK!', error);
  }
})();

function getErrorMessage(reason: BlinkIDSDK.NotSupportedReason) {
  switch (reason) {
    case NotSupportedReason.CameraNotAllowed:
      return 'Camera access was not granted by the user';

    case NotSupportedReason.CameraInUse:
      return 'Unable to start playing because camera is already in use.';

    case NotSupportedReason.CameraNotAvailable:
      return 'Camera is currently not available due to a OS or hardware error.';

    case NotSupportedReason.CameraNotFound:
      return 'Camera with requested features is not available on current device.';

    case NotSupportedReason.MediaDevicesNotSupported:
      return 'navigator.mediaDevices.getUserMedia is not supported by current browser for current context.';

    case NotSupportedReason.VideoElementNotProvided:
      return 'There is no provided video element to which the camera feed should be redirected.';
    default:
      return 'Unknown error';
  }
}
