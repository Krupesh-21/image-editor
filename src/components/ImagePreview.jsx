import { useContext } from "react";
import Flip from "./Flip";
import { ImageEditorContext } from "./ImageEditorProvide";
import Settings from "./Settings";

const ImagePreview = () => {
  const { toggleCropBox, cropBox } = useContext(ImageEditorContext);
  return (
    <div className="image-preview-container">
      <div id="settings-container">
        <Settings />
        <div className="flip-container">
          <button id="crop-box-btn" onClick={toggleCropBox} disabled={cropBox}>
            Crop Image
          </button>
        </div>
        <Flip />
      </div>
      <div id="image-preview"></div>
    </div>
  );
};

export default ImagePreview;
