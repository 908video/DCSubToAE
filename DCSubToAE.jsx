// v 0.14

// NOTES:
// there is no validation of the XML yet
// there is no evaluation of XML within the subtitle text yet

//#include "json2.js"

// GLOBALS
var myXML;
var xmlString;

var FONTSIZE = 16;
var FONTREGULAR = "ArialMT";
var FONTITALIC = "Arial-ItalicMT";
var STROKEWIDTH = 0.2;
var LINEHEIGHT = 25;
var FRAMERATESOURCE = 25;
var SKEWAMOUNT = 15;
var FADEIN = 0;
var FADEOUT = 0;

var labelInfoSubtitleID,labelInfoMovieTitle,labelInfoReelNumber,labelInfoLanguage,labelInfoLoadFontId;
var dropdownFrom, dropdownTo, dropdownXmlFileType;
var editFontRegular, editFontItalic, editFontSize, editStrokeWidth, editLineHeight, editSkewAmount, editFadeIn, editFadeOut;
var btOpenFile, btRun, btColorFill, btColorStroke;
var checkboxChangeTimebase;
var checkboxFixAnchor;
var imgColorFill, imgColorStroke;
var pickerFill, pickerStroke;
var radioVAlignT,radioVAlignM,radioVAlignB;
var radioHAlignL,radioHAlignC,radioHAlignM;
var frameRateList = ['23.976', '24', '25', '29.97', '30', '48', '50', '60'];
var xmlFileTypes = ['DCSubtitle', 'TimeXML', 'SubRipSRT', 'FinalCut XMEML'];

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
	this.xmlString = "";
	this.xml = undefined;
	this.count = 0;
}

function encode_utf8( s ) {
    return unescape( encodeURIComponent( s ) );
}

function decode_utf8( s ) {
    var unicoderegex = /\\u([\d\w]{4})/gi;
    try {
        var t = escape( s );
        t = t.replace(unicoderegex, function (match, grp) {
            return String.fromCharCode(parseInt(grp, 16));
        });
        //t = JSON.parse(t);
        return decodeURIComponent(t);
    }
    catch(err) {
        return err.message;
    }
}

SubtitleFile.prototype.readXML = function() {
	if (this.file != null)
	{
		try {
			this.fileName = this.file.name;
			this.file.open('r');
			this.xmlString = this.file.read();
			this.xml = new XML(this.xmlString);
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
			this.xmlString = this.file.read();
			this.xml = this.xmlString;
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
 
// SubtitleEntry.prototype.timeAsSeconds = function(t, fps) 
// {
// 	var u = t.split(':');
// 	var h = Number(u[0]);
// 	var m = Number(u[1]);
// 	var s = Number(u[2]);
// 	var ms = Number(u[3].substring(0,2));
// 	return (h * 60 * 60) + (m * 60) + s + (ms/fps);
// }

// SubtitleEntry.prototype.timeInAsSeconds = function(fps) {return this.timeAsSeconds(this.timeIn, fps);}
// SubtitleEntry.prototype.timeOutAsSeconds = function(fps) {return this.timeAsSeconds(this.timeOut, fps);}
// SubtitleEntry.prototype.fadeInAsSeconds = function(fps) {return this.timeAsSeconds(this.fadeIn, fps);}
// SubtitleEntry.prototype.fadeOutAsSeconds = function(fps) {return this.timeAsSeconds(this.fadeOut, fps);}



function GetXMLFromFile() {
	theSubtitleFile.file = File.openDialog("Choose A Subtitle XML File","Subtitles:*.xml;*.srt");
	var res;

	if (dropdownXmlFileType.selection.text == "DCSubtitle")
	{
		var res = theSubtitleFile.readXML();
		if (res != undefined)
		{
			theSubtitleFile.subtitleId = theSubtitleFile.xml.SubtitleID;
			theSubtitleFile.movieTitle = theSubtitleFile.xml.MovieTitle;
			theSubtitleFile.reel = theSubtitleFile.xml.ReelNumber;
			theSubtitleFile.language = theSubtitleFile.xml.Language;
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
	else if (dropdownXmlFileType.selection.text == "FinalCut XMEML")
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

function fileToSubtitleEntries(xml, format)
{
	var subtitleArray = new Array();
	var counter = 0;

    $.writeln(format);

	if (format == "DCSubtitle")
	{
		theSubtitleFile.count = xml.Font.child("Font").length();
		
		for each(var child in xml.Font.child("Font")){
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
		theSubtitleFile.count = xml.child("Paragraph").length();
		
		for each(var child in xml.child("Paragraph")){
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
		var lines = xml.split("\n");

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
    else if (format == "FinalCut XMEML")
    {
		theSubtitleFile.count = 0;

        for each(var track in xml.sequence.media.video.track)
        {
            for each(var generatoritem in track.generatoritem)
            {
                    for each(var param in generatoritem.effect.parameter) {
                        if (param["parameterid"].toString() != "str") continue;
                        
                        var s = new SubtitleEntry();
                        counter++;
                        theSubtitleFile.count++;

                        clearOutput();
                        writeLn("Reading Subs: " + counter.toString() + "/" + theSubtitleFile.count.toString() + "(" + (counter/theSubtitleFile.count*100).toFixed(1).toString() + "%)");

                        s.framerate = parseFloat(generatoritem.rate["timebase"].text()); // FRAMERATESOURCE;
                        FRAMERATESOURCE = s.framerate;
                        s.timeIn = parseFloat(generatoritem["start"].text()) / FRAMERATESOURCE;
                        s.timeOut = parseFloat(generatoritem["end"].text()) / FRAMERATESOURCE;
                        s.fadeIn = -1;
                        s.fadeOut = -1;
                        s.italic = false;
                        s.fontName = FONTREGULAR;
                        
                        s.text = param["value"].toString();
                        var regex = new RegExp("&#13;", "g");
                        s.text = s.text.replace(regex, "\n");
                        s.text = decode_utf8(s.text);
                        $.writeln(s.text);
                        subtitleArray.push(s);
                    } // for each parameter
            } // for each generator
        } // for each track
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

    var grpXmlType = newGroup(myPanel, 'row', ["fill","fill"], [300,30], [300,20]);
	grpXmlType.add('statictext',[undefined,undefined,80,16],"XML Type:");
	dropdownXmlFileType = grpXmlType.add('dropdownlist', undefined, xmlFileTypes);
	dropdownXmlFileType.selection = 0;
    btOpenFile = grpXmlType.add("button", [undefined,undefined,100,25], "Open XML File").onClick = GetXMLFromFile;

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
		editSkewAmount.onChange = OnSkewAmountChange;
    
    myPanel.add ("panel");

	var grpFade = newGroup(myPanel, 'row', ["fill","fill"], [300,20], [300,20]);
		grpFade.add('statictext',[undefined,undefined,80,20],"Fade In:");
		editFadeIn = grpFade.add('edittext',[undefined,undefined,50,20],0);
		editFadeIn.onChange = OnFadeInAmountChange;
         grpFade.add('statictext',[undefined,undefined,80,20],"Fade Out:");
         editFadeOut = grpFade.add('edittext',[undefined,undefined,50,20],0);
		editFadeOut.onChange = OnFadeOutAmountChange;
        
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

	var grpButtonRun = newGroup(myPanel, 'row', ["fill","top"], [300,25], [300,25]);
    	btRun = grpButtonRun.add("button", [undefined,undefined,100,25], "Run Script").onClick = CreateSubtitleLayer;
 		btRun.enabled = false;
 	
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

function OnSkewAmountChange () {
	SKEWAMOUNT = Number(editSkewAmount.text);
}


function OnLineHeightChange () {
	LINEHEIGHT = Number(editLineHeight.text);
}

function OnFadeInAmountChange() {
    FADEIN = Number(editFadeIn.text);
}

function OnFadeOutAmountChange() {
    FADEOUT = Number(editFadeOut.text);
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

	theSubtitleFile.subtitles = fileToSubtitleEntries(theSubtitleFile.xml, dropdownXmlFileType.selection.text);

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
         DCSubToAEPanel.update();
		var timeIn = sub.timeIn * timeBase;
		//$.writeln(timeIn);
		var timeOut = sub.timeOut * timeBase;
		//$.writeln(timeOut);
		//$.writeln("--");
		if (count == 1) subtitleTextLayer.inPoint = timeIn;
         subtitleTextLayer.outPoint = timeOut;
         myComp.duration = Math.max(timeOut, myComp.duration);

         var fillColor = sub.fillcolor;
		var strokeColor = sub.strokecolor;

		if (checkboxOverrideColors.value == false)
		{
			fillColor = pickerFill;
			strokeColor = pickerStroke;
		}

		var myMarker = new MarkerValue(sub.text.toString());
		

        if (FADEIN !== 0) {
            subtitleTextLayer.property("Marker").setValueAtTime(timeIn, myMarker);
            animatorStyleOpacity.setValueAtTime(timeIn, 0);
            animatorStyleOpacity.setValueAtTime(timeIn+FADEIN/FRAMERATESOURCE, 100);
        }
        else
        {
            subtitleTextLayer.property("Marker").setValueAtTime(timeIn, myMarker);
            animatorStyleOpacity.setValueAtTime(timeIn, 100);
        }

        if (FADEOUT !== 0) {
            animatorStyleOpacity.setValueAtTime(timeOut-FADEOUT/FRAMERATESOURCE, 100);            
            animatorStyleOpacity.setValueAtTime(timeOut, 0);
        }
        else
        {
            animatorStyleOpacity.setValueAtTime(timeOut, 0);
        }
           
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
	// clearOutput();
	write("Squaring keys.");
	for (var i = animatorStyleAnchorPoint.numKeys; i > 0; i--) {
	    animatorStyleAnchorPoint.setInterpolationTypeAtKey(i, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
	};
	write(".");
    if (FADEIN !== 0 || FADEOUT !== 0) {
        for (var i = animatorStyleOpacity.numKeys; i > 0; i--) {
            animatorStyleOpacity.setInterpolationTypeAtKey(i, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
        };
    }
    else {
        for (var i = animatorStyleOpacity.numKeys; i > 0; i--) {
            animatorStyleOpacity.setInterpolationTypeAtKey(i, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
        };
    }
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
// DCSubToAEPanel.show();
