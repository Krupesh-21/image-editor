import { useContext } from "react";
import { ImageEditorContext } from "./ImageEditorProvide";

const options = [
  { name: "grayscale", max: 100 },
  { name: "brightness", max: 200 },
  { name: "saturation", max: 200 },
  { name: "inversion", max: 100 },
];

const Settings = () => {
  const { settings, handleSettings } = useContext(ImageEditorContext);
  return options.map(({ name, max }) => (
    <label key={name} className="setting">
      <div className="label-value-area">
        <span>{name.substring(0, 1).toUpperCase() + name.substring(1)}</span>
        <span>{`(${settings[name]})`}</span>
      </div>
      <input
        name={name}
        value={settings[name]}
        onChange={handleSettings}
        type="range"
        max={max}
      />
    </label>
  ));
};

export default Settings;
