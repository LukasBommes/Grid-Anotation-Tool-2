from flask import Flask, render_template, request, jsonify


app = Flask(__name__)
app.secret_key = "fhuds87f§$%§$%kljelkljlflkwe%6ker52r:;G;hkjf2"
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # disable caching of static files
app.config['API_URL'] = "http://localhost:8000"


@app.route('/')
@app.route('/projects')
def projects():
    return render_template(
        'projects.html',
        api_url=app.config['API_URL']
    )


@app.route('/add')
def add_project():
    return render_template(
        'add_edit_project.html',
        api_url=app.config['API_URL'],
        project_id=None,
        mode="add"
    )


@app.route('/get_edit_project_url', methods=['GET'])
def get_edit_project_url():
    project_id = request.args.get("project_id")
    return jsonify({"url": f'/edit/{project_id}'})


@app.route('/edit/<int:project_id>')
def edit_project(project_id):
    return render_template(
        'add_edit_project.html',
        api_url=app.config['API_URL'],
        project_id=project_id,
        mode="edit"
    )


@app.route('/get_editor_url', methods=['GET'])
def get_editor_url():
    project_id = request.args.get("project_id")
    return jsonify({"url": f'/editor/{project_id}'})


@app.route('/editor/<int:project_id>')
def editor(project_id):
    return render_template(
        'editor.html',
        api_url=app.config['API_URL'],
        project_id=project_id
    )


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=9999, debug=True)
