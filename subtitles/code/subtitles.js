"use strict";

// A full list of supported features can be found here: https://github.com/AniDevTwitter/animeopenings/wiki/Subtitle-Features

function subtitleRenderer(SC, video, subFile) {
	var counter = 1;
	var fontsizes = {};
	var lastTime = -1;
	var _this = this;
	var renderer = this;
	var stopped = false;
	var assdata, resizeRequest, splitLines, styleCSS, subtitles, TimeOffset, PlaybackSpeed;

	// SC == Subtitle Container
	SC.innerHTML = "<defs></defs>";

	var map = {
		"b" : function(arg,ret) {
			if (arg && +arg) ret.style["font-weight"] = (arg == "1") ? "bold" : arg;
			else delete ret.style["font-weight"];
		},
		"i" : function(arg,ret) {
			if (arg && +arg) ret.style["font-style"] = "italic";
			else delete ret.style["font-style"];
		},
		"u" : function(arg,ret) {
			if (arg && +arg) {
				if (ret.style["text-decoration"]) ret.style["text-decoration"] = "underline line-through";
				else ret.style["text-decoration"] = "underline";
			} else {
				if (ret.style["text-decoration"].indexOf("line-through")+1) ret.style["text-decoration"] = "line-through";
				else delete ret.style["text-decoration"];
			}
		},
		"s" : function(arg,ret) {
			if (arg && +arg) {
				if (ret.style["text-decoration"]) ret.style["text-decoration"] = "underline line-through";
				else ret.style["text-decoration"] = "line-through";
			} else {
				if (ret.style["text-decoration"].indexOf("underline")+1) ret.style["text-decoration"] = "underline";
				else delete ret.style["text-decoration"];
			}
		},
		"alpha" : function(arg) {
			if (!arg) {
				var pStyle = renderer.style[this.style.Name];
				this.style.c1a = pStyle.c1a;
				this.style.c2a = pStyle.c2a;
				this.style.c3a = pStyle.c3a;
				this.style.c4a = pStyle.c4a;
			} else {
				arg = arg.slice(2,-1); // remove 'H' and '&'s
				var a = 1 - (parseInt(arg,16) / 255);
				this.style.c1a = a; // primary fill
				this.style.c2a = a; // secondary fill (for karaoke)
				this.style.c3a = a; // border
				this.style.c4a = a; // shadow
			}
		},
		"1a" : function(arg) {
			this.style.c1a = 1 - (parseInt(arg.slice(2,-1),16) / 255);
		},
		"2a" : function(arg) {
			this.style.c2a = 1 - (parseInt(arg.slice(2,-1),16) / 255);
		},
		"3a" : function(arg) {
			this.style.c3a = 1 - (parseInt(arg.slice(2,-1),16) / 255);
		},
		"4a" : function(arg) {
			this.style.c4a = 1 - (parseInt(arg.slice(2,-1),16) / 255);
		},
		"a" : function(arg) {
			if (typeof(this.style.Alignment) == "string") {
				if (arg == 0) arg = parseInt(renderer.style[this.style.Name].Alignment,10);
				else {
					arg = parseInt(arg,10);
					switch (arg) {
						case 5: arg = 7; break;
						case 6: arg = 8; break;
						case 7: arg = 9; break;
						case 9: arg = 4; break;
						case 10: arg = 5; break;
						case 11: arg = 6;
					}
				}
				this.style.Alignment = arg;
			}
		},
		"an" : function(arg) {
			if (typeof(this.style.Alignment) == "string") {
				if (arg == 0) arg = renderer.style[this.style.Name].Alignment;
				this.style.Alignment = parseInt(arg,10);
			}
		},
		"be" : function(arg) {
			this.style.Blur = arg;
		},
		"blur" : function(arg) {
			this.style.Blur = arg;
		},
		"bord" : function(arg) {
			this.style.Outline = arg;
		},
		"xbord" : function(arg) {
			// ?
		},
		"ybord" : function(arg) {
			// ?
		},
		"c" : function(arg) {
			map["1c"].call(this,arg);
		},
		"1c" : function(arg) {
			if (arg.substr(8,2) != "&") {
				this.style.c1a = 1 - (parseInt(arg.substr(2,2),16) / 255);
				arg = arg.substr(2);
			}
			this.style.c1r = parseInt(arg.substr(6,2),16);
			this.style.c1g = parseInt(arg.substr(4,2),16);
			this.style.c1b = parseInt(arg.substr(2,2),16);
		},
		"2c" : function(arg) {
			if (arg.substr(8,2) != "&") {
				this.style.c2a = 1 - (parseInt(arg.substr(2,2),16) / 255);
				arg = arg.substr(2);
			}
			this.style.c2r = parseInt(arg.substr(6,2),16);
			this.style.c2g = parseInt(arg.substr(4,2),16);
			this.style.c2b = parseInt(arg.substr(2,2),16);
		},
		"3c" : function(arg) {
			if (arg.substr(8,2) != "&") {
				this.style.c3a = 1 - (parseInt(arg.substr(2,2),16) / 255);
				arg = arg.substr(2);
			}
			this.style.c3r = parseInt(arg.substr(6,2),16);
			this.style.c3g = parseInt(arg.substr(4,2),16);
			this.style.c3b = parseInt(arg.substr(2,2),16);
		},
		"4c" : function(arg) {
			if (arg.substr(8,2) != "&") {
				this.style.c4a = 1 - (parseInt(arg.substr(2,2),16) / 255);
				arg = arg.substr(2);
			}
			this.style.c4r = parseInt(arg.substr(6,2),16);
			this.style.c4g = parseInt(arg.substr(4,2),16);
			this.style.c4b = parseInt(arg.substr(2,2),16);
		},
		"clip(" : function(arg) {
			arg = arg.slice(0,-1).split(",");
			if (this.clip) SC.getElementById("clip" + this.clip.num).remove();
			var mask = "<mask id='clip" + counter + "' maskUnits='userSpaceOnUse'><path d='";

			if (arg.length == 4)
				mask += "M " + arg[0] + " " + arg[1] + " L " + arg[2] + " " + arg[1] + " " + arg[2] + " " + arg[3] + " " + arg[0] + " " + arg[3];
			else if (arg.length == 2)
				mask += pathASStoSVG(arg[1], arg[0]);
			else
				mask += pathASStoSVG(arg[0], 1);

			SC.getElementsByTagName("defs")[0].innerHTML += mask + "' /></mask>";

			this.clip = {"type" : "mask", "num" : counter++};
		},
		"iclip(" : function(arg) {
			arg = arg.slice(0,-1).split(",");
			if (this.clip) SC.getElementById("clip" + this.clip.num).remove();
			var clip = "<clipPath id='clip" + counter + "'><path d='";

			if (arg.length == 4)
				clip += "M " + arg[0] + " " + arg[1] + " L " + arg[2] + " " + arg[1] + " " + arg[2] + " " + arg[3] + " " + arg[0] + " " + arg[3];
			else if (arg.length == 2)
				clip += pathASStoSVG(arg[1], arg[0]);
			else
				clip += pathASStoSVG(arg[0], 1);

			SC.getElementsByTagName("defs")[0].innerHTML += clip + "' /></clipPath>";

			this.clip = {"type" : "clip-path", "num" : counter++};
		},
		"fad(" : function(arg) {
			arg = arg.slice(0,-1).split(",");
			var time = this.time.milliseconds;
			this.addFade(255,0,255,0,arg[0],time-arg[1],time);
		},
		"fade(" : function(arg) {
			arg = arg.slice(0,-1).split(",");
			this.addFade(arg[0],arg[1],arg[2],arg[3],arg[4],arg[5],arg[6]);
		},
		"fax" : function(arg) {
			this.transforms["fax"] = "matrix(1,0," + arg + ",1,0,0)";
		},
		"fay" : function(arg) {
			this.transforms["fay"] = "matrix(1," + arg + ",0,1,0,0)";
		},
		"fn" : function(arg,ret) {
			var size = getFontSize(arg,this.style.Fontsize);
			this.style.Fontname = arg;
			this.style.Fontsize = size;
			ret.style["font-family"] = arg;
			ret.style["font-size"] = size + "px";
		},
		"fr" : function(arg) {
			map["frz"].call(this,arg);
		},
		"frx" : function(arg) {
			this.transforms["frx"] = "rotateX(" + arg + "deg)";
		},
		"fry" : function(arg) {
			this.transforms["fry"] = "rotateY(" + arg + "deg)";
		},
		"frz" : function(arg) {
			this.transforms["frz"] = "rotateZ(" + -(this.style.Angle + parseFloat(arg)) + "deg)";
		},
		"fs" : function(arg,ret) {
			var size;

			if (!arg || arg == "0")
				size = getFontSize(this.style.Fontname,renderer.style[this.style.Name].Fontsize);
			else if (arg.charAt(0) == "+" || arg.charAt(0) == "-")
				size = this.style.Fontsize * (1 + (parseInt(arg) / 10));
			else size = getFontSize(this.style.Fontname,arg);

			this.style.Fontsize = size;
			ret.style["font-size"] = size + "px";
		},
		"fscx" : function(arg) {
			if (!arg || arg == "0") arg = renderer.style[this.style.Name].ScaleX;
			this.style.ScaleX = arg;
			this.transforms["fscx"] = "scaleX(" + arg / 100 + ")";
		},
		"fscy" : function(arg) {
			if (!arg || arg == "0") arg = renderer.style[this.style.Name].ScaleY;
			this.style.ScaleY = arg;
			this.transforms["fscy"] = "scaleY(" + arg / 100 + ")";
		},
		"fsp" : function(arg,ret) {
			if (arg == "0") arg = this.style.Spacing;
			ret.style["letter-spacing"] = arg + "px";
		},
		"k" : function(arg,ret) {
			setKaraokeColors.call(this,arg,ret,false);
		},
		"K" : function(arg,ret) {
			map["kf"].call(this,arg,ret);
		},
		"kf" : function(arg,ret) {
			let startTime = this.karaokeTimer;
			let endTime = startTime + arg * 10;

			let startColor = "rgba(" + this.style.c2r + "," + this.style.c2g + "," + this.style.c2b + "," + this.style.c2a + ")";
			let endColor = "rgba(" + this.style.c1r + "," + this.style.c1g + "," + this.style.c1b + "," + this.style.c1a + ")";
			let grad = document.createElementNS("http://www.w3.org/2000/svg","linearGradient");
				grad.innerHTML = "<stop offset='0' stop-color='" + endColor + "'></stop><stop stop-color='" + startColor + "'></stop>";
				grad.id = "gradient" + counter;
			SC.getElementsByTagName("defs")[0].appendChild(grad);

			ret.style.fill = "url(#gradient" + counter + ")";

			if (!this.kf) this.kf = [counter];
			else this.kf.push(counter);

			let index = ret.classes.findIndex(str => /kf[0-9]+/.test(str));
			if (index > -1) ret.classes[index] = "kf" + counter;
			else ret.classes.push("kf"+counter);

			let vars = {"num" : counter};
			this.updates["kf"+counter] = function(_this,t) {
				if (!vars.start) {
					let range = document.createRange();
					vars.node = SC.querySelector(".kf" + vars.num);
					if (!vars.node) {
						delete _this.updates["kf"+vars.num];
						return;
					}
					range.selectNodeContents(vars.node);
					let eSize = range.getBoundingClientRect();
					let pSize = _this.div.getBoundingClientRect();
					vars.start = (eSize.left - pSize.left) / pSize.width;
					vars.frac = eSize.width / pSize.width;
					vars.gradStop = SC.getElementById("gradient" + vars.num).firstChild;
				}

				vars.node.style.fill = "url(#gradient" + vars.num + ")";
				if (t <= startTime) vars.gradStop.setAttribute("offset", vars.start);
				else if (startTime < t && t < endTime) {
					let val = vars.start + vars.frac * (t - startTime) / (endTime - startTime);
					vars.gradStop.setAttribute("offset", val);
				} else vars.gradStop.setAttribute("offset", vars.start + vars.frac);
			};

			++counter;
			this.karaokeTimer = endTime;
		},
		"ko" : function(arg,ret) {
			setKaraokeColors.call(this,arg,ret,true);
		},
		"kt" : function(arg) {
			this.karaokeTimer = parseFloat(arg);
		},
		"_k" : function(arg,ret) {
			let color = this["k"+arg];
			ret.style.fill = "rgba(" + color.r + "," + color.g + "," + color.b + "," + color.a + ")";
			this.style.c1r = color.r;
			this.style.c1g = color.g;
			this.style.c1b = color.b;
			this.style.c1a = color.a;
			this.style.c3a = color.o;
		},
		"move(" : function(arg) {
			arg = arg.slice(0,-1).split(",");
			this.addMove(arg[0],arg[1],arg[2],arg[3],arg[4],arg[5]);
		},
		"org(" : function(arg) {
			arg = arg.slice(0,-1).split(",");
			this.tOrg = arg[0] + "px " + arg[1] + "px";
		},
		"p" : function(arg,ret) {
			ret.hasPath = parseFloat(arg);
			if (ret.hasPath) this.pathOffset.y = 0;
		},
		"pbo" : function(arg) {
			this.pathOffset.y = parseInt(arg,10);
		},
		"pos(" : function(arg) {
			arg = arg.slice(0,-1).split(",");
			this.style.position.x = arg[0];
			this.style.position.y = arg[1];
		},
		"q" : function(arg) {
			if (arg) this.WrapStyle = parseInt(arg);
			else delete this.WrapStyle;
		},
		"r" : function(arg,ret) {
			var pos = this.style.position;
			var style = (!arg ? this.style.Name : (renderer.style[arg] ? arg : this.style.Name));
			ret.classes.push("subtitle_" + style.replace(/ /g,"_"));
			this.style = JSON.parse(JSON.stringify(renderer.style[style]));
			this.style.position = pos;
		},
		"shad" : function(arg) {
			this.style.ShOffX = arg;
			this.style.ShOffY = arg;
		},
		"xshad" : function(arg) {
			this.style.ShOffX = arg;
			if (!this.style.ShOffY) this.style.ShOffY = 0;
		},
		"yshad" : function(arg) {
			if (!this.style.ShOffX) this.style.ShOffX = 0;
			this.style.ShOffY = arg;
		}
	};

	function BBox(E) {
		let box;
		try {
			box = E.getBBox();
		} catch(e) {
			SC.appendChild(E);
			box = E.getBBox();
			E.remove();
		}
		return box;
	}
	function timeConvert(HMS) {
		var t = HMS.split(":");
		return t[0]*3600 + t[1]*60 + parseFloat(t[2]);
	}
	function pathASStoSVG(path,scale) {
		// This function converts an ASS style path to a SVG style path.

		// scale path
		path = path.replace(/\d+/g, M => scale * parseFloat(M));

		path = path.toLowerCase();
		path = path.replace(/b/g,"C");	// cubic bezier curve to point 3 using point 1 and 2 as the control points
		path = path.replace(/c/g,"Z");	// close b-spline
		path = path.replace(/l/g,"L");	// line-to <x>, <y>
		path = path.replace(/m/g,"M");	// move-to <x>, <y>
		path = path.replace(/n/g,"M");	// move-to <x>, <y> (without closing shape)
		path = path.replace(/p/g,"");	// extend b-spline to <x>, <y>
		path = path.replace(/s/g,"C");	// 3rd degree uniform b-spline to point N, contains at least 3 coordinates
		return path + " Z";				// close path at the end
	}
	function getFontSize(font,size) {
		size = (+size).toFixed(2);

		if (!fontsizes[font]) {
			fontsizes[font] = {};
			if (document.fonts) {
				document.fonts.load("0 " + font).then(function() {
					fontsizes[font] = {};
					write_styles();
					return getFontSize(font,size);
				});
			}
		}

		if (!fontsizes[font][size]) {
			let temp = SC.style.transform;
			SC.style.transform = "scale(1)";

			var sampleText = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
			var smallE = document.createElementNS("http://www.w3.org/2000/svg","text");
				smallE.style.display = "block";
				smallE.style.fontFamily = font;
				smallE.style.fontSize = 100 + "px";
				smallE.style.opacity = 0;
				smallE.innerHTML = sampleText;
			var bigE = document.createElementNS("http://www.w3.org/2000/svg","text");
				bigE.style.display = "block";
				bigE.style.fontFamily = font;
				bigE.style.fontSize = 300 + "px";
				bigE.style.opacity = 0;
				bigE.innerHTML = sampleText;

			SC.appendChild(smallE);
			SC.appendChild(bigE);
			var scale = (200 / (bigE.getBoundingClientRect().height - smallE.getBoundingClientRect().height));
			smallE.remove();
			bigE.remove();

			fontsizes[font][size] = {"size" : size * (scale >= 1 ? 1 / scale : scale), "offset" : 0, "height" : 0};
			fontsizes[font][size].offset = -(size - fontsizes[font][size].size) / 4; // 4?

			var finalE = document.createElementNS("http://www.w3.org/2000/svg","text");
				finalE.style.display = "block";
				finalE.style.fontFamily = font;
				finalE.style.fontSize = fontsizes[font][size].size + "px";
				finalE.style.opacity = 0;
				finalE.innerHTML = sampleText;
			SC.appendChild(finalE);
			fontsizes[font][size].height = finalE.getBoundingClientRect().height;
			finalE.remove();

			SC.style.transform = temp;
		}

		return fontsizes[font][size].size;
	}
	function setKaraokeColors(arg,ret,isko) { // for \k and \ko
		if (!this.initialColors) {
			this.initialColors = {
				"r" : this.style.c1r,
				"g" : this.style.c1g,
				"b" : this.style.c1b,
				"a" : this.style.c1a,
				"o" : this.style.c3a
			};
		}

		this["k"+counter] = {
			"r" : this.initialColors.r,
			"g" : this.initialColors.g,
			"b" : this.initialColors.b,
			"a" : this.initialColors.a,
			"o" : this.initialColors.o
		};

		if (isko) this.style.c3a = 0;
		else {
			ret.style.fill = "rgba(" + this.style.c2r + "," + this.style.c2g + "," + this.style.c2b + "," + this.style.c2a + ")";
			this.style.c1r = this.style.c2r;
			this.style.c1g = this.style.c2g;
			this.style.c1b = this.style.c2b;
			this.style.c1a = this.style.c2a;
		}

		let index = ret.classes.findIndex(str => /transition[0-9]+/.test(str));
		if (index > -1) ret.classes.splice(index, 1);
		this.addTransition(ret, this.karaokeTimer + "," + this.karaokeTimer, "\\_k" + counter, counter);
		this.karaokeTimer += arg * 10;
		++counter;
	}

	function subtitle(data,lineNum) {
		let _this = this;
		this.time = {"start" : timeConvert(data.Start), "end" : timeConvert(data.End)};
		this.time.milliseconds = (this.time.end - this.time.start) * 1000;
		this.pathOffset = {x:0,y:0};
		this.visible = false;

		let Margin = {"L" : (data.MarginL && parseInt(data.MarginL)) || renderer.style[data.Style].MarginL,
					  "R" : (data.MarginR && parseInt(data.MarginR)) || renderer.style[data.Style].MarginR,
					  "V" : (data.MarginV && parseInt(data.MarginV)) || renderer.style[data.Style].MarginV};

		// These functions get the dimensions of the text relative to the window,
		// so make sure to remove the scaling on the SC before using them (and put it back after).
		this.width = function() {
			var range = new Range();
			range.selectNodeContents(this.div);
			return range.getBoundingClientRect().width + this.pathOffset.x;
		};
		this.height = function() {
			var range = new Range();
			range.selectNodeContents(this.div);
			return range.getBoundingClientRect().height;
		};

		this.start = function(time) {
			this.style = JSON.parse(JSON.stringify(renderer.style[data.Style])); // deep clone

			this.div = document.createElementNS("http://www.w3.org/2000/svg", "text");
			var TD = this.div;
			TD.setAttribute("class", "subtitle_" + data.Style);

			this.callbacks = {};
			this.transforms = {};
			this.updates = {};
			this.style.position = {};

			if (Margin.L) TD.style["margin-left"] = Margin.L + "px";
			if (Margin.R) TD.style["margin-right"] = Margin.R + "px";
			if (Margin.V) {
				TD.style["margin-top"] = Margin.V + "px";
				TD.style["margin-bottom"] = Margin.V + "px";
			}

			TD.innerHTML = parse_text_line(data.Text);

			this.group = document.createElementNS("http://www.w3.org/2000/svg", "g");
			this.group.setAttribute("id", "line" + lineNum);
			this.group.appendChild(TD);

			if (this.box) {
				var TB = this.box;
				var TS = this.style;
				var A = parseInt(TS.Alignment,10);
				var B = parseFloat(TB.style.strokeWidth);
				var W = parseFloat(getComputedStyle(TD).width);
				var H = parseFloat(getComputedStyle(TD).height);
				var X = parseFloat(TD.getAttribute("x"));
				var Y = parseFloat(TD.getAttribute("y"));

				if (A%3 == 0) X -= W; // 3, 6, 9
				else if ((A+1)%3 == 0) X -= W / 2; // 2, 5, 8

				if (A < 7) {
					if (A < 4) Y -= H;
					else Y -= H / 2;
				}

				TB.setAttribute("x", X - B);
				TB.setAttribute("y", Y + B);
				TB.setAttribute("width", W + 2*B);
				TB.setAttribute("height", H + 2*B);
				this.group.insertBefore(TB,TD);
			}
			if (this.paths) for (var path of this.paths) this.group.insertBefore(path,TD);
			if (this.clip) this.group.setAttribute(this.clip.type, "url(#clip" + this.clip.num + ")");

			SC.getElementById("layer" + data.Layer).appendChild(this.group);

			updateAlignment();
			this.updatePosition();
			this.visible = true;
		};
		this.update = function(t) {
			let time = t * 1000;
			for (let key in this.updates)
				this.updates[key](this,time);
			for (let key in this.callbacks) {
				let callback = this.callbacks[key];
				if (callback.t <= time) {
					callback.f(this);
					delete this.callbacks[key];
				}
			}
		};
		this.cleanup = function() {
			if (this.group) this.group.remove();
			if (this.kf) for (var num of this.kf) SC.getElementById("gradient" + num).remove();
			if (this.clip) SC.getElementById("clip" + this.clip.num).remove();

			this.group = null;
			this.box = null;
			this.div = null;
			this.paths = null;

			this.kf = null;
			this.clip = null;

			this.visible = false;
		};

		function parse_text_line(line) {
			_this.karaokeTimer = 0;

			function createPath(line,scale) {
				// Given an ASS "Dialogue:" line, this function finds the first path in the line and converts it
				// to SVG format. It then returns an object containing both versions of the path (ASS and SVG).

				line = line.slice(line.search(/\\p-?\d+/)+3);
				line = line.slice(line.indexOf("}")+1);
				if (line.indexOf("{") >= 0) line = line.slice(0,line.indexOf("{"));

				return {"ass" : line, "svg" : pathASStoSVG(line,scale)};
			}
			function updateShadows(ret) {
				var fillColor = ret.style.fill;
				var borderColor = ret.style.stroke;
				var shadowColor = "rgba(" + _this.style.c4r + "," + _this.style.c4g + "," + _this.style.c4b + "," + _this.style.c4a + ")";
				_this.div.style.filter = "";
				if (_this.style.BorderStyle != 3) { // Outline and Shadow
					if (_this.style.Blur) // \be, \blur
						_this.div.style.filter += "drop-shadow( 0 0 " + _this.style.Blur + "px " + (_this.style.Outline ? borderColor : fillColor) + ") ";
					if (_this.style.ShOffX != 0 || _this.style.ShOffY != 0) // \shad, \xshad, \yshad
						_this.div.style.filter += "drop-shadow(" + _this.style.ShOffX + "px " + _this.style.ShOffY + "px 0 " + shadowColor + ")";
				} else { // Border Box
					if (!_this.box) _this.box = document.createElementNS("http://www.w3.org/2000/svg", "rect");
					_this.box.setAttribute("fill", borderColor);
					_this.box.style.stroke = (_this.style.Outline ? borderColor : fillColor);
					_this.box.style.strokeWidth = ret.style["stroke-width"];
					ret.style["stroke-width"] = "0px";

					if (_this.style.Blur) // \be, \blur
						_this.div.style.filter = "drop-shadow( 0 0 " + _this.style.Blur + "px " + fillColor + ")";
					if (_this.style.ShOffX != 0 || _this.style.ShOffY != 0) // \shad, \xshad, \yshad
						_this.box.style.filter = "drop-shadow(" + _this.style.ShOffX + "px " + _this.style.ShOffY + "px 0 " + shadowColor + ")";
					else _this.box.style.filter = "";
				}
				if (_this.paths) {
					for (var path of _this.paths) {
						path.style.filter = "";
						if (_this.style.Blur) // \be, \blur
							path.style.filter += "drop-shadow( 0 0 " + _this.style.Blur + "px " + shadowColor + ") ";
						if (_this.style.ShOffX != 0 || _this.style.ShOffY != 0) // \shad, \xshad, \yshad
							path.style.filter += "drop-shadow(" + _this.style.ShOffX + "px " + _this.style.ShOffY + "px 0 " + shadowColor + ")";
					}
				}
			}

			let overrides = line.match(/{.*?}/g) || ["}"];
			let ret = {"style" : {}, "classes" : []};
			_this.pathOffset.x = 0; // Horizontal Path Offset
			for (let match of overrides) { // match == "{...}"
				override_to_html(match,ret);

				if (ret.hasPath) {
					let path = createPath(line,ret.hasPath);
					line = line.replace(path.ass,""); // remove .ass path commands

					let classes = _this.div.getAttribute("class");
					if (ret.classes.length) classes += " " + ret.classes.join(" ");

					let styles = "display:block;";
					for (let x in ret.style) styles += x + ":" + ret.style[x] + ";";

					let E = document.createElementNS("http://www.w3.org/2000/svg","path");
						E.setAttribute("d",path.svg);
						E.setAttribute("class",classes);
						E.setAttribute("style",styles);

					if (!_this.paths) _this.paths = [E];
					else _this.paths.push(E);

					let A = _this.style.Alignment;
					if (A % 3) { // 1, 2, 4, 5, 7, 8
						let offset = BBox(E).width;
						if ((A + 1) % 3 == 0) // 2, 5, 8
							offset /= 2;
						_this.pathOffset.x += offset * _this.style.ScaleX / 100;
					}
				}

				updateShadows(ret);

				let retval = "</tspan><tspan style=\"";
				for (let x in ret.style) retval += x + ":" + ret.style[x] + ";";
				if (ret.classes.length) retval += "\" class=\"" + ret.classes.join(" ");
				if (_this.pathOffset.x && !ret.hasPath) {
					retval += "\" dx=\"" + _this.pathOffset.x;
					_this.pathOffset.x = 0;
				}
				retval += "\">";

				line = line.replace(match, retval);
			}
			return line + "</tspan>";
		}
		function override_to_html(match,ret) {
			// Remove {,} tags and first "\", then split on the remaining "\".
			let options = match.slice(match.indexOf("\\")+1,-1).split("\\");

			let transition = 0;
			let transitionString = "";
			let transline = "";
			for (let key in options) {
				let option = options[key].trim();

				if (transition) {
					transline += "\\" + option;
					transition += option.split("(").length - 1;
					transition -= option.split(")").length - 1;
				} else if (option.slice(0,2) == "t(") {
					++transition;
					transitionString = option.slice(2,-1);
					transline = "";
				} else {
					let i = 1 + Math.min(option.length, 6);
					while (i --> 0) {
						if (map[option.slice(0,i)]) {
							map[option.slice(0,i)].call(_this, option.slice(i), ret);
							break;
						}
					}
					if (!i) ret.classes.push(option);
				}

				if (transline && !transition) {
					_this.addTransition(ret,transitionString,transline.slice(0,-1),counter);
					++counter;
				}
			}

			// update colors
			if (!ret.style.fill || (ret.style.fill && (ret.style.fill.slice(0,4) != "url("))) ret.style.fill = "rgba(" + _this.style.c1r + "," + _this.style.c1g + "," + _this.style.c1b + "," + _this.style.c1a + ")";
			ret.style.stroke = "rgba(" + _this.style.c3r + "," + _this.style.c3g + "," + _this.style.c3b + "," + _this.style.c3a + ")";
			ret.style["stroke-width"] = _this.style.Outline + "px";
		}

		this.addFade = function(a1,a2,a3,t1,t2,t3,t4) {
			var o1 = 1 - a1/255;
			var o2 = 1 - a2/255;
			var o3 = 1 - a3/255;
			_this.div.style.opacity = o1; // Prevent flickering at the start.
			_this.updates["fade"] = function(_this,t) {
				if (t <= t1) _this.div.style.opacity = o1;
				else if (t1 < t && t < t2) _this.div.style.opacity = o1 + (o2-o1) * (t-t1) / (t2-t1);
				else if (t2 < t && t < t3) _this.div.style.opacity = o2;
				else if (t3 < t && t < t4) _this.div.style.opacity = o2 + (o3-o2) * (t-t3) / (t4-t3);
				else _this.div.style.opacity = o3;
			};
		};
		this.addMove = function(x1,y1,x2,y2,t1,t2,accel) {
			if (t1 === undefined) t1 = 0;
			if (t2 === undefined) t2 = _this.time.milliseconds;
			if (accel === undefined) accel = 1;
			_this.style.position = {"x" : parseFloat(x1), "y" : parseFloat(y1)};
			_this.updatePosition();
			_this.updates["move"] = function(_this,t) {
				if (t < t1) t = t1;
				if (t > t2) t = t2;
				var calc = Math.pow((t-t1)/(t2-t1),accel);
				_this.style.position = {"x" : parseFloat(x1) + (x2 - x1) * calc, "y" : parseFloat(y1) + (y2 - y1) * calc};
				_this.updatePosition();
			};
		};
		this.addTransition = function(ret,times,options,trans_n) {
			ret.classes.push("transition" + trans_n);
			times = times.split(",");
			var intime, outtime, accel = 1;

			switch (times.length) {
				case 3:
					accel = parseFloat(times[2]);
				case 2:
					outtime = times[1];
					intime = times[0];
					break;
				case 1:
					if (times[0]) accel = parseFloat(times[0]);
					outtime = _this.time.milliseconds;
					intime = 0;
			}

			if (options.indexOf("pos(") >= 0) {
				let pos = options.slice(options.indexOf("pos(")+4,options.indexOf(")")).split(",");
				options = options.replace(/\\pos\((\d|,)*\)/,"");
				_this.addMove(_this.style.position.x,_this.style.position.y,pos[0],pos[1],intime,outtime,accel);
			}

			if (options) {
				let callback = function(_this) {
					override_to_html(options+"}",ret);

					let divs = SC.getElementsByClassName("transition"+trans_n);
					let trans = "all " + (outtime - intime) + "ms ";

					if (accel == 1) trans += "linear";
					else {
						let CBC = fitCurve([[0,0],[0.25,Math.pow(0.25,accel)],[0.5,Math.pow(0.5,accel)],[0.75,Math.pow(0.75,accel)],[1,1]]);
						// cubic-bezier(x1, y1, x2, y2)
						trans += "cubic-bezier(" + CBC[1][0] + "," + CBC[1][1] + "," + CBC[2][0] + "," + CBC[2][1] + ")";
					}

					_this.div.style.transition = trans; // for transitions that can only be applied to the entire line
					for (let div of divs) {
						div.style.transition = trans;
						for (let x in ret.style)
							div.style[x] = ret.style[x];
						div.setAttribute("class", div.getAttribute("class") + " " + ret.classes.join(" "));
					}

					_this.updatePosition();

					// and now remove all those transitions so they don't affect anything else.
					// Changing the transition timing doesn't affect currently running transitions, so this is okay to do.
					// We do have to let the animation actually start first though, so we can't do it immediately.
					setTimeout(function(){
						if (_this.div) _this.div.style.transition = "";
						for (let div of divs) div.style.transition = "";
					},0);
				};
				_this.callbacks[trans_n] = {"f" : callback, "t" : intime};
			}
		};

		function updateAlignment() {
			_this.moved = true;

			var TS = _this.style;
			var TD = _this.div;
			var F = getComputedStyle(TD).fontFamily || TS.Fontname;
				F = fontsizes[F] || fontsizes[F.slice(1,-1)];
			var S = parseInt(renderer.style[TS.Name].Fontsize,10);
				F = F[S.toFixed(2)];
				S = _this.ScaleY / 100 || 1;
			var H = F.height * S;
			var O = F.offset * S;
			var A = parseInt(TS.Alignment,10);
			var SA = TD.setAttribute.bind(TD);

			if (TS.position.x) {
				if (A > 6) SA("dy",H+O); // 7, 8, 9
				else if (A < 4) SA("dy",O); // 1, 2, 3
				else SA("dy",H/2+O); // 4, 5, 6

				if (A%3 == 0) SA("text-anchor","end"); // 3, 6, 9
				else if ((A+1)%3 == 0) SA("text-anchor","middle"); // 2, 5, 8
				else SA("text-anchor","start"); // 1, 4, 7
			} else {
				if (A > 6) { // 7, 8, 9
					SA("dy",H+O);
					SA("y",Margin.V);
				} else if (A < 4) { // 1, 2, 3
					SA("dy",O);
					SA("y",SC.getAttribute("height")-Margin.V);
				} else { // 4, 5, 6
					SA("dy",H/2+O);
					SA("y",SC.getAttribute("height")/2);
				}

				if (A%3 == 0) { // 3, 6, 9
					SA("text-anchor","end");
					SA("x",SC.getAttribute("width")-Margin.R);
				} else if ((A+1)%3 == 0) { // 2, 5, 8
					SA("text-anchor","middle");
					SA("x",((Margin.L-Margin.R)/2)+(SC.getAttribute("width")/2));
				} else { // 1, 4, 7
					SA("text-anchor","start");
					SA("x",Margin.L);
				}
			}
		}
		this.updatePosition = function() {
			this.moved = true;

			var TS = this.style;
			var TSSX = TS.ScaleX / 100;
			var TSSY = TS.ScaleY / 100;
			var TD = this.div;

			if (TS.position.x) {
				TD.setAttribute("x",TS.position.x);
				TD.setAttribute("y",TS.position.y);
			}

			if (TS.Angle && !this.transforms["frz"]) this.transforms["frz"] = "rotateZ(" + (-TS.Angle) + "deg)";
			if (TSSX != 1 && !this.transforms["fscx"])
				this.transforms["fscx"] = "scaleX(" + TSSX + ")";
			if (TSSY != 1 && !this.transforms["fscy"])
				this.transforms["fscy"] = "scaleY(" + TSSY + ")";

			var transforms = "";
			for (var key in this.transforms) transforms += " " + this.transforms[key];

			var box = BBox(TD);
			var divX = TD.getAttribute("x");
			var divY = TD.getAttribute("y");
			var origin = this.tOrg || ((box.x + box.width / 2) + "px " + (box.y + box.height / 2) + "px");

			TD.style.transform = transforms;
			TD.style.transformOrigin = origin;
			if (this.box) {
				this.box.style.transform = transforms;
				this.box.style.transformOrigin = origin;
			}
			if (this.paths) {
				let A = TS.Alignment;
				for (let path of this.paths) {
					let pBounds = path.getBBox();
					let px = parseFloat(divX), py = parseFloat(divY);

					if (A%3 == 0) px -= TSSX * (box.width + pBounds.width); // 3, 6, 9
					else if ((A+1)%3 == 0) px -= TSSX * (box.width + pBounds.width) / 2; // 2, 5, 8

					if (A < 7) {
						if (A < 4) py -= TSSY * pBounds.height;
						else py -= TSSY * pBounds.height / 2;
					}

					path.style.transform = "translate(" + px + "px," + (py /*+ this.pathOffset.y*/) + "px)" + transforms;
				}
			}
			if (this.kf) {
				for (var num of this.kf)
					SC.getElementById("gradient" + num).setAttribute("gradient-transform", "translate(" + divX + "px," + divY + "px)" + transforms + " translate(" + (-divX) + "px," + (-divY) + "px)");
			}
		};
	}

	function parse_info(info_section) {
		var info = {};
		for (var line of info_section) {
			if (line.charAt(0) == "!" || line.charAt(0) == ";") continue;
			var keyval = line.split(":");
			if (keyval.length != 2) continue;
			info[keyval[0]] = keyval[1].trim();
		}
		return info;
	}
	function parse_styles(style_section) {
		var styles = {};
		var header = style_section[0].replace("Format: ","");
		var map = header.split(", ");
		for (var line of style_section) {
			if (line.search("Style: ") == -1)
				continue;
			var elems = line.replace("Style: ","").split(",");
			var new_style = {};
			for (var i = 0; i < elems.length; ++i)
				new_style[map[i]] = elems[i];
			new_style.Name = new_style.Name.replace(/[^_a-zA-Z0-9-]/g,"_");
			styles[new_style.Name] = new_style;
		}
		return styles;
	}
	function parse_events(event_section) {
		var events = [];
		var header = event_section[0].replace("Format: ","");
		var map = header.split(", ");
		for (var line of event_section) {
			if (line.search("Dialogue: ") == -1)
				continue;
			var elems = line.replace("Dialogue: ","").split(",");
			var i, new_event = {};
			for (i = 0; map[i] != "Text" && i < elems.length; ++i)
				new_event[map[i]] = elems[i];
			new_event.Style = new_event.Style.replace(/[^_a-zA-Z0-9-]/g,"_");
			if (map[i] == "Text") new_event.Text = elems.slice(i).join(",");
			events.push(new_event);
		}
		return events;
	}
	function ass2js(asstext) {
		var subtitles = {styles:{}};
		var assfile = asstext.split("\n");
		var last_tag = 0;
		for (var i = 0; i < assfile.length; ++i) {
			assfile[i] = assfile[i].trim();
			if (assfile[i] == "[Script Info]") {
				last_tag = i;
			} else if (assfile[i].indexOf("Styles") > -1) {
				subtitles.info = parse_info(assfile.slice(last_tag+1,i-1));
				last_tag = i;
			} else if (assfile[i] == "[Events]") {
				subtitles.styles = parse_styles(assfile.slice(last_tag+1,i-1));
				last_tag = i;
			}
		}
		subtitles.events = parse_events(assfile.slice(++last_tag));
		subtitles.events.line = last_tag + 2;
		return subtitles;
	}

	function style_to_css(style) {
		let ret = "";
		if (style.Fontname) {
			if (style.Fontname.charAt(0) == "@") {
				style.Fontname = style.Fontname.slice(1);
				style.Vertical = true;
			}
		} else style.Fontname = "Arial";
		ret += "font-family: " + style.Fontname + ";\n";

		if (!style.Fontsize) style.Fontsize = 40;
		ret += "font-size: " + getFontSize(style.Fontname,style.Fontsize) + "px;\n";

		if (+style.Bold) ret += "font-weight: bold;\n";
		if (+style.Italic) ret += "font-style: italic;\n";
		if (+style.Underline || +style.StrikeOut) {
			ret += "text-decoration:";
			if (+style.Underline) ret += " underline";
			if (+style.StrikeOut) ret += " line-through";
			ret += ";\n";
		}

		if (!style.ScaleX) style.ScaleX = 100;
		if (!style.ScaleY) style.ScaleY = 100;

		if (style.Spacing) ret += "letter-spacing: " + style.Spacing + "px;\n";
		else style.Spacing = "0";


		// Remove "&H" or set default.
		style.PrimaryColour = style.PrimaryColour ? style.PrimaryColour.slice(2) : "FFFFFF"; // white
		style.SecondaryColour = style.SecondaryColour ? style.SecondaryColour.slice(2) : "FF0000"; // blue
		style.OutlineColour = style.OutlineColour ? style.OutlineColour.slice(2) : "000000"; // black
		style.BackColour = style.BackColour ? style.BackColour.slice(2) : "000000"; // black

		// Apparently, black can sometimes be listed as just "&H0".
		if (style.PrimaryColour.length == 1) style.PrimaryColour = "000000";
		if (style.SecondaryColour.length == 1) style.SecondaryColour = "000000";
		if (style.OutlineColour.length == 1) style.OutlineColour = "000000";
		if (style.BackColour.length == 1) style.BackColour = "000000";

		if (style.PrimaryColour.length == 8) {
			style.c1a = (255-parseInt(style.PrimaryColour.substr(0,2),16))/255;
			style.PrimaryColour = style.PrimaryColour.slice(2);
		} else style.c1a = 1;
		style.c1r = parseInt(style.PrimaryColour.substr(4,2),16);
		style.c1g = parseInt(style.PrimaryColour.substr(2,2),16);
		style.c1b = parseInt(style.PrimaryColour.substr(0,2),16);

		if (style.SecondaryColour.length == 8) {
			style.c2a = (255-parseInt(style.SecondaryColour.substr(0,2),16))/255;
			style.SecondaryColour = style.SecondaryColour.slice(2);
		} else style.c2a = 1;
		style.c2r = parseInt(style.SecondaryColour.substr(4,2),16);
		style.c2g = parseInt(style.SecondaryColour.substr(2,2),16);
		style.c2b = parseInt(style.SecondaryColour.substr(0,2),16);

		if (style.OutlineColour.length == 8) {
			style.c3a = (255-parseInt(style.OutlineColour.substr(0,2),16))/255;
			style.OutlineColour = style.OutlineColour.slice(2);
		} else style.c3a = 1;
		style.c3r = parseInt(style.OutlineColour.substr(4,2),16);
		style.c3g = parseInt(style.OutlineColour.substr(2,2),16);
		style.c3b = parseInt(style.OutlineColour.substr(0,2),16);

		if (style.BackColour.length == 8) {
			style.c4a = (255-parseInt(style.BackColour.substr(0,2),16))/255;
			style.BackColour = style.BackColour.slice(2);
		} else style.c4a = 1;
		style.c4r = parseInt(style.BackColour.substr(4,2),16);
		style.c4g = parseInt(style.BackColour.substr(2,2),16);
		style.c4b = parseInt(style.BackColour.substr(0,2),16);


		if (!style.Angle) style.Angle = 0;
		else style.Angle = parseFloat(style.Angle);
		if (style.Vertical) {
			style.Angle -= 270; // Why 270?
			ret += "writing-mode: vertical-rl;\n";
		}

		if (!style.BorderStyle) style.BorderStyle = 1;
		if (!style.Outline) style.Outline = 0;

		if (+style.Shadow) {
			if (style.Outline == 0) style.Outline = 1;
			style.ShOffX = style.Shadow;
			style.ShOffY = style.Shadow;
		} else {
			style.ShOffX = 0;
			style.ShOffY = 0;
		}

		ret += "fill: rgba(" + style.c1r + "," + style.c1g + "," + style.c1b + "," + style.c1a + ");\n";
		ret += "stroke: rgba(" + style.c3r + "," + style.c3g + "," + style.c3b + "," + style.c3a + ");\n";
		ret += "stroke-width: " + style.Outline + "px;\n";


		if (!style.Alignment) style.Alignment = "2";
		var N = parseInt(style.Alignment,10);

		ret += "text-align: ";
		if (N%3 == 0) ret += "right"; // 3, 6, 9
		else if ((N+1)%3 == 0) ret += "center"; // 2, 5, 8
		else ret += "left"; // 1, 4, 7
		ret += ";\n";

		ret += "vertical-align: ";
		if (N > 6) ret += "top";
		else if (N < 4) ret += "bottom";
		else ret += "middle";
		ret += ";\n";


		style.MarginL = parseInt(style.MarginL) || 0;
		style.MarginR = parseInt(style.MarginR) || 0;
		style.MarginV = parseInt(style.MarginV) || 0;

		ret += "margin-top: " + style.MarginV + "px;\n";
		ret += "margin-bottom: " + style.MarginV + "px;\n";


		return ret;
	}
	function parse_head() {
		var info = JSON.parse(JSON.stringify(assdata.info));
		var width = info.PlayResX || video.videoWidth;
		var height = info.PlayResY || video.videoHeight;
		SC.setAttribute("height", height);
		SC.style.height = height + "px";
		SC.setAttribute("width", width);
		SC.style.width = width + "px";
		TimeOffset = parseFloat(info.TimeOffset) || 0;
		PlaybackSpeed = (100 / info.Timer) || 1;
		_this.WrapStyle = (info.WrapStyle ? parseInt(info.WrapStyle) : 2);
	}
	function write_styles() {
		if (!styleCSS) {
			styleCSS = document.createElement("style");
			SC.insertBefore(styleCSS, SC.firstChild);
		}

		var styles = JSON.parse(JSON.stringify(assdata.styles));
		var Default = {
			Name: "Default",
			Outline: 2,
			MarginL: 10,
			MarginR: 10,
			MarginV: 20,
			Blur: 2
		};

		var text = ".subtitle_Default {\n" + style_to_css(Default) + "}\n";
		for (var key in styles) text += "\n.subtitle_" + key + " {\n" + style_to_css(styles[key]) + "}\n";
		styleCSS.innerHTML = text;
		_this.style = styles;
	}
	function init_subs() {
		var subtitle_lines = JSON.parse(JSON.stringify(assdata.events));
		var line_num = assdata.events.line;
		var layers = {};
		splitLines = [];
		subtitles = [];

		function createSubtitle(line,num) {
			var text = line.Text;

			// Remove whitespace at the start and end, and handle '\h'.
			text = text.trim();
			text = text.replace(/\\h/g," ");

			// Fix things that would be displayed incorrectly in HTML.
			text = text.replace(/</g,"&lt;");
			text = text.replace(/</g,"&gt;");

			// Combine adjacent override blocks.
			text = text.replace(/}{/g,"");

			// If the line doesn't start with an override, add one.
			if (text.charAt(0) != "{") text = "{}" + text;

			line.Text = text;


			// Count number of line breaks.
			// Remove soft breaks if they don't apply.
			var breaks = (line.Text.match(/\\N/g) || []).length;
			var qWrap = line.Text.match(/{.*?\\q[0-9].*?}/g);
			if (qWrap) qWrap = +qWrap[qWrap.length-1].match(/[0-9]/);
			if ((qWrap || _this.WrapStyle) == 2) breaks += (line.Text.match(/\\n/g) || []).length;
			else line.Text = line.Text.replace("\\n"," ");


			// Things that can change within a line, but isn't allowed to be changed within a line in HTML/CSS/SVG.
			// \be, \blur, \bord, \fax, \fay, \fr, \frx, \fry, \frz, \fscx, \fscy, \shad, \xshad, and \yshad
			// Also check for paths because they're always problematic.
			var reProblemBlock = /{.*?\\(?:(?:b(?:e|lur|ord))|(?:f(?:(?:(?:a|sc)[xy])|(?:r[xyz]?)))|(?:[xy]?shad)|(?:p(?:[1-9]|0\.[0-9]*?[1-9]))).*?}/;
			var reProblem = /\\(?:(?:b(?:e|lur|ord))|(?:f(?:(?:(?:a|sc)[xy])|(?:r[xyz]?)))|(?:[xy]?shad)|(?:p(?:[1-9]|0\.[0-9]*?[1-9])))/;

			// These lines kept in case I need them again.
			// \fax, \fr, \fry, \frz, and \fscx change the line width.
			// var reWidth = /\\f(?:(?:(?:a|sc)x)|(?:r[yz]?))[.\\\d}]/;
			// \be, \blur, \bord, \fay, \frx, \fscy, \shad, \xshad, and \yshad don't change the line width.
			// var reNoWidth = /\\(?:(?:b(?:e|lur|ord))|(?:f(?:ay|rx|scy))|(?:[xy]?shad))/;


			// Check for a line break anywhere, or one of the problematic overrides after the first block.
			if (breaks || reProblemBlock.test(line.Text.slice(line.Text.indexOf("}")))) {
				// Split on newlines, then into block-text pairs, then split the pair.
				var pieces = line.Text.split(/\\n/gi).map(x => ("{}"+x).replace("}{","").split("{").slice(1).map(y => y.split("}")));
				var i, megablock = "{", newLine, safe = [""];

				// Merge subtitle line pieces into non-problematic strings.
				for (let piece of pieces) {
					for (let block of piece) {
						megablock += block[0];
						if (reProblem.test(block[0])) safe.push(megablock + "}" + block[1]);
						else safe[safe.length-1] += "{" + block[0] + "}" + block[1];
					}
					safe.push(megablock + "}");
				}

				safe = safe.slice(safe[0] ? 0 : 1, -1).map(s => s.replace("}{",""));
				splitLines.push({line:subtitles.length,pieces:safe.length,breaks:pieces.map(p => p.length)});

				// Create subtitle objects.
				for (i = 0; i < safe.length; ++i) {
					newLine = JSON.parse(JSON.stringify(line));
					newLine.Text = safe[i];
					subtitles.push(new subtitle(newLine,num+"-"+(i+1)));
				}
			} else subtitles.push(new subtitle(line,num));
		}

		for (var line of subtitle_lines) {
			layers[line.Layer] = true;
			setTimeout(createSubtitle.bind(null,line,line_num++),0);
		}

		for (var layer of Object.keys(layers)) {
			var d = document.createElementNS("http://www.w3.org/2000/svg","g");
				d.setAttribute("id","layer"+layer);
			SC.appendChild(d);
		}
	}

	this.pauseSubtitles = function() {
		stopped = true;
	};
	this.resumeSubtitles = function() {
		stopped = false;
		requestAnimationFrame(mainLoop);
	};
	this.resizeSubtitles = function() {
		if (resizeRequest) return;
		resizeRequest = requestAnimationFrame(function() {
			resizeRequest = 0;
			if (!assdata) return; // We're not loaded, or we've deconstructed.

			var SCP = SC.parentElement;

			// Scale Video
			if (video.videoWidth / video.videoHeight > SCP.clientWidth / SCP.clientHeight) { // increase width
				video.style.width = SCP.clientWidth + "px";
				video.style.height = "auto";
			} else { // increase height
				video.style.width = "auto";
				video.style.height = SCP.clientHeight + "px";
			}

			// Scale Subtitles
			var scaleX = video.clientWidth / parseFloat(SC.style.width);
			var scaleY = video.clientHeight / parseFloat(SC.style.height);
			SC.style.transform = "scale(" + scaleX + ", " + scaleY + ")";
			SC.style.left = ((SCP.clientWidth - video.offsetWidth) / 2) + "px";
			SC.style.top = ((SCP.clientHeight - video.offsetHeight) / 2) + "px";

			// Update alignment and such.
			write_styles();
		});
	};

	this.init = function(text) {
		assdata = ass2js(text);
		setTimeout(function() {
			function templocal() {
				video.removeEventListener("loadedmetadata",templocal);
				parse_head();
				setTimeout(write_styles,0);
				setTimeout(init_subs,0);
				setTimeout(() => {
					video.addEventListener("pause",_this.pauseSubtitles,false);
					video.addEventListener("play",_this.resumeSubtitles,false);
					window.addEventListener("resize",_this.resizeSubtitles,false);
					document.addEventListener("mozfullscreenchange",_this.resizeSubtitles,false);
					document.addEventListener("webkitfullscreenchange",_this.resizeSubtitles,false);
					_this.resizeSubtitles();
					requestAnimationFrame(mainLoop);
				},0);
			}

			// Wait for video metadata to be loaded.
			if (video.readyState) templocal();
			else video.addEventListener("loadedmetadata",templocal);
		},0);
	};
	this.shutItDown = function() {
		video.removeEventListener("pause",this.pauseSubtitles,false);
		video.removeEventListener("play",this.resumeSubtitles,false);
		window.removeEventListener("resize",this.resizeSubtitles,false);
		document.removeEventListener("mozfullscreenchange",this.resizeSubtitles,false);
		document.removeEventListener("webkitfullscreenchange",this.resizeSubtitles,false);
		if (subtitles) {
			for (var S of subtitles) {
				clearTimeout(S.startTimer);
				clearTimeout(S.endTimer);
			}
		}
		stopped = true;
		SC.innerHTML = "<defs></defs>";
		styleCSS = null;
	};

	function mainLoop() {
		if (stopped) return;
		if (video.paused) {
			_this.pauseSubtitles();
			return;
		}

		requestAnimationFrame(mainLoop);

		var time = video.currentTime - TimeOffset;
		if (Math.abs(time-lastTime) < 0.01) return;
		lastTime = time;

		// Display Subtitles
		for (var S of subtitles) {
			if (S.time.start <= time && time <= S.time.end) {
				if (S.visible) S.update(time - S.time.start);
				else S.start();
			} else if (S.visible) S.cleanup();
		}

		// Fix position of subtitle lines that had to be split.
		let transform = SC.style.transform;
		SC.style.transform = "";
		for (let L of splitLines) {
			if (subtitles[L.line].visible && subtitles[L.line].moved) {
				subtitles[L.line].moved = false;

				let A = parseInt(subtitles[L.line].style.Alignment,10), heights = [], lines;


				// Align Horizontally
				lines = subtitles.slice(L.line,L.line+L.pieces);
				for (let amount of L.breaks) {
					let spans = lines.splice(0,amount);
					let totalWidth = spans.reduce((sum,span) => sum + span.width(), 0);
					let maxHeight;

					// Align the pieces relative to the previous piece.
					if (A%3 == 0) { // Right Alignment
						let previous = spans[0].div.getAttribute("x") - totalWidth + spans[0].width();
						maxHeight = 0;
						for (let span of spans) {
							let cWidth = span.width();
							span.div.setAttribute("x", previous += cWidth);
							span.div.style.transformOrigin = span.tOrg || span.div.style.transformOrigin.replace(/[0-9]*\.?[0-9]*/, previous - (cWidth / 2));
							maxHeight = Math.max(maxHeight,span.height());
						}
					} else if ((A+1)%3 == 0) { // Middle Alignment
						let pWidth = spans[0].width();
						maxHeight = spans[0].height();
						spans[0].div.setAttribute("x", spans[0].div.getAttribute("x") - (totalWidth - pWidth) / 2);
						spans[0].div.style.transformOrigin = spans[0].tOrg || spans[0].div.style.transformOrigin.replace(/[0-9]*\.?[0-9]*/, spans[0].div.getAttribute("x"));
						for (let i = 1; i < spans.length; ++i) {
							let cWidth = spans[i].width(), offset = parseInt(spans[i-1].div.getAttribute("x"),10);
							spans[i].div.setAttribute("x", offset + (pWidth + cWidth) / 2);
							spans[i].div.style.transformOrigin = spans[i].tOrg || spans[i].div.style.transformOrigin.replace(/[0-9]*\.?[0-9]*/, spans[i].div.getAttribute("x"));
							pWidth = cWidth;
							maxHeight = Math.max(maxHeight,spans[i].height());
						}
					} else { // Left Alignment
						let previous = parseInt(spans[0].div.getAttribute("x"),10), pWidth = spans[0].width();
						maxHeight = spans[0].height();
						spans[0].div.style.transformOrigin = spans[0].tOrg || spans[0].div.style.transformOrigin.replace(/[0-9]*\.?[0-9]*/, previous + (pWidth / 2));
						for (let i = 1; i < spans.length; ++i) {
							spans[i].div.setAttribute("x", previous += pWidth);
							spans[i].div.style.transformOrigin = spans[i].tOrg || spans[i].div.style.transformOrigin.replace(/[0-9]*\.?[0-9]*/, previous + ((pWidth = spans[i].width()) / 2));
							maxHeight = Math.max(maxHeight,spans[i].height());
						}
					}

					heights.push(maxHeight);
				}


				// Align Vertically
				lines = subtitles.slice(L.line,L.line+L.pieces);
				let spans = lines.splice(0,L.breaks[0]);

				// Align the first span.
				let yPos = parseFloat(spans[0].div.getAttribute("y"));
				// Nothing to do for top alignment.
				if (A<7) { // Middle and Bottom Alignment
					if (A>3) yPos += heights[0] - heights.reduce((sum,height) => sum + height, 0) / 2;
					else yPos -= heights.reduce((sum,height) => sum + height, -heights[0]);

					for (let span of spans) {
						span.div.setAttribute("y", yPos);
						if (span.tOrg) {
							span.div.style.transformOrigin = span.tOrg;
						} else {
							let old = span.div.style.transformOrigin.split(" ");
							old[1] = old[1].replace(/[0-9]*\.?[0-9]*/, yPos + (heights[0] / 2));
							span.div.style.transformOrigin = old.join(" ");
						}
					}
				}

				// Align the pieces relative to the previous span.
				for (let j = 1; j < L.breaks.length; ++j) {
					yPos += heights[j-1];
					spans = lines.splice(0,L.breaks[j]);
					for (let span of spans) {
						span.div.setAttribute("y", yPos);
						if (span.tOrg) {
							span.div.style.transformOrigin = span.tOrg;
						} else {
							let old = span.div.style.transformOrigin.split(" ");
							old[1] = old[1].replace(/[0-9]*\.?[0-9]*/, yPos + (span.height() / 2));
							span.div.style.transformOrigin = old.join(" ");
						}
					}
				}
			}
		}
		SC.style.transform = transform;
	}

	var freq = new XMLHttpRequest();
	freq.open("get",subFile,true);
	freq.onreadystatechange = function() {
		if (freq.readyState != 4) return;
		_this.init(freq.responseText);
	};
	freq.send();
}
