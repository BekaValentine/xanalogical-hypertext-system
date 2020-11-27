import datetime
from flask import Flask, render_template, request, redirect, url_for, send_from_directory
import json
import os
import re
from tinydb import TinyDB, Query
import uuid

import document_types


app = Flask(__name__)
app.url_map.strict_slashes = False
app.config['UPLOAD_DIRECTORY'] = 'data/media/'
app.config['ALLOWED_UPLOAD_EXTENSIONS'] = extensions = {
    # text files
    'txt',

    # image files
    'svg', 'png', 'jpg', 'jpeg', 'gif', 'tif', 'tiff', 'bmp',

    # audio files
    'mp3', 'wav', 'midi', 'ogg', 'oga', 'mogg', 'flac', 'aac', 'aiff', 'au', 'm4a', 'm4b',

    # video files
    'avi', 'mpg', 'mpeg', 'mp4', 'mov', 'webm', 'mkv', 'wmv',
}
ip_address = '127.0.0.1:' + os.environ['FLASK_RUN_PORT']

database = TinyDB('data/scroll.json')


@app.route('/', methods=['GET'])
def root_get():
    return repr(len(database.all()))


@app.route('/api/scroll/<doc_id>', methods=['GET'])
def api_scroll_doc_id_get(doc_id):
    results = database.search(Query().id == doc_id)
    if len(results) != 1:
        return 'not found\n', 404

    document = document_types.parse_db_record(results[0])

    if isinstance(document, document_types.Text) or\
       isinstance(document, document_types.Link) or\
       isinstance(document, document_types.WebPage):
        return json.dumps(document.to_dict())

    elif isinstance(document, document_types.Media):
        return send_from_directory(app.config['UPLOAD_DIRECTORY'], document.filename)

    elif isinstance(document, document_types.Compound):
        resolved = document_types.resolve_compound_document(database, document)
        return resolved, 200

    else:
        return 'invalid document', 500

    return 'ok\n', 200


@app.route('/api/scroll/<doc_id>', methods=['POST'])
def api_scroll_doc_id_post(doc_id):
    if not re.match('^[0-9a-f]+$', doc_id):
        return 'invalid document id\n', 400

    if 0 != len(database.search(Query().id == doc_id)):
        return 'document id already used\n', 400

    publish_datetime = datetime.datetime.now().isoformat()

    # determine content type
    if request.content_type == 'application/json':
        data = json.loads(request.data)
        document = document_types.parse_new_document_description(
            doc_id, publish_datetime, data)
        database.insert(document.to_dict())
    else:
        files = request.files.getlist("file")
        if len(files) != 1:
            return 'invalid request\n', 400
        else:
            file = files[0]
            if '.' not in file.filename:
                return 'invalid filename\n', 400

            extension = file.filename.rsplit('.', 1)[1].lower()

            if not allowed_file_extensions(extension):
                return 'invalid file type extension\n', 400

            filename = doc_id + '.' + extension
            file.save(os.path.join(app.config['UPLOAD_DIRECTORY'], filename))
            document = document_types.Media(doc_id, publish_datetime, filename)
            database.insert(document.to_dict())

    return 'ok\n', 200


def allowed_file_extensions(extension):
    return extension in app.config['ALLOWED_UPLOAD_EXTENSIONS']


@app.route('/api/scroll/new_id', methods=['GET'])
def api_scroll_new_id_get():
    while True:
        id = str(uuid.uuid4()).replace('-', '')
        if 0 == len(database.search(Query().document_id == id)):
            break

    return id
