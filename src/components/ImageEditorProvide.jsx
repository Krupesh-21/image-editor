import PropTypes from "prop-types";
import { createContext, useCallback, useEffect, useRef, useState } from "react";
import useAddCanvasListner from "./useAddCanvasListner";

export const ImageEditorContext = createContext(null);

let animationId = null;

const ImageEditorProvide = ({ children }) => {
  const [image, setImage] = useState(null);
  const [oldImage, setOldImage] = useState(null);
  const [imageName, setImageName] = useState("");
  const [settings, setSettings] = useState({
    grayscale: 0,
    brightness: 100,
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
  const [isDragging, setIsDragging] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  const cropDimension = useRef({ startX: 0, startY: 0, endX: 0, endY: 0 });

  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const canvas = canvasRef.current;
  const ctx = ctxRef.current;

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

  const drawImage = useCallback(() => {
    const img = imageRef.current;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgWidth = img.width;
    const imgHeight = img.height;

    const scaleFactor = Math.min(
      canvasWidth / imgWidth,
      canvasHeight / imgHeight
    );
    const newWidth = imgWidth * scaleFactor;
    const newHeight = imgHeight * scaleFactor;

    const x = (canvasWidth - newWidth) / 2;
    const y = (canvasHeight - newHeight) / 2;

    ctx.drawImage(img, x, y, newWidth, newHeight);
  }, [canvas, ctx]);

  const drawCropBox = useCallback(
    (e) => {
      const width = e.pageX - canvas.offsetLeft - (cropRect?.startX || 0);
      const height = e.pageY - canvas.offsetTop - (cropRect?.startY || 0);

      const { startX, startY } = cropDimension.current;
      setCropRect((prev) => ({ ...prev, width, height }));
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, startY, width, height);

      cropDimension.current = {
        ...cropDimension.current,
        endX: e.offsetX,
        endY: e.offsetY,
        croppedWidth: width,
        croppedHeight: height,
      };
    },
    [canvas, cropRect, ctx]
  );

  const applySettings = useCallback(
    (drawRect = false, e) => {
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        // ctx.scale(settings.flipHorizontal, settings.flipVertical);
        // ctx.rotate((settings.rotate * Math.PI) / 180);
        ctx.filter = `brightness(${settings.brightness}%) saturate(${settings.saturation}%) invert(${settings.inversion}%) grayscale(${settings.grayscale}%)`;
        drawImage();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.filter = "none";

        ctx.canvas.style.boxShadow = "rgba(0, 0, 0, 0.15) 0px 2px 8px";
        ctx.canvas.style.backgroundColor = "white";

        if (drawRect && typeof drawRect === "boolean") drawCropBox(e);

        if (animationId) {
          cancelAnimationFrame(animationId);
        }

        if (!isDragging) {
          animationId = window.requestAnimationFrame(applySettings);
        }
        ctx.restore();
      }
    },
    [settings, isDragging, canvas, ctx, drawImage, drawCropBox]
  );

  const mouseDown = useCallback(
    (e) => {
      setIsDragging(true);
      const rect = canvas?.getBoundingClientRect();
      cropDimension.current = {
        ...cropDimension.current,
        startX: e.clientX - rect.left,
        startY: e.clientY - rect.top,
      };
      setCropRect((prev) => ({
        ...prev,
        startX: e.clientX - rect.left,
        startY: e.clientY - rect.top,
      }));
    },
    [canvas]
  );

  const mouseMove = useCallback(
    (e) => {
      if (isDragging) {
        applySettings(true, e);
      }
    },
    [isDragging, applySettings]
  );

  const mouseUp = useCallback(() => {
    setIsDragging(false);
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

  function createCropPreview() {
    const { startX, startY, endX, endY, croppedWidth, croppedHeight } =
      cropDimension.current || {};

    const sx = Math.min(startX, endX);
    const sy = Math.min(startY, endY);
    const dx = canvas.width / 2 - croppedWidth / 2;
    const dy = canvas.height / 2 - croppedHeight / 2;

    const data = ctx.getImageData(sx, sy, croppedWidth, croppedHeight);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(data, dx, dy);

    const dataUrl = canvas.toDataURL();
    if (dataUrl !== "data:,") {
      setImage(dataUrl);
      const img = document.createElement("img");
      img.src = dataUrl;
      imageRef.current = img;
    }
    setDisabledCropBtn(true);
    if (animationId) cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(applySettings);
  }

  const downloadImage = () => {
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
    if (img && oldImage && canvas) {
      canvas.width = 1000;
      canvas.height = 500;
      setCrop({ x: 0, y: 0, width: 0, height: 0 });
      img.src = oldImage;
      setImage(oldImage);
      drawImage();
      setSettings({
        grayscale: 0,
        brightness: 100,
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

      e.preventDefault();

      const translateX = e.clientX - canvas.offsetLeft;
      const translateY = e.clientY - canvas.offsetTop;
      const wheel = e.deltaY < 0 ? 1 : -1;

      const zoom = Math.exp(wheel * zoomStep);
      let _zoomScale = 1;
      _zoomScale = Math.min(zoomScale * zoom, 30);

      if (_zoomScale <= 1) {
        ctx.resetTransform();
        _zoomScale = 1;
        setZoomScale(_zoomScale);
        applySettings();
        return;
      }

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
      setTranslate((prev) => ({ ...prev, x: translateX, y: translateY }));
      setZoom(zoom);
      setZoomScale(_zoomScale);
      applySettings();
    },
    [applySettings, zoomScale, canvas, ctx]
  );

  useEffect(() => {
    if (canvas) applySettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, image]);

  useAddCanvasListner({
    canvas,
    mouseDown,
    mouseMove,
    mouseUp,
    handleZoomInAndOut,
  });

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
