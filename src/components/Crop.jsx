import { useContext } from "react";
import { ImageEditorContext } from "./ImageEditorProvide";

const Crop = () => {
  const { crop, handleCropChange, applyCrop } = useContext(ImageEditorContext);
  return (
    <>
      <div className="crop-container">
        <div>
          <label htmlFor="cropX">Crop X (px)</label>
          <input
            className="crop"
            value={crop.x}
            name="x"
            onChange={handleCropChange}
            id="cropX"
            type="number"
            min={0}
          />
        </div>
        <div>
          <label htmlFor="cropY">Crop Y (px)</label>
          <input
            className="crop"
            value={crop.y}
            name="y"
            onChange={handleCropChange}
            id="cropY"
            type="number"
            min={0}
          />
        </div>
      </div>
      <div className="crop-container">
        <div>
          <label htmlFor="cropX">Width (px)</label>
          <input
            className="crop"
            value={crop.width}
            name="width"
            onChange={handleCropChange}
            id="cropX"
            type="number"
            min={0}
          />
        </div>
        <div>
          <label htmlFor="cropY">Height (px)</label>
          <input
            className="crop"
            value={crop.height}
            name="height"
            onChange={handleCropChange}
            id="cropY"
            type="number"
            min={0}
          />
        </div>
      </div>
      <button className="apply-crop-btn" onClick={applyCrop}>
        Apply Crop
      </button>
    </>
  );
};

export default Crop;
