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

var cursor_size_slider = document.getElementById('cursor-size-slider');
if (cursor_size_slider) {
    cursor_size_slider = new MDCSlider(cursor_size_slider);
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
            cursor_size: 10
        }
    }
    if (cursor_size_slider) {
        cursor_size_slider.setValue(editor_settings.cursor_size);
    }
    return editor_settings;
}

// write editor settings to local storage
function saveEditorSettingsButtonClicked() {
    const editor_settings = {
        cursor_size: cursor_size_slider.getValue()
    }
    localStorage.setItem("editor_settings", JSON.stringify(editor_settings));
    history.back();
}

export {
    getEditorSettings
};