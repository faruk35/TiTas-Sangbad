/* script.js - fix for blob/data-url issue so uploaded image appears in downloaded image
   - uses FileReader.readAsDataURL for uploaded image (data: URI)
   - waits for all images to finish loading before running html2canvas
   - robust html2canvas loader
   - drag-handle behavior unchanged
*/

document.addEventListener("DOMContentLoaded", () => {
  /* DOM refs */
  const imageInput = document.getElementById("imageInput");
  const previewImage = document.getElementById("previewImage");
  const placeholderText = document.getElementById("placeholderText");
  const titleEl = document.getElementById("cardTitle");
  const titleInput = document.getElementById("titleInput");
  const titleColor = document.getElementById("titleColor");
  const incBtn = document.querySelector(".increase-font");
  const decBtn = document.querySelector(".decrease-font");
  const downloadBtn = document.getElementById("downloadBtn");
  const timerEl = document.getElementById("timerText");
  const cardEl = document.getElementById("cardToExport");
  const nav = document.getElementById("controls");
  const closeControls = document.getElementById("closeControls");
  const headerHandle = nav ? nav.querySelector(".controls-header") : null; // drag handle

  /********** IMAGE PREVIEW (use FileReader -> data URL) **********/
  if (imageInput && previewImage && placeholderText) {
    imageInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert("অনুগ্রহ করে একটি ইমেজ ফাইল বেছে নিন।");
        imageInput.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onerror = function () {
        alert("Image ফাইল পড়তে সমস্যা হয়েছে। অন্য একটি চেষ্টা করুন।");
        imageInput.value = "";
      };

      reader.onload = function (evt) {
        // evt.target.result is a data: URI (base64)
        previewImage.src = evt.target.result;
        // ensure displayed
        previewImage.style.display = "block";
        placeholderText.style.display = "none";

        // ensure image decoded completely (optional)
        previewImage.onload = () => {
          // nothing extra required; onload ensures decode finished
        };
      };

      reader.readAsDataURL(file);
    });

    // allow clicking input to re-select same file on some browsers
    imageInput.addEventListener("click", () => {
      imageInput.value = "";
    });
  }

  /********** BANGLA DATETIME (LIVE) **********/
  function getBanglaDateTime() {
    const engToBn = { "0":"০","1":"১","2":"২","3":"৩","4":"৪","5":"৫","6":"৬","7":"৭","8":"৮","9":"৯" };
    const months = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];
    const now = new Date();
    const day = now.getDate().toString();
    const month = months[now.getMonth()];
    const year = now.getFullYear().toString();
    let hour = now.getHours();
    let minute = now.getMinutes();
    let second = now.getSeconds();
    const ampm = hour >= 12 ? "pm" : "am";
    hour = hour % 12 || 12;
    function toBn(s){ return s.replace(/[0-9]/g, d => engToBn[d]); }
    return `${toBn(day)} ${month} ${toBn(year)} | ${toBn(String(hour).padStart(2,'0'))}:${toBn(String(minute).padStart(2,'0'))}:${toBn(String(second).padStart(2,'0'))} ${ampm}`;
  }

  if (timerEl) {
    timerEl.textContent = getBanglaDateTime();
    setInterval(() => { timerEl.textContent = getBanglaDateTime(); }, 1000);
  }

  /********** TITLE & COLOR BINDINGS **********/
  if (titleEl && titleInput) {
    titleInput.value = titleEl.textContent.trim();
    titleInput.addEventListener("input", (e) => {
      titleEl.textContent = e.target.value || " ";
    });
  }

  function rgbToHex(rgb){
    const m = (rgb || "").match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!m) return null;
    return "#" + [1,2,3].map(i => parseInt(m[i]).toString(16).padStart(2,'0')).join('');
  }
  if (titleColor && titleEl) {
    try {
      const cs = window.getComputedStyle(titleEl).color;
      const hex = rgbToHex(cs);
      if (hex) titleColor.value = hex;
    } catch(e){}
    titleColor.addEventListener("input", (e) => {
      titleEl.style.color = e.target.value;
    });
    titleColor.addEventListener("change", (e) => { titleEl.style.color = e.target.value; });
  }

  /********** FONT SIZE CONTROLS **********/
  let currentFont = 18;
  if (titleEl) {
    const fs = parseFloat(window.getComputedStyle(titleEl).fontSize);
    if (!isNaN(fs)) currentFont = fs;
  }
  if (incBtn) {
    incBtn.addEventListener("click", () => {
      currentFont += 2;
      if (titleEl) titleEl.style.fontSize = currentFont + "px";
    });
  }
  if (decBtn) {
    decBtn.addEventListener("click", () => {
      if (currentFont <= 10) return;
      currentFont -= 2;
      if (titleEl) titleEl.style.fontSize = currentFont + "px";
    });
  }

  /********** html2canvas loader helper **********/
  function loadHtml2Canvas() {
    return new Promise((resolve, reject) => {
      if (typeof html2canvas === "function") return resolve(html2canvas);
      if (window.html2canvas && typeof window.html2canvas === "function") return resolve(window.html2canvas);

      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      s.async = true;
      s.onload = () => {
        if (typeof html2canvas === "function") resolve(html2canvas);
        else if (window.html2canvas && typeof window.html2canvas === "function") resolve(window.html2canvas);
        else reject(new Error("html2canvas পাওয়া যায়নি"));
      };
      s.onerror = () => reject(new Error("html2canvas লোড করা যায়নি। ইন্টারনেট চেক করুন।"));
      document.head.appendChild(s);
    });
  }

  /********** Helper: ensure all images inside an element are loaded **********/
  function ensureImagesLoaded(container, timeout = 5000) {
    const imgs = Array.from(container.querySelectorAll("img"));
    return Promise.all(imgs.map(img => {
      return new Promise((resolve) => {
        // If data URL or already decoded
        if (img.complete && img.naturalWidth !== 0) return resolve();
        let done = false;
        const onLoad = () => { if (done) return; done = true; cleanup(); resolve(); };
        const onErr = () => { if (done) return; done = true; cleanup(); resolve(); };
        function cleanup() {
          img.removeEventListener("load", onLoad);
          img.removeEventListener("error", onErr);
        }
        img.addEventListener("load", onLoad);
        img.addEventListener("error", onErr);
        // safety: timeout per image
        setTimeout(() => { if (done) return; done = true; cleanup(); resolve(); }, timeout);
      });
    }));
  }

  /********** DOWNLOAD HANDLER **********/
  if (downloadBtn && cardEl) {
    downloadBtn.addEventListener("click", async () => {
      downloadBtn.disabled = true;
      const prevText = downloadBtn.textContent;
      downloadBtn.textContent = "Preparing...";

      try {
        // ensure images fully loaded (especially the uploaded data url)
        await ensureImagesLoaded(cardEl, 5000);

        const runner = await loadHtml2Canvas();
        const used = (typeof runner === "function") ? runner : (window.html2canvas || html2canvas);
        if (typeof used !== "function") throw new Error("html2canvas রানটাইম পাওয়া যায়নি");

        // render with reasonable scale for crispness
        const scale = Math.min(4, Math.max(1, window.devicePixelRatio || 1));
        const canvas = await used(cardEl, { scale, useCORS: false, allowTaint: true });

        const link = document.createElement("a");
        link.download = `news-card-${Date.now()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch (err) {
        console.error(err);
        alert("Download ব্যর্থ: " + (err && err.message ? err.message : "Unknown error"));
      } finally {
        downloadBtn.disabled = false;
        downloadBtn.textContent = prevText || "Download the Image";
      }
    });
  }

  /********** DRAGGABLE NAVIGATION (ONLY FROM HEADER) **********/
  (function makeDraggableWithHandle(container, handle) {
    if (!container || !handle) return;

    let active = false;
    let startX = 0, startY = 0, origLeft = 0, origTop = 0, pointerId = null;
    handle.addEventListener("pointerdown", (e) => {
      // Ignore clicks on buttons inside header (like close)
      if (e.target.closest("button")) return;
      active = true;
      pointerId = e.pointerId;
      handle.setPointerCapture(pointerId);
      startX = e.clientX; startY = e.clientY;
      const rect = container.getBoundingClientRect();
      origLeft = rect.left + window.scrollX;
      origTop = rect.top + window.scrollY;
      container.style.transition = "none";
      container.style.cursor = "grabbing";
    });
    window.addEventListener("pointermove", (e) => {
      if (!active) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      container.style.position = "absolute";
      container.style.left = (origLeft + dx) + "px";
      container.style.top = (origTop + dy) + "px";
      container.style.transform = "translate(0,0)";
    });
    window.addEventListener("pointerup", (e) => {
      if (!active) return;
      active = false;
      try { handle.releasePointerCapture(pointerId); } catch (err) {}
      container.style.cursor = "grab";
      container.style.transition = "";
    });
  })(nav, headerHandle);

  if (closeControls) {
    closeControls.addEventListener("click", () => {
      if (!nav) return;
      nav.style.display = "none";
    });
  }

}); // DOMContentLoaded end
