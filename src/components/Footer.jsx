import { useContext } from "react";
import { ImageEditorContext } from "./ImageEditorProvide";

const Footer = () => {
  const { downloadImage, reset, image } = useContext(ImageEditorContext);
  return image ? (
    <div className="footer">
      <button onClick={downloadImage}>Download Image</button>
      <button onClick={reset}>Reset</button>
    </div>
  ) : null;
};

export default Footer;
