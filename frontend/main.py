import os
import glob
import json
import copy
from flask import Flask, request, redirect, render_template, url_for, jsonify
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = "fhuds87f§$%§$%kljelkljlflkwe%6ker52r:;G;hkjf2"
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # disable caching of static files
app.config['API_URL'] = "http://localhost:8000"


@app.route('/editor/<int:project_id>')
def index(project_id):
    """Main page for annotation of images"""
    return render_template(
        'index.html',
        api_url=app.config['API_URL'],
        project_id=project_id
    )


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=9999, debug=True)
