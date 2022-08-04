import { MDCSlider } from '@material/slider';

import { entrypoint } from "../../utils.js";


var cancel_button = document.getElementById("editor-settings-cancel-button");
if (cancel_button) {
    cancel_button.addEventListener("click", () => { history.back(); });
}
var submit_button = document.getElementById("editor-settings-submit-button");
if (submit_button) {   
    submit_button.addEventListener("click", saveEditorSettingsButtonClicked);
}

var cursor_radius_slider = document.getElementById('cursor-radius-slider');
if (cursor_radius_slider) {
    cursor_radius_slider = new MDCSlider(cursor_radius_slider);
}
var handle_radius_slider = document.getElementById('handle-radius-slider');
if (handle_radius_slider) {
    handle_radius_slider = new MDCSlider(handle_radius_slider);
}
var line_width_slider = document.getElementById('line-width-slider');
if (line_width_slider) {
    line_width_slider = new MDCSlider(line_width_slider);
}

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
        }
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
    return editor_settings;
}

// write editor settings to local storage
function saveEditorSettingsButtonClicked() {
    const editor_settings = {
        cursor_radius: cursor_radius_slider.getValue(),
        handle_radius: handle_radius_slider.getValue(),
        line_width: line_width_slider.getValue(),
    }
    localStorage.setItem("editor_settings", JSON.stringify(editor_settings));
    history.back();
}

export {
    getEditorSettings
};