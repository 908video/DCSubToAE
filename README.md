# DCSubToAE

ExtendedScript plugin to import Subtitles into After Effects

Currently supports the following subtitle formats:
- Interop (DCSubtitle XML)
- TimeXML
- SRT (SubRip)

more to come...

The import right now is rather basic:
- there is little to no error checking
- SRT: text formatting is not supported (tags are just read as text)
- Interop: images are not supported


### How does it work?
Rather simple, actually (once one manages to bend your mind around the ExtendedScript API - which more often than not is for from obvious...). What we do is use the Layer Marker facility of After Effects to write each subtitle as a Layer Marker's comment onto a fresh layer. We then use Text Animators to keyframe certain text attributes at the correct in- and out-times of the subtitles.

The advantage of doing it this way:
- speed
- regular Text Layer that can be modified globally without keys (font, size...)

The disadvantage (compared to creating Text Document objects and keyframing those):
- less keyed control over the text attributes
- all text uses the same font etc
- no "real" regular and italic fonts in the same layer (instead, fake italics by skewing the fonts per key)

The "Source Text" attribute of the Text Layer uses an expression (set up by the script too) to read the text from the Layer Markers:

```javascript
n = 0; 
t = 0; 
if (marker.numKeys > 0)
{
  n = marker.nearestKey(time).index; 
  if (marker.key(n).time > time) n--;
} 
if (n > 0) marker.key(n).comment; 
else '';
```

### Installation
Just copy into your `Scripts\ScriptUI Panels\` folder

### Disclaimer
This script was created as an in-house tool to burn (and retime) subtitles for DCPs. I would not exactly call it well tested and error proof. I'd rather expect it to set your cat on fire and run screaming through town. Naked. But in most cases, with well behaving subtitle files, it does what it should. And that's something too, right?
