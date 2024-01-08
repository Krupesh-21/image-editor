import { useContext } from "react";
import { ImageEditorContext } from "./ImageEditorProvide";

const ImageUpload = () => {
  const { displayFiles, handleDragEnter, handleDragLeave, handleDrop } =
    useContext(ImageEditorContext);
  return (
    <div className="image-upload-container">
      <input
        type="file"
        id="upload-image"
        accept="image/*"
        onChange={(e) => {
          displayFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div
        id="drag-drop-container"
        onClick={() => {
          const uploadInput = document.getElementById("upload-image");
          uploadInput?.click();
        }}
        onDragOver={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <span>&#43; Drag and Drop your image here!</span>
      </div>
    </div>
  );
};

export default ImageUpload;
