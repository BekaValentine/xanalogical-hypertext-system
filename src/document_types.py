import re
from tinydb import Query


class Document(object):
    def __init__(self):
        pass


class Text(Document):
    def __init__(self, id, dt, text):
        super().__init__()
        self.id = id
        self.datetime = dt
        self.text = text

    def __repr__(self):
        return '<Text: id=' + repr(self.id) + ', datetime=' + self.datetime + ', text=' + repr(self.text) + '>'

    def to_dict(self):
        return {
            'id': self.id,
            'datetime': self.datetime,
            'type': 'text',
            'text': self.text
        }


class Link(Document):
    def __init__(self, id, dt, link_type, endsets):
        super().__init__()
        self.id = id
        self.datetime = dt
        self.link_type = link_type
        self.endsets = endsets

    def __repr__(self):
        return '<Link: id=' + repr(self.id) + ', datetime=' + self.datetime + ', type=' + self.link_type + ', endsets = ' + repr(self.endsets) + '>'

    def to_dict(self):
        return {
            'id': self.id,
            'datetime': self.datetime,
            'type': 'link',
            'link_type': self.link_type,
            'endsets': self.endsets
        }


class Media(Document):
    def __init__(self, id, dt, filename):
        super().__init__()
        self.id = id
        self.datetime = dt
        self.filename = filename

    def __repr__(self):
        return '<Media: id=' + repr(self.id) + ', datetime=' + self.datetime + ', filename=' + self.filename + '>'

    def to_dict(self):
        return {
            'id': self.id,
            'datetime': self.datetime,
            'type': 'media',
            'filename': self.filename
        }


class WebPage(Document):
    def __init__(self, id, dt, url):
        super().__init__()
        self.id = id
        self.datetime = dt
        self.url = url

    def __repr__(self):
        return '<WebPage: id=' + repr(self.id) + ', datetime=' + self.datetime + ', url=' + self.url + '>'

    def to_dict(self):
        return {
            'id': self.id,
            'datetime': self.datetime,
            'type': 'webpage',
            'url': self.url
        }


class Compound(Document):
    def __init__(self, id, dt, transclusions):
        super().__init__()
        self.id = id
        self.datetime = dt
        self.transclusions = transclusions

    def __repr__(self):
        return '<Compound: id=' + repr(self.id) + ', datetime=' + self.datetime + ', transclusions=' + repr(self.transclusions) + '>'

    def to_dict(self):
        return {
            'id': self.id,
            'datetime': self.datetime,
            'type': 'compound',
            'transclusions': self.transclusions
        }


def parse_new_document_description(doc_id, datetime, d):
    if 'type' not in d:
        return None

    d['id'] = doc_id
    d['datetime'] = datetime

    if d['type'] == 'text':
        if 'text' not in d:
            return None
        return Text(d['id'], d['datetime'], d['text'])

    elif d['type'] == 'link':
        if 'link_type' not in d or 'endsets' not in d or\
                not isinstance(d['endsets'], dict) or\
                not all([isinstance(endset, list) for endset in d['endsets'].values()]) or\
                not all([isinstance(end, str) for endset in d['endsets'].values() for end in endset]):
            return None

        return Link(d['id'], d['datetime'], d['link_type'], d['endsets'])

    elif d['type'] == 'webpage':
        if 'url' not in d:
            return None

        return WebPage(d['id'], d['datetime'], d['url'])

    elif d['type'] == 'compound':
        if 'transclusions' not in d or\
                not isinstance(d['transclusions'], list) or\
                not all([isinstance(tx, str) for tx in d['transclusions']]):
            return None

        return Compound(d['id'], d['datetime'], d['transclusions'])

    else:
        return None


def parse_db_record(rec):

    if rec['type'] == 'text':
        return Text(rec['id'], rec['datetime'], rec['text'])

    elif rec['type'] == 'link':
        return Link(rec['id'], rec['datetime'], rec['link_type'], rec['endsets'])

    elif rec['type'] == 'media':
        return Media(rec['id'], rec['datetime'], rec['filename'])

    elif rec['type'] == 'webpage':
        return WebPage(rec['id'], rec['datetime'], rec['url'])

    elif rec['type'] == 'compound':
        return Compound(rec['id'], rec['datetime'], rec['transclusions'])

    else:
        return None


def resolve_compound_document(db, doc):
    resolved = doc.to_dict()
    resolved_transclusions = []
    transclusion_spans = {}
    resolved_length = 0

    for tx_id in doc.transclusions:
        results = db.search(Query().id == tx_id)
        if len(results) != 1:
            return None

        tx = parse_db_record(results[0])
        end = resolved_length

        if isinstance(tx, Text):
            resolved_transclusions.append({
                'type': 'text',
                'text': tx.text
            })
            end = resolved_length + len(tx.text)

        elif isinstance(tx, Link):
            resolved_transclusions.append({
                'link_type': tx.link_type,
                'endsets': tx.endsets
            })
            end = resolved_length + 1

        elif isinstance(tx, Media):
            resolved_transclusions.append({
                'type': 'media',
                'id': tx.id
            })
            end = resolved_length + 1

        elif isinstance(tx, WebPage):
            resolved_transclusions.append({
                'type': 'webpage',
                'id': tx.id,
                'url': tx.url
            })
            end = resolved_length + 1

        elif isinstance(tx, Compound):
            rec = resolve_compound_document(db, tx)
            resolved_transclusions += rec['resolved_transclusions']
            resolved_links += rec['resolved_links']
            end = resolved_length + rec['resolved_length']

        if tx.id not in transclusion_spans:
            transclusion_spans[tx.id] = []
        transclusion_spans[tx.id].append((resolved_length, end))
        resolved_length = end
        print(tx)

    resolved['resolved_transclusions'] = resolved_transclusions
    resolved['transclusion_spans'] = transclusion_spans
    resolved['resolved_length'] = resolved_length

    return resolved
