import PropTypes from "prop-types";
import { createContext, useCallback, useEffect, useRef, useState } from "react";
import useAddCanvasListner from "./useAddCanvasListner";

export const ImageEditorContext = createContext(null);

const ImageEditorProvide = ({ children }) => {
  const [image, setImage] = useState(null);
  const [oldImage, setOldImage] = useState(null);
  const [imageName, setImageName] = useState("");
  const [settings, setSettings] = useState({
    grayscale: 0,
    brightness: 0,
    saturation: 0,
    inversion: 0,
    exposure: 0,
    contrast: 0,
  });
  const [flipRotate, setFlipRotate] = useState({
    rotate: 0,
    flipHorizontal: 1,
    flipVertical: 1,
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

  const putImageData = useCallback(
    (imageData) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.putImageData(imageData, currentCoordinates.x, currentCoordinates.y);
    },
    [canvas, ctx, currentCoordinates]
  );

  const adjustBrightness = useCallback(
    (value, imageData) =>
      new Promise((resolve) => {
        if (currentCoordinates.width != null) {
          const data = imageData.data;

          const brightness = Math.round((Number(value) / 100) * 255);
          for (let i = 0; i < data.length; i += 4) {
            data[i] = data[i] + brightness;
            data[i + 1] = data[i + 1] + brightness;
            data[i + 2] = data[i + 2] + brightness;
          }
        }
        resolve(imageData);
      }),
    [currentCoordinates]
  );

  const adjustGrayscale = useCallback(
    (value, imageData) =>
      new Promise((resolve) => {
        if (currentCoordinates.width != null) {
          const data = imageData.data;

          const gs = (1 + Number(value) / 100) * 3;

          for (let i = 0; i < data.length; i += 4) {
            const red = data[i];
            const green = data[i + 1];
            const blue = data[i + 2];
            const gray = (red + green + blue) / gs;

            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          }
        }

        resolve(imageData);
      }),
    [currentCoordinates]
  );

  const adjustSaturation = useCallback(
    (value, imageData) =>
      new Promise((resolve) => {
        if (currentCoordinates.width != null) {
          const d = imageData.data;

          value = Number(value) / 100;

          for (var i = 0; i < d.length; i += 4) {
            var r = d[i];
            var g = d[i + 1];
            var b = d[i + 2];
            var gray = 0.2989 * r + 0.587 * g + 0.114 * b; //weights from CCIR 601 spec
            d[i] = -gray * value + d[i] * (1 + value);
            d[i + 1] = -gray * value + d[i + 1] * (1 + value);
            d[i + 2] = -gray * value + d[i + 2] * (1 + value);
            //normalize over- and under-saturated values
            if (d[i] > 255) d[i] = 255;
            if (d[i + 1] > 255) d[i] = 255;
            if (d[i + 2] > 255) d[i] = 255;
            if (d[i] < 0) d[i] = 0;
            if (d[i + 1] < 0) d[i] = 0;
            if (d[i + 2] < 0) d[i] = 0;
          }
        }

        resolve(imageData);
      }),
    [currentCoordinates]
  );

  const adjustInversion = useCallback(
    (value, imageData) =>
      new Promise((resolve) => {
        if (currentCoordinates.width != null) {
          const data = imageData.data;

          const inversion = 1 + Number(value) / 100;

          for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i] * inversion;
            data[i + 1] = 255 - data[i + 1] * inversion;
            data[i + 2] = 255 - data[i + 2] * inversion;
          }
        }

        resolve(imageData);
      }),
    [currentCoordinates]
  );

  const adjustExposure = useCallback(
    (value, imageData) =>
      new Promise((resolve) => {
        if (currentCoordinates.width != null) {
          const data = imageData.data;
          const factor = Math.pow(2, Number(value) / 100);

          for (let i = 0; i < data.length; i += 4) {
            // Adjust each channel individually
            data[i] = Math.min(255, data[i] * factor); // Red channel
            data[i + 1] = Math.min(255, data[i + 1] * factor); // Green channel
            data[i + 2] = Math.min(255, data[i + 2] * factor); // Blue channel
          }
        }

        resolve(imageData);
      }),
    [currentCoordinates]
  );

  const adjustContrast = useCallback(
    (value, imageData) =>
      new Promise((resolve) => {
        if (currentCoordinates.width != null) {
          const data = imageData.data;
          const contrast = (Number(value) + 255) / 255;

          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.round((data[i] - 128) * contrast + 128); // Red channel
            data[i + 1] = Math.round((data[i + 1] - 128) * contrast + 128); // Green channel
            data[i + 2] = Math.round((data[i + 2] - 128) * contrast + 128); // Blue channel
          }
        }

        resolve(imageData);
      }),
    [currentCoordinates]
  );

  const applyFilters = useCallback(
    async (drawCroppingBox = false) => {
      const {
        brightness,
        contrast,
        exposure,
        saturation,
        inversion,
        grayscale,
      } = settings;

      const img = document.createElement("img");
      img.src = image;
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingQuality = "high";
      ctx.scale(flipRotate.flipHorizontal, flipRotate.flipVertical);
      ctx.drawImage(
        img,
        currentCoordinates.x * flipRotate.flipHorizontal,
        currentCoordinates.y * flipRotate.flipVertical,
        currentCoordinates.width * flipRotate.flipHorizontal,
        currentCoordinates.height * flipRotate.flipVertical
      );
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      if (drawCroppingBox) {
        const { startX, startY, croppedWidth, croppedHeight } =
          cropDimension.current;
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;
        ctx.strokeRect(startX, startY, croppedWidth, croppedHeight);
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // Example: semi-transparent black

        // Draw the backdrop rectangle
        ctx.fillRect(0, 0, startX, canvas.height); // Left side
        ctx.fillRect(
          startX + croppedWidth,
          0,
          canvas.width - startX - croppedWidth,
          canvas.height
        ); // Right side
        ctx.fillRect(startX, 0, croppedWidth, startY); // Top side
        ctx.fillRect(
          startX,
          startY + croppedHeight,
          croppedWidth,
          canvas.height - startY - croppedHeight
        ); // Bottom side
      }
      ctx.restore();

      let imageData = ctx.getImageData(
        currentCoordinates.x,
        currentCoordinates.y,
        currentCoordinates.width,
        currentCoordinates.height
      );

      if (grayscale) imageData = await adjustGrayscale(grayscale, imageData);
      if (brightness) imageData = await adjustBrightness(brightness, imageData);
      if (saturation) imageData = await adjustSaturation(saturation, imageData);
      if (inversion) imageData = await adjustInversion(inversion, imageData);
      if (exposure) imageData = await adjustExposure(exposure, imageData);
      if (contrast) imageData = await adjustContrast(contrast, imageData);

      putImageData(imageData);
    },
    [
      adjustGrayscale,
      adjustBrightness,
      adjustSaturation,
      adjustInversion,
      adjustExposure,
      adjustContrast,
      canvas,
      currentCoordinates,
      ctx,
      putImageData,
      image,
      settings,
      flipRotate,
    ]
  );

  const drawImageOnCanvas = useCallback(
    (canvas, ctx, image, toSetCoOrd = false, toGetImageData = false, e) => {
      const imageWidth = image.width;
      const imageHeight = image.height;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const scaleX = canvasWidth / imageWidth;
      const scaleY = canvasHeight / imageHeight;
      const scale = Math.min(scaleX, scaleY);

      const x = isImageDragging
        ? e.pageX - canvas.offsetLeft - (imageWidth * scale) / 2
        : (canvasWidth - imageWidth * scale) / 2;
      const y = isImageDragging
        ? e.pageY - canvas.offsetTop - (imageHeight * scale) / 2
        : (canvasHeight - imageHeight * scale) / 2;

      const newWidth = parseInt(imageWidth * scale, 10);
      const newHeight = parseInt(imageHeight * scale, 10);

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingQuality = "high";

      ctx.scale(flipRotate.flipHorizontal, flipRotate.flipVertical);
      ctx.drawImage(
        image,
        x * flipRotate.flipHorizontal,
        y * flipRotate.flipVertical,
        newWidth * flipRotate.flipHorizontal,
        newHeight * flipRotate.flipVertical
      );
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      ctx.restore();

      if (toSetCoOrd) {
        setCurrentCoordinates({
          x,
          y,
          width: newWidth,
          height: newHeight,
        });
      }

      if (toGetImageData) {
        return ctx.getImageData(x, y, newWidth, newHeight);
      }
    },
    [isImageDragging, flipRotate]
  );

  const drawImage = useCallback(
    (src, isToDrawCropBox, e) => {
      const image = new Image();
      image.onload = () => {
        drawImageOnCanvas(canvas, ctx, image, true, false, isToDrawCropBox, e);
      };
      image.src = src;
    },
    [canvas, ctx, drawImageOnCanvas]
  );

  const drawCropBox = useCallback(
    (e) => {
      let width = e
        ? e.pageX - canvas.offsetLeft - (cropRect?.startX || 0)
        : 150;
      let height = e
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

      cropDimension.current = {
        ...cropDimension.current,
        endX: e ? e.offsetX / zoomScale : x,
        endY: e ? e.offsetY / zoomScale : y,
        croppedWidth: width,
        croppedHeight: height,
        startX: x,
        startY: y,
      };

      const img = new Image();
      img.src = image;

      img.onload = () => {
        applyFilters(true);
      };

      if (cropBox) {
        setDisabledCropBtn(false);
      }
    },
    [canvas, cropRect, cropBox, image, zoomScale, applyFilters]
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
    },
    [canvas, cropBox, currentCoordinates]
  );

  const mouseMove = useCallback(
    (e) => {
      if (isDragging || isImageDragging) {
        if (isDragging) {
          drawCropBox(e);
        } else if (isImageDragging) {
          const x = e.pageX - canvas.offsetLeft - currentCoordinates.width / 2;
          const y = e.pageY - canvas.offsetTop - currentCoordinates.height / 2;

          const img = new Image();
          img.src = image;

          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(
            img,
            x,
            y,
            currentCoordinates.width,
            currentCoordinates.height
          );
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          setCurrentCoordinates((prev) => ({ ...prev, x, y }));
          ctx.restore();
          applyFilters();
        }
        if (!isDragging && isImageDragging) canvas.style.cursor = "move";
        else canvas.style.cursor = "default";
      }
    },
    [
      isDragging,
      drawCropBox,
      isImageDragging,
      canvas,
      image,
      applyFilters,
      ctx,
      currentCoordinates,
    ]
  );

  const mouseUp = useCallback(() => {
    if (isDragging && !isImageDragging) {
      setIsDragging(false);
      setDisabledCropBtn(false);
    } else if (!isDragging && isImageDragging) {
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

        ctx.canvas.style.boxShadow = "rgba(0, 0, 0, 0.15) 0px 2px 8px";
        ctx.canvas.style.backgroundColor = "white";

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
    setSettings((prev) => ({ ...prev, [name]: Number(value) }));
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
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(zoomScale, zoomScale);

    const dataUrl = canvas.toDataURL();

    setDisabledCropBtn(true);
    setCurrentCoordinates({
      x: sx,
      y: sy,
      width: croppedWidth,
      height: croppedHeight,
    });

    const img = new Image();
    img.src = dataUrl;

    ctx.imageSmoothingQuality = "high";
    ctx.save();
    ctx.drawImage(img, dx, dy, croppedWidth, croppedHeight);
    ctx.restore();

    if (cropBox) {
      toggleCropBox();
    }

    if (dataUrl !== "data:,") {
      setImage(dataUrl);
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
      imageRef.current.src = oldImage;
      setImage(oldImage);
      setSettings({
        grayscale: 0,
        brightness: 0,
        saturation: 0,
        inversion: 0,
        exposure: 0,
        contrast: 0,
      });
      setFlipRotate({ rotate: 0, flipHorizontal: 1, flipVertical: 1 });
      setCurrentCoordinates({ x: 0, y: 0 });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(1, 1);
      drawImage(oldImage);
    }
  };

  const handleZoomInAndOut = useCallback(
    (e) => {
      const zoomStep = 0.03;

      e.preventDefault();

      const translateX = e.clientX - canvas.offsetLeft;
      const translateY = e.clientY - canvas.offsetTop;
      const wheel = e.deltaY < 0 ? 1 : -1;

      const zoom = Math.exp(wheel * zoomStep);
      let _zoomScale = 1;
      _zoomScale = Math.min(zoomScale * zoom, 30);

      const trasnform = ctx.getTransform();
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      if (_zoomScale <= 1) {
        _zoomScale = 1;
      } else {
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
      }

      setZoomScale(_zoomScale);

      const img = new Image();
      img.src = image;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        img,
        currentCoordinates.x,
        currentCoordinates.y,
        currentCoordinates.width,
        currentCoordinates.height
      );
      ctx.restore();
      applyFilters();
    },
    [zoomScale, canvas, ctx, image, currentCoordinates, applyFilters]
  );

  const toggleCropBox = useCallback(() => {
    setCropBox((prev) => !prev);
  }, []);

  useEffect(() => {
    if (canvas && currentCoordinates.width != null) {
      applyFilters();
    }
  }, [settings, flipRotate]);

  useEffect(() => {
    if (canvas) drawImage(image);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);

  useEffect(() => {
    if (cropBox) {
      drawCropBox();
    }
  }, [cropBox]);

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
        setFlipRotate,
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
