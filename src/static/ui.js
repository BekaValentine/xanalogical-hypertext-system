const MAINVIEW = document.getElementById("main_view");
const MEDIATYPES = {
  // image files
  "svg": "image",
  "png": "image",
  "jpg": "image",
  "jpeg": "image",
  "gif": "image",
  "tif": "image",
  "tiff": "image",
  "bmp": "image",

  // audio files
  "mp3": "audio",
  "wav": "audio",
  "midi": "audio",
  "ogg": "audio",
  "oga": "audio",
  "mogg": "audio",
  "flac": "audio",
  "aac": "audio",
  "aiff": "audio",
  "au": "audio",
  "m4a": "audio",
  "m4b": "audio",

  // video files
  "avi": "video",
  // mpg not supported by chrome
  //"mpg": "video",
  //"mpeg": "video",
  "mp4": "video",
  "mov": "video",
  "webm": "video",
  "mkv": "video",
  "wmv": "video"
}
const FONTSIZE = 12;







function svg(tag, props) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);

  for (let p in props) {
    el.setAttribute(p, props[p]);
  }

  return el;
}


class Rect {
  constructor(x,y,w,h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  }

  union(other) {
    const newX = Math.min(this.x, other.x);
    const newY = Math.min(this.y, other.y);
    const newX2 = Math.max(this.x + this.width, other.x + other.width);
    const newY2 = Math.max(this.y + this.height, other.y + other.height);
    const newW = newX2 - newX;
    const newH = newY2 - newY;
    return new Rect(newX, newY, newW, newH);
  }
}



function animate(duration, easer, callback) {
  var now = 0;
  const timestep = 1/30;
  const ticker = setInterval(() => {
    if (duration - now < timestep || now > duration) {
      now = duration;
      clearInterval(ticker);
    }
    callback(smoothstep(now/duration));
    now += timestep;
  }, 1000*timestep);
}

function linear(t) {
  return t;
}

function smoothstep(t) {
  const t2 = t * t * (3 - 2 * t);
  return t2 > 1 ? 1 :
         t2 < 0 ? 0 : t2;
}



class View {
  constructor() {
    this.parentView = null;
    this.position = { "x": 0, "y": 0 };
    this.needsRedraw = false;
  }

  setParentView(parent) {
    this.parentView = parent;
    this.display();
  }

  setPosition(x,y) {
    this.position.x = x;
    this.position.y = y;
    this.display();
  }

  display() {
    if (this.needsRedraw) {
      this.draw();
    }

    if (this.parentView) {
      this.region.style.left = this.position.x + "px";
      this.region.style.top = this.position.y + "px";
    }
  }

  draw() {
    this.needsRedraw = false;
  }
}

class MainView extends View {
  constructor(timelineModel) {
    super();
    this.region = document.getElementById("main_view");

    this.isDragging = false;
    this.downPosition = null;


    this.backdrop = document.getElementById("backdrop");


    this.mode = "timeline";
    this.timelineModel = timelineModel;
    this.timelineView = new TimelineView();
    this.timelineView.setModel(this.timelineModel);
    this.timelineView.setParentView(this);
    this.timelineView.setIsVisible(true);

    this.groundPlane = document.getElementById("groundPlane");
    this.groundPlane.appendChild(this.timelineView.region);

    this.viewpoint = { "x": 200, "y": 200 }; // this.timelineView.getSize().height/2 };
    this.backdropViewBox = this.backdropViewBox = {
      "x": this.viewpoint.x - window.innerWidth/2,
      "y": this.viewpoint.y - window.innerHeight/2,
      "width": window.innerWidth,
      "height": window.innerHeight
    };

    this.zoomLevel = 1;
    document.addEventListener("wheel", ev => { this.handleWheel(ev); });
    this.region.addEventListener("mousedown", ev => { this.handleMouseDown(ev); });
    this.region.addEventListener("mousemove", ev => { this.handleMouseMove(ev); });
    this.region.addEventListener("mouseup", ev => { this.handleMouseUp(ev); });
    window.addEventListener("keydown", ev => { this.handleKeydown(ev); });
    window.addEventListener("resize", ev => { this.display(); });
  }

  getChildViews() {
    if (this.mode == "timeline") {
      return this.timelineView;
    }
  }

  display() {
    super.display();

    this.backdropViewBox.width = window.innerWidth/this.zoomLevel;
    this.backdropViewBox.height = window.innerHeight/this.zoomLevel;

    this.backdropViewBox.x = this.viewpoint.x - this.backdropViewBox.width/2;
    this.backdropViewBox.y = this.viewpoint.y - this.backdropViewBox.height/2;

    this.backdrop.setAttribute("viewBox", this.backdropViewBox.x + " " + this.backdropViewBox.y + " " + this.backdropViewBox.width + " " + this.backdropViewBox.height);

    this.groundPlane.style.transformOrigin = (window.innerWidth/2) + "px " + (window.innerHeight/2) + "px";
    this.groundPlane.style.transform = "scale(" + this.zoomLevel + ") translate(" + (window.innerWidth/2) + "px, " + (window.innerHeight/2) + "px)";

    this.timelineView.setPosition(-this.viewpoint.x, -this.viewpoint.y);
  }

  handleKeydown(ev) {
    if (ev.key == "h") {
      this.zoomLevel = 1;
      this.viewpoint.x = 200;
      this.viewpoint.y = 200;
      this.region.style["filter"] = "invert(1)";
      document.body.style["background-color"] = "#cccccc";
      setTimeout(() => {
        this.region.style["filter"] = "none";
        document.body.style["background-color"] = "#000000";
        this.display();
      }, 200);
    }
  }

  handleWheel(ev) {


    if (ev.deltaY > 0) {
      this.zoomOut();
    } else if (ev.deltaY < 0) {
      this.zoomIn();
    }

  }

  handleMouseDown(ev) {
    this.isDragging = true;
    this.downPosition = {
      "x": ev.clientX,
      "y": ev.clientY
    };
    this.startViewpoint = Object.assign({}, this.viewpoint);
  }

  handleMouseMove(ev) {
    if (this.isDragging) {

      const dx = this.downPosition.x - ev.clientX;
      const dy = this.downPosition.y - ev.clientY;

      this.viewpoint.x = this.startViewpoint.x + dx/this.zoomLevel;
      this.viewpoint.y = this.startViewpoint.y + dy/this.zoomLevel;

      this.backdropViewBox.x = this.viewpoint.x - this.backdropViewBox.width/2;
      this.backdropViewBox.y = this.viewpoint.y - this.backdropViewBox.height/2;

      this.display();
    }
  }

  handleMouseUp(ev) {
    if (this.downPosition.x == ev.clientX && this.downPosition.y == ev.clientY) {
      let hit = null;
      this.timelineView.contentViews.forEach(v => {
        if (v.region.contains(ev.target)) {
          hit = v;
          return false;
        }
      });

      if (hit) {
        // this.region.style["filter"] = "invert(1)";
        // document.body.style["background-color"] = "#cccccc";
        // setTimeout(() => {
        //   this.region.style["filter"] = "none";
        //   document.body.style["background-color"] = "#000000";
        //   this.viewpoint = {
        //     "x": hit.position.x + 400/2,
        //     "y": 200
        //   };
        //   this.display();
        // }, 200);

        const startX = this.viewpoint.x;
        const startY = this.viewpoint.y;
        let newX;
        if (hit.isDefocused) {
          newX = hit.position.x + 0.1*400/2
        } else {
          newX = hit.position.x + 400/2;
        }

        animate(0.5, smoothstep, (now) => {
          this.viewpoint.x = startX + now * (newX - startX);
          this.viewpoint.y = startY + now * (200 - startY);
          this.display();
        });
      }
    }

    this.isDragging = false;
    this.downPosition = null;
  }

  setZoom(level) {
    this.zoomLevel = level;

    this.display();
  }

  zoomIn() {
    this.setZoom(this.zoomLevel * 1.2);
  }

  zoomOut() {
    this.setZoom(this.zoomLevel / 1.2);
  }
}

class TimelineModel {
  constructor(timelineContents) {
    this.timelineContents = timelineContents;
  }
}

class TimelineView extends View {
  constructor() {
    super();
    this.timelineModel = [];
    this.contentViews = [];

    this.region = document.getElementById("timeline");
    this.backdrop = document.getElementById("timelineBackdrop");

    this.marks = {};


  }

  setModel(timelineModel) {
    this.timelineModel = timelineModel;
    this.contentViews = [];

    this.needsRedraw = true;

    const docs = this.timelineModel.timelineContents;
    docs.reverse();
    for (let i in docs) {
      const docview = TimelineDocumentView.fromDocumentModel(this.timelineModel.timelineContents[i]);
      this.contentViews.push(docview);
      this.region.appendChild(docview.region);
      docview.setParentView(this);
      if (docview instanceof TimelineLinkView) {
        docview.setIsDefocused(true);
      }
    }

    this.display();
  }

  getChildViews() {
    return this.contentViews;
  }

  display() {
    super.display();
    this.contentViews.forEach(cv => { cv.display() });
  }

  draw() {
    super.draw();

    var xpos = 0;
    for (let i in this.contentViews) {
      const docview = this.contentViews[i];

      const ypos = 200;
      docview.setPosition(xpos, docview.isDefocused ? ypos : ypos - 57.5);

      const datetime = new Date(docview.documentModel["datetime"]);
      const year = datetime.getFullYear();
      const month = datetime.getMonth();
      const day = datetime.getDate();

      if (!(year in this.marks)) {
        this.marks[year] = {
          "x-location": xpos,
          "datetime": datetime,
          "months": {}
        };
      }

      if (!(month in this.marks[year]["months"])) {
        this.marks[year]["months"][month] = {
          "x-location": xpos,
          "datetime": datetime,
          "days": {}
        };
      }

      if (!(day in this.marks[year]["months"][month]["days"])) {
        this.marks[year]["months"][month]["days"][day] = {
          "x-location": xpos,
          "datetime": datetime
        };
      }

      if (docview.isDefocused) {
        xpos += 0.1*400 + 50
      } else {
        xpos += 400 + 50;
      }
    }

    for (let myear in this.marks) {
      const y = this.marks[myear];
      const yearMarkTop = 200 - 20 - 100 - 20 - 200 - 20 - 300;
      const yearMarkBottom = yearMarkTop + 300;
      const yearc = svg("line", {
        "x1": y["x-location"] - 25,
        "y1": yearMarkTop,
        "x2": y["x-location"] - 25,
        "y2": yearMarkBottom,
        "stroke": "#ffffff",
        "stroke-width": 5
      });
      this.backdrop.appendChild(yearc);
      const yearMarkLabel = svg("text", {
        "x": y["x-location"] ,
        "y": yearMarkTop + 175,
        "fill": "#ffffff"
      });
      yearMarkLabel.innerHTML = myear;
      yearMarkLabel.style["font-size"] = 300 - 50;
      this.backdrop.appendChild(yearMarkLabel);

      for (let mmonth in y["months"]) {
        const m = y["months"][mmonth];
        const monthMarkTop = 200 - 20 - 100 - 20 - 200;
        const monthMarkBottom = monthMarkTop + 200;
        const monthc = svg("line", {
          "x1": m["x-location"] - 25,
          "y1": monthMarkTop,
          "x2": m["x-location"] - 25,
          "y2": monthMarkBottom,
          "stroke": "#ffffff",
          "stroke-width": 5
        });
        this.backdrop.appendChild(monthc);
        const monthMarkLabel = svg("text", {
          "x": m["x-location"] ,
          "y": monthMarkTop + 105,
          "fill": "#ffffff"
        });
        monthMarkLabel.innerHTML = (new Intl.DateTimeFormat('en-US', { "month": "short" })).format(m["datetime"]);
        monthMarkLabel.style["font-size"] = 200 - 50;
        this.backdrop.appendChild(monthMarkLabel);

        for (let mday in m["days"]) {
          const d = m["days"][mday];
          const dayMarkTop = 200 - 20 - 100;
          const dayMarkBottom = dayMarkTop + 100;
          const dayc = svg("line", {
            "x1": d["x-location"] - 25,
            "y1": dayMarkTop,
            "x2": d["x-location"] - 25,
            "y2": dayMarkBottom,
            "stroke": "#ffffff",
            "stroke-width": 5
          });
          this.backdrop.appendChild(dayc);
          const dayMarkLabel = svg("text", {
            "x": d["x-location"] ,
            "y": dayMarkTop + 35,
            "fill": "#ffffff"
          });
          dayMarkLabel.innerHTML = d["datetime"].getDate(); //(new Intl.DateTimeFormat('en-US', { "day": "long" })).format(m["datetime"]);
          dayMarkLabel.style["font-size"] = 100 - 50;
          this.backdrop.appendChild(dayMarkLabel);
        }
      }
    }
  }

  setIsVisible(yn) {
    this.region.style["display"] = yn ? "block" : "none";
    this.backdrop.setAttribute("display", yn ? "inline" : "none");
  }

  setPosition(x,y) {
    super.setPosition(x,y);
  }

  getSize() {
    const bbs = this.contentViews.map(v => v.getBoundingRect());
    if (bbs.length == 0) {
      return new Rect(0,0,0,0);
    } else {
      var bb = bbs[0];
      for (let i = 1; i < bbs.length; i++) {
        bb = bb.union(bbs[i]);
      }
      return bb;
    }
  }

  setIsDefocused(id, yn) {
    this.contentViews.forEach(v => {
      if (v.documentModel["id"] == id) {
        v.setIsDefocused(yn);
      }
    });

    this.needsRedraw = true;
    this.display();
  }
}

class TimelineDocumentView extends View {
  constructor(documentModel) {
    super();
    this.documentModel = documentModel;
    this.isDefocused = false;

    this.region = document.createElement("div");
    this.region.classList.add("documentView")

    this.titleDescription = document.createElement("div");
    this.titleDescription.classList.add("titleDescription");
    this.region.appendChild(this.titleDescription);

    this.titleID = document.createElement("div");
    this.titleID.classList.add("titleID");
    this.titleID.innerHTML = this.documentModel["id"];
    this.region.appendChild(this.titleID);

    this.titleDatetime = document.createElement("div");
    this.titleDatetime.classList.add("titleDatetime");
    this.titleDatetime.innerHTML = this.documentModel["datetime"];
    this.region.appendChild(this.titleDatetime);
  }

  description() { return "document"; }

  display() {
    super.display();
    this.titleDescription.innerHTML = this.description();
  }

  getBoundingRect() {
    const bb = this.region.getBoundingClientRect();
    if (this.isDefocused) {
      return new Rect(bb.x, bb.y, 0.1*bb.width, 0.1*bb.height);
    } else {
      return new Rect(bb.x, bb.y, bb.width, bb.height);
    }
  }

  setIsDefocused(yn) {
    this.isDefocused = yn;
    if (this.isDefocused) {
      this.region.classList.add("defocused");
    } else {
      this.region.classList.remove("defocused");
    }
  }

  static fromDocumentModel(documentModel) {
    let doc;
    if ("text" == documentModel["type"]) {
      doc = new TimelineTextView(documentModel);
    } else if ("link" == documentModel["type"]) {
      doc = new TimelineLinkView(documentModel);
    } else if ("media" == documentModel["type"]) {
      doc = new TimelineMediaView(documentModel);
    } else if ("compound" == documentModel["type"]) {
     doc = new TimelineCompoundView(documentModel);
    } else {
      console.log("WHAT", documentModel);
      doc = new TimelineTextView({
        "id": documentModel["id"],
        "datetime": "NONE",
        "type": "text",
        "text": "some " + documentModel["type"] + "view" + "<br/>foo bar baz<br/>foo bar baz<br/>foo bar baz<br/>foo bar baz<br/>foo bar baz<br/>foo bar baz<br/>foo bar baz<br/>foo bar baz<br/>foo bar baz<br/>foo bar baz<br/>foo bar baz<br/>foo bar baz<br/>foo bar baz<br/>foo bar baz<br/>foo bar baz<br/>foo bar baz<br/>foo bar baz<br/>foo bar baz<br/>foo bar baz<br/>foo bar baz<br/>foo bar baz<br/>foo bar baz<br/>foo bar baz<br/>foo bar baz<br/>foo bar baz<br/>foo bar baz<br/>foo bar baz<br/>foo bar baz"
      })
    }
    return doc;
  }
}

class TimelineTextView extends TimelineDocumentView {
  constructor(documentModel) {
    super(documentModel);

    this.contentRegion = document.createElement("div");
    this.region.appendChild(this.contentRegion);
    this.contentRegion.classList.add("contentRegion");
    this.contentRegion.classList.add("textView");
    this.contentRegion.innerHTML = documentModel["text"];
  }

  description() {
    return "text";
  }
}

class TimelineLinkView extends TimelineDocumentView {
  constructor(documentModel) {
    super(documentModel);

    this.contentRegion = document.createElement("div");
    this.region.appendChild(this.contentRegion);
    this.contentRegion.classList.add("contentRegion");
    this.contentRegion.classList.add("linkView");

    let s = documentModel["link_type"];
    for (let endset in documentModel["endsets"]) {
      s += "<br/>" + endset + ":";
      for (let addr in documentModel["endsets"][endset]) {
        s += "<br/>&nbsp;&nbsp;" + addr;
      }
    }
    this.contentRegion.innerHTML = s;

  }

  description() {
    return "link";
  }
}

class TimelineMediaView extends TimelineDocumentView {
  constructor(documentModel) {
    super(documentModel);

    const r = makeMedia(documentModel["filename"]);
    this.mediaType = r.mediaType;

    this.contentRegion = r.mediaElement;
    this.region.appendChild(this.contentRegion);
    this.contentRegion.classList.add("mediaView");
    this.contentRegion.classList.add("contentRegion");
  }

  description() {
    return "media (" + this.mediaType + ")";
  }
}

class TimelineCompoundView extends TimelineDocumentView {
  constructor(documentModel) {
    super(documentModel);

    this.contentRegion = document.createElement("div");
    this.region.appendChild(this.contentRegion);
    this.contentRegion.classList.add("contentRegion");
    this.contentRegion.classList.add("compoundView");

    let spans = [];
    let previous = null;
    this.documentModel["resolved_transclusions"].forEach(tx => {
      if ("text" == tx["type"]) {
        if (previous && previous != "text") {
          this.contentRegion.append(document.createElement("br"));
        }
        const s = document.createElement("span");
        s.innerHTML = tx["text"];
        spans.push(s);
        previous = "text";

      } else if ("media" == tx["type"]) {
        if (spans.length > 0) {
          if (previous != "text") {
            this.contentRegion.append(document.createElement("br"));
          }
          spans.forEach(s => {
            this.contentRegion.append(s);
          });
          spans = [];
          previous = "text";
        }

        if (previous != "media") {
          this.contentRegion.append(document.createElement("br"));
        }

        const r = makeMedia(tx["filename"]);
        this.contentRegion.append(r.mediaElement);
        previous = "media";
      }
    });

    if (spans.length > 0) {
      spans.forEach(s => {
        this.contentRegion.append(s);
      });
      spans = [];
    }
  }

  description() {
    return "compound";
  }
}

function makeMedia(filename) {
  let parts = filename.split(".");
  const extension = parts[1];
  const mediaType = MEDIATYPES[extension];
  let mediaElement;


  if (mediaType == "image") {
    let img = document.createElement("img");
    img.setAttribute("src", "/api/timeline/" + filename)

    mediaElement = img;

  } else if (mediaType == "audio") {
    let aud = document.createElement("audio");
    aud.setAttribute("controls", "controls");

    let src = document.createElement("source");
    src.setAttribute("src", "/api/timeline/" + filename);

    aud.appendChild(src);
    mediaElement = aud


  } else if (mediaType == "video") {
    let vid = document.createElement("video");
    vid.setAttribute("controls", "controls");

    let src = document.createElement("source");
    src.setAttribute("src", "/api/timeline/" + filename);

    vid.appendChild(src);
    mediaElement = vid;
  }

  mediaElement.setAttribute("draggable", "false");

  return {
    "extension": extension,
    "mediaType": mediaType,
    "mediaElement": mediaElement
  };
}








function main() {
  fetch("/api/timeline").then(response => {
    response.json().then(timelineContents => {
      const model = new TimelineModel(timelineContents);
      const mainView = new MainView(model);
      setTimeout(() => { mainView.display(); }, 200);

      mainView.display();
    });
  });
}

main();
