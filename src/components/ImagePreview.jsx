import Crop from "./Crop";
import Flip from "./Flip";
import Settings from "./Settings";

const ImagePreview = () => {
  return (
    <div className="image-preview-container">
      <div id="settings-container">
        <Settings />
        <Crop />
        <Flip />
      </div>
      <div id="image-preview"></div>
    </div>
  );
};

export default ImagePreview;
