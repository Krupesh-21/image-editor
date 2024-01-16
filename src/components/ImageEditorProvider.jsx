import PropTypes from "prop-types";
import { createContext, useCallback, useEffect, useRef, useState } from "react";
import useAddCanvasListner from "./useAddCanvasListner";

export const ImageEditorContext = createContext(null);

let animationId = null;
let timeout = null;

const ImageEditorProvide = ({ children }) => {
  const [image, setImage] = useState(null);
  const [oldImage, setOldImage] = useState(null);
  const [imageName, setImageName] = useState("");
  const [settings, setSettings] = useState({
    grayscale: 0,
    brightness: 100,
    saturation: 0,
    inversion: 0,
    rotate: 0,
    flipHorizontal: 1,
    flipVertical: 1,
    exposure: 0,
    contrast: 0,
  });
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [cropRect, setCropRect] = useState({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  });
  const [disabledCropBtn, setDisabledCropBtn] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [cropBox, setCropBox] = useState(false);
  const [isImageDragging, setIsImageDragging] = useState(false);
  const [currentCoordinates, setCurrentCoordinates] = useState({ x: 0, y: 0 });

  const cropDimension = useRef({ startX: 100, startY: 100, endX: 0, endY: 0 });

  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const oldImageData = useRef(null);

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

  const drawImage = useCallback(
    (x, y, isDragging) => {
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

      x = isDragging ? x - newWidth / 2 : (canvasWidth - newWidth) / 2;
      y = isDragging ? y - newHeight / 2 : (canvasHeight - newHeight) / 2;

      ctx.drawImage(
        img,
        x * settings.flipHorizontal,
        y * settings.flipVertical,
        newWidth * settings.flipHorizontal,
        newHeight * settings.flipVertical
      );
      setCurrentCoordinates({ x, y, width: newWidth, height: newHeight });

      const imgData = ctx.getImageData(x, y, newWidth, newHeight);
      oldImageData.current = new ImageData(
        new Uint8ClampedArray(imgData.data),
        imgData.width,
        imgData.height
      );
      // if (!oldImageData.current) {
      // }
    },
    [canvas, ctx, settings]
  );

  const drawCropBox = useCallback(
    (e) => {
      const width = e
        ? e.pageX - canvas.offsetLeft - (cropRect?.startX || 0)
        : 150;
      const height = e
        ? e.pageY - canvas.offsetTop - (cropRect?.startY || 0)
        : 150;

      const { startX, startY } = cropDimension.current;

      const x = e ? startX : canvas.width / 2 - 150 / 2;
      const y = e ? startY : canvas.height / 2 - 150 / 2;

      setCropRect((prev) => ({
        ...prev,
        width,
        height,
        startX: x,
        startY: y,
        endX: e ? prev.endX : x,
        endY: e ? prev.endY : y,
      }));
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, startY, width, height);

      cropDimension.current = {
        ...cropDimension.current,
        endX: e ? e.offsetX : x,
        endY: e ? e.offsetY : y,
        croppedWidth: width,
        croppedHeight: height,
        startX: x,
        startY: y,
      };

      if (cropBox) {
        setDisabledCropBtn(false);
      }
    },
    [canvas, cropRect, ctx, cropBox]
  );

  const adjustBrightness = () => {
    if (!oldImageData.current || !currentCoordinates.width) return;

    const imgData = ctx.getImageData(
      currentCoordinates.x,
      currentCoordinates.y,
      currentCoordinates.width,
      currentCoordinates.height
    );

    const data = imgData.data;
    const originalData = oldImageData.current.data;

    const brightness = Number(settings.brightness) - 100;

    for (let i = 0; i < data.length; i += 4) {
      let r = originalData[i];
      let g = originalData[i + 1];
      let b = originalData[i + 2];

      r += Number(brightness);
      g += Number(brightness);
      b += Number(brightness);

      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));

      // Update the pixel values
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    ctx.clearRect(
      currentCoordinates.x,
      currentCoordinates.y,
      canvas.width,
      canvas.height
    );

    ctx.putImageData(imgData, currentCoordinates.x, currentCoordinates.y);
    const dataUrl = canvas.toDataURL();
    const img = document.createElement("img");
    img.src = dataUrl;
    setImage(dataUrl);
    imageRef.current = img;
  };

  // const adjustGrayscale = () => {
  //   if (Number(settings.grayscale) < 1) return;

  //   const imageData = new ImageData(
  //     oldImageData.current.width,
  //     oldImageData.current.height
  //   );
  //   imageData.data.set(oldImageData.current.data);
  //   const data = imageData.data;

  //   const gs = Number(settings.grayscale) / 100;

  //   for (let i = 0; i < data.length; i += 4) {
  //     const grayscale = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;

  //     const adjustedGrayscale = grayscale * gs;

  //     data[i] = adjustedGrayscale;
  //     data[i + 1] = adjustedGrayscale;
  //     data[i + 1] = adjustedGrayscale;
  //   }

  //   ctx.clearRect(
  //     currentCoordinates.x,
  //     currentCoordinates.y,
  //     canvas.width,
  //     canvas.height
  //   );
  //   ctx.putImageData(imageData, currentCoordinates.x, currentCoordinates.y);
  //   const dataUrl = canvas.toDataURL();
  //   const img = document.createElement("img");
  //   img.src = dataUrl;
  //   setImage(dataUrl);
  //   imageRef.current = img;
  // };

  const adjustSaturation = () => {
    if (Number(settings.saturation) < 1) return;

    const imageData = oldImageData.current;
    const data = imageData.data;

    const saturation = Number(settings.saturation) / 100;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const grayscale = (r + g + b) / 3;

      data[i] = (r - grayscale) * saturation + grayscale;
      data[i + 1] = (g - grayscale) * saturation + grayscale;
      data[i + 2] = (b - grayscale) * saturation + grayscale;
    }

    ctx.clearRect(
      currentCoordinates.x,
      currentCoordinates.y,
      canvas.width,
      canvas.height
    );
    ctx.putImageData(imageData, currentCoordinates.x, currentCoordinates.y);
    const dataUrl = canvas.toDataURL();
    const img = document.createElement("img");
    img.src = dataUrl;
    setImage(dataUrl);
    imageRef.current = img;
  };

  // const adjustInversion = () => {
  //   if (Number(settings.inversion) < 0 || currentCoordinates.width == null)
  //     return;

  //   const imgData = ctx.getImageData(
  //     currentCoordinates.x,
  //     currentCoordinates.y,
  //     currentCoordinates.width,
  //     currentCoordinates.height
  //   );

  //   const data = imgData.data;
  //   const originalData = oldImageData.current;

  //   const inversion = Number(settings.inversion) / 100;

  //   for (let i = 0; i < data.length; i += 4) {
  //     // Calculate the inverted color value for each channel
  //     data[i] = originalData.data[i] * inversion + data[i] * (1 - inversion);
  //     data[i + 1] =
  //       originalData.data[i + 1] * inversion + data[i + 1] * (1 - inversion);
  //     data[i + 2] =
  //       originalData.data[i + 2] * inversion + data[i + 2] * (1 - inversion);
  //   }

  //   ctx.clearRect(
  //     currentCoordinates.x,
  //     currentCoordinates.y,
  //     canvas.width,
  //     canvas.height
  //   );
  //   ctx.putImageData(imgData, currentCoordinates.x, currentCoordinates.y);
  //   const dataUrl = canvas.toDataURL();
  //   const img = document.createElement("img");
  //   img.src = dataUrl;
  //   setImage(dataUrl);
  //   imageRef.current = img;
  // };

  const adjustExposure = () => {
    if (currentCoordinates.width == null) return;
    const imgData = ctx.getImageData(
      currentCoordinates.x,
      currentCoordinates.y,
      currentCoordinates.width,
      currentCoordinates.height
    );

    const data = imgData.data;
    const factor = Math.pow(2, Number(settings.exposure) / 100);

    for (let i = 0; i < data.length; i += 4) {
      // Adjust each channel individually
      data[i] = Math.min(255, data[i] * factor); // Red channel
      data[i + 1] = Math.min(255, data[i + 1] * factor); // Green channel
      data[i + 2] = Math.min(255, data[i + 2] * factor); // Blue channel
    }

    ctx.clearRect(
      currentCoordinates.x,
      currentCoordinates.y,
      canvas.width,
      canvas.height
    );
    ctx.putImageData(imgData, currentCoordinates.x, currentCoordinates.y);
    const dataUrl = canvas.toDataURL();
    const img = document.createElement("img");
    img.src = dataUrl;
    setImage(dataUrl);
    imageRef.current = img;
  };

  const adjustContrast = () => {
    if (Number(settings.contrast) < 1 || currentCoordinates.width == null)
      return;

    const imgData = ctx.getImageData(
      currentCoordinates.x,
      currentCoordinates.y,
      currentCoordinates.width,
      currentCoordinates.height
    );

    const data = imgData.data;
    const contrast = (Number(settings.contrast) + 255) / 255;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.round((data[i] - 128) * contrast + 128); // Red channel
      data[i + 1] = Math.round((data[i + 1] - 128) * contrast + 128); // Green channel
      data[i + 2] = Math.round((data[i + 2] - 128) * contrast + 128); // Blue channel
    }

    ctx.clearRect(
      currentCoordinates.x,
      currentCoordinates.y,
      canvas.width,
      canvas.height
    );
    ctx.putImageData(imgData, currentCoordinates.x, currentCoordinates.y);
    const dataUrl = canvas.toDataURL();
    const img = document.createElement("img");
    img.src = dataUrl;
    setImage(dataUrl);
    imageRef.current = img;
  };

  const applySettings = useCallback(
    (drawRect = false, e, isImageDragging = false) => {
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(settings.flipHorizontal, settings.flipVertical);
        // ctx.rotate((settings.rotate * Math.PI) / 180);
        ctx.filter = `invert(${settings.inversion}%) grayscale(${settings.grayscale}%)`;
        const x = e ? e.pageX - canvas.offsetLeft : currentCoordinates.x;
        const y = e ? e.pageY - canvas.offsetTop : currentCoordinates.y;
        drawImage(x, y, isImageDragging);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        // ctx.filter = "none";

        ctx.canvas.style.boxShadow = "rgba(0, 0, 0, 0.15) 0px 2px 8px";
        ctx.canvas.style.backgroundColor = "white";

        if ((drawRect && typeof drawRect === "boolean") || cropBox)
          drawCropBox(e, x, y, isImageDragging);
        if (animationId) {
          cancelAnimationFrame(animationId);
        }

        if (!isDragging && !isImageDragging) {
          animationId = window.requestAnimationFrame(applySettings);
        }
        ctx.restore();
      }
    },
    [
      settings,
      isDragging,
      canvas,
      ctx,
      drawImage,
      drawCropBox,
      cropBox,
      currentCoordinates,
    ]
  );

  const mouseDown = useCallback(
    (e) => {
      const mouseX = e.pageX - canvas.offsetLeft;
      const mouseY = e.pageY - canvas.offsetTop;
      const { x, y } = currentCoordinates;
      const img = imageRef.current;
      if (
        mouseX >= x - img.width / 2 &&
        mouseX <= x + img.width / 2 &&
        mouseY >= y - img.height / 2 &&
        mouseY <= y + img.height / 2 &&
        !cropBox
      ) {
        setIsImageDragging(true);
      } else if (cropBox) {
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
          endX: cropBox ? 0 : prev.endX,
          endY: cropBox ? 0 : prev.endY,
        }));
      }
      setCropBox(false);
    },
    [canvas, cropBox, currentCoordinates]
  );

  const mouseMove = useCallback(
    (e) => {
      if (isDragging || isImageDragging) {
        applySettings(isDragging, e, !isDragging && isImageDragging);
        if (!isDragging && isImageDragging) canvas.style.cursor = "move";
        else canvas.style.cursor = "default";
      }
    },
    [isDragging, applySettings, isImageDragging, canvas]
  );

  const mouseUp = useCallback(() => {
    if (isDragging && !isImageDragging) {
      setIsDragging(false);
      setDisabledCropBtn(false);
    } else {
      setIsImageDragging(false);
    }
  }, [isDragging, isImageDragging]);

  const mouseOver = useCallback(
    (e) => {
      const mouseX = e.pageX - canvas.offsetLeft;
      const mouseY = e.pageY - canvas.offsetTop;
      const { x, y } = currentCoordinates;
      const img = imageRef.current;
      if (
        mouseX >= x - img.width / 2 &&
        mouseX <= x + img.width / 2 &&
        mouseY >= y - img.height / 2 &&
        mouseY <= y + img.height / 2 &&
        !cropBox
      ) {
        canvas.style.cursor = "move";
      } else {
        canvas.style.cursor = "default";
      }
    },
    [canvas, cropBox, currentCoordinates]
  );

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
        if (previewContainer) previewContainer.style.display = "grid";

        const { width, height } = imagePreview.getBoundingClientRect();

        canvas.width = width;
        canvas.height = height;

        canvasRef.current = canvas;
        ctxRef.current = ctx;
        imageRef.current = img;

        if (imagePreview) {
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
    setCurrentCoordinates({
      x: sx,
      y: sy,
      width: croppedWidth,
      height: croppedHeight,
    });
    if (cropBox) {
      toggleCropBox();
    }
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
      setCrop({ x: 0, y: 0, width: 0, height: 0 });
      img.src = oldImage;
      setImage(oldImage);
      drawImage();
      setSettings({
        grayscale: 0,
        brightness: 100,
        saturation: 0,
        inversion: 0,
        rotate: 0,
        flipHorizontal: 1,
        flipVertical: 1,
        exposure: 0,
        contrast: 0,
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
      setZoomScale(_zoomScale);
      applySettings();
    },
    [applySettings, zoomScale, canvas, ctx]
  );

  const toggleCropBox = useCallback(() => {
    setCropBox((prev) => !prev);
  }, []);

  useEffect(() => {
    if (canvas) applySettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, image, cropBox]);

  useEffect(() => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }

    timeout = setTimeout(() => {
      adjustBrightness();
      // adjustGrayscale();
      // adjustInversion();
      adjustSaturation();
      adjustExposure();
      adjustContrast();
    }, 500);
  }, [settings]);

  useEffect(() => {
    const cropImageBtn = document.getElementById("crop-box-btn");
    window.addEventListener("click", (e) => {
      e.stopPropagation();
      if (canvas) {
        const hasClickedOutside =
          !canvas?.contains(e.target) && !cropImageBtn.contains(e.target);
        if (hasClickedOutside && cropBox) {
          setCropBox(false);
          setDisabledCropBtn(true);
          cropDimension.current = {
            startX: 100,
            startY: 100,
            endX: 0,
            endY: 0,
          };
        }
      }
    });

    return () => {
      window.removeEventListener("click", (e) => {
        e.stopPropagation();
        if (canvas) {
          const hasClickedOutside =
            !canvas?.contains(e.target) && !cropImageBtn.contains(e.target);
          if (hasClickedOutside && cropBox) {
            setCropBox(false);
            setDisabledCropBtn(true);
            cropDimension.current = {
              startX: 100,
              startY: 100,
              endX: 0,
              endY: 0,
            };
          }
        }
      });
    };
  }, [canvas, cropBox]);

  useAddCanvasListner({
    canvas,
    mouseDown,
    mouseMove,
    mouseUp,
    mouseOver,
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
        toggleCropBox,
        cropBox,
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
