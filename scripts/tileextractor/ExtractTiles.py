import Image, ImageDraw, ImageFont
import md5, sha
import sys, time, os
import re

tileSize = (16,16)
outputWidth = 10
outputSpare = 1
scale = 2

pathIn = 'input/'
pathOut = 'output/'

animatedTiles = []
		
class Tile :
	pixels = None
	hash = None
	number = None
	image = None
	
	def __init__ (self) :
		self.pixels = {}
		self.hash = ''
		self.number = 0
		self.image = None
		
	def putpixel (self, pixel, data) :
		self.pixels[pixel] = data

	def getpixel (self, pixel) :
		return self.pixels[pixel]
	
	def generateHash (self) :
		self.hash = md5.md5(str(self)).hexdigest()
		self.hash += sha.sha(str(self)).hexdigest()
	
	def save (self, filename) :
		img = Image.new("RGBA", tileSize)
		for j in range(tileSize[1]) :
			for i in range(tileSize[0]) :
				pixel = (i, j)
				img.putpixel(pixel, self.getpixel(pixel))
				
		img.save(filename)
				
	def __str__ (self) :
		retStr = ''
		for i in self.pixels :
			pixel = self.getpixel(i)
			retStr += str(pixel[0])
			retStr += str(pixel[1])
			retStr += str(pixel[2])
		return retStr
	
	def __repr__ (self) :
		return self.hash
		
class AnimatedTile :
	knownFrames = None
	
	def __init__ (self, frames) :
		self.knownFrames = frames

def createTile(firstPixel, image) :
	currentPixel = [firstPixel[0], firstPixel[1]]
	tile = Tile()
	replace = False
	for j in range(tileSize[1]) :
		for i in range(tileSize[0]) :
			data = image.getpixel((currentPixel[0], currentPixel[1]))
			if data[3] < 255 :
				data = (data[0], data[1], data[2], 255)
				replace = True
			tile.putpixel((i, j), data)
			currentPixel[0] += 1
		currentPixel[1] += 1
		currentPixel[0] = firstPixel[0]
	tile.generateHash()
	return tile, replace
	
def replaceTile(firstPixel, tile, image) :
	currentPixel = [firstPixel[0], firstPixel[1]]
	for j in range(tileSize[1]) :
		for i in range(tileSize[0]) :
			data = tile.getpixel((i, j))
			image.putpixel((currentPixel[0], currentPixel[1]), data)
			currentPixel[0] += 1
		currentPixel[1] += 1
		currentPixel[0] = firstPixel[0]
	return image

def writeTile(tile, out, firstPixel) :
	currentPixel = [firstPixel[0], firstPixel[1]]
	for i in range(tileSize[1]) :
		for j in range(tileSize[0]) :
			data = tile.getpixel((j, i))
			out.putpixel((currentPixel[0], currentPixel[1]), data)
			currentPixel[0] += 1
		currentPixel[1] += 1
		currentPixel[0] = firstPixel[0]

def isDuplicate(tile, hashes) :
	i = 0
	for hash in hashes :
		if hash == tile.hash :
			return True, i
		i += 1
	while i % outputWidth >= outputWidth - outputSpare :
		i += 1
		hashes.append(None)
	hashes.append(tile.hash)
	return False, i

def extractAnimations() :
	animationsImage = Image.open(pathIn + 'animations.png')
	animations = []
	
	print "loading animation frames . . ."
	tilesHigh = animationsImage.size[1] / tileSize[1] 
	tilesWide = animationsImage.size[0] / tileSize[0]
	for j in range(tilesHigh) :
		percentDone = 100 / (tilesHigh / float(j+1))
		print str(percentDone)[0:5] + "%"
		row = []
		for i in range(tilesWide) :
			pixel = (i*tileSize[0], j*tileSize[1])
			if animationsImage.getpixel(pixel)[3] != 0 :
				tile = createTile(pixel, animationsImage)[0]
				row.append(tile)
		animations.append(AnimatedTile(row))
	
	return animations
	
def isAnimationFrame(tile) :
	for row in animatedTiles :
		for frame in row.knownFrames :
			if tile.hash == frame.hash :
				return row.knownFrames[0]
	return None
			

def extractTiles(filename, filetype) :
	
	map = re.sub("\.(png|jpg|gif)$", '', filename)
	fullImage = pathIn + filename
	outputImage = pathOut + map + "tiles" + filetype
	image = Image.open(fullImage).convert("RGBA")
	tiles = []
	tileOrder = []
	hashes = []
	
	currentPixel = [0,0]
	print "starting " + filename
	tilesHigh = image.size[1] / tileSize[1] 
	tilesWide = image.size[0] / tileSize[0]
	for j in range(tilesHigh) :
		percentDone = 100 / (tilesHigh / float(j+1))
		print str(percentDone)[0:5] + "%"
		for i in range(tilesWide) :
			currentPixel = (i * tileSize[0], j * tileSize[1])
			if image.getpixel((currentPixel))[3] != 0 :
				tile, replace = createTile(currentPixel, image)
				af = isAnimationFrame(tile)
				if af != None :
					tile = af
					replace = True
				if replace :
					replaceTile(currentPixel, tile, image)
				isDup, id = isDuplicate(tile, hashes)
				if not isDup :
					tiles.append(tile)
				tile.number = id
				tileOrder.append(id)
			
	outputSize = (tileSize[0] * outputWidth, tileSize[1] * (1 + len(tiles) / (outputWidth - outputSpare)))
	out = Image.new(image.mode, outputSize, (255, 255, 255,0))
	i = 0
	j = 0
	for tile in tiles :
		writeTile(tile, out, (i*tileSize[0], j*tileSize[1]))
		i += 1
		if i == outputWidth - outputSpare :
			i = 0
			j += 1
	size = (out.size[0] * scale, out.size[1] * scale)
	print size
	print "saving. . ."
	out = out.resize(size, Image.NEAREST)
	out.save(outputImage)
	
	size = (image.size[0] * scale, image.size[1] * scale)
	image = image.resize(size, Image.NEAREST)
	image.save(pathOut + map + "noanim.png")
	
listing = os.listdir(pathIn)
for file in listing :
	m = re.search("\.(png|jpg|gif)$", file)
	if file == 'animations.png' :
		animatedTiles = extractAnimations()
	elif m != None :
		extractTiles(file, m.group(0))