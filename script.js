
/* =====================================
   BLUECAPTURE - JAVASCRIPT
===================================== */

// ELEMENTS
const landingPage = document.getElementById("landingPage");
const boothPage = document.getElementById("boothPage");
const navbar = document.querySelector(".navbar");

const video = document.getElementById("video");
const cameraPlaceholder = document.getElementById("cameraPlaceholder");
const cameraStatus = document.getElementById("cameraStatus");
const shotPreview = document.getElementById("shotPreview");

const startCamera = document.getElementById("startCamera");
const captureButton = document.getElementById("captureButton");
const retakeShotButton = document.getElementById("retakeShotButton");
const countdown = document.getElementById("countdown");

const capturedGrid = document.getElementById("capturedGrid");
const photoCount = document.getElementById("photoCount");

const editorSection = document.getElementById("editorSection");
const previewCanvas = document.getElementById("previewCanvas");
const ctx = previewCanvas.getContext("2d");

const filterSelect = document.getElementById("filterSelect");
const layoutSelect = document.getElementById("layoutSelect");
const themeSelect = document.getElementById("themeSelect");
const frameSelect = document.getElementById("frameSelect");
const stickerSelect = document.getElementById("stickerSelect");

const downloadButton = document.getElementById("downloadButton");

// STATE
let cameraStream = null;
let capturedPhotos = [];
let totalPhotos = 3;
let isCapturing = false;

const PHOTO_WIDTH = 640;
const PHOTO_HEIGHT = 480;

function iconMarkup(name) {
    return `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
}

// =====================================
// NAVIGATION
// =====================================

function openPhotobooth() {
    navbar.classList.add("hidden");
    landingPage.classList.add("hidden");
    boothPage.classList.remove("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function backToHome() {
    stopCamera();

    navbar.classList.remove("hidden");
    boothPage.classList.add("hidden");
    landingPage.classList.remove("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

document.getElementById("heroStart").addEventListener("click", openPhotobooth);
document.getElementById("ctaStart").addEventListener("click", openPhotobooth);
document.getElementById("navStart").addEventListener("click", (e) => {
    e.preventDefault();
    openPhotobooth();
});

document.getElementById("backHome").addEventListener("click", backToHome);

// MOBILE MENU
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.querySelector(".nav-links");

menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
});

document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("active");
    });
});

// =====================================
// PHOTO COUNT SETTING
// =====================================

// Pilihan jumlah foto sebelum mulai sesi.
const cameraControls = document.querySelector(".camera-controls");

const countWrapper = document.createElement("div");
countWrapper.className = "capture-count-wrapper";

countWrapper.innerHTML = `
    <label for="captureCountSelect">Number of Photos</label>
    <select id="captureCountSelect">
        <option value="3">3 Photos</option>
        <option value="4">4 Photos</option>
    </select>
`;

cameraControls.prepend(countWrapper);

const captureCountSelect = document.getElementById("captureCountSelect");

const countStyle = document.createElement("style");
countStyle.textContent = `
    .capture-count-wrapper {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-right: 15px;
        justify-content: center;
    }

    .capture-count-wrapper label {
        font-size: 11px;
        font-weight: 700;
        color: #7890aa;
    }

    .capture-count-wrapper select {
        border: 1px solid #e0ebf6;
        border-radius: 30px;
        padding: 13px 15px;
        color: #263e63;
        background: #f6faff;
        outline: none;
        font-size: 12px;
    }

    @media(max-width:600px) {
        .camera-controls {
            flex-direction: column;
            gap: 12px;
        }

        .capture-count-wrapper {
            margin: 0;
        }

        .capture-count-wrapper select {
            width: 100%;
        }
    }
`;

document.head.appendChild(countStyle);

captureCountSelect.addEventListener("change", () => {
    totalPhotos = Number(captureCountSelect.value);

    layoutSelect.innerHTML = `
        <option value="${totalPhotos}">
            Classic Strip (${totalPhotos} Photos)
        </option>
    `;

    resetPhotos();
});

// =====================================
// CAMERA
// =====================================

async function enableCamera() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Browser tidak mendukung akses kamera.");
        }

        startCamera.disabled = true;
        startCamera.textContent = "Connecting...";

        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "user",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        video.srcObject = cameraStream;

        await video.play();

        video.style.display = "block";
        cameraPlaceholder.classList.add("hidden");

        cameraStatus.innerHTML = `<svg class="ui-icon live-icon" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="4"/></svg> CONNECTED`;
        cameraStatus.style.color = "#69b9a3";

        startCamera.classList.add("hidden");
        captureButton.classList.remove("hidden");

        countWrapper.classList.remove("hidden");

    } catch (error) {
        console.error(error);

        alert(
            "Tidak dapat mengakses kamera. Pastikan kamu memberikan izin kamera dan menggunakan localhost atau HTTPS."
        );

        startCamera.disabled = false;
        startCamera.innerHTML = `Enable Camera <span class="button-icon">${iconMarkup("arrow-right")}</span>`;
    }
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }

    video.srcObject = null;
}

startCamera.addEventListener("click", enableCamera);

// =====================================
// COUNTDOWN
// =====================================

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runCountdown() {
    for (let i = 3; i >= 1; i--) {
        countdown.textContent = i;

        await wait(1000);
    }

    countdown.innerHTML = iconMarkup("sparkle");
    await wait(500);

    countdown.textContent = "";
}

function reviewPhoto(photo) {
    shotPreview.src = photo;
    shotPreview.classList.remove("hidden");
    video.style.display = "none";
    captureButton.classList.add("hidden");
    retakeShotButton.classList.remove("hidden");

    let secondsLeft = 3;
    countdown.textContent = secondsLeft;

    return new Promise(resolve => {
        let timer;

        const finishReview = keepPhoto => {
            clearInterval(timer);
            retakeShotButton.removeEventListener("click", retakePhoto);
            shotPreview.classList.add("hidden");
            shotPreview.removeAttribute("src");
            video.style.display = "block";
            retakeShotButton.classList.add("hidden");
            captureButton.classList.remove("hidden");
            countdown.textContent = "";
            resolve(keepPhoto);
        };

        const retakePhoto = () => finishReview(false);
        retakeShotButton.addEventListener("click", retakePhoto);

        timer = setInterval(() => {
            secondsLeft -= 1;
            if (secondsLeft === 0) {
                finishReview(true);
            } else {
                countdown.textContent = secondsLeft;
            }
        }, 1000);
    });
}

// =====================================
// CAPTURE PHOTO
// =====================================

function takePhoto() {
    const canvas = document.createElement("canvas");

    canvas.width = PHOTO_WIDTH;
    canvas.height = PHOTO_HEIGHT;

    const photoContext = canvas.getContext("2d");
    const targetAspect = PHOTO_WIDTH / PHOTO_HEIGHT;
    const sourceAspect = video.videoWidth / video.videoHeight;
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = video.videoWidth;
    let sourceHeight = video.videoHeight;

    if (sourceAspect > targetAspect) {
        sourceWidth = sourceHeight * targetAspect;
        sourceX = (video.videoWidth - sourceWidth) / 2;
    } else {
        sourceHeight = sourceWidth / targetAspect;
        sourceY = (video.videoHeight - sourceHeight) / 2;
    }

    // Mirror foto agar sesuai tampilan kamera selfie.
    photoContext.translate(PHOTO_WIDTH, 0);
    photoContext.scale(-1, 1);

    photoContext.drawImage(
        video,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        PHOTO_WIDTH,
        PHOTO_HEIGHT
    );

    return canvas.toDataURL("image/png");
}

async function startCapture() {
    if (isCapturing) return;

    if (!cameraStream || video.readyState < 2) {
        alert("Kamera belum siap. Silakan tunggu sebentar.");
        return;
    }

    isCapturing = true;
    capturedPhotos = [];

    totalPhotos = Number(captureCountSelect.value);

    captureButton.disabled = true;
    captureCountSelect.disabled = true;

    editorSection.classList.add("hidden");

    renderCapturedPhotos();

    for (let i = 0; i < totalPhotos; i++) {
        let photo;
        let accepted = false;

        while (!accepted) {
            await runCountdown();
            photo = takePhoto();
            accepted = await reviewPhoto(photo);
        }

        capturedPhotos.push(photo);
        renderCapturedPhotos();

        if (i < totalPhotos - 1) {
            await wait(700);
        }
    }

    countdown.textContent = "";

    isCapturing = false;
    captureButton.disabled = false;
    captureCountSelect.disabled = false;

    captureButton.innerHTML = `Take Again <span class="button-icon">${iconMarkup("refresh")}</span>`;

    editorSection.classList.remove("hidden");

    renderPhotoStrip();

    editorSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

captureButton.addEventListener("click", startCapture);

// =====================================
// RENDER CAPTURED PHOTOS
// =====================================

function renderCapturedPhotos() {
    capturedGrid.innerHTML = "";

    photoCount.textContent = `(${capturedPhotos.length}/${totalPhotos})`;

    for (let i = 0; i < totalPhotos; i++) {
        if (capturedPhotos[i]) {
            const img = document.createElement("img");

            img.src = capturedPhotos[i];
            img.alt = `Captured photo ${i + 1}`;
            img.className = "captured-photo";

            capturedGrid.appendChild(img);

        } else {
            const placeholder = document.createElement("div");

            placeholder.className = "empty-photo";
            placeholder.textContent = String(i + 1).padStart(2, "0");

            capturedGrid.appendChild(placeholder);
        }
    }
}

// =====================================
// PHOTO FILTER
// =====================================

function getFilter() {
    const filters = {
        none: "none",
        vintage: "sepia(0.65) contrast(1.1) saturate(0.85)",
        grayscale: "grayscale(1)",
        warm: "sepia(0.25) saturate(1.35)",
        cool: "saturate(0.85) hue-rotate(10deg)",
        dreamy: "brightness(1.12) contrast(0.9) saturate(0.8)"
    };

    return filters[filterSelect.value] || "none";
}

const frameThemes = {
    classic: { color: "#ffffff", accent: "#397bb5", detail: "#a9d3f5", pattern: "none" },
    "color-pop": { color: "#fff3c4", accent: "#d65353", detail: "#397bb5", pattern: "dots" },
    botanical: { color: "#dff4e8", accent: "#496b55", detail: "#9ab98d", pattern: "leaves" },
    skyline: { color: "#dceeff", accent: "#2879b8", detail: "#64c7d7", pattern: "rings" },
    starlight: { color: "#eee6ff", accent: "#7552a0", detail: "#e5ad46", pattern: "diamonds" }
};

function drawThemeDetails(theme, width, height) {
    if (theme.pattern === "none") return;

    const marks = [
        [18, 22], [width - 18, 22],
        [18, height - 22], [width - 18, height - 22]
    ];

    ctx.save();
    marks.forEach(([x, y], index) => {
        ctx.beginPath();

        if (theme.pattern === "dots") {
            ctx.fillStyle = index % 2 ? theme.detail : theme.accent;
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (theme.pattern === "leaves") {
            ctx.fillStyle = index % 2 ? theme.detail : theme.accent;
            ctx.ellipse(x, y, 5, 10, index % 2 ? -0.6 : 0.6, 0, Math.PI * 2);
            ctx.fill();
        } else if (theme.pattern === "rings") {
            ctx.strokeStyle = index % 2 ? theme.detail : theme.accent;
            ctx.lineWidth = 2;
            ctx.arc(x, y, 7, 0, Math.PI * 2);
            ctx.stroke();
        } else if (theme.pattern === "diamonds") {
            ctx.fillStyle = index % 2 ? theme.detail : theme.accent;
            ctx.moveTo(x, y - 7);
            ctx.lineTo(x + 5, y);
            ctx.lineTo(x, y + 7);
            ctx.lineTo(x - 5, y);
            ctx.closePath();
            ctx.fill();
        }
    });
    ctx.restore();
}

// =====================================
// DRAW PHOTO STRIP
// =====================================

async function renderPhotoStrip() {
    if (!capturedPhotos.length) return;

    const photos = await Promise.all(
        capturedPhotos.map(src => {
            return new Promise(resolve => {
                const image = new Image();

                image.onload = () => resolve(image);
                image.src = src;
            });
        })
    );

    const frameColor = frameSelect.value;
    const theme = frameThemes[themeSelect.value] || frameThemes.classic;
    const sticker = stickerSelect.value;
    const filter = getFilter();

    const width = 420;
    const photoWidth = 360;
    const photoHeight = 270;

    const padding = 30;
    const gap = 18;
    const headerHeight = 80;
    const footerHeight = 95;

    const height =
        headerHeight +
        padding +
        (photos.length * photoHeight) +
        ((photos.length - 1) * gap) +
        padding +
        footerHeight;

    previewCanvas.width = width;
    previewCanvas.height = height;

    // FRAME BACKGROUND
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, width, height);
    drawThemeDetails(theme, width, height);

    // HEADER
    ctx.fillStyle = theme.accent;
    ctx.textAlign = "center";
    ctx.font = "bold 21px sans-serif";
    ctx.fillText("BLUECAPTURE", width / 2, 38);

    ctx.font = "11px sans-serif";
    ctx.fillText("YOUR LITTLE MOMENTS", width / 2, 59);

    // PHOTOS
    for (let i = 0; i < photos.length; i++) {
        const x = (width - photoWidth) / 2;
        const y = headerHeight + padding +
            i * (photoHeight + gap);

        ctx.save();

        ctx.filter = filter;

        ctx.drawImage(
            photos[i],
            x,
            y,
            photoWidth,
            photoHeight
        );

        ctx.restore();

        // PHOTO NUMBER
        ctx.fillStyle = "rgba(38,62,99,.75)";
        ctx.font = "bold 15px sans-serif";
        ctx.textAlign = "left";

        ctx.fillText(
            `0${i + 1}`,
            x + 10,
            y + photoHeight - 12
        );

        // STICKER
        if (sticker) {
            ctx.font = "35px sans-serif";
            ctx.textAlign = "right";

            ctx.fillText(
                sticker,
                x + photoWidth - 12,
                y + 42
            );
        }
    }

    // FOOTER
    ctx.fillStyle = theme.accent;
    ctx.textAlign = "center";
    ctx.font = "bold 14px sans-serif";

    ctx.fillText(
        "CAPTURED WITH LOVE ♡",
        width / 2,
        height - 52
    );

    ctx.font = "11px sans-serif";

    ctx.fillText(
        new Date().toLocaleDateString("id-ID"),
        width / 2,
        height - 30
    );
}

// =====================================
// EDITOR EVENTS
// =====================================

filterSelect.addEventListener("change", renderPhotoStrip);
frameSelect.addEventListener("change", renderPhotoStrip);
stickerSelect.addEventListener("change", renderPhotoStrip);
themeSelect.addEventListener("change", () => {
    frameSelect.value = frameThemes[themeSelect.value].color;
    renderPhotoStrip();
});

layoutSelect.addEventListener("change", renderPhotoStrip);

// =====================================
// DOWNLOAD PHOTO
// =====================================

downloadButton.addEventListener("click", () => {
    if (!capturedPhotos.length) {
        alert("Belum ada foto untuk diunduh.");
        return;
    }

    renderPhotoStrip().then(() => {
        const link = document.createElement("a");

        link.download = `BlueCapture-${Date.now()}.png`;
        link.href = previewCanvas.toDataURL("image/png");

        link.click();
    });
});

// =====================================
// RETAKE PHOTO
// =====================================

function resetPhotos() {
    if (isCapturing) return;

    capturedPhotos = [];

    renderCapturedPhotos();

    editorSection.classList.add("hidden");

    captureButton.innerHTML = `Start Capture <span class="button-icon">${iconMarkup("sparkle")}</span>`;
}

document.getElementById("retakeButton").addEventListener("click", () => {
    resetPhotos();

    capturedGrid.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
});

document.getElementById("restartButton").addEventListener("click", () => {
    resetPhotos();

    cameraSectionScroll();
});

function cameraSectionScroll() {
    document.getElementById("cameraSection").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

// INITIALIZATION
totalPhotos = Number(captureCountSelect.value);
renderCapturedPhotos();
