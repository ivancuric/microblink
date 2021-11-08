import * as BlinkIDSDK from '@microblink/blinkid-in-browser-sdk';

// UI elements for scanning feedback
const cameraFeed = document.getElementById('camera-feed') as HTMLVideoElement;
const cameraFeedback = document.getElementById(
  'camera-feedback',
) as HTMLCanvasElement;
const drawContext = cameraFeedback.getContext('2d') as CanvasRenderingContext2D;
const scanFeedback = document.getElementById(
  'camera-guides',
) as HTMLParagraphElement;
const scanOverlayEl = document.getElementById(
  'scanning-overlay',
) as HTMLDivElement;

// UI elements for filling in inputs
const firstNameInput = <HTMLInputElement>document.getElementById('first-name');
const lastNameInput = <HTMLInputElement>document.getElementById('last-name');
const birthDateInput = <HTMLInputElement>document.getElementById('birth-date');
const expiryDateInput = <HTMLInputElement>(
  document.getElementById('expiry-date')
);

export async function startScan(sdk: BlinkIDSDK.WasmSDK) {
  scanOverlayEl.classList.add('visible');

  // 1. Create a recognizer objects which will be used to recognize single image or stream of images.
  //

  // Generic ID Recognizer - scan various ID documents
  const genericIDRecognizer = await BlinkIDSDK.createBlinkIdRecognizer(sdk);

  // [OPTIONAL] Create a callbacks object that will receive recognition events, such as detected object location etc.
  const callbacks = {
    onQuadDetection: (quad: BlinkIDSDK.DisplayableQuad) => drawQuad(quad),
    onDetectionFailed: () => updateScanFeedback('Detection failed', true),
  };

  // 2. Create a RecognizerRunner object which orchestrates the recognition with one or more

  //    recognizer objects.
  const recognizerRunner = await BlinkIDSDK.createRecognizerRunner(
    // SDK instance to use
    sdk,

    // List of recognizer objects that will be associated with created RecognizerRunner object
    [genericIDRecognizer],

    // [OPTIONAL] Should recognition pipeline stop as soon as first recognizer in chain finished recognition
    false,

    // [OPTIONAL] Callbacks object that will receive recognition events
    callbacks,
  );

  // 3. Create a VideoRecognizer object and attach it to HTMLVideoElement that will be used for displaying the camera feed
  const videoRecognizer =
    await BlinkIDSDK.VideoRecognizer.createVideoRecognizerFromCameraStream(
      cameraFeed,
      recognizerRunner,
    );

  // 4. Start the recognition and await for the results
  const processResult = await videoRecognizer.recognize();

  // 5. If recognition was successful, obtain the result and display it
  if (processResult !== BlinkIDSDK.RecognizerResultState.Empty) {
    const genericIDResults = await genericIDRecognizer.getResult();
    if (genericIDResults.state !== BlinkIDSDK.RecognizerResultState.Empty) {
      console.log('BlinkIDGeneric results', genericIDResults);
      const firstName =
        genericIDResults.firstName || genericIDResults.mrz.secondaryID;
      const lastName =
        genericIDResults.lastName || genericIDResults.mrz.primaryID;
      const dateOfBirth = {
        year:
          genericIDResults.dateOfBirth.year ||
          genericIDResults.mrz.dateOfBirth.year,
        month:
          genericIDResults.dateOfBirth.month ||
          genericIDResults.mrz.dateOfBirth.month,
        day:
          genericIDResults.dateOfBirth.day ||
          genericIDResults.mrz.dateOfBirth.day,
      };
      const expiryDate = {
        year:
          genericIDResults.dateOfExpiry.year ||
          genericIDResults.mrz.dateOfExpiry.year,
        month:
          genericIDResults.dateOfExpiry.month ||
          genericIDResults.mrz.dateOfExpiry.month,
        day:
          genericIDResults.dateOfExpiry.day ||
          genericIDResults.mrz.dateOfExpiry.day,
      };

      const localizedBirthDate = new Date(
        Date.UTC(dateOfBirth.year, dateOfBirth.month, dateOfBirth.day),
      ).toLocaleDateString();

      const localizedExpiryDate = new Date(
        Date.UTC(expiryDate.year, expiryDate.month, expiryDate.day),
      ).toLocaleDateString();

      firstNameInput.value = firstName;
      lastNameInput.value = lastName;
      birthDateInput.value = localizedBirthDate;
      expiryDateInput.value = localizedExpiryDate;
    }

    // 7. Release all resources allocated on the WebAssembly heap and associated with camera stream

    // Release browser resources associated with the camera stream
    videoRecognizer?.releaseVideoFeed();

    // Release memory on WebAssembly heap used by the RecognizerRunner
    recognizerRunner?.delete();

    // Release memory on WebAssembly heap used by the recognizer
    genericIDRecognizer?.delete();

    // Clear any leftovers drawn to canvas
    clearDrawCanvas();

    scanOverlayEl.classList.remove('visible');
  }
}

/**
 * Utility functions for drawing detected quadrilateral onto canvas.
 */
function drawQuad(quad: BlinkIDSDK.DisplayableQuad) {
  clearDrawCanvas();

  // Based on detection status, show appropriate color and message
  setupColor(quad);
  setupMessage(quad);
  applyTransform(quad.transformMatrix);
  drawContext.beginPath();
  drawContext.moveTo(quad.topLeft.x, quad.topLeft.y);
  drawContext.lineTo(quad.topRight.x, quad.topRight.y);
  drawContext.lineTo(quad.bottomRight.x, quad.bottomRight.y);
  drawContext.lineTo(quad.bottomLeft.x, quad.bottomLeft.y);
  drawContext.closePath();
  drawContext.stroke();
}

/**
 * This function will make sure that coordinate system associated with detectionResult
 * canvas will match the coordinate system of the image being recognized.
 */
function applyTransform(transformMatrix: Float32Array) {
  const canvasAR = cameraFeedback.width / cameraFeedback.height;
  const videoAR = cameraFeed.videoWidth / cameraFeed.videoHeight;
  let xOffset = 0;
  let yOffset = 0;
  let scaledVideoHeight = 0;
  let scaledVideoWidth = 0;
  if (canvasAR > videoAR) {
    // pillarboxing: https://en.wikipedia.org/wiki/Pillarbox
    scaledVideoHeight = cameraFeedback.height;
    scaledVideoWidth = videoAR * scaledVideoHeight;
    xOffset = (cameraFeedback.width - scaledVideoWidth) / 2;
  } else {
    // letterboxing: https://en.wikipedia.org/wiki/Letterboxing_(filming)
    scaledVideoWidth = cameraFeedback.width;
    scaledVideoHeight = scaledVideoWidth / videoAR;
    yOffset = (cameraFeedback.height - scaledVideoHeight) / 2;
  }

  // first transform canvas for offset of video preview within the HTML video element (i.e. correct letterboxing or pillarboxing)
  drawContext.translate(xOffset, yOffset);

  // second, scale the canvas to fit the scaled video
  drawContext.scale(
    scaledVideoWidth / cameraFeed.videoWidth,
    scaledVideoHeight / cameraFeed.videoHeight,
  );

  // finally, apply transformation from image coordinate system to

  // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setTransform
  drawContext.transform(
    transformMatrix[0],
    transformMatrix[3],
    transformMatrix[1],
    transformMatrix[4],
    transformMatrix[2],
    transformMatrix[5],
  );
}

function clearDrawCanvas() {
  cameraFeedback.width = cameraFeedback.clientWidth;
  cameraFeedback.height = cameraFeedback.clientHeight;
  drawContext.clearRect(0, 0, cameraFeedback.width, cameraFeedback.height);
}

function setupColor(displayable: BlinkIDSDK.Displayable) {
  let color = '#FFFF00FF';
  if (displayable.detectionStatus === 0) {
    color = '#FF0000FF';
  } else if (displayable.detectionStatus === 1) {
    color = '#00FF00FF';
  }
  drawContext.fillStyle = color;
  drawContext.strokeStyle = color;
  drawContext.lineWidth = 5;
}

function setupMessage(displayable: BlinkIDSDK.Displayable) {
  switch (displayable.detectionStatus) {
    case BlinkIDSDK.DetectionStatus.Fail:
      updateScanFeedback('Scanning...');
      break;
    case BlinkIDSDK.DetectionStatus.Success:
    case BlinkIDSDK.DetectionStatus.FallbackSuccess:
      updateScanFeedback('Detection successful');
      break;
    case BlinkIDSDK.DetectionStatus.CameraAtAngle:
      updateScanFeedback('Adjust the angle');
      break;
    case BlinkIDSDK.DetectionStatus.CameraTooHigh:
      updateScanFeedback('Move document closer');
      break;
    case BlinkIDSDK.DetectionStatus.CameraTooNear:
    case BlinkIDSDK.DetectionStatus.DocumentTooCloseToEdge:
    case BlinkIDSDK.DetectionStatus.Partial:
      updateScanFeedback('Move document farther');
      break;
    default:
      console.warn('Unhandled detection status!', displayable.detectionStatus);
  }
}

let scanFeedbackLock = false;

/**
 * The purpose of this function is to ensure that scan feedback message is
 * visible for at least 1 second.
 */
function updateScanFeedback(message: string, force?: boolean) {
  if (scanFeedbackLock && !force) {
    return;
  }
  scanFeedbackLock = true;
  scanFeedback.innerText = message;
  window.setTimeout(() => (scanFeedbackLock = false), 1000);
}
