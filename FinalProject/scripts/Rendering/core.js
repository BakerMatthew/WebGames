/* global Main */

//
// This namespace provides the core rendering code for the main
Main.renderer.core = (function() {
	'use strict';
	var canvas = null;
	var	context = null;
	var	world = {
			size: 0,
			top: 0,
			left: 0
		};
	var	resizeHandlers = [];

	//
	// Used to set the size of the canvas to match the size of the browser
	// window so that the rendering stays pixel perfect
	function resizeCanvas() {
		var smallestSize = 0;
		var	handler = null;

		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		//
		// Have to figure out where the upper left corner of the unit world is
		// based on whether the width or height is the largest dimension.
		if (canvas.width < canvas.height) {
			smallestSize = canvas.width;
			world.size = smallestSize * 0.9;
			world.left = Math.floor(canvas.width * 0.05);
			world.top = (canvas.height - world.size) / 2;
		} else {
			smallestSize = canvas.height;
			world.size = smallestSize * 0.9;
			world.top = Math.floor(canvas.height * 0.05);
			world.left = (canvas.width - world.size) / 2;
		}

		//
		// Notify interested parties of the canvas resize event
		for (handler in resizeHandlers) {
			resizeHandlers[handler](true);
		}
	}

	//
	// Quick to allow other code to be notified when a resize event occurs.
	function notifyResize(handler) {
		resizeHandlers.push(handler);
	}

	//
	// Toggles the full-screen mode.  If not in full-screen, it enters
	// full-screen.  If in full screen, it exits full-screen
	function toggleFullScreen(element) {
		var	fullScreenElement = document.fullscreenElement ||
								document.webkitFullscreenElement ||
								document.mozFullScreenElement ||
								document.msFullscreenElement;

		element.requestFullScreen = element.requestFullScreen ||
									element.webkitRequestFullscreen ||
									element.mozRequestFullScreen ||
									element.msRequestFullscreen;
		document.exitFullscreen =	document.exitFullscreen ||
									document.webkitExitFullscreen ||
									document.mozCancelFullScreen ||
									document.msExitFullscreen;

		if (!fullScreenElement && element.requestFullScreen) {
			element.requestFullScreen();
		} else if (fullScreenElement) {
			document.exitFullscreen();
		}
	}

	//
	// Clear the whole canvas
	function clearCanvas() {
		context.clearRect(0, 0, canvas.width, canvas.height);
	}

	//
	// This provides initialization of the canvas.  From here the various
	// event listeners we care about are prepared, along with setting up
	// the canvas for rendering
	function initialize() {
		canvas = document.getElementById('canvas-main-game');
		context = canvas.getContext('2d');

		window.addEventListener('resize', function() {
			resizeCanvas();
		}, false);
		window.addEventListener('orientationchange', function() {
			resizeCanvas();
		}, false);
		window.addEventListener('deviceorientation', function() {
			resizeCanvas();
		}, false);

		//
		// Force the canvas to resize to the window first time in, otherwise
		// the canvas is a default we don't want
		resizeCanvas();
	}

	//
	// Renders the text based on the provided spec
	function drawText(spec) {
		context.font = spec.font;
		context.fillStyle = spec.fill;
		context.textBaseline = 'top';

		context.fillText(
			spec.text,
			world.left + spec.position.x * world.size,
			world.top + spec.position.y * world.size);
	}

	//
	// This returns the height of the specified font, in world units
	function measureTextHeight(spec) {
		var height = 0;
		context.save();

		context.font = spec.font;
		context.fillStyle = spec.fill;

		height = context.measureText('m').width / world.size;

		context.restore();

		return height;
	}

	//
	// This returns the width of the specified font, in world units
	function measureTextWidth(spec) {
		var width = 0;
		context.save();

		context.font = spec.font;
		context.fillStyle = spec.fill;

		width = context.measureText(spec.text).width / world.size;

		context.restore();

		return width;
	}

	//
	// Draw a line segment within the unit world
	function drawLine(style, pt1, pt2) {
		context.strokeStyle = style;
		context.beginPath();
		context.moveTo(
			0.5 + world.left + (pt1.x * world.size),
			0.5 + world.top + (pt1.y * world.size));
		context.lineTo(
			0.5 + world.left + (pt2.x * world.size),
			0.5 + world.top + (pt2.y * world.size));
		context.stroke();
	}

	//
	// Draw a circle within the unit world
	function drawCircle(style, center, radius) {
		//
		// 0.5, 0.5 is to ensure an actual 1 pixel line is drawn
		context.strokeStyle = style;
		context.beginPath();
		context.arc(
			0.5 + world.left + (center.x * world.size),
			0.5 + world.top + (center.y * world.size),
			radius * world.size,
			0, 2 * Math.PI);
		context.stroke();
	}

	//
	// Draws a rectangle relative to the 'unit world'
	function drawRectangle(style, left, top, width, height) {
		//
		// 0.5, 0.5 is to ensure an actual 1 pixel line is drawn.
		context.strokeStyle = style;
		context.strokeRect(
			0.5 + world.left + (left * world.size),
			0.5 + world.top + (top * world.size),
			width * world.size,
			height * world.size);
	}

	function saveContext() {
		context.save();
	}

	function drawImage(image, spriteSheetX, spriteSheetY, spriteSheetWidth, spriteSheetHeight, drawX, drawY, spriteWidth, spriteHeight) {
		//
		// Convert from pixel to world coordinates on a few items
		context.drawImage(
			image,
			spriteSheetX, spriteSheetY,
			spriteSheetWidth, spriteSheetHeight,
			drawX * world.size + world.left, drawY * world.size + world.top,
			spriteWidth * world.size, spriteHeight * world.size
		);

		/* ************************************************************************************************

			core.drawImage(
				sprite.spriteSheet,
				sprite.pixelWidth * sprite.sprite, 0,	// Which sprite to pick out
				sprite.pixelWidth, sprite.pixelHeight,	// The size of the sprite in the sprite sheet
				sprite.center.x - sprite.width / 2, sprite.center.y - sprite.height / 2,		// Where to draw the sprite
				sprite.width, sprite.height
			);

		************************************************************************************************ */
	}

	//
	// This converts from client (pixel) coordinates to the unit world coordinates
	function clientToWorld(clientX, clientY) {
		return {
			x: (clientX - world.left) / world.size,
			y: (clientY - world.top) / world.size
		};
	}

	function restoreContext() {
		context.restore();
	}

	function rotateCanvas(center, rotation) {
		context.translate(center.x * world.size + world.left, center.y * world.size + world.top);
		context.rotate(rotation);
		context.translate(-(center.x * world.size + world.left), -(center.y * world.size + world.top));
	}

	return {
		initialize: initialize,
		clearCanvas: clearCanvas,
		toggleFullScreen: toggleFullScreen,
		drawText: drawText,
		measureTextHeight: measureTextHeight,
		measureTextWidth: measureTextWidth,
		drawLine: drawLine,
		drawRectangle: drawRectangle,
		drawCircle: drawCircle,
		drawImage: drawImage,
		saveContext: saveContext,
		notifyResize: notifyResize,
		clientToWorld: clientToWorld,
		restoreContext: restoreContext,
		rotateCanvas: rotateCanvas
	};

}());
