// DCSubToAE
// 908video <908lab@908video.de>

// v 0.10
// Initial commit by Michael Auerswald

// GLOBALS
var VERSION = "0.10-140319"
var FONTSIZE = 16;
var FONTREGULAR = "ArialMT";
var FONTITALIC = "Arial-ItalicMT";
var STROKEWIDTH = 0.2;
var LINEHEIGHT = 25;
var FRAMERATESOURCE = 25;
var SKEWAMOUNT = 15;

var labelInfoSubtitleID,labelInfoMovieTitle,labelInfoReelNumber,labelInfoLanguage,labelInfoLoadFontId;
var dropdownFrom, dropdownTo, dropdownXmlFileType;
var editFontRegular, editFontItalic, editFontSize, editStrokeWidth, editLineHeight;
var btOpenFile, btRun, btColorFill, btColorStroke;
var checkboxChangeTimebase;
var checkboxFixAnchor;
var imgColorFill, imgColorStroke;
var pickerFill, pickerStroke;
var radioVAlignT,radioVAlignM,radioVAlignB;
var radioHAlignL,radioHAlignC,radioHAlignM;
var frameRateList = ['23.976', '24', '25', '29.97', '30', '48', '50', '60'];
var xmlFileTypes = ['DCSubtitle', 'TimeXML', 'SubRipSRT'];

var theSubtitleFile;

// master object for subtitle file
// contains subtitle meta data and an array to the actual subtitles
// the array is made of subtitleentry objects
function SubtitleFile() {
	this.fileName = "";
	this.file = null;
	this.subtitles = new Array();
	this.subtitleId = 0;
	this.movieTitle = "";
	this.reel = 0;
	this.language = "";
	this.raw = undefined;
	this.count = 0;
}

SubtitleFile.prototype.readXML = function() {
	if (this.file != null)
	{
		try {
			this.fileName = this.file.name;
			this.file.open('r');
			var xmlString = this.file.read();
			this.raw = new XML(xmlString);
			this.file.close();
			return true;
		} catch(err) {
			return false;
		}
	}
	return false;
}

SubtitleFile.prototype.readText = function() {
	if (this.file != null)
	{
		try {
			this.fileName = this.file.name;
			this.file.open('r');
			this.raw = this.file.read();
			this.file.close();
			return true;
		} catch(err) {
			return false;
		}
	}
	return false;
}

// one per subtitle entry in the xml file
function SubtitleEntry(text, inTime, outTime, framerate, inFade, outFade) {
	this.text = text;
	this.timeIn = inTime;
	this.timeOut = outTime;
	this.fadeIn = inFade;
	this.fadeOut = outFade;
	this.framerate = framerate;
	this.italic = false;
	this.fontName = FONTREGULAR;
	this.strokecolor = [0,0,0];
	this.fillcolor = [1,1,1];
	this.justification = "center";
}

// reads raw data from file
function GetXMLFromFile() {
	theSubtitleFile.file = File.openDialog("Choose A Subtitle XML File","Subtitles:*.xml;*.srt");
	var res;

	if (dropdownXmlFileType.selection.text == "DCSubtitle")
	{
		var res = theSubtitleFile.readXML();
		if (res != undefined)
		{
			theSubtitleFile.subtitleId = theSubtitleFile.raw.SubtitleID;
			theSubtitleFile.movieTitle = theSubtitleFile.raw.MovieTitle;
			theSubtitleFile.reel = theSubtitleFile.raw.ReelNumber;
			theSubtitleFile.language = theSubtitleFile.raw.Language;
		}
	}
	else if (dropdownXmlFileType.selection.text == "TimeXML")
	{
		var res = theSubtitleFile.readXML();
		if (res != undefined)
		{
			theSubtitleFile.subtitleId = "n/a";
			theSubtitleFile.movieTitle = theSubtitleFile.fileName;
			theSubtitleFile.reel = "n/a";
			theSubtitleFile.language = "n/a";
		}
	}
	else if (dropdownXmlFileType.selection.text == "SubRipSRT")
	{
		var res = theSubtitleFile.readText();
		if (res != undefined)
		{
			theSubtitleFile.subtitleId = "n/a";
			theSubtitleFile.movieTitle = theSubtitleFile.fileName;
			theSubtitleFile.reel = "n/a";
			theSubtitleFile.language = "n/a";
		}
	}

	if (res != undefined)
	{
		labelInfoSubtitleID.text = theSubtitleFile.subtitleId;
		labelInfoMovieTitle.text = theSubtitleFile.movieTitle;
		labelInfoReelNumber.text = theSubtitleFile.reel;
		labelInfoLanguage.text = theSubtitleFile.language;
		btRun.enabled = true;
	}
	else {
		alert("Could not read file.");
		return undefined;
	}
}

// a simple way to convert timecode string to float seconds
// some formats use hundreds of frames instead of milliseconds as the last tuple, so the framerate has to be known!
function timeCodeToSeconds(t, msbase)
{
	try
	{
		var u = t.split(':');
		var h = Number(u[0]);
		var m = Number(u[1]);
		var s = Number(u[2]);
		var ms = Number(u[3].substring(0,2));
		return (h * 60 * 60) + (m * 60) + s + (ms/msbase);
	}
	catch(e)
	{
		return -1;
	}
}

// a simple way to convert timecode string to float seconds
function timeCodeToSecondsSRT(t)
{
	try
	{
		var u = t.split(':');
		var v = u[2].split(',');
		var h = Number(u[0]);
		var m = Number(u[1]);
		var s = Number(v[0]);
		var ms = Number(v[1].substring(0,2));
		// $.writeln(h,m,s,ms);
		return (h * 60 * 60) + (m * 60) + s + ms/1000;
	}
	catch(e)
	{
		return -1;
	}
}

function d2h(d) {return d.toString(16);}
function h2d(h) {return parseInt(h,16);}

function hexToRGB(hex)
{
	var r = h2d(hex.substring(0,2)) / 255;
	var g = h2d(hex.substring(2,4)) / 255;
	var b = h2d(hex.substring(4,6)) / 255;
	// $.writeln([r,g,b]);
	return [r,g,b];
}

/**
 * Here's where the raw subtitle data is parsed into subtitle objects
 * XML can be read rather conveniently using E4X (ECMAScript for XML), text files like SRT....not so much
 * @param {string} raw - the raw string read from the subtitle file
 * @param {string} format - the parser format, usually selected via dropdown, e.g. "DCSubtitle"
 * @return {Array} subtitleArray - an Array of SubtitleEntry objects
 */
function fileToSubtitleEntries(raw, format)
{
	var subtitleArray = new Array();
	var counter = 0;

	if (format == "DCSubtitle")
	{
		theSubtitleFile.count = raw.Font.child("Font").length();
		
		for each(var child in raw.Font.child("Font")){
			var s = new SubtitleEntry();
			counter++;

			clearOutput();
			writeLn("Reading Subs: " + counter.toString() + "/" + theSubtitleFile.count.toString() + "(" + (counter/theSubtitleFile.count*100).toFixed(1).toString() + "%)");

			s.framerate = FRAMERATESOURCE;
			s.timeIn = timeCodeToSeconds(child.Subtitle.@TimeIn, s.framerate);
			s.timeOut = timeCodeToSeconds(child.Subtitle.@TimeOut, s.framerate);
			s.fadeIn = timeCodeToSeconds(child.Subtitle.@FadeUpTime, s.framerate);
			s.fadeOut = timeCodeToSeconds(child.Subtitle.@FadeDownTime, s.framerate);
	    	s.italic = (child.@Italic == "yes") ? true : false;
			s.fontName = (child.@Italic == "yes") ? FONTITALIC : FONTREGULAR;
			s.fillcolor = hexToRGB(child.@Color);
			s.strokecolor = hexToRGB(child.@Color);
	    	s.text = "";
	    	var counttext = 0;
			for each(var textchild in child.Subtitle.child("Text")){
				s.justification = textchild.@HAlign;
				if (counttext > 0) s.text += "\n";
				s.text += textchild;
				counttext++;
			}
			subtitleArray.push(s);
		}
	}
	else if (format == "TimeXML")
	{
		theSubtitleFile.count = raw.child("Paragraph").length();
		
		for each(var child in raw.child("Paragraph")){
			var s = new SubtitleEntry();
			counter++;

			clearOutput();
			writeLn("Reading Subs: " + counter.toString() + "/" + theSubtitleFile.count.toString() + "(" + (counter/theSubtitleFile.count*100).toFixed(1).toString() + "%)");

			s.timeIn = parseFloat(child.StartMilliseconds) / 1000.0;
			s.timeOut = parseFloat(child.EndMilliseconds) / 1000.0;
			s.fadeIn = -1;
			s.fadeOut = -1;
			s.framerate = FRAMERATESOURCE;
	    	s.italic = false;
			s.fontName = FONTREGULAR;
	    	s.text = child.Text;
			subtitleArray.push(s);
		}
	}
	else if (format == "SubRipSRT")
	{
		var srtStep = 0;
		var s = new SubtitleEntry();
		var counttext = 0;
		var lines = raw.split("\n");

		for each(var line in lines)
		{
			counter++;
			if (line.replace(/ /g,'') == "")
			{
				srtStep = 0;
				if (counttext > 0)
				{
					subtitleArray.push(s);
					counttext = 0;
				}
			}
			else if (srtStep == 0)
			{
				writeLn("Reading Subs: " + line);
				s = new SubtitleEntry();
				s.text = "";
				srtStep = 1;
				counttext = 0;
			}
			else if (srtStep == 1)
			{
				var times = line.split(' ');
				if (times[1] == "-->")
				{
					s.timeIn = timeCodeToSecondsSRT(times[0]);
					s.timeOut = timeCodeToSecondsSRT(times[2]);
					s.fadeIn = -1;
					s.fadeOut = -1;
					s.framerate = FRAMERATESOURCE;
					s.italic = false;
					s.fontName = FONTREGULAR;
					srtStep = 2;
				}
			}
			else if (srtStep == 2)
			{	
				if (counttext > 0) s.text += "\n";
				counttext++;
				s.text += line;
				if (counter == lines.length)
				{
					subtitleArray.push(s);
				}
			}
		}
	}

	return subtitleArray;
}

function onCheckboxTimebase()
{
	if (checkboxChangeTimebase.value == true)
	{
		dropdownFrom.enabled = true;
		dropdownTo.enabled = true;
	}
	else
	{
		dropdownFrom.enabled = false;
		dropdownTo.enabled = false;	
	}
}

/**
 * Creates an ADBE Text Document
 * not actually used right now (in favour of using Layer Markers instead)
 * @param {AVLayer} theLayer - the layer the document should be created for
 * @param {number} fontSize
 * @param {string} fontName - Postscript name of font (e.g ArialMT)
 * @param {number} doctext - Text to put into the document
 * @param {Array} colorFill - [0..1,0..1,0..1]
 * @param {Array} colorStroke - [0..1,0..1,0..1]
 * @param {number} strokeWidth
 * @param {number} justification - ParagraphJustification.CENTER_JUSTIFY|RIGHT_JUSTIFY|LEFT_JUSTIFY
 * @return {ADBE Text Document} doc - an ADBE Text Document
 */
function setTextLayerProperties( theLayer, fontSize, fontName, doctext, colorFill, colorStroke, strokeWidth, justification ) {
	var doc = theLayer.property("ADBE Text Properties").property("ADBE Text Document").value;
	// doc.resetCharStyle();
	doc.fontSize = fontSize;
	doc.fillColor = colorFill;
	doc.strokeColor = colorStroke;
	doc.strokeWidth = strokeWidth;
	doc.font = fontName;
	doc.strokeOverFill = true;
	doc.applyStroke = true;
	doc.applyFill = true;
	doc.text = doctext;
	if (justification == "center")
		doc.justification = ParagraphJustification.CENTER_JUSTIFY;
	else if (justification == "right")
		doc.justification = ParagraphJustification.RIGHT_JUSTIFY;
	else
		doc.justification = ParagraphJustification.LEFT_JUSTIFY;
	return doc;
}

/**
 * Helper function to create UI groups
 * @param {object} parent - parent UI group
 * @param {string} orientation - row or column
 * @param {Array} fill - ["left","fill"]
 * @param {Array} preferredSize - [x,y]
 * @param {Array} minimumSize - [x,y]
 * @return {object} grp - the created group
 */
function newGroup(parent, orientation, fill, preferredSize, minimumSize)
{
	var grp = parent.add('group', undefined, ''); 
	grp.orientation = orientation;
    grp.alignChildren = fill;
    grp.preferredSize = preferredSize;
    grp.minimumSize = minimumSize;
    return grp;
}

function createUI(thisObj) { 
    var myPanel;
    if ( thisObj instanceof Panel )
    {
        myPanel = thisObj;
    }
    else
    {
        myPanel = new Window("palette", "DCSubToAE", undefined);
    }
    myPanel.preferredSize = [300, 350];
    // var myPanel = ( thisObj instanceof Panel ) ? thisObj : new Window("palette", "Siemens Test", undefined, {resizeable: true});
    myPanel.alignChildren = ["fill","fill"];
    myPanel.orientation = "column";

    var grpXmlType = newGroup(myPanel, 'row', ["fill","fill"], [300,30], [300,30]);
	grpXmlType.add('statictext',[undefined,undefined,80,16],"File Type:");
	dropdownXmlFileType = grpXmlType.add('dropdownlist', undefined, xmlFileTypes);
	dropdownXmlFileType.selection = 0;
    btOpenFile = grpXmlType.add("button", [undefined,undefined,100,25], "Open File").onClick = GetXMLFromFile;

    myPanel.add ("panel");

    var grpInfoSubtitleID = newGroup(myPanel, 'row', ["fill","fill"], [300,20], [300,16]);
		grpInfoSubtitleID.add('statictext',[undefined,undefined,100,16],"SubtitleID:");
		labelInfoSubtitleID = grpInfoSubtitleID.add('statictext',[undefined,undefined,100,16],"");
	var grpInfoMovieTitle = newGroup(myPanel, 'row', ["fill","fill"], [300,20], [300,16]);
		grpInfoMovieTitle.add('statictext',[undefined,undefined,100,16],"MovieTitle:");
		labelInfoMovieTitle = grpInfoMovieTitle.add('statictext',[undefined,undefined,100,16],"");
	var grpInfoReelNumber = newGroup(myPanel, 'row', ["fill","fill"], [300,20], [300,16]);
		grpInfoReelNumber.add('statictext',[undefined,undefined,100,16],"ReelNumber:");
		labelInfoReelNumber = grpInfoReelNumber.add('statictext',[undefined,undefined,100,16],"");
	var grpInfoLanguage = newGroup(myPanel, 'row', ["fill","fill"], [300,20], [300,16]);
		grpInfoLanguage.add('statictext',[undefined,undefined,100,16],"Language:");
		labelInfoLanguage = grpInfoLanguage.add('statictext',[undefined,undefined,100,16],"");

	var grpTimebaseOriginal = newGroup(myPanel, 'row', ["fill","fill"], [300,20], [300,20]);
		grpTimebaseOriginal.add('statictext',[undefined,undefined,60,16],"Timebase:");
		dropdownFrom = grpTimebaseOriginal.add('dropdownlist', undefined, frameRateList);
		dropdownFrom.selection = 1;

		checkboxChangeTimebase = grpTimebaseOriginal.add("checkbox", undefined, "Change to:");
		dropdownTo = grpTimebaseOriginal.add('dropdownlist', undefined, frameRateList);
		checkboxChangeTimebase.addEventListener( 'click', onCheckboxTimebase );
		dropdownTo.selection = 1;


	myPanel.add ("panel");

	var grpSkew = newGroup(myPanel, 'row', ["fill","fill"], [300,20], [300,20]);
		grpSkew.add('statictext',[undefined,undefined,80,20],"Faux Italic Strength:");
		editSkewAmount = grpSkew.add('edittext',[undefined,undefined,50,20],SKEWAMOUNT);
		editSkewAmount.onChange = OnSkewAmounChange;
	// var grpHorizontal = myPanel.add('group', undefined, ''); grpHorizontal.orientation = 'row';
	// 	grpHorizontal.add('statictext',[undefined,undefined,60,20],"Alignment:");
	// 	radioHAlignL = grpHorizontal.add('radiobutton',[undefined,undefined,70,20],"left");
	// 	radioHAlignC = grpHorizontal.add('radiobutton',[undefined,undefined,70,20],"center");
	// 	radioHAlignR = grpHorizontal.add('radiobutton',[undefined,undefined,70,20],"right");
	// 	radioHAlignC.value = true;

	myPanel.add ("panel");

	var grpAnchor = newGroup(myPanel, 'column', ["left","top"], [300,50], [300,50]);
		checkboxFixAnchor = grpAnchor.add("checkbox", undefined, "Fix Anchor (slower)");
		var grpVertical = newGroup(grpAnchor, 'row', ["fill","fill"], [300,20], [300,20]);
			grpVertical.add('statictext',[undefined,undefined,60,20],"Anchor:");
			radioVAlignT = grpVertical.add('radiobutton',[undefined,undefined,70,20],"top");
			radioVAlignM = grpVertical.add('radiobutton',[undefined,undefined,70,20],"middle");
			radioVAlignB = grpVertical.add('radiobutton',[undefined,undefined,70,20],"bottom");
			radioVAlignB.value = true;

	myPanel.add ("panel");

	var grpColor = newGroup(myPanel, 'column', ["left","top"], [300,110], [300,110]);
		checkboxOverrideColors = grpColor.add("checkbox", undefined, "Use XML-defined colors");
		var grpColorFill = newGroup(grpColor, 'row', ["left","fill"], [300,25], [300,25]);
			btColorFill = grpColorFill.add('button', [undefined,undefined,80,25],"Fill Color");
		    btColorFill.onClick = OnColorFill;
		    imgColorFill = grpColorFill.add('statictext', [undefined,undefined,25,25], "\u2588\u2588");
		    pickerFill = [1,1,1];
			imgColorFill.graphics.foregroundColor = imgColorFill.graphics.newPen (imgColorFill.graphics.PenType.SOLID_COLOR, pickerFill, 1);

		var grpStroke = newGroup(grpColor, 'row', ["left","fill"], [300,25], [300,25]);
			btColorStroke = grpStroke.add('button', [undefined,undefined,80,25],"Stroke Color");
		    btColorStroke.onClick = OnColorStroke;
		    imgColorStroke = grpStroke.add('statictext', [undefined,undefined,25,25], "\u2588\u2588");
		    pickerStroke = [0,0,0];
			imgColorStroke.graphics.foregroundColor = imgColorStroke.graphics.newPen (imgColorStroke.graphics.PenType.SOLID_COLOR, pickerStroke, 1);
			grpStroke.add('statictext',[undefined,undefined,40,20],"Width:");
			editStrokeWidth = grpStroke.add('edittext',[undefined,undefined,50,20],STROKEWIDTH);
			editStrokeWidth.onChange = OnStrokeWidthChange;

	var grpButtonRun = newGroup(myPanel, 'column', ["fill","top"], [300,30], [300,30]);
    	btRun = grpButtonRun.add("button", undefined, "Run Script").onClick = CreateSubtitleLayer;
 		btRun.enabled = false;
 	var grpCredits = newGroup(myPanel, 'row', ["fill","top"], [300,20], [300,20]);
 		grpCredits.add('statictext', [undefined,undefined,200,20], "http://www.908video.de/lab" );
 		grpCredits.add('statictext', undefined, "v" + VERSION );
 	myPanel.layout.layout();

 	return myPanel;   
}

function hexToRgb2(hex) {
    var r = hex >> 16;
	var g = (hex & 0x00ff00) >> 8;
	var b = hex & 0xff;
    return [r/255,g/255,b/255];
}

function OnFontSizeChange()
{
	FONTSIZE = Number(editFontSize.text);
}

function OnStrokeWidthChange () {
	STROKEWIDTH = Number(editStrokeWidth.text);
}

function OnSkewAmounChange () {
	SKEWAMOUNT = Number(editSkewAmount.text);
}


function OnLineHeightChange () {
	LINEHEIGHT = Number(editLineHeight.text);
}


function OnColorFill()
{
	var color = $.colorPicker ();
	pickerFill = hexToRgb2(color);
	imgColorFill.graphics.foregroundColor = imgColorFill.graphics.newPen (imgColorFill.graphics.PenType.SOLID_COLOR, pickerFill, 1);
}

function OnColorStroke()
{
	var color = $.colorPicker ();
	pickerStroke = hexToRgb2(color);
	imgColorStroke.graphics.foregroundColor = imgColorStroke.graphics.newPen (imgColorStroke.graphics.PenType.SOLID_COLOR, pickerStroke, 1);
}

function CreateSubtitleLayer()
{
	var startTime = new Date().getTime();
	FRAMERATESOURCE = parseFloat(dropdownFrom.selection.text);

	theSubtitleFile.subtitles = fileToSubtitleEntries(theSubtitleFile.raw, dropdownXmlFileType.selection.text);

	var count = 0;
	var myComp = app.project.activeItem;
	if (myComp == null)
	{
		myComp = app.project.items.addComp('SubtitleComp', 1920, 600, 1, 60, FRAMERATESOURCE);
	}
	var subtitleTextLayer = myComp.layers.addText(theSubtitleFile.movieTitle + " - " + theSubtitleFile.language);

	// Add Text Animators to keyframe text styles
	// This is MUCH faster than assigning new Text Document objects to the text layer
	var animatorStyle = subtitleTextLayer.Text.Animators.addProperty("ADBE Text Animator");
	animatorStyle.name = "Style Animator";
	var animatorStyleFillColor = animatorStyle.Properties.addProperty("ADBE Text Fill Color");
	var animatorStyleStrokeColor = animatorStyle.Properties.addProperty("ADBE Text Stroke Color");
	var animatorStyleStrokeWidth = animatorStyle.Properties.addProperty("ADBE Text Stroke Width");
	var animatorStyleSkew = animatorStyle.Properties.addProperty("ADBE Text Skew");
	var animatorStyleAnchorPoint = animatorStyle.Properties.addProperty("ADBE Text Anchor Point 3D");
	var animatorStyleOpacity = animatorStyle.Properties.addProperty("ADBE Text Opacity");

	// These are just leftovers from a previous version where subtitles were added as ADBE Text Document objects
	// This was slower, but had certain advantages and disadvanteges
	// May return as an optional way to create keys

	// // Initial key on frame 0
	// var doc = theLayer.property("ADBE Text Properties").property("ADBE Text Document").value;
	// doc.resetCharStyle();
	// if (radioHAlignC == true)
	// 	doc.justification = ParagraphJustification.CENTER_JUSTIFY;
	// else if (radioHAlignR == true)
	// 	doc.justification = ParagraphJustification.RIGHT_JUSTIFY;
	// else
	// 	doc.justification = ParagraphJustification.LEFT_JUSTIFY;
	// doc.fontSize = FONTSIZE;
	// doc.fillColor = pickerFill;
	// doc.strokeColor = pickerStroke;
	// doc.strokeWidth = STROKEWIDTH;
	// doc.font = FONTREGULAR;
	// doc.strokeOverFill = true;
	// doc.applyStroke = true;
	// doc.applyFill = true;
	// doc.text = "";
	// subtitleTextLayer.property("ADBE Text Properties").property("ADBE Text Document").setValueAtTime(0, doc);

	var timeBase = 1.0;
	if (checkboxChangeTimebase.value == true) 
	{
		var tbfrom = parseFloat(dropdownFrom.selection.text);
		var tbto = parseFloat(dropdownTo.selection.text);
		timeBase = tbto/tbfrom;
	}

	for each(var sub in theSubtitleFile.subtitles){
		count++;
		clearOutput();
		writeLn("Writing keys... " + count.toString() + "/" + theSubtitleFile.count.toString() + "(" + (count/theSubtitleFile.count*100).toFixed(1).toString() + "%)");

		var timeIn = sub.timeIn * timeBase;
		// $.writeln(timeIn);
		var timeOut = sub.timeOut * timeBase;
		// $.writeln(timeOut);
		// $.writeln("--");
		if (count == 1) subtitleTextLayer.inPoint = timeIn;
		if (count == theSubtitleFile.count)
		{
			myComp.duration = Math.max(timeOut, myComp.duration);
			subtitleTextLayer.outPoint = timeOut;
		}

		var fillColor = sub.fillcolor;
		var strokeColor = sub.strokecolor;

		if (checkboxOverrideColors.value == false)
		{
			fillColor = pickerFill;
			strokeColor = pickerStroke;
		}

		var myMarker = new MarkerValue(sub.text.toString());
		subtitleTextLayer.property("Marker").setValueAtTime(timeIn, myMarker);
		animatorStyleOpacity.setValueAtTime(timeIn, 100);
		animatorStyleOpacity.setValueAtTime(timeOut, 0);
		if (sub.italic == true)
			animatorStyleSkew.setValueAtTime(timeIn, SKEWAMOUNT);
		else
			animatorStyleSkew.setValueAtTime(timeIn, 0);
		animatorStyleFillColor.setValueAtTime(timeIn, fillColor);
		animatorStyleStrokeColor.setValueAtTime(timeIn, strokeColor);
		animatorStyleStrokeWidth.setValueAtTime(timeIn, STROKEWIDTH);
	}

	if(subtitleTextLayer.property("Text").property("Source Text").canSetExpression)
	{
		subtitleTextLayer.property("Text").property("Source Text").expressionEnabled = true;
		subtitleTextLayer.property("Text").property("Source Text").expression = "n = 0; t = 0; if (marker.numKeys > 0){n = marker.nearestKey(time).index; if (marker.key(n).time > time) n--;} if (n > 0) marker.key(n).comment; else '';"
	}

	// make all keys HOLD (square animation curves)
	write("Squaring keys.");
	for (var i = animatorStyleAnchorPoint.numKeys; i > 0; i--) {
	    animatorStyleAnchorPoint.setInterpolationTypeAtKey(i, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
	};
	write(".");
	for (var i = animatorStyleOpacity.numKeys; i > 0; i--) {
	    animatorStyleOpacity.setInterpolationTypeAtKey(i, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
	};
	write(".");
	for (var i = animatorStyleFillColor.numKeys; i > 0; i--) {
	    animatorStyleFillColor.setInterpolationTypeAtKey(i, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
	};
	write(".");
	for (var i = animatorStyleStrokeColor.numKeys; i > 0; i--) {
	    animatorStyleStrokeColor.setInterpolationTypeAtKey(i, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
	};
	write(".");
	for (var i = animatorStyleSkew.numKeys; i > 0; i--) {
	    animatorStyleSkew.setInterpolationTypeAtKey(i, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
	};
	writeLn(".");
	for (var i = animatorStyleStrokeWidth.numKeys; i > 0; i--) {
	    animatorStyleStrokeWidth.setInterpolationTypeAtKey(i, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
	};
	// Fixing the anchor line (to cater for descenders) was made optional, since this made the layer creation slower (several times, since the script
	// has to sample (and thus render) the layer at every keyframe to get the boundary box)
	if (checkboxFixAnchor.value == true)
	{
		writeLn("Fixing Anchor Points... (script may appear to be stuck)");
		for (var i = subtitleTextLayer.property("Marker").numKeys; i > 0; i--) {
			var t = subtitleTextLayer.property("Marker").keyTime(i);
			var rect = subtitleTextLayer.sourceRectAtTime(t+0.01, false);
			if (radioVAlignB.value == true)
				animatorStyleAnchorPoint.setValueAtTime(t, [0, rect.height]);
			else if (radioVAlignM.value == true)
				animatorStyleAnchorPoint.setValueAtTime(t, [0, rect.height/2]);
			else
				break;
		}
		for (var i = animatorStyleAnchorPoint.numKeys; i > 0; i--) {
		    animatorStyleAnchorPoint.setInterpolationTypeAtKey(i, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
		};
	}

	var stopTime = new Date().getTime();
	if (checkboxChangeTimebase.value == true)
	{
		subtitleTextLayer.name = theSubtitleFile.movieTitle.toString() + " - " + theSubtitleFile.language.toString() + " - Retimed: " + dropdownFrom.selection.text + ">" + dropdownTo.selection.text + " (" + timeBase.toFixed(2).toString() + "x)";
	}
	else
	{
		subtitleTextLayer.name = theSubtitleFile.movieTitle.toString() + " - " + theSubtitleFile.language.toString();
	}
	writeLn("Finished in " + ((stopTime-startTime)/1000).toString() + "s");
}


var DCSubToAEPanel = createUI(this); // create the UI elements
theSubtitleFile = new SubtitleFile();
( this instanceof Panel ) ? null : DCSubToAEPanel.show(); // if run as a ScriptUI script, do nothing, else call show()
