import { useEffect } from "react";

const useAddCanvasListner = ({ canvas, mouseDown, mouseUp, mouseMove }) => {
  useEffect(() => {
    if (canvas) {
      canvas.addEventListener("mousedown", mouseDown, false);
      canvas.addEventListener("mousemove", mouseMove, false);
      canvas.addEventListener("mouseup", mouseUp, false);
    }
    console.log({ canvas });

    return () => {
      if (canvas) {
        canvas.removeEventListener("mousedown", mouseDown, false);
        canvas.removeEventListener("mousemove", mouseMove, false);
        canvas.removeEventListener("mouseup", mouseUp, false);
      }
    };
  }, [canvas, mouseDown, mouseUp, mouseMove]);
};

export default useAddCanvasListner;
