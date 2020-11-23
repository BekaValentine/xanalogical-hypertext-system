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

# Document Types

Some documents have different types. For instance, some documents should be seen as Markdown formatted text. Such a document would be represented by the raw text content as one document, and two complex documents: one is the one that is indicated to be Markdown, and another is a link that tags the document as Markdown. For example:

```
host/rawtext1:
  # Title
  This is markdown.

  ## Subtitle
  - foo
    - bar
    - baz

host/markdowndoc1:
  host/rawtext1
  host/markdowntag1

host/markdowntag1:
  markdownspechost/markdownspec
  markdown-document: host/markdowndoc1
  source-elements: element/0
```

The markdown document transcludes the raw text, but also to the link that marks it as markdown and thus by this transclusion the link is canonically part of, and essential to, what the document is. The link itself indicates both which document is the markdown document, and which part of that document is the markdown source text.

A more complex kind of compound document could be something like a textual document that has a canonical HTML mechanism for rendering it, which might look something like this:

```
host/rawtext2:
  My Document

  This is some text. This is a paragraph.

  This is also a paragraph.

host/doc2:
  host/rawtext2
  host/htmlformattingfordoc2

host/htmlformattingfordoc2:
  htmlformattingspechost/htmlformattingspec
  formattable-document: host/doc2
  html-template: host/htmltemplatefordoc2

host/htmltemplatefordoc2:
  <html>
    <head>
      <title>{{ element/0/span/0-11 }}</title>
    </head>
    <body>
      <p>{{ element/0/span/13-52 }}</p>
      <p>{{ element/0/span/54-79 }}</p>
    </body>
  </html>
```

A document that has a more native kind of styling would use what is sometimes called an overlay decision list (ODL), which in this setting consists of a separate document which transcludes links that mark which parts of the document are what sort of thing. For instance, the ODL analog of the HTML example above:

```
host/doc3:
  host/rawtext2
  host/odllinkfordoc3

host/odllinkfordoc3:
  odlspechost/odlspec
  formattable-document: host/doc3
  odl-document: host/odlfordoc3

host/odlfordoc3:
  host/odldoc3titlelink
  host/odldoc3par1link
  host/odldoc3par2link

host/odldoc3titlelink:
  odlspechost/odltitlespec
  title-text: element/0/span/0-11

host/olddoc3par1link:
  odlspechost/odlparagraphspec
  paragraph-text: element/0/span/13-52

host/olddoc3par2link:
  odlspechost/odlparagraphspec
  paragraph-text: element/0/span/54-79
```

Other imaginable uses for compound documents are as records of browsing, to replicate Memex's trails, for instance. Such a thing might look something like this:

```
host/memextrail:
  host/doc1
  host/doc2
  host/doc3
  host/memextraillink

host/memextraillink:
  memextrailspechost/memextrailspec
  trail: host/memextrail
  link-sequence: host/linkdoc1todoc2, host/linkdoc2todoc3
```

# Syntax / Formatting

The system should have many kinds of simple documents, ranging from text to video to whatever. There should also be two kinds of complex documents, content and links. The following two syntaxes seem reasonable as a way to define them.

## Compound Content Syntax

Compound content is represented by a list of newline-separated addresses.

```
<compound-document> ::= <address>*{<newline>}
```

An example of a content document would be this:

```
51.23.56.11:5000/1786vrf5asd4f7/
51.23.56.11:5000/sdf8732jkvdb0983q/time/4m30s-5m30s
```

## Link Syntax

Links are represented by the following grammar:

```
<link-document> ::= <link-type> <newline> <endset-line>+{<newline>}
<link-type> ::= <non-whitespace-ascii-character>+
<endset-line> ::= <endset-tag> <colon> (<whitespace> <address>)+{<comma>}
<endset-tag> ::= <non-whitespace-ascii-character>+
```

An example of a link document would be this:

```
51.23.56.11:5000/c98vb32kjdf
foo: 51.23.56.11:5000/239nbsac83/part/0
bar: 51.23.56.11:5000/239nbsac83/part/1, 51.23.56.11:5000/239nbsac83/part/2
```
