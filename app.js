const videoElement = document.getElementById("video");
      const canvasElement = document.getElementById("canvas");
      const canvasCtx = canvasElement.getContext("2d");
      const keys = document.querySelectorAll(".key");

      let writtenText = "";
      let lastPressedKey = null;
      let lastPressTime = 0;
      const textOutput = document.getElementById("text-output");

      // Kamera başlat
      const camera = new Camera(videoElement, {
        onFrame: async () => {
          await hands.send({ image: videoElement });
        },
        width: 640,
        height: 480,
      });
      camera.start();

      canvasElement.width = 1680;
      canvasElement.height = 1000;

      // MediaPipe Hands tanımı
      const hands = new Hands({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.6,
      });

      let lastSnapTime = 0;

      function detectSnapGesture(hand) {
        const thumb = hand[4];
        const middle = hand[12];

        const dx = thumb.x - middle.x;
        const dy = thumb.y - middle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 0.05 && Date.now() - lastSnapTime > 1000) {
          console.log("Snap hareketi algılandı!");
          // Örneğin: tüm yazıyı temizle
          writtenText = textOutput.textContent;
          textOutput.textContent = textOutput.textContent.slice(0, -1);

          lastSnapTime = Date.now();
        }
      }

      function checkKeyCollision(x, y) {
        keys.forEach((key) => {
          const rect = key.getBoundingClientRect();

          if (
            x >= rect.left &&
            x <= rect.right &&
            y >= rect.top &&
            y <= rect.bottom
          ) {
            key.classList.add("active");

            const now = Date.now();

            // Aynı tuşa 500ms içinde tekrar basılmasın (debounce)
            if (key.textContent === lastPressedKey && now - lastPressTime < 500)
              return;

            lastPressedKey = key.textContent;
            lastPressTime = now;

            if (key.textContent === "←") {
              writtenText = writtenText.slice(0, -1);
            } else if (key.textContent === "SPACE") {
              writtenText += " ";
            } else {
              writtenText += key.textContent;
            }

            textOutput.textContent = writtenText;
          } else {
            key.classList.remove("active");
          }
        });
      }

      /*
      function checkKeyCollision(x, y) {
        keys.forEach((key) => {
          const rect = key.getBoundingClientRect();

          // Çarpışma kontrolü
          if (
            x >= rect.left &&
            x <= rect.right &&
            y >= rect.top &&
            y <= rect.bottom
          ) {
            key.classList.add("active");
            console.log("Tuş basıldı:", key.textContent);
          } else {
            key.classList.remove("active");
          }
        });
      }
*/
      hands.onResults((results) => {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(
          results.image,
          0,
          0,
          canvasElement.width,
          canvasElement.height
        );

        if (results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0];
          const tip = landmarks[8];

          const hand = results.multiHandLandmarks[0];
          detectSnapGesture(hand);

          const x = tip.x * canvasElement.width;
          const y = tip.y * canvasElement.height;

          // Nokta çiz
          canvasCtx.beginPath();
          canvasCtx.arc(x, y, 10, 0, 2 * Math.PI);
          canvasCtx.fillStyle = "red";
          canvasCtx.fill();

          // Ekran koordinatlarına dönüştür
          const screenX = window.innerWidth - tip.x * window.innerWidth;
          const screenY = tip.y * window.innerHeight;

          checkKeyCollision(screenX, screenY);
        }

        canvasCtx.restore();
      });