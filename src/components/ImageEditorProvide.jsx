import PropTypes from "prop-types";
import { createContext, useCallback, useEffect, useRef, useState } from "react";

export const ImageEditorContext = createContext(null);

let animationId = null;

const ImageEditorProvide = ({ children }) => {
  const [image, setImage] = useState(null);
  const [oldImage, setOldImage] = useState(null);
  const [imageName, setImageName] = useState("");
  const [settings, setSettings] = useState({
    grayscale: 0,
    brightness: 0,
    saturation: 100,
    inversion: 0,
    rotate: 0,
    flipHorizontal: 1,
    flipVertical: 1,
  });
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [cropRect, setCropRect] = useState({});
  const [disabledCropBtn, setDisabledCropBtn] = useState(true);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0);

  const isDragging = useRef(false);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const zoomScale = useRef(1);
  // let zoom = 0;

  const handleDragEnter = (e) => {
    const dropZone = document.getElementById("drag-drop-container");
    e.preventDefault();
    if (dropZone) {
      dropZone.classList.add("highlight");
    }
  };

  const handleDragLeave = (e) => {
    const dropZone = document.getElementById("drag-drop-container");
    e.preventDefault();
    if (dropZone) dropZone.classList.remove("highlight");
  };

  const getImageBrightness = () => {
    const img = imageRef.current;
    if (!img) return null;

    // let alphaSum = 0;
    let colorSum = 0;

    const canvas = canvasRef.current;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let r, g, b, avg;

    for (let x = 0, len = data.length; x < len; x += 4) {
      r = data[x];
      g = data[x + 1];
      b = data[x + 2];
      // a = data[x + 3];

      avg = Math.floor((r + g + b) / 3);
      colorSum += avg;
      // alphaSum += a;
    }

    const brightness = Math.floor(colorSum / (canvas.height * canvas.width));

    return { brightness };
  };

  const applySettings = useCallback(
    (drawRect = false, e) => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;

      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(settings.flipHorizontal, settings.flipVertical);
        ctx.rotate((settings.rotate * Math.PI) / 180);
        ctx.filter = `brightness(${settings.brightness}%) saturate(${settings.saturation}%) invert(${settings.inversion}%) grayscale(${settings.grayscale}%)`;
        ctx.drawImage(imageRef.current, -canvas.width / 2, -canvas.height / 2);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.filter = "none";

        if (typeof drawRect === "boolean" && drawRect) {
          const width =
            e.pageX - canvasRef.current.offsetLeft - (cropRect?.startX || 0);
          const height =
            e.pageY - canvasRef.current.offsetTop - (cropRect?.startY || 0);
          setCropRect((prev) => ({ ...prev, width, height }));
          ctxRef.current.strokeStyle = "white";
          ctxRef.current.lineWidth = 2;
          ctxRef.current.strokeRect(
            cropRect?.startX || 0,
            cropRect?.startY || 0,
            width,
            height
          );
        }

        if (animationId) {
          cancelAnimationFrame(animationId);
        }

        if (!isDragging.current) {
          animationId = window.requestAnimationFrame(applySettings);
        }
        ctx.restore();
      }
    },
    [cropRect, settings]
  );

  const mouseDown = useCallback((e) => {
    isDragging.current = true;
    const rect = canvasRef.current.getBoundingClientRect();
    setCropRect((prev) => ({
      ...prev,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
    }));
  }, []);

  const mouseMove = useCallback(
    (e) => {
      if (isDragging.current) {
        applySettings(true, e);
      }
    },
    [applySettings]
  );

  const mouseUp = useCallback(() => {
    isDragging.current = false;
    setDisabledCropBtn(false);
  }, []);

  const cropSelectedArea = () => {
    createCropPreview(imageRef.current, true);
  };

  const displayFiles = (files) => {
    const file = files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      if (file) {
        const imagePreview = document.getElementById("image-preview");
        const oldCanvas = document.getElementById("canvas");
        const previewContainer = document.querySelector(
          ".image-preview-container"
        );
        if (oldCanvas) {
          oldCanvas.remove();
        }

        const canvas = document.createElement("canvas");
        canvas.id = "canvas";
        const ctx = canvas.getContext("2d");
        const img = document.createElement("img");
        img.src = e.target.result;
        img.id = "preview-image";
        canvas.width = 1000;
        canvas.height = 500;
        canvasRef.current = canvas;
        ctxRef.current = ctx;
        imageRef.current = img;
        if (previewContainer) previewContainer.style.display = "grid";
        if (imagePreview) {
          // imagePreview.appendChild(img);
          imagePreview.appendChild(canvas);
        }
        setOldImage(e.target.result);
        setImageName(file.name);
        setImage(e.target.result);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    const dropZone = document.getElementById("drag-drop-container");

    e.preventDefault();
    dropZone.classList.remove("highlight");

    const droppedFiles = e.dataTransfer.files;
    displayFiles(droppedFiles);
  };

  const handleSettings = useCallback(({ target: { value, name } }) => {
    setSettings((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleCropChange = ({ target: { value, name } }) => {
    setCrop((prev) => ({ ...prev, [name]: value.trim() ? Number(value) : 0 }));
  };

  function createCropPreview(img, isFromDrag = false) {
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    const canvas = canvasRef.current;

    const width = (isFromDrag ? cropRect.width : crop.width) * scaleX;
    const height = (isFromDrag ? cropRect.height : crop.height) * scaleY;

    canvas.width = Math.ceil(width);
    canvas.height = Math.ceil(height);

    const ctx = ctxRef.current;

    ctx.drawImage(
      img,
      (isFromDrag ? cropRect.startX : crop.x) * scaleX,
      (isFromDrag ? cropRect.startY : crop.y) * scaleY,
      width,
      height,
      0,
      0,
      canvas.width * scaleX,
      canvas.height * scaleY
    );

    const dataUrl = canvas.toDataURL();
    // const previewImage = document.getElementById("preview-image");
    if (dataUrl !== "data:,") {
      setImage(dataUrl);
      const img = document.createElement("img");
      img.src = dataUrl;
      imageRef.current = img;
      setCrop({ x: 0, y: 0, width: 0, height: 0 });
    }
    setDisabledCropBtn(true);
    if (animationId) cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(applySettings);
  }

  const downloadImage = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(settings.flipHorizontal, settings.flipVertical);
    ctx.rotate((settings.rotate * Math.PI) / 180);
    ctx.filter = `brightness(${settings.brightness}%) saturate(${settings.saturation}%) invert(${settings.inversion}%) grayscale(${settings.grayscale}%)`;
    ctx.drawImage(imageRef.current, -canvas.width / 2, -canvas.height / 2);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = "none";

    const trasnform = ctx.getTransform();
    ctx.resetTransform();
    ctx.translate(translate.x, translate.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-translate.x, -translate.y);
    ctx.transform(
      trasnform.a,
      trasnform.b,
      trasnform.c,
      trasnform.d,
      trasnform.e,
      trasnform.f
    );
    ctx.restore();

    const link = document.createElement("a");
    link.download = imageName;
    link.href = canvas.toDataURL();
    link.click();
  };

  const applyCrop = () => {
    const img = imageRef.current;
    if (image && img && (crop.width || crop.height)) {
      createCropPreview(img);
    }
  };

  const reset = () => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (img && oldImage && canvas) {
      canvas.width = 1000;
      canvas.height = 500;
      setCrop({ x: 0, y: 0, width: 0, height: 0 });
      img.src = oldImage;
      setImage(oldImage);
      const { brightness } = getImageBrightness();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.drawImage(
        imageRef.current,
        -canvas.width / 2,
        -canvas.height / 2,
        canvas.width,
        canvas.height
      );
      setSettings({
        grayscale: 0,
        brightness,
        saturation: 100,
        inversion: 0,
        rotate: 0,
        flipHorizontal: 1,
        flipVertical: 1,
      });
    }
  };

  const handleZoomInAndOut = useCallback(
    (e) => {
      const zoomStep = 0.02;
      const canvas = canvasRef.current;

      e.preventDefault();

      const translateX = e.clientX - canvas.offsetLeft;
      const translateY = e.clientY - canvas.offsetTop;
      const wheel = e.deltaY < 0 ? 1 : -1;

      const zoom = Math.exp(wheel * zoomStep);
      zoomScale.current = Math.min(zoomScale * zoom, 30);

      if (zoomScale.current <= 1) {
        ctxRef.current.resetTransform();
        zoomScale.current = 1;
        applySettings();
        return;
      }

      ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
      const trasnform = ctxRef.current.getTransform();
      ctxRef.current.resetTransform();
      ctxRef.current.translate(translateX, translateY);
      ctxRef.current.scale(zoom, zoom);
      ctxRef.current.translate(-translateX, -translateY);
      ctxRef.current.transform(
        trasnform.a,
        trasnform.b,
        trasnform.c,
        trasnform.d,
        trasnform.e,
        trasnform.f
      );
      setTranslate((prev) => ({ ...prev, x: translateX, y: translateY }));
      setZoom(zoom);
      applySettings();
    },
    [applySettings]
  );

  useEffect(() => {
    if (canvasRef.current) applySettings();
  }, [settings]);

  useEffect(() => {
    if (image) {
      setSettings((prev) => ({
        ...prev,
        ...getImageBrightness(),
      }));
    }
  }, [image]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener("mousedown", mouseDown, false);
      canvas.addEventListener("mousemove", mouseMove, false);
      canvas.addEventListener("mouseup", mouseUp, false);
      canvas.addEventListener("wheel", handleZoomInAndOut, true);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener("mousedown", mouseDown, false);
        canvas.removeEventListener("mousemove", mouseMove, false);
        canvas.removeEventListener("mouseup", mouseUp, false);
        canvas.removeEventListener("wheel", handleZoomInAndOut, true);
      }
    };
  }, [mouseDown, mouseMove, mouseUp, handleZoomInAndOut]);

  return (
    <ImageEditorContext.Provider
      value={{
        reset,
        downloadImage,
        image,
        setSettings,
        applyCrop,
        createCropPreview,
        handleCropChange,
        handleSettings,
        handleDragEnter,
        handleDragLeave,
        handleDrop,
        crop,
        settings,
        displayFiles,
        cropSelectedArea,
        disabledCropBtn,
      }}
    >
      {children}
    </ImageEditorContext.Provider>
  );
};

ImageEditorProvide.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
};

export default ImageEditorProvide;
