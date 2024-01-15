import "./App.css";
import Footer from "./components/Footer";
import ImageEditorProvider from "./components/ImageEditorProvider";
import ImagePreview from "./components/ImagePreview";
import ImageUpload from "./components/ImageUpload";

function App() {
  return (
    <div className="container">
      <ImageEditorProvider>
        <ImageUpload />
        <ImagePreview />
        <Footer />
      </ImageEditorProvider>
    </div>
  );
}

export default App;
