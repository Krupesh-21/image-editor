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

  const isDragging = useRef(false);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const rectRef = useRef(cropRect);

  let zoomScale = 1;
  let zoom = 0;
  let translateX = 0,
    translateY = 0;

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
    const { width, height } =
      canvas?.parentElement?.getBoundingClientRect() || {};

    const ctx = canvas.getContext("2d");
    if (width || height) {
      ctx.canvas.width = width;
      ctx.canvas.height = height;
    }
    ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2);

    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let r, g, b, avg;

    for (let x = 0, len = data.length; x < len; x += 4) {
      r = data[x];
      g = data[x + 1];
      b = data[x + 2];
      // a = data[x + 3];

      // avg = 0.2126 * r + 0.7152 * g + 0.072 * b;
      avg = Math.floor((r + g + b) / 3);
      colorSum += avg;
      // alphaSum += a;
    }

    const brightness = Math.floor(colorSum / (canvas.height * canvas.width));

    return { brightness };
  };

  const applySettings = (drawRect = false, e) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    const { width, height } =
      canvas?.parentElement?.getBoundingClientRect() || {};
    if (width || height) {
      ctx.canvas.width = width;
      ctx.canvas.height = height;
    }

    if (canvas && ctx) {
      const { brightness } = getImageBrightness();
      if (!settings.brightness) {
        setSettings((prev) => ({
          ...prev,
          brightness,
        }));
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(settings.flipHorizontal, settings.flipVertical);
      ctx.rotate((settings.rotate * Math.PI) / 180);
      ctx.filter = `brightness(${
        settings.brightness || brightness
      }%) saturate(${settings.saturation}%) invert(${
        settings.inversion
      }%) grayscale(${settings.grayscale}%)`;
      ctx.drawImage(imageRef.current, -canvas.width / 2, -canvas.height / 2);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.filter = "none";

      if (typeof drawRect === "boolean" && drawRect) {
        const width =
          e.pageX - canvas.offsetLeft - (rectRef.current?.startX || 0);
        const height =
          e.pageY - canvas.offsetTop - (rectRef.current?.startY || 0);
        setCropRect((prev) => ({ ...prev, width, height }));
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          rectRef.current?.startX || 0,
          rectRef.current?.startY || 0,
          width,
          height
        );
      }
      if (animationId) {
        window.cancelAnimationFrame(animationId);
      }
      if (!isDragging.current) {
        animationId = window.requestAnimationFrame(() =>
          applySettings(drawRect, e)
        );
      }
      ctx.restore();
    }
  };

  const mouseDown = (e) => {
    isDragging.current = true;
    const rect = canvasRef.current.getBoundingClientRect();
    rectRef.current = {
      ...rectRef.current,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
    };
    setCropRect((prev) => ({
      ...prev,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
    }));
    window.cancelAnimationFrame(animationId);
  };

  const mouseMove = (e) => {
    if (isDragging.current && rectRef.current?.startX) {
      applySettings(true, e);
    }
  };

  const mouseUp = () => {
    isDragging.current = false;
    setDisabledCropBtn(false);
  };

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
    if (dataUrl !== "data:,") {
      setImage(dataUrl);
      const img = document.createElement("img");
      img.src = dataUrl;
      imageRef.current = img;
      setCrop({ x: 0, y: 0, width: 0, height: 0 });
    }
    setDisabledCropBtn(true);
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
    ctx.translate(translateX, translateY);
    ctx.scale(zoom, zoom);
    ctx.translate(-translateX, -translateY);
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
      ctx.drawImage(imageRef.current, -canvas.width / 2, -canvas.height / 2);
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

  const handleZoomInAndOut = (e) => {
    const zoomStep = 0.05;
    const canvas = canvasRef.current;

    e.preventDefault();

    translateX = e.clientX - canvas.offsetLeft;
    translateY = e.clientY - canvas.offsetTop;
    const wheel = e.deltaY < 0 ? 1 : -1;

    let zoom = Math.exp(wheel * zoomStep);
    zoomScale = Math.min(zoomScale * zoom, 30);

    if (zoomScale <= 1) {
      ctxRef.current.resetTransform();
      zoomScale = 1;
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
    applySettings();
  };

  useEffect(() => {
    if (canvasRef.current) applySettings();
  }, [settings]);

  useEffect(() => {
    if (image) {
      applySettings();
    }
  }, [image]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.addEventListener("mousedown", mouseDown, false);
      canvasRef.current.addEventListener("mousemove", mouseMove, false);
      canvasRef.current.addEventListener("mouseup", mouseUp, false);
      canvasRef.current.addEventListener("wheel", handleZoomInAndOut, true);
    }

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener("mousedown", mouseDown, false);
        canvasRef.current.removeEventListener("mousemove", mouseMove, false);
        canvasRef.current.removeEventListener("mouseup", mouseUp, false);
      }
    };
  }, [canvasRef.current, mouseDown, mouseMove, mouseUp]);

  useEffect(() => {
    window.addEventListener("resize", (e) => {
      const ctx = ctxRef.current;
      // const imagePreview = document.getElementById('image-preview')
      if (ctx) {
        applySettings(false, e);
      }
    });
  }, []);

  return (
    <ImageEditorContext.Provider
      value={{
        reset,
        downloadImage,
        image,
        setSettings,
        applyCrop,
        createCropPreview,
        getImageBrightness,
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
