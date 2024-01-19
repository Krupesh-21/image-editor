import { useContext } from "react";
import { ImageEditorContext } from "./ImageEditorProvider";

const Flip = () => {
  const { setFlipRotate } = useContext(ImageEditorContext);
  return (
    <div className="flip-container">
      <button
        onClick={() => {
          setFlipRotate((prev) => ({
            ...prev,
            flipHorizontal: prev.flipHorizontal === 1 ? -1 : 1,
          }));
        }}
      >
        Flip X
      </button>
      <button
        onClick={() => {
          setFlipRotate((prev) => ({
            ...prev,
            flipVertical: prev.flipVertical === 1 ? -1 : 1,
          }));
        }}
      >
        Flip Y
      </button>
      {/* <button
        onClick={() => {
          setFlipRotate((prev) => ({
            ...prev,
            rotate: prev.rotate - 90,
          }));
        }}
      >
        Rotate Left
      </button>
      <button
        onClick={() => {
          setFlipRotate((prev) => ({
            ...prev,
            rotate: prev.rotate + 90,
          }));
        }}
      >
        Rotate Right
      </button> */}
    </div>
  );
};

export default Flip;
