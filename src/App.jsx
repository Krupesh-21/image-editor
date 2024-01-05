import "./App.css";
import Footer from "./components/Footer";
import ImageUpload from "./components/ImageUpload";
import ImagePreview from "./components/ImagePreview";
import ImageEditorProvide from "./components/ImageEditorProvide";

function App() {
  return (
    <div className="container">
      <ImageEditorProvide>
        <ImageUpload />
        <ImagePreview />
        <Footer />
      </ImageEditorProvide>
    </div>
  );
}

export default App;
