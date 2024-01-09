import { useContext } from "react";
import { ImageEditorContext } from "./ImageEditorProvide";

const Footer = () => {
  const { downloadImage, reset, image, disabledCropBtn, cropSelectedArea } =
    useContext(ImageEditorContext);
  return image ? (
    <div className="footer">
      <button disabled={disabledCropBtn} onClick={cropSelectedArea}>
        Crop Selected Area
      </button>
      <button onClick={downloadImage}>Download Image</button>
      <button onClick={reset}>Reset</button>
    </div>
  ) : null;
};

export default Footer;
