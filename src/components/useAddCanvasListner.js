import { useEffect } from "react";

const useAddCanvasListner = ({
  canvas,
  mouseDown,
  mouseUp,
  mouseMove,
  handleZoomInAndOut,
}) => {
  useEffect(() => {
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
  }, [mouseDown, mouseMove, mouseUp, handleZoomInAndOut, canvas]);
};

export default useAddCanvasListner;
