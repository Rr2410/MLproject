import * as ort from 'onnxruntime-web';
import { Tensor, InferenceSession } from "onnxruntime-web";

document.getElementById('imageUpload').addEventListener('change', async (event) => {

  const file = event.target.files[0];
  if (!file) return;

  const img = new Image();
  img.src = URL.createObjectURL(file);

  img.onload = async () => {

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 224;
    canvas.height = 224;

    // Draw the image on canvas
    ctx.drawImage(img, 0, 0, 224, 224);

    const imageData = ctx.getImageData(0, 0, 224, 224);
    const data = imageData.data;

    console.log(data);

    const float32Data = new Float32Array(224 * 224 * 3);
    
    for (let i = 0; i < 224 * 224; i++) {
      float32Data[i * 3] = data[i * 4];         // R
      float32Data[i * 3 + 1] = data[i * 4 + 1]; // G
      float32Data[i * 3 + 2] = data[i * 4 + 2]; // B
    }

    console.log(float32Data)

    const inputTensor = new Tensor('float32', float32Data, [1, 224, 224, 3]);

    await loadModelAndRunInference(inputTensor);
  };
});

async function loadModelAndRunInference(inputTensor) {

  try {

    const progressBar = document.getElementById('progressBar');
    const progressBarInner = document.getElementById('progressBarInner');

    progressBar.style.display = 'block';

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      progressBarInner.style.width = progress + '%';
      progressBarInner.innerText = progress + '%';

      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 100);


    const session = await ort.InferenceSession.create('./model.onnx',
    {
        executionProviders: ["webgl"],
     }
    );

    const inputName = session.inputNames[0];
    
    const feeds = {};

    feeds[inputName] = inputTensor;

    const output = await session.run(feeds);

    const outputTensor = output[session.outputNames[0]];

    console.log(`Model output tensor: ${outputTensor.data}`);

    const outputData = Array.from(outputTensor.data); 
    
    console.log(outputData)

    const predictedClassIndex = outputData.indexOf(Math.max(...outputData));

    const classNames = ['COVID', 'Lung Opacity', 'Normal', 'Viral Pneumonia'];

    const predictedClassName = classNames[predictedClassIndex ];

    const nextPageUrl = `results.html?predictedClass=${encodeURIComponent(predictedClassName)}`;
    
    window.location.href = nextPageUrl;

  } catch (error) {
    console.error('Error during model inference:', error);
  }
}
