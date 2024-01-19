import { useContext } from "react";
import { ImageEditorContext } from "./ImageEditorProvider";

const options = [
  { name: "grayscale", max: 100 },
  { name: "brightness", max: 100 },
  { name: "saturation", max: 100 },
  { name: "inversion", max: 100 },
  { name: "exposure", max: 100 },
  { name: "contrast", max: 100 },
];

const Settings = () => {
  const { settings, handleSettings } = useContext(ImageEditorContext);
  return options.map(({ name, max }) => (
    <label key={name} className="setting">
      <div className="label-value-area">
        <span>{name.substring(0, 1).toUpperCase() + name.substring(1)}</span>
        <span>{`(${settings[name] || 0})`}</span>
      </div>
      <input
        name={name}
        value={settings[name] || 0}
        onChange={handleSettings}
        type="range"
        max={max}
        step={1}
      />
    </label>
  ));
};

export default Settings;
