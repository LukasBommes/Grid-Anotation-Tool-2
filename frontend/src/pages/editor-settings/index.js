import { MDCSlider } from "@material/slider";

import { entrypoint } from "../../utils.js";

var cancel_button = document.getElementById("editor-settings-cancel-button");
if (cancel_button) {
  cancel_button.addEventListener("click", () => {
    history.back();
  });
}
var submit_button = document.getElementById("editor-settings-submit-button");
if (submit_button) {
  submit_button.addEventListener("click", saveEditorSettingsButtonClicked);
}
var revert_button = document.getElementById("editor-setting-revert-default-button");
if (revert_button) {
  revert_button.addEventListener("click", revertToDefaultsButtonClicked);
}

var cursor_radius_slider = document.getElementById("cursor-radius-slider");
if (cursor_radius_slider) {
  cursor_radius_slider = new MDCSlider(cursor_radius_slider);
}
var handle_radius_slider = document.getElementById("handle-radius-slider");
if (handle_radius_slider) {
  handle_radius_slider = new MDCSlider(handle_radius_slider);
}
var line_width_slider = document.getElementById("line-width-slider");
if (line_width_slider) {
  line_width_slider = new MDCSlider(line_width_slider);
}
var colorpicker_lines_handles = document.getElementById("colorpicker-lines-handles");
var colorpicker_cells_visible = document.getElementById("colorpicker-cells-visible");
var colorpicker_cells_invisible = document.getElementById("colorpicker-cells-invisible");
var colorpicker_editor_background = document.getElementById("colorpicker-editor-background");

entrypoint(() => {
  getEditorSettings();
});

// read editor settings from local storage
function getEditorSettings() {
  var editor_settings = JSON.parse(localStorage.getItem("editor_settings"));
  // set defaults
  if (!editor_settings) {
    editor_settings = {
      cursor_radius: 2,
      handle_radius: 2,
      line_width: 1,
      color_lines_handles: "#ff00ff",
      color_cells_visible: "#7cfc00",
      color_cells_invisible: "#ffff00",
      color_editor_background: "#ffffff"
    };
  }
  if (cursor_radius_slider) {
    cursor_radius_slider.setValue(editor_settings.cursor_radius);
  }
  if (handle_radius_slider) {
    handle_radius_slider.setValue(editor_settings.handle_radius);
  }
  if (line_width_slider) {
    line_width_slider.setValue(editor_settings.line_width);
  }
  if (colorpicker_lines_handles) {
    colorpicker_lines_handles.value = editor_settings.color_lines_handles;
  }
  if (colorpicker_cells_visible) {
    colorpicker_cells_visible.value = editor_settings.color_cells_visible;
  }
  if (colorpicker_cells_invisible) {
    colorpicker_cells_invisible.value = editor_settings.color_cells_invisible;
  }
  if (colorpicker_editor_background) {
    colorpicker_editor_background.value = editor_settings.color_editor_background;
  }
  return editor_settings;
}

// write editor settings to local storage
function saveEditorSettingsButtonClicked() {
  const editor_settings = {
    cursor_radius: cursor_radius_slider.getValue(),
    handle_radius: handle_radius_slider.getValue(),
    line_width: line_width_slider.getValue(),
    color_lines_handles: colorpicker_lines_handles.value,
    color_cells_visible: colorpicker_cells_visible.value,
    color_cells_invisible: colorpicker_cells_invisible.value,
    color_editor_background: colorpicker_editor_background.value
  };
  localStorage.setItem("editor_settings", JSON.stringify(editor_settings));
  history.back();
}

function revertToDefaultsButtonClicked() {
  localStorage.removeItem("editor_settings");
  getEditorSettings();
  history.back();
}

export { getEditorSettings };
