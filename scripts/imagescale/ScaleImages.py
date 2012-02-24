import Image, ImageDraw, ImageFont
import sys, time, os
import re

scale = 2

pathIn = 'input/'
pathOut = 'output/'

def scaleUp(filename) :
	map = re.sub("\.png$", '', filename)
	image = Image.open(pathIn + filename).convert("RGBA")
	size = (int(image.size[0] * scale), int(image.size[1] * scale))
	image = image.resize(size, Image.NEAREST)
	outfile = pathOut + map
	if scale != 2 :
		outfile += "x" + str(int(scale))
	outfile += ".png"
	image.save(outfile)

if len(sys.argv) > 1 :
	scale = float(sys.argv[1])
	
listing = os.listdir(pathIn)
for file in listing :
	m = re.search("\.png$", file)
	if m != None :
		scaleUp(file)