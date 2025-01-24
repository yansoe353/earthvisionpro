<script setup>
import { Loader } from './components/loader';
import debounce from "lodash/debounce";
import { KEY_TOKEN, SECRET_TOKEN, DESCRIPTION_TOKEN, STYLE_TOKEN, styles } from './core/constants';
</script>

<template>
  <div class="container-fluid h-100">
    <div class="row h-100">
      <!-- Form Section -->
      <div class="col-12 col-lg-4 col-xl-3 p-3">
        <form class="h-100 d-flex flex-column">
          <!-- API Settings -->
          <details v-bind:open="isAPISettingsOpened">
            <summary class="mb-2">API Settings</summary>
            <div class="row mb-3">
              <div class="col-12">
                <a class="icon-link" title="Step-by-step guide on API key management"
                  href="https://fusionbrain.ai/docs/doc/poshagovaya-instrukciya-po-upravleniu-api-kluchami/"
                  target="_blank">
                  How to create keys
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                    class="bi bi-box-arrow-up-right" viewBox="0 0 16 16">
                    <path fill-rule="evenodd"
                      d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5" />
                    <path fill-rule="evenodd"
                      d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z" />
                  </svg>
                </a>
              </div>
            </div>
            <div class="row mb-3 form-floating">
              <input class="form-control" placeholder="key" id="keyControl" v-model="key" type="password"
                autocomplete="off">
              <label for="keyControl">Key</label>
            </div>
            <div class="row mb-3 form-floating">
              <input class="form-control" placeholder="secret" id="secretControl" v-model="secret" type="password"
                autocomplete="off">
              <label for="secretControl">Secret</label>
            </div>
            <div class="row mb-2">
              <div class="col-12 d-flex justify-content-between">
                <button type="button" class="btn btn-danger" v-bind:disabled="!(key && secret)" @click="saveKeys">Save
                  to Local Storage</button>
                <button type="button" class="btn btn-primary" v-if="hasStoredKeys" @click="clearKeys">Clear Keys</button>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-12 form-text">
                You don't have to store the keys.
              </div>
            </div>
          </details>

          <!-- Translation Toggle -->
          <div class="row mb-3">
            <div class="col-12 form-check">
              <input class="form-check-input" type="checkbox" id="translateToggle" v-model="enableTranslation">
              <label class="form-check-label" for="translateToggle">
                Translate prompt to English
              </label>
            </div>
          </div>

          <!-- Aspect Ratio Selection -->
          <div class="row mb-3">
            <label class="col-12 col-form-label">Aspect Ratio:</label>
            <div class="col-12">
              <select class="form-select" v-model="aspectRatio">
                <option v-for="ratio in aspectRatios" :key="ratio.value" :value="ratio.value">
                  {{ ratio.label }}
                </option>
              </select>
            </div>
          </div>

          <!-- Style Selection -->
          <div class="row mb-3">
            <label class="col-12 col-form-label">Style:</label>
            <div class="col-12">
              <div class="form-check" v-for="s in styles">
                <input class="form-check-input" type="radio" :value="s" v-model="style" v-bind:id="'style_' + s">
                <label class="form-check-label" v-bind:for="'style_' + s">
                  {{ s }}
                </label>
              </div>
            </div>
          </div>

          <!-- Description Input -->
          <div class="row mb-3 form-floating flex-grow-1">
            <textarea class="form-control h-100" placeholder="Description" v-model="description" id="description"
              @keyup.ctrl.enter="submit"></textarea>
            <label for="description">Description</label>
          </div>

          <!-- Buttons -->
          <div class="row mb-3">
            <div class="col-12 d-grid gap-2">
              <button type="button" class="btn btn-success" v-on:click="submit" v-bind:disabled="isLoading">Generate</button>
              <button type="button" class="btn btn-info" v-on:click="copyImageToClipboard"
                v-bind:disabled="isLoading || !image">
                {{ isCopyToClipboardSuccessfully ? 'Copied!' : 'Copy to Clipboard' }}
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- Canvas Section -->
      <div class="col-12 col-lg-8 col-xl-9 p-3">
        <div class="d-flex justify-content-center align-items-center h-100">
          <canvas class="border border-secondary-subtle" v-bind:width="canvasWidth" v-bind:height="canvasHeight"
            ref="canvas"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const totalAttempts = 30;
export default {
  data() {
    return {
      isLoading: false,
      status: "None",
      description: "",
      styles: [
        "UHD",
        "KANDINSKY",
        "DEFAULT",
        "ANIME"
      ],
      style: undefined,
      key: "",
      secret: "",
      isAPISettingsOpened: true,
      isCopyToClipboardSuccessfully: false,
      hasStoredKeys: false,
      canvasHeight: 512,
      canvasWidth: 512,
      image: null,
      aspectRatio: "1:1", // Default aspect ratio
      aspectRatios: [
        { value: "1:1", label: "1:1 (Square)", width: 1024, height: 1024 },
        { value: "2:3", label: "2:3 (Portrait)", width: 832, height: 1248 },
        { value: "3:2", label: "3:2 (Landscape)", width: 1248, height: 832 },
        { value: "9:16", label: "9:16 (Vertical)", width: 576, height: 1024 },
        { value: "16:9", label: "16:9 (Horizontal)", width: 1024, height: 576 },
      ],
      enableTranslation: true, // Enable translation by default
    };
  },
  computed: {
    canvas: function () {
      return this.$refs.canvas;
    },
    selectedAspectRatio() {
      return this.aspectRatios.find((ratio) => ratio.value === this.aspectRatio);
    },
  },
  watch: {
    aspectRatio() {
      this.updateCanvasSize();
    },
  },
  mounted() {
    this.loader = new Loader(this.canvas, totalAttempts);
    this.description = localStorage.getItem(DESCRIPTION_TOKEN) ?? "";
    this.style = localStorage.getItem(STYLE_TOKEN) ?? this.styles[0];
    this.key = localStorage.getItem(KEY_TOKEN) ?? "";
    this.secret = localStorage.getItem(SECRET_TOKEN) ?? "";
    this.isAPISettingsOpened = !(this.key || this.secret);
    this.updateHasStoredKeys();
    window.addEventListener("resize", this.handleResize);
    this.handleResize();
  },
  methods: {
    beforeDestroy() {
      window.removeEventListener("resize", this.handleResize);
    },
    handleResize: function () {
      const maxCanvasWidth = Math.min(window.innerWidth * 0.9, 800); // Limit canvas width to 90% of screen width or 800px
      const aspectRatio = this.selectedAspectRatio;
      const newWidth = Math.min(maxCanvasWidth, aspectRatio.width);
      const newHeight = (newWidth / aspectRatio.width) * aspectRatio.height;

      this.canvasWidth = newWidth;
      this.canvasHeight = newHeight;

      if (this.image) {
        debounce(() => this.drawImage(this.image), 100)();
      }
    },
    setLoading(value) {
      this.isLoading = value;
      value
        ? this.loader.showLoading()
        : this.loader.hideLoading();
    },
    saveKeys() {
      localStorage.setItem(KEY_TOKEN, this.key);
      localStorage.setItem(SECRET_TOKEN, this.secret);
      this.updateHasStoredKeys();
    },
    clearKeys() {
      localStorage.removeItem(KEY_TOKEN);
      localStorage.removeItem(SECRET_TOKEN);
      this.key = "";
      this.secret = "";
      this.updateHasStoredKeys();
    },
    updateHasStoredKeys() {
      this.hasStoredKeys = !!(this.key || this.secret);
    },
    getAccessHeaders() {
      return {
        "X-Key": `Key ${this.key}`,
        "X-Secret": `Secret ${this.secret}`,
      };
    },
    async translateToEnglish(text) {
      const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        return data[0][0][0]; // Return translated text
      } catch (error) {
        console.error("Translation failed:", error);
        throw new Error("Translation failed.");
      }
    },
    async submit() {
      if (this.isLoading) {
        return;
      }
      this.image = null;
      localStorage.setItem(DESCRIPTION_TOKEN, this.description);
      localStorage.setItem(STYLE_TOKEN, this.style);
      this.setLoading(true);

      try {
        let prompt = this.description;

        // Translate the description if translation is enabled
        if (this.enableTranslation) {
          try {
            prompt = await this.translateToEnglish(this.description);
            console.log("Translated Description:", prompt);
          } catch (translationError) {
            console.error("Translation failed, using original prompt:", translationError);
            alert("Translation failed. Using the original prompt.");
          }
        }

        const { width, height } = this.selectedAspectRatio;
        const uuid = await this.getImageUUID(prompt, this.style, width, height);
        const images = await this.checkImageStatus(uuid);

        if (images) {
          this.image = await this.loadImage(images[0]);
          this.drawImage(this.image);
        }
      } catch (error) {
        console.error("Error during submission:", error);
        this.status = "ERROR";
        alert("An error occurred. Please try again.");
      } finally {
        this.setLoading(false);
      }
    },
    async getImageUUID(query, style, width, height) {
      const form = new FormData();
      form.append("model_id", "4");
      form.append("params", new Blob([JSON.stringify({
        "type": "GENERATE",
        "style": style,
        "width": width,
        "height": height,
        "num_images": 1,
        "negativePromptUnclip": "яркие цвета, кислотность, высокая контрастность",
        "generateParams": {
          "query": query,
        }
      })], { type: 'application/json' }));
      const imageReq = await fetch("https://api-key.fusionbrain.ai/key/api/v1/text2image/run", {
        method: "POST",
        body: form,
        headers: this.getAccessHeaders(),
      });
      const imageReqResult = await imageReq.json();

      this.status = imageReqResult?.status;

      return imageReqResult.uuid;
    },
    async checkImageStatus(uuid, attempts = totalAttempts, delay = 3000) {
      while (attempts > 0) {
        this.loader.setAttempt(totalAttempts - attempts + 1);
        const req = await fetch(`https://api-key.fusionbrain.ai/key/api/v1/text2image/status/${uuid}`, {
          method: "GET",
          headers: this.getAccessHeaders(),
        });

        const data = await req.json();
        this.status = data.status;;
        if (data.status == 'DONE') {
          return data.images;
        }

        attempts -= 1;

        await new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, delay);
        })
      }

      this.status = "ERROR";
    },
    async loadImage(base64Image) {
      return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
          resolve(image);
        };
        image.src = `data:image/png;base64, ${base64Image}`;
      })
    },
    drawImage(image) {
      const ctx = this.canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, image.width, image.height,
        0, 0, this.canvas.scrollWidth, this.canvas.scrollHeight);
    },
    async copyImageToClipboard() {
      try {
        const blob = await new Promise((resolve) => {
          const canvas = document.createElement("canvas");
          canvas.width = this.image.width;
          canvas.height = this.image.height;
          const context = canvas.getContext("2d");
          context.drawImage(this.image, 0, 0);

          canvas.toBlob(blob => {
            resolve(blob);
          })
        });

        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob,
          }),
        ]);
        this.copyImageToClipboardSuccess();
      } catch (error) {
        console.error(error);
      }
    },
    copyImageToClipboardSuccess() {
      this.isCopyToClipboardSuccessfully = true;
      setTimeout(() => {
        this.isCopyToClipboardSuccessfully = false;
      }, 2000);
    },
    updateCanvasSize() {
      const { width, height } = this.selectedAspectRatio;
      this.canvasWidth = width;
      this.canvasHeight = height;
      if (this.image) {
        this.drawImage(this.image);
      }
    },
  },
}
</script>

<style scoped>
/* Ensure form and canvas are stacked vertically on mobile */
@media (max-width: 768px) {
  .col-12 {
    padding: 0;
  }

  .form-control, .form-select, .btn {
    font-size: 1rem; /* Adjust font size for mobile */
  }

  .btn {
    padding: 0.5rem 1rem; /* Adjust button padding for mobile */
  }

  canvas {
    max-width: 100%; /* Ensure canvas does not overflow on mobile */
  }
}
</style>
