import Image, ImageDraw, ImageFont
import sys, time, os
import re

pathIn = 'input/'
pathOut = 'output/'

def trimBottom(filename) :
	map = re.sub("\.png$", '', filename)
	image = Image.open(pathIn + filename).convert("RGBA")
	paddingRows = -1
	i = image.size[1] - 1
	while i > 0 :
		for j in range(image.size[0]) :
			pxl = image.getpixel((j, i))
			if pxl[3] != 0 :
				i = 0
		i -= 1
		paddingRows += 1
		
	i = image.size[1] - paddingRows
	while i > 0 :
		for j in range(image.size[0]) :
			pxl = image.getpixel((j, i))
			if pxl[3] != 0 :
				image.putpixel((j,i), (0,0,0,0))
				image.putpixel((j,i+paddingRows), pxl)
		i -= 1
	
	print paddingRows
	outfile = pathOut + map + ".png"
	image.save(outfile)

if len(sys.argv) > 1 :
	scale = float(sys.argv[1])
	
listing = os.listdir(pathIn)
for file in listing :
	m = re.search("\.png$", file)
	if m != None :
		trimBottom(file)