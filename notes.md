# Project Overview

This project is an attempt to make a Xanadu-like hypertext system.

# UI and Interactions

The browsing UI should consist of a pane with the content in a
scrollable area. There should be a tool bar somewhere that shows
the various viewing options for the current content, which is
determined by looking for styling links for the content.

Links should be displayed either via highlighting of the content
thats linked, or perhaps more robustly, the links should be in a
sidebar area that scrolls in parallel with the main content, in a
kind of margin note fashion. Clicking on a link should display the
link's name and/or explanation (or perhaps only hovering should),
and double clicking (or maybe just single clicking) takes the user
to the linked content.

Following a link can be done in place, or in parallel. Parallel
following is the default mode, and brings up another window or
panel for the target document.

## Dimensions of Variation

There are multiple dimensions along which the UI could vary, and
exploration should be done. Namely:

1. Author - One could browse things in a way organized primarily by
   who the author/source/owner of some content is. This would be
   a lot like browsing the Web, where you visit pages on a site,
   and the site is effectively a single person's presence.

2. Time - One could browse things in a way organized primarily by
   when the content was produced. This would be a lot like reading
   social media websites like Twitter, Tumblr, etc. where the main
   perspective is by way of a reverse chronological feed.

3. Topic - One could browse things in a way organized primarily by
   topic, which would be a lot like chat rooms and Pinterest and
   perhaps the various story-like things that Twitter does.

4. Content Root - One could browse things in a way organized
   primarily by root documents, from which replies, comments, etc.
   issue forth.

5. Blends - Various methods are often blended together. For
   example, Twitter has reverse chronological feeds as the
   top-level structure which can be unfolded into a content root
   structure of threads. Web forums, Usenet, etc. use topics as
   primary structures with each topic containing reverse
   chronological lists of content rooted threads.

Other dimensions that are interesting: geolocation, media type,
random (e.g. Stumbleupon), versions...

All of these can be seen as metadata (tho some is more core and
arguably intrinsic, e.g. author, time, media type, versioning).
It ought to therefore be possible to take certain things as links
and others as constitutive. Author-as-in-server, and
media-type-as-in-file-type probably ought to be intrinsic, while
time and version might not be present at all in some documents and
so can't be intrinsic for everything, so probably can only be links
predicating of things. This motivates non-binary links (see below).

# Styling

Styling would use what is sometimes called an overlay decision list (ODL), which in this setting consists of a separate document which transcludes links that mark which parts of the document are what sort of thing. For instance, the ODL analog of the HTML example above:

```
host/doc:
  compound
  host/rawtext
  host/odllinkfordoc

host/odllinkfordoc:
  link
  odlspechost/odlspec
  formattable-document: host/doc
  odl: host/odldoctitlelink, host/odldocpar1link host/odldocpar2link

host/odldoctitlelink:
  link
  odlspechost/odltitlespec
  title-text: element/0/span/0-11

host/olddocpar1link:
  link
  odlspechost/odlparagraphspec
  paragraph-text: element/0/span/13-52

host/olddocpar2link:
  link
  odlspechost/odlparagraphspec
  paragraph-text: element/0/span/54-79
```

# Trails and Assemblages

Other imaginable uses for links are as records of browsing, to replicate Memex's trails, for instance. Such a thing might look something like this:

```
host/memextrail:
  link
  memextraillinkspechost/memextraillinkspec
  trail: host/doc1, host/linkdoc1todoc2, host/doc2, host/linkdoc2todoc3, host/doc3
```

Since trails have a distinctive linearity to them, it's also probably desirable to have a more free-form scattering of documents that are related in ways that the author wishes to share. The structure of one of these assemblages would be very similar to a trail but the expected structure of the links, and the presentation, are not sequential:

```
host/assemblage:
  link
  assemblagelinkspechost/assemblagelinkspec
  assemblage: host/doc1, host/doc2, host/doc3, host/linkdoc1todoc2, host/linkdoc1todoc3, host/linkdoc2todoc3
```

# Distinctions Between Compound Documents and Links

The difference between compound documents and links is perhaps subtle, but important. Compound documents are fundamentally not structured in any interesting way beyond sequence of content. That is, essentially, what they're for: combining multiple pieces of content, of possibly different types, into a single sequential document. Compound documents are not intended for especially rich content, and definitely not for content with interesting structure beyond sequential combination and aggregation of sub-content. Compound documents dont have types, or any sort of information about "what" they are or do, because they do precisely one thing: sum up the content of their transclusions. Links, on the other hand, are for all structured concepts that relate things, whether those things are content documents (simple or complex), or other links. Links are the structured, open-ended, type-distinguished form of document. Some kinds of links are merely relational, for example, jump links, quote links, and comment links. But other links are much more richly structured, and represent a kind of document in their own right, such as trail links.

# Syntax / Formatting

The system should have many kinds of simple documents, ranging from text to video to whatever. There should also be two kinds of complex documents, content and links. The following two syntaxes seem reasonable as a way to define them.

## Compound Content Syntax

Compound content is represented by the following JSON type:

```
{
  "type": "compound",
  "id": DocID,
  "transclusions": [Address]
}
```

An example of a content document would be this:

```
{
  "type": "compound",
  "id": "4587xv87234asd",
  "transclusions": ["51.23.56.11:5000/1786vrf5asd4f7/", "51.23.56.11:5000/sdf8732jkvdb0983q/time/4m30s-5m30s"]
}
```

## Link Syntax

Links are represented by the following JSON type:

```
{
  "type": "link",
  "id": DocID,
  "link_type": String,
  "endsets": {
    FieldName: [Address]
  }
}
```

An example of a link document would be this:

```
{
  "type": "link",
  "id": "z789v6asdf23vds",
  "link_type": "51.23.56.11:5000/c98vb32kjdf",
  "endsets": {
    "foo": ["51.23.56.11:5000/239nbsac83/part/0"],
    "bar": ["51.23.56.11:5000/239nbsac83/part/1", "51.23.56.11:5000/239nbsac83/part/2"]
  }
}
```

# Primitive Document Types

There are 5 primitive document types supported by the system:

- Text
- Images
- Audio
- Video
- Web Pages

More may be added later as necessary. From these, we build compound documents, which are a 6th kind of document but not a primitive type.

Raw text documents have the following JSON type:

```
{
  "type": "text",
  "id": DocID,
  "text": String
}
```

# Addressing Spans

Spans within a document can be referenced by span addresses in various ways, depending on the kind of document.

## Text Spans

Text spans are addressed exclusively by character spans. Indexes start at 0 and go up to and include the length of the text. Their syntax is

```
<text-span> ::= <natural> "-" <natural>
```

An example of a text span is `3-42`.

## Image Spans

Image spans are rectangles, i.e. pairs of points. The first pair is the bottom left corner of the rectangle, and the second is the top right of the rectangle. The rectangle must of course fit within the image.

```
<image-span> ::= <natural> "," <natural> "-" <natural> "," <natural>
```

An example of an image span is `25,25-50,50`.

## Audio Spans

Audio spans are pairs of times in seconds. The first time is the start time, the second is the end time. Times are measured in positive decimals, and they reference the nearest timepoint in the actual audio.

```
<audio-span> ::= <decimal> "-" <decimal>
```

An example of an audio span is `3.44-51.097`.

## Video Spans

Video spans are pairs of frame numbers, representing the start and end frame.

```
<video-span> ::= <natural> "-" <natural>
```

An example of a video span is `92-1770`.

## Web Page Spans

Web pages do not have spans currently, and can only be referenced in whole by their URL. If the URL has an anchor in it, then that is included as the address of the page, but it is not really addressable otherwise.

## Compound Document Spans

Compound documents have spans similar to text spans, but with non-textual elements treated as occupying a single index. So for instance a compound document that has only text is addressed normally like text (independent of the underlying, transcluded document's indexes). If there is an image, the image is treated like a single character. Consider the following compound document, and its source text:

```
host/text0:
  This is some text.

host/text1:
  This is also some text.

host/image

host/compound:
  compound
  host/text0
  host/image
  host/text1
```

The span `0-4` in `host/compound` spans the text "This", just as it does in `host/text0`. Up to position `18`, the spans cover the same characters. However, span `18-19` covers the image, in its entirety. `19-42` covers the same characters in `host/compound` as are in span `0-23` in `host/text1`.

## Link Spans

Links do not have spans into them, they are seen externally as atomic wholes.

# Versioning

Unlike some of the Xanadu systems, this system is immutable and append-only. Documents cannot be edited in place, and versions are distinct documents that are noted as versions via versioning links. This lets us do a number of useful things, one of which is have branching histories -- future versions that are derived from more than one past version.

# Request Processing

A retrieval request for a compound document should retrieve all of the transcluded document spans and links recursively down to the primitive components. The returned result should consist of the text and data content of the final document, for each of the transcluded subdocuments.

In practice, we can implement this in two ways, by actually live-composing the documents for each request, or by composing them at creation and storing the pre-composed results as a cache. There are trade-offs: live composition takes CPU time, while caching of pre-composed documents takes storage. Given the vast quantities of storage that are currently available at ridiculously low prices, it makes sense to pre-compose documents. However, it will take experimentation to determine what is the right solution. Probably the ultimate right solution is to track access statistics and cache the high-frequency content but let the low-frequency content be composed on the fly.

Regardless of caching, for compound documents we will return a list of raw text components, and addresses of non-textual documents. The non-textual documents should be fetched by the front end separately from the compound document itself, and then presented intermixed with the compound documents text content.

# What's Stored With Documents

Documents are stored with some metadata, namely the datetime of their creation. This is used primarily for sorting the scroll to display items by time.

# Server API

The server has two main functionalities -- to serve data when its requested, and to store new data when its provided. The web API for this is as follows:

## GET `/api/scroll/<docid>`

Retrieve the document with id `<docid>`. Header content type should be text for raw text, links, and

## GET `/api/scroll/<docid>/<span>`

Retrieve the span `<span>` in the document `<docid>`.

## GET `/api/scroll/new_id/<count>`

Generate `<count>` many random unique document ids.

## POST `/api/scroll/<docid>`

Store new documents. The returned value is the new document id. Validation of the data is performed to ensure that its a valid document. Validation of the id is performed to check that it hasn't yet been stored. If the documents are invalid or the id has already had a document stored at it, a 400 error is returned.
