import { useContext } from "react";
import { ImageEditorContext } from "./ImageEditorProvide";

const Flip = () => {
  const { setSettings } = useContext(ImageEditorContext);
  return (
    <div className="flip-container">
      <button
        onClick={() => {
          setSettings((prev) => ({
            ...prev,
            flipHorizontal: prev.flipHorizontal === 1 ? -1 : 1,
          }));
        }}
      >
        Flip X
      </button>
      <button
        onClick={() => {
          setSettings((prev) => ({
            ...prev,
            flipVertical: prev.flipVertical === 1 ? -1 : 1,
          }));
        }}
      >
        Flip Y
      </button>
      <button
        onClick={() => {
          setSettings((prev) => ({
            ...prev,
            rotate: prev.rotate - 90,
          }));
        }}
      >
        Rotate Left
      </button>
      <button
        onClick={() => {
          setSettings((prev) => ({
            ...prev,
            rotate: prev.rotate + 90,
          }));
        }}
      >
        Rotate Right
      </button>
    </div>
  );
};

export default Flip;
