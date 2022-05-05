import os
import glob
import json
import copy
from flask import Flask, request, redirect, render_template, url_for, jsonify
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = "fhuds87f§$%§$%kljelkljlflkwe%6ker52r:;G;hkjf2"
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # disable caching of static files
app.config['UPLOAD_PATH'] = 'uploads'
app.config['ANNOTATION_PATH'] = 'annotations'
app.config['SAVE_PATH'] = 'save'
app.config['API_URL'] = "http://localhost:8000"

def get_files():
    """Get files from upload and annotation folders"""
    image_files = sorted(glob.glob(os.path.join(app.config['UPLOAD_PATH'], "*")))
    image_names = [os.path.basename(image_file) for image_file in image_files]
    image_names_wo_ext = [os.path.splitext(image_name)[0] for image_name in image_names]
    existing_annotations = sorted(glob.glob(os.path.join(app.config['SAVE_PATH'], "*.json")))
    existing_annotations = [os.path.basename(json_file) for json_file in existing_annotations]
    existing_annotations = [os.path.splitext(json_file)[0] for json_file in existing_annotations]
    images = [{"id": id, "filename": fname} for id, fname in zip(image_names_wo_ext, image_names)]
    return images, existing_annotations


@app.route('/editor/<int:project_id>')
def index(project_id):
    """Main page for annotation of images"""
    images, existing_annotations = get_files()
    print(images, existing_annotations)
    return render_template(
        'index.html',
        api_url=app.config['API_URL'],
        project_id=project_id
    )


@app.route('/get_existing_annotations')
def get_existing_annotations():
    """An endpoint to query the exisiting annotations."""
    images, existing_annotations = get_files()
    return jsonify({
        'existing_annotations': existing_annotations
    })


# TODO: needed fo exporting function
# ### receive annotations for image and store to json file
# def create_annotation_data(save_data):
#     """Returns the final annotation JSON which is a cleane dup version of the save JSON"""
#     #annotation_data = save_data
#     annotation_data = {}
#     annotation_data["image"] = copy.deepcopy(save_data["image"])  # image contains the full filename, e.g. abcd-efg-hij.jpg
#     annotation_data["grid_cells"] = copy.deepcopy(save_data["grid_cells"])
#     # remove ids from corners in PV modules
#     try:
#         for p in annotation_data["grid_cells"]:
#             corners = p["corners"]
#             for corner in corners:
#                 del corner["id"]
#     except KeyError:
#         pass
#     return annotation_data

# @app.route('/save_annotation', methods=['POST'])
# def save_annotation():
#     """Endpoint to post annotation data to. This data gets stored in an annotation file"""
#     if request.method == 'POST':
#         save_data = request.get_json()
#         if save_data is not None:
#             image_name = os.path.splitext(save_data["image"])[0]  # image contains the full filename, e.g. abcd-efg-hij.jpg
#             print(f"Received annotation for {image_name}")
#             with open(os.path.join(app.config['SAVE_PATH'], "{}.json".format(image_name)), "w") as json_file:
#                 json.dump(save_data, json_file)
#             annotation_data = create_annotation_data(save_data)
#             with open(os.path.join(app.config['ANNOTATION_PATH'], "{}.json".format(image_name)), "w") as json_file:
#                 json.dump(annotation_data, json_file)
#     return redirect(url_for("index"))


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=9999, debug=True)
