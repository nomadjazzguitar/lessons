
"use strict";

// ============================================================
// RENDERIZADO PRINCIPAL
// ============================================================

function drawFretboard() {

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Fondo del canvas
	if (neckImageLoaded){
/*
		const colorBack = getComputedStyle(document.documentElement).getPropertyValue("--color-dark-background").trim();

		ctx.fillStyle = colorBack;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
*/
	}else{
		ctx.fillStyle = "#FFFFFF";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}

	// Sobresalido discreto de la imagen del diapasón
	neckBleed = Math.max(3, stringSpace * 0.20);

	// Radio de las esquinas redondeadas
	neckRadius = Math.max(5, stringSpace * 0.28);

	// Medidas finales de la imagen
	imageLeft = boardleft - neckBleed;
	imageTop = boardtop - neckBleed;
	imageWidth = boardWidth + neckBleed * 2;
	imageHeight = boardHeight + neckBleed * 2;


	//------------------------------------------------
	// Imagen del diapasón
	//------------------------------------------------

	if (neckImageLoaded) {

		// Degradado

		ctx.save();

		for (let i = 5; i >= 1; i--) {

			ctx.lineWidth = i * 1.5;

			const colorLogo = getComputedStyle(document.documentElement).getPropertyValue("--color-logo").trim().replace("#", "");

			if (colorLogo === "FFF"){
				ctx.strokeStyle = `rgba(255,248,235,${0.03 * i})`;
			}else{
				ctx.strokeStyle = `rgba(0,0,0,${0.03 * i})`;
			}

			roundedRectPath(imageLeft,imageTop,imageWidth,imageHeight,neckRadius);

			ctx.stroke();

		}

		ctx.restore();


		// Clip de la imagen

		ctx.save();

		roundedRectPath(imageLeft, imageTop, imageWidth, imageHeight, neckRadius);

		ctx.clip();

		switch (rotation) {

			//------------------------------------------------
			// Vertical (cejuela arriba)
			//------------------------------------------------

			case 0:

				ctx.save();

				ctx.translate(imageLeft, imageTop + imageHeight);
				ctx.rotate(-Math.PI / 2);

				ctx.drawImage(neckImage, 0, 0, imageHeight, imageWidth);

				ctx.restore();

				break;


			//------------------------------------------------
			// Horizontal (cejuela izquierda)
			//------------------------------------------------

			case 270:

				ctx.drawImage(neckImage, imageLeft, imageTop, imageWidth, imageHeight);

				break;


			//------------------------------------------------
			// Vertical (cejuela abajo)
			//------------------------------------------------

			case 180:

				ctx.save();

				ctx.translate(imageLeft + imageWidth, imageTop);
				ctx.rotate(Math.PI / 2);

				ctx.drawImage(neckImage, 0, 0, imageHeight, imageWidth);

				ctx.restore();

				break;


			//------------------------------------------------
			// Horizontal (cejuela derecha)
			//------------------------------------------------

			case 90:

				ctx.save();

				ctx.translate(imageLeft + imageWidth, imageTop + imageHeight);
				ctx.rotate(Math.PI);

				ctx.drawImage(neckImage, 0, 0, imageWidth, imageHeight);

				ctx.restore();

				break;

		}

		ctx.restore();

	} else {

		ctx.fillStyle = "#FFFFFF";
		ctx.fillRect(boardleft, boardtop, boardWidth, boardHeight);

	}


	//------------------------------------------------
	// Trastes, cuerdas...
	//------------------------------------------------

	if (rotation === 90 || rotation === 270) {
		drawHorizontal();
	} else {
		drawVertical();
	}


	//------------------------------------------------
	// Título
	//------------------------------------------------

	if (chkShowTitle.checked){

		let title = titleText.value.trim() || "Sin Título";

		let fontSize = 24;

		do {

			ctx.font = `bold ${fontSize}px Segoe UI`;
			fontSize--;

		} while (ctx.measureText(title).width > boardWidth - 10 && fontSize > 10);

		if (neckImageLoaded){

			const colorText = getComputedStyle(document.documentElement).getPropertyValue("--color-text").trim();

			ctx.fillStyle = colorText;

		}else{
			ctx.fillStyle = "#000000";
		}

		ctx.textAlign = "left";
		ctx.textBaseline = "middle";

		ctx.fillText(title, boardleft, boardtop - (showFretNumbers && (rotation === 0 || rotation === 90) ? 42 : 20));

	}


	//------------------------------------------------
	// Números
	//------------------------------------------------

	if (showFretNumbers) {

		drawFretNumbers();
		drawStringNumbers();

	}

	//------------------------------------------------
	// Guardamos todo el dibujo
	//------------------------------------------------

	fretboardBackground = ctx.getImageData(0,0,canvas.width,canvas.height);

}

function restoreFretboardBackground() {

	if (!fretboardBackground) return;

	ctx.putImageData(fretboardBackground,0,0);

}

function drawHorizontal() {

	boardright = boardleft + boardWidth;
	boardbottom = boardtop + boardHeight;

	stringSpace = boardHeight / (stringCount - 1);
	fretSpace = boardWidth / fretCount;

	const reverseStrings = (rotation === 90);

	//------------------------------------------------
	// Trastes
	//------------------------------------------------

	for (let fret = 1; fret <= fretCount; fret++) {

		const x = boardleft + getFretPosition(fret);

		const fretWidth = Math.max(2,stringSpace * 0.10);

		const margin = fretWidth / 2;

		if (fretboardStyle === "blank") {

			drawFret(x,boardtop,x,boardbottom,fretWidth);

		} else {

			//------------------------------------------------
			// Traste metálico realista
			//------------------------------------------------

			const y1 = imageTop + margin;
			const y2 = imageTop + imageHeight - margin;

			ctx.save();

			// Sombra exterior

			ctx.beginPath();
			ctx.moveTo(x - fretWidth * 0.65, y1);
			ctx.lineTo(x - fretWidth * 0.65, y2);

			ctx.lineWidth = fretWidth * 1.8;
			ctx.strokeStyle = "rgba(45,45,45,0.45)";
			ctx.stroke();


			// Cuerpo metálico con degradado

			const gradient = ctx.createLinearGradient(
				x - fretWidth,
				0,
				x + fretWidth,
				0
			);

			gradient.addColorStop(0, "#686868");
			gradient.addColorStop(0.18, "#b8b8b8");
			gradient.addColorStop(0.38, "#eeeeee");
			gradient.addColorStop(0.55, "#cfcfcf");
			gradient.addColorStop(0.78, "#8c8c8c");
			gradient.addColorStop(1, "#555555");

			ctx.beginPath();
			ctx.moveTo(x, y1);
			ctx.lineTo(x, y2);

			ctx.lineWidth = fretWidth;
			ctx.strokeStyle = gradient;
			ctx.stroke();


			// Pequeño brillo central

			ctx.beginPath();
			ctx.moveTo(x - fretWidth * 0.15, y1);
			ctx.lineTo(x - fretWidth * 0.15, y2);

			ctx.lineWidth = Math.max(0.35,fretWidth * 0.16);

			ctx.strokeStyle = "rgba(255,255,255,0.55)";
			ctx.stroke();


			// Sombra fina en el lado derecho

			ctx.beginPath();
			ctx.moveTo(x + fretWidth * 0.30, y1);
			ctx.lineTo(x + fretWidth * 0.30, y2);

			ctx.lineWidth = Math.max(0.35,fretWidth * 0.12);

			ctx.strokeStyle = "rgba(30,30,30,0.45)";
			ctx.stroke();

			ctx.restore();

		}

	}

	if (displayMode) {

		drawInlays(boardleft,boardtop,stringSpace);

	}


	//------------------------------------------------
	// Cuerdas
	//------------------------------------------------

	const stringBleed = Math.max(3,stringSpace * 0.10);

	for (let s = 0; s < stringCount; s++) {

		const index = reverseStrings ? stringCount - 1 - s : s;

		const y = boardtop + index * stringSpace;

		let stringWidth;

		if (s < 3) {

			stringWidth = 1 + s * 0.2;

		} else {

			stringWidth = 1.8 + (s - 3) * 0.45;

		}

		if (fretboardStyle === "blank") {

			ctx.beginPath();
			ctx.moveTo(boardleft, y);
			ctx.lineTo(boardright, y);
			ctx.lineWidth = 1;
			ctx.strokeStyle = "#000";
			ctx.stroke();

		} else {

			//------------------------------------------------
			// Cuerda metálica realista
			//------------------------------------------------

			const x1 = boardleft - stringBleed;
			const x2 = boardright;

			ctx.save();

			// Sombra inferior

			ctx.beginPath();
			ctx.moveTo(x1, y + stringWidth * 0.30);
			ctx.lineTo(x2, y + stringWidth * 0.30);

			ctx.lineWidth = stringWidth * 1.15;
			ctx.strokeStyle = "rgba(35,35,35,0.45)";
			ctx.stroke();


			// Cuerpo metálico

			const gradient = ctx.createLinearGradient(
				0,
				y - stringWidth,
				0,
				y + stringWidth
			);

			gradient.addColorStop(0, "#555555");
			gradient.addColorStop(0.22, "#a8a8a8");
			gradient.addColorStop(0.45, "#f0f0f0");
			gradient.addColorStop(0.58, "#c8c8c8");
			gradient.addColorStop(0.80, "#777777");
			gradient.addColorStop(1, "#404040");

			ctx.beginPath();
			ctx.moveTo(x1, y);
			ctx.lineTo(x2, y);

			ctx.lineWidth = stringWidth;
			ctx.strokeStyle = gradient;
			ctx.stroke();


			// Brillo superior

			ctx.beginPath();
			ctx.moveTo(x1, y - stringWidth * 0.22);
			ctx.lineTo(x2, y - stringWidth * 0.22);

			ctx.lineWidth = Math.max(0.25,stringWidth * 0.16);

			ctx.strokeStyle = "rgba(255,255,255,0.65)";
			ctx.stroke();


			// Línea oscura central muy sutil

			ctx.beginPath();
			ctx.moveTo(x1, y + stringWidth * 0.12);
			ctx.lineTo(x2, y + stringWidth * 0.12);

			ctx.lineWidth = Math.max(0.2,stringWidth * 0.10);

			ctx.strokeStyle = "rgba(40,40,40,0.35)";
			ctx.stroke();

			ctx.restore();

		}

	}


	//------------------------------------------------
	// Cejuela
	//------------------------------------------------

	if (!displayMode) {

		const fretWidth = Math.max(2,stringSpace * 0.10);

		const nutX = rotation === 270 ? boardleft : boardright;

		drawFret(nutX,boardtop,nutX,boardbottom,fretWidth);

	} else {

		if (fretboardStyle === "blank") {

			const nutWidth = 3;
			const gap = 5;

			ctx.lineWidth = nutWidth;
			ctx.strokeStyle = getNutColor();

			const x1 = rotation === 270 ? boardleft : boardright;

			const x2 = rotation === 270 ? boardleft + gap : boardright - gap;

			ctx.beginPath();
			ctx.moveTo(x1, boardtop);
			ctx.lineTo(x1, boardbottom);
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(x2, boardtop);
			ctx.lineTo(x2, boardbottom);
			ctx.stroke();

		} else {

			drawRealisticNut();

		}

	}


}

function drawVertical() {

	boardright = boardleft + boardWidth;
	boardbottom = boardtop + boardHeight;

	stringSpace = boardWidth / (stringCount - 1);
	fretSpace = boardHeight / fretCount;

	const reverseStrings = (rotation === 180);

	//------------------------------------------------
	// Trastes
	//------------------------------------------------

	for (let fret = 1; fret <= fretCount; fret++) {

		const y = boardtop + getFretPosition(fret);

		const fretWidth = Math.max(2,stringSpace * 0.10);

		const margin = fretWidth / 2;

		if (fretboardStyle === "blank") {

			drawFret(boardleft,y,boardright,y,fretWidth);

		} else {

			//------------------------------------------------
			// Traste metálico realista
			//------------------------------------------------

			const x1 = imageLeft + margin;
			const x2 = imageLeft + imageWidth - margin;

			ctx.save();

			// Sombra exterior

			ctx.beginPath();
			ctx.moveTo(x1, y - fretWidth * 0.65);
			ctx.lineTo(x2, y - fretWidth * 0.65);

			ctx.lineWidth = fretWidth * 1.8;
			ctx.strokeStyle = "rgba(45,45,45,0.45)";
			ctx.stroke();


			// Cuerpo metálico con degradado

			const gradient = ctx.createLinearGradient(0,y - fretWidth,0,y + fretWidth);

			gradient.addColorStop(0, "#555555");
			gradient.addColorStop(0.18, "#8c8c8c");
			gradient.addColorStop(0.38, "#d0d0d0");
			gradient.addColorStop(0.52, "#f0f0f0");
			gradient.addColorStop(0.72, "#b0b0b0");
			gradient.addColorStop(1, "#5b5b5b");

			ctx.beginPath();
			ctx.moveTo(x1, y);
			ctx.lineTo(x2, y);

			ctx.lineWidth = fretWidth;
			ctx.strokeStyle = gradient;
			ctx.stroke();


			// Brillo superior

			ctx.beginPath();
			ctx.moveTo(x1, y - fretWidth * 0.15);
			ctx.lineTo(x2, y - fretWidth * 0.15);

			ctx.lineWidth = Math.max(0.35,fretWidth * 0.16);

			ctx.strokeStyle = "rgba(255,255,255,0.55)";
			ctx.stroke();


			// Sombra inferior

			ctx.beginPath();
			ctx.moveTo(x1, y + fretWidth * 0.30);
			ctx.lineTo(x2, y + fretWidth * 0.30);

			ctx.lineWidth = Math.max(0.35,fretWidth * 0.12);

			ctx.strokeStyle = "rgba(30,30,30,0.45)";
			ctx.stroke();

			ctx.restore();

		}

	}

	if (displayMode) {

		drawInlays(boardleft,boardtop,stringSpace);

	}

	//------------------------------------------------
	// Cuerdas
	//------------------------------------------------

	const stringBleed = Math.max(3,stringSpace * 0.10);

	for (let s = 0; s < stringCount; s++) {

		const index = reverseStrings ? s : stringCount - 1 - s;

		const x = boardleft + index * stringSpace;

		let stringWidth;

		if (s < 3) {

			stringWidth = 1 + s * 0.2;

		} else {

			stringWidth = 1.8 + (s - 3) * 0.45;

		}

		if (fretboardStyle === "blank") {

			ctx.beginPath();
			ctx.moveTo(x, boardtop);
			ctx.lineTo(x, boardbottom);
			ctx.lineWidth = 1;
			ctx.strokeStyle = "#000";
			ctx.stroke();

		} else {

			//------------------------------------------------
			// Cuerda metálica realista
			//------------------------------------------------

			const y1 = boardtop - stringBleed;
			const y2 = boardbottom;

			ctx.save();

			// Sombra lateral

			ctx.beginPath();
			ctx.moveTo(x + stringWidth * 0.30, y1);
			ctx.lineTo(x + stringWidth * 0.30, y2);

			ctx.lineWidth = stringWidth * 1.15;
			ctx.strokeStyle = "rgba(35,35,35,0.45)";
			ctx.stroke();


			// Cuerpo metálico

			const gradient = ctx.createLinearGradient(x - stringWidth,0,x + stringWidth,0);

			gradient.addColorStop(0, "#444444");
			gradient.addColorStop(0.20, "#8c8c8c");
			gradient.addColorStop(0.42, "#ededed");
			gradient.addColorStop(0.55, "#c8c8c8");
			gradient.addColorStop(0.80, "#737373");
			gradient.addColorStop(1, "#3e3e3e");

			ctx.beginPath();
			ctx.moveTo(x, y1);
			ctx.lineTo(x, y2);

			ctx.lineWidth = stringWidth;
			ctx.strokeStyle = gradient;
			ctx.stroke();


			// Brillo lateral

			ctx.beginPath();
			ctx.moveTo(x - stringWidth * 0.22, y1);
			ctx.lineTo(x - stringWidth * 0.22, y2);

			ctx.lineWidth = Math.max(0.25,stringWidth * 0.16);

			ctx.strokeStyle = "rgba(255,255,255,0.65)";
			ctx.stroke();


			// Sombra central sutil

			ctx.beginPath();
			ctx.moveTo(x + stringWidth * 0.12, y1);
			ctx.lineTo(x + stringWidth * 0.12, y2);

			ctx.lineWidth = Math.max(0.2,stringWidth * 0.10);

			ctx.strokeStyle = "rgba(40,40,40,0.35)";
			ctx.stroke();

			ctx.restore();

		}

	}

	//------------------------------------------------
	// Cejuela
	//------------------------------------------------

	if (!displayMode) {

		const fretWidth = Math.max(2,stringSpace * 0.10);

		const nutY = rotation === 0 ? boardtop : boardbottom;

		drawFret(boardleft,nutY,boardright,nutY,fretWidth);

	} else {

		if (fretboardStyle === "blank") {

			const nutWidth = 3;
			const gap = 5;

			ctx.lineWidth = nutWidth;
			ctx.strokeStyle = getNutColor();

			const y1 = rotation === 0 ? boardtop : boardbottom;

			const y2 = rotation === 0 ? boardtop + gap : boardbottom - gap;

			ctx.beginPath();
			ctx.moveTo(boardleft, y1);
			ctx.lineTo(boardright, y1);
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(boardleft, y2);
			ctx.lineTo(boardright, y2);
			ctx.stroke();

		} else {

			drawRealisticNut();

		}

	}

}

function drawRealisticNut() {

	const nutThickness = Math.max(6, stringSpace * 0.34);
	const nutRadius = Math.min(3, nutThickness / 2);

	ctx.save();

	ctx.lineCap = "round";
	ctx.lineJoin = "round";

	const nutFill = "#e8dfc9";
	const nutShadow = "rgba(40,28,18,0.45)";
	const nutHighlight = "rgba(255,255,255,0.72)";
	const slotColor = "rgba(78,58,38,0.62)";

	ctx.shadowColor = nutShadow;
	ctx.shadowBlur = 3;

	switch (rotation) {

		case 0:
		case 270:
			ctx.shadowOffsetX = 1;
			ctx.shadowOffsetY = 1;
			break;

		case 180:
		case 90:
			ctx.shadowOffsetX = -1;
			ctx.shadowOffsetY = -1;
			break;

	}

	switch (rotation) {

		//------------------------------------------------
		// Vertical (cejuela arriba)
		//------------------------------------------------

		case 0: {

			const x = boardleft - nutRadius;
			const y = boardtop - nutThickness / 2;
			const width = boardWidth + nutRadius * 2;
			const height = nutThickness;

			ctx.beginPath();

			ctx.moveTo(x + nutRadius, y);
			ctx.lineTo(x + width - nutRadius, y);
			ctx.quadraticCurveTo(x + width, y, x + width, y + nutRadius);
			ctx.lineTo(x + width, y + height - nutRadius);
			ctx.quadraticCurveTo(x + width, y + height, x + width - nutRadius, y + height);
			ctx.lineTo(x + nutRadius, y + height);
			ctx.quadraticCurveTo(x, y + height, x, y + height - nutRadius);
			ctx.lineTo(x, y + nutRadius);
			ctx.quadraticCurveTo(x, y, x + nutRadius, y);

			ctx.closePath();

			ctx.fillStyle = nutFill;
			ctx.fill();

			ctx.shadowColor = "transparent";

			// Brillo superior
			ctx.beginPath();
			ctx.moveTo(x + nutRadius, y + nutThickness * 0.28);
			ctx.lineTo(x + width - nutRadius, y + nutThickness * 0.28);
			ctx.strokeStyle = nutHighlight;
			ctx.lineWidth = Math.max(0.7, nutThickness * 0.13);
			ctx.stroke();

			// Ranuras
			for (let s = 0; s < stringCount; s++) {

				const stringX = boardright - s * stringSpace;

				ctx.beginPath();
				ctx.moveTo(stringX, y + nutThickness * 0.18);
				ctx.lineTo(stringX, y + nutThickness * 0.82);
				ctx.strokeStyle = slotColor;
				ctx.lineWidth = Math.max(0.7, 1 + s * 0.14);
				ctx.stroke();

			}

			break;
		}

		//------------------------------------------------
		// Horizontal (cejuela izquierda)
		//------------------------------------------------

		case 270: {

			const x = boardleft - nutThickness / 2;
			const y = boardtop - nutRadius;
			const width = nutThickness;
			const height = boardHeight + nutRadius * 2;

			ctx.beginPath();

			ctx.moveTo(x + nutRadius, y);
			ctx.lineTo(x + width - nutRadius, y);
			ctx.quadraticCurveTo(x + width, y, x + width, y + nutRadius);
			ctx.lineTo(x + width, y + height - nutRadius);
			ctx.quadraticCurveTo(x + width, y + height, x + width - nutRadius, y + height);
			ctx.lineTo(x + nutRadius, y + height);
			ctx.quadraticCurveTo(x, y + height, x, y + height - nutRadius);
			ctx.lineTo(x, y + nutRadius);
			ctx.quadraticCurveTo(x, y, x + nutRadius, y);

			ctx.closePath();

			ctx.fillStyle = nutFill;
			ctx.fill();

			ctx.shadowColor = "transparent";

			ctx.beginPath();
			ctx.moveTo(x + nutThickness * 0.28, y + nutRadius);
			ctx.lineTo(x + nutThickness * 0.28, y + height - nutRadius);
			ctx.strokeStyle = nutHighlight;
			ctx.lineWidth = Math.max(0.7, nutThickness * 0.13);
			ctx.stroke();

			for (let s = 0; s < stringCount; s++) {

				const stringY = boardtop + s * stringSpace;

				ctx.beginPath();
				ctx.moveTo(x + nutThickness * 0.18, stringY);
				ctx.lineTo(x + nutThickness * 0.82, stringY);
				ctx.strokeStyle = slotColor;
				ctx.lineWidth = Math.max(0.7, 1 + s * 0.14);
				ctx.stroke();

			}

			break;
		}

		//------------------------------------------------
		// Vertical (cejuela abajo)
		//------------------------------------------------

		case 180: {

			const x = boardleft - nutRadius;
			const y = boardbottom - nutThickness / 2;
			const width = boardWidth + nutRadius * 2;
			const height = nutThickness;

			ctx.beginPath();

			ctx.moveTo(x + nutRadius, y);
			ctx.lineTo(x + width - nutRadius, y);
			ctx.quadraticCurveTo(x + width, y, x + width, y + nutRadius);
			ctx.lineTo(x + width, y + height - nutRadius);
			ctx.quadraticCurveTo(x + width, y + height, x + width - nutRadius, y + height);
			ctx.lineTo(x + nutRadius, y + height);
			ctx.quadraticCurveTo(x, y + height, x, y + height - nutRadius);
			ctx.lineTo(x, y + nutRadius);
			ctx.quadraticCurveTo(x, y, x + nutRadius, y);

			ctx.closePath();

			ctx.fillStyle = nutFill;
			ctx.fill();

			ctx.shadowColor = "transparent";

			// Brillo inferior
			ctx.beginPath();
			ctx.moveTo(x + nutRadius, y + nutThickness * 0.72);
			ctx.lineTo(x + width - nutRadius, y + nutThickness * 0.72);
			ctx.strokeStyle = nutHighlight;
			ctx.lineWidth = Math.max(0.7, nutThickness * 0.13);
			ctx.stroke();

			for (let s = 0; s < stringCount; s++) {

				const stringX = boardleft + s * stringSpace;

				ctx.beginPath();
				ctx.moveTo(stringX, y + nutThickness * 0.18);
				ctx.lineTo(stringX, y + nutThickness * 0.82);
				ctx.strokeStyle = slotColor;
				ctx.lineWidth = Math.max(0.7, 1 + s * 0.14);
				ctx.stroke();

			}

			break;
		}

		//------------------------------------------------
		// Horizontal (cejuela derecha)
		//------------------------------------------------

		case 90: {

			const x = boardright - nutThickness / 2;
			const y = boardtop - nutRadius;
			const width = nutThickness;
			const height = boardHeight + nutRadius * 2;

			ctx.beginPath();

			ctx.moveTo(x + nutRadius, y);
			ctx.lineTo(x + width - nutRadius, y);
			ctx.quadraticCurveTo(x + width, y, x + width, y + nutRadius);
			ctx.lineTo(x + width, y + height - nutRadius);
			ctx.quadraticCurveTo(x + width, y + height, x + width - nutRadius, y + height);
			ctx.lineTo(x + nutRadius, y + height);
			ctx.quadraticCurveTo(x, y + height, x, y + height - nutRadius);
			ctx.lineTo(x, y + nutRadius);
			ctx.quadraticCurveTo(x, y, x + nutRadius, y);

			ctx.closePath();

			ctx.fillStyle = nutFill;
			ctx.fill();

			ctx.shadowColor = "transparent";

			// Brillo derecho
			ctx.beginPath();
			ctx.moveTo(x + nutThickness * 0.72, y + nutRadius);
			ctx.lineTo(x + nutThickness * 0.72, y + height - nutRadius);
			ctx.strokeStyle = nutHighlight;
			ctx.lineWidth = Math.max(0.7, nutThickness * 0.13);
			ctx.stroke();

			for (let s = 0; s < stringCount; s++) {

				const stringY = boardbottom - s * stringSpace;

				ctx.beginPath();
				ctx.moveTo(x + nutThickness * 0.18, stringY);
				ctx.lineTo(x + nutThickness * 0.82, stringY);
				ctx.strokeStyle = slotColor;
				ctx.lineWidth = Math.max(0.7, 1 + s * 0.14);
				ctx.stroke();

			}

			break;
		}

	}

	ctx.restore();

}

function drawFret(x1, y1, x2, y2, fretWidth) {

	// Cuerpo metálico
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);

	ctx.strokeStyle = "#666";
	ctx.lineWidth = fretWidth;
	ctx.stroke();

	// Reflejo metálico
	ctx.beginPath();

	if (x1 === x2) {

		// Traste vertical
		ctx.moveTo(x1 - fretWidth * 0.18,y1);

		ctx.lineTo(x2 - fretWidth * 0.18,y2);

	} else {

		// Traste horizontal
		ctx.moveTo(x1,y1 - fretWidth * 0.18);

		ctx.lineTo(x2,y2 - fretWidth * 0.18);

	}

	ctx.strokeStyle = "rgba(255,255,255,0.75)";
	ctx.lineWidth = Math.max(0.7,fretWidth * 0.22);

	ctx.stroke();

}

function roundedRectPath(x, y, width, height, radius) {

	const r = Math.min(radius, width / 2, height / 2);

	ctx.beginPath();

	ctx.moveTo(x + r, y);
	ctx.lineTo(x + width - r, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + r);
	ctx.lineTo(x + width, y + height - r);
	ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
	ctx.lineTo(x + r, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - r);
	ctx.lineTo(x, y + r);
	ctx.quadraticCurveTo(x, y, x + r, y);
	ctx.closePath();

}

function drawInlays(left, top, stringSpace) {

	if (!chkInlays.checked) return;

	const marks = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
	const radius = 6;

	ctx.fillStyle = getInlayColor();

	const horizontal = rotation === 90 || rotation === 270;
	const reverseStrings = rotation === 180 || rotation === 90;

	marks.forEach(fret => {

		if (fret > fretCount) return;

		const fretCenter = getFretCenter(fret);

		let x;
		let y;

		if (horizontal) {

			x = left + fretCenter;
			y = top + (reverseStrings ? (stringCount - 1 - 2.5) * stringSpace : 2.5 * stringSpace);

		} else {

			x = left + (reverseStrings ? 2.5 * stringSpace : (stringCount - 1 - 2.5) * stringSpace);
			y = top + fretCenter;

		}

		//------------------------------------------------
		// Trastes 12 y 24
		//------------------------------------------------

		if (fret === 12 || fret === 24) {

			if (horizontal) {

				const y1 = top + (reverseStrings ? (stringCount - 1 - 1.5) * stringSpace : 1.5 * stringSpace);
				const y2 = top + (reverseStrings ? (stringCount - 1 - 3.5) * stringSpace : 3.5 * stringSpace);

				ctx.beginPath();
				ctx.arc(x, y1, radius, 0, Math.PI * 2);
				ctx.fill();

				ctx.beginPath();
				ctx.arc(x, y2, radius, 0, Math.PI * 2);
				ctx.fill();

			} else {

				const x1 = left + (reverseStrings ? 1.5 * stringSpace : (stringCount - 1 - 1.5) * stringSpace);
				const x2 = left + (reverseStrings ? 3.5 * stringSpace : (stringCount - 1 - 3.5) * stringSpace);

				ctx.beginPath();
				ctx.arc(x1, y, radius, 0, Math.PI * 2);
				ctx.fill();

				ctx.beginPath();
				ctx.arc(x2, y, radius, 0, Math.PI * 2);
				ctx.fill();

			}

		} else {

			ctx.beginPath();
			ctx.arc(x, y, radius, 0, Math.PI * 2);
			ctx.fill();

		}

	});

}

function drawFretNumbers() {

	ctx.save();

	if (neckImageLoaded){
		const colorText = getComputedStyle(document.documentElement).getPropertyValue("--color-text").trim();
		ctx.fillStyle = colorText;
	}else{
		ctx.fillStyle = "#000000";
	}

	ctx.font = "12px Segoe UI";
	ctx.textBaseline = "middle";

	let numIni = 1;

	if (!displayMode) {

		numIni = numberFrets.value == null || numberFrets.value === "" ? 1 : parseInt(numberFrets.value);

	}

	const horizontal = rotation === 90 || rotation === 270;

	if (horizontal) {

		ctx.textAlign = "center";

		const y = rotation === 90 ? boardtop - 18 : boardbottom + 18;

		for (let fret = 1; fret <= fretCount; fret++) {

			const p = getCellCenter(0, fret);

			ctx.fillText(numIni++, p.x, y);

		}

	} else {

		ctx.textAlign = rotation === 0 ? "right" : "left";

		const x = rotation === 0 ? boardleft - 18 : boardright + 18;

		for (let fret = 1; fret <= fretCount; fret++) {

			const p = getCellCenter(0, fret);

			ctx.fillText(numIni++, x, p.y);

		}

	}

	ctx.restore();

}

function drawStringNumbers() {

	ctx.save();

	if (neckImageLoaded){
		const colorText = getComputedStyle(document.documentElement).getPropertyValue("--color-text").trim();
		ctx.fillStyle = colorText;
	}else{
		ctx.fillStyle = "#000000";
	}

	ctx.font = "12px Segoe UI";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	for (let s = 0; s < stringCount; s++) {

		let x;
		let y;

		switch (rotation) {

			//------------------------------------------------
			// Vertical (cejuela arriba)
			//------------------------------------------------

			case 0:

				x = boardright - s * stringSpace;
				y = boardtop - 18;

				break;

			//------------------------------------------------
			// Horizontal (cejuela izquierda)
			//------------------------------------------------

			case 270:

				x = boardleft - 18;
				y = boardtop + s * stringSpace;

				break;

			//------------------------------------------------
			// Vertical (cejuela abajo)
			//------------------------------------------------

			case 180:

				x = boardleft + s * stringSpace;
				y = boardbottom + 18;

				break;

			//------------------------------------------------
			// Horizontal (cejuela derecha)
			//------------------------------------------------

			case 90:

				x = boardright + 18;
				y = boardbottom - s * stringSpace;

				break;

		}

		ctx.fillText(s + 1, x, y);

	}

	ctx.restore();

}


//==================================================
// DRAW NOTES
//==================================================

function drawNotesAlpha(opacity = 1) {

	restoreFretboardBackground();

	drawBarres(opacity);

	notes.forEach(note => {

		const p = getCellCenter(note.string, note.fret);

		drawMarker(p.x, p.y, note, false, opacity);

	});

	drawNutNotes(opacity);

	// Guardar el estado completo: mástil + notas con opacidad
	fretboardPlaybackBackground = ctx.getImageData(0,0,canvas.width,canvas.height);

}

function drawPlayingMarker(x, y) {

	ctx.save();

	ctx.globalAlpha = 1;

	const radius = stringSpace * 0.39;
	const border = Math.max(0.6, radius * 0.05);

	ctx.beginPath();
	ctx.arc(x, y, radius, 0, Math.PI * 2);

	ctx.fillStyle = "#FFF";
	ctx.fill();

	ctx.strokeStyle = "#000";
	ctx.lineWidth = border;
	ctx.stroke();

	ctx.restore();

}

function drawNotes() {

	restoreFretboardBackground();

	drawBarres();

	notes.forEach(note => {

		const p = getCellCenter(note.string, note.fret);

		drawMarker(p.x, p.y, note, false);

	});

	drawNutNotes();

	drawNutHover();
	drawHoverMarker();

}

function drawBarres(opacity = 1) {

	for (const barre of barreNotes) {

		drawBarre(barre,opacity);

	}

}

function drawBarre(barre, opacity = 1) {

	const firstString = 0;
	const lastString = barre.startString;

	const markerRadius = Math.min(stringSpace * 0.34, 14);

	const barThickness = markerRadius * 2;

	const border = Math.max(0.6,markerRadius * 0.05);

	const fillColor = String(barre.color).toLowerCase();

	const textColor = getTextColor(fillColor);

	ctx.save();

	ctx.globalAlpha = opacity;

	ctx.lineCap = "round";
	ctx.lineJoin = "round";

	ctx.shadowColor = "rgba(0,0,0,0.28)";
	ctx.shadowBlur = 2;
	ctx.shadowOffsetX = 1;
	ctx.shadowOffsetY = 1;

	//------------------------------------------------
	// Posición
	//------------------------------------------------

	const p1 = getCellCenter(firstString,barre.fret);

	const p2 = getCellCenter(lastString,barre.fret);

	const x1 = p1.x;
	const y1 = p1.y;

	const x2 = p2.x;
	const y2 = p2.y;

	//------------------------------------------------
	// Barra
	//------------------------------------------------

	if (opacity < 1) {

		ctx.beginPath();
		ctx.strokeStyle = barre.color;
		ctx.lineWidth = barThickness;
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();

	}else{

		ctx.beginPath();
		ctx.strokeStyle = "#000";
		ctx.lineWidth = barThickness + border * 2;
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();

		ctx.beginPath();
		ctx.strokeStyle = barre.color;
		ctx.lineWidth = barThickness;
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();

	}

	//------------------------------------------------
	// Texto
	//------------------------------------------------

	const textPosition = getCellCenter(barre.startString,barre.fret);

	const textX = textPosition.x;
	const textY = textPosition.y;

	const text = getNoteText(textX,textY,barre.text);

	ctx.shadowColor = "transparent";
	ctx.fillStyle = textColor;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	//------------------------------------------------
	// Tamaño de fuente
	//------------------------------------------------

	let fontSize = markerRadius * 1.45;

	ctx.font = `bold ${fontSize}px Segoe UI`;

	const maxWidth = barThickness * 0.85;

	while (ctx.measureText(text).width > maxWidth && fontSize > 5) {

		fontSize -= 0.5;

		ctx.font = `bold ${fontSize}px Segoe UI`;
	}

	//------------------------------------------------
	// Dibujar texto
	//------------------------------------------------

	ctx.fillText(text,textX,textY + fontSize * 0.03);

	ctx.restore();

}

function drawNutNotes(opacity = 1) {

	const gap = 5;

	for (let s = 0; s < stringCount; s++) {

		const note = nutNotes[s];

		if (!note) continue;

		let x;
		let y;

		switch (rotation) {

			//------------------------------------------------
			// Vertical (cejuela arriba)
			//------------------------------------------------

			case 0:

				x = boardleft + (stringCount - 1 - s) * stringSpace;
				y = boardtop + gap / 2;

				break;

			//------------------------------------------------
			// Horizontal (cejuela izquierda)
			//------------------------------------------------

			case 270:

				x = boardleft + gap / 2;
				y = boardtop + s * stringSpace;

				break;

			//------------------------------------------------
			// Vertical (cejuela abajo)
			//------------------------------------------------

			case 180:

				x = boardleft + s * stringSpace;
				y = boardbottom - gap / 2;

				break;

			//------------------------------------------------
			// Horizontal (cejuela derecha)
			//------------------------------------------------

			case 90:

				x = boardright - gap / 2;
				y = boardtop + (stringCount - 1 - s) * stringSpace;

				break;

		}

		drawMarker(x,y,note,true,opacity);

	}

}

function drawMarker(x, y, note, isNut = false, opacity = 1) {

	if (!note || !note.color) return;

	ctx.save();

	ctx.globalAlpha = opacity;

	const radius = stringSpace * 0.39;
	const border = Math.max(0.6, radius * 0.05);

	ctx.beginPath();
	ctx.arc(x, y, radius, 0, Math.PI * 2);

	ctx.fillStyle = note.color;
	ctx.fill();

	if (opacity >= 1) {

		ctx.strokeStyle = "#000";
		ctx.lineWidth = border;
		ctx.stroke();

	}

	const fillColor = String(note.color).toLowerCase();

	const textColor = getTextColor(fillColor);

	ctx.fillStyle = textColor;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	const text = getNoteText(x, y, note.text, isNut);

	let fontSize = radius * 1.15;

	ctx.font = `bold ${fontSize}px Segoe UI`;

	const maxWidth = radius * 1.7;

	while (ctx.measureText(text).width > maxWidth && fontSize > 5) {

		fontSize -= 0.5;

		ctx.font = `bold ${fontSize}px Segoe UI`;
	}

	ctx.fillText(text, x, y + fontSize * 0.03);

	ctx.restore();

}

function drawHoverMarker() {

	if (!hoverCell) return;

	const hasNote = notes.some(note => note.string === hoverCell.string && note.fret === hoverCell.fret);

	if (hasNote) return;

	const p = getCellCenter(hoverCell.string, hoverCell.fret);
	const radius = stringSpace * 0.39;
	const border = Math.max(0.6, radius * 0.05);

	ctx.save();
	ctx.globalAlpha = 0.35;

	ctx.beginPath();
	ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);

	ctx.fillStyle = colorPicker.value;
	ctx.fill();

	ctx.strokeStyle = "#000";
	ctx.lineWidth = border;
	ctx.stroke();

	ctx.restore();
}

function drawNutHover() {

	// Si no estamos sobre el NUT
	if (hoverNut === null) {
		return;
	}

	// Si estamos sobre un traste,
	// no dibujamos el hover del NUT.
	if (hoverCell !== null) {
		return;
	}

	// Si ya existe una nota en el NUT, tampoco dibujamos el hover.
	if (nutNotes[hoverNut]) {
		return;
	}

	const gap = 5;

	let x;
	let y;

	switch (rotation) {

		//------------------------------------------------
		// Vertical (cejuela arriba)
		//------------------------------------------------

		case 0:

			x = boardright - hoverNut * stringSpace;
			y = boardtop + gap / 2;

			break;

		//------------------------------------------------
		// Horizontal (cejuela izquierda)
		//------------------------------------------------

		case 270:

			x = boardleft + gap / 2;
			y = boardtop + hoverNut * stringSpace;

			break;

		//------------------------------------------------
		// Vertical (cejuela abajo)
		//------------------------------------------------

		case 180:

			x = boardleft + hoverNut * stringSpace;
			y = boardbottom - gap / 2;

			break;

		//------------------------------------------------
		// Horizontal (cejuela derecha)
		//------------------------------------------------

		case 90:

			x = boardright - gap / 2;
			y = boardbottom - hoverNut * stringSpace;

			break;

	}

	const radius = stringSpace * 0.39;
	const border = Math.max(0.6, radius * 0.05);

	ctx.save();

	ctx.globalAlpha = 0.35;

	ctx.beginPath();
	ctx.arc(x,y,radius,0,Math.PI * 2);

	ctx.fillStyle = colorPicker.value;
	ctx.fill();

	ctx.strokeStyle = "#000";
	ctx.lineWidth = border;
	ctx.stroke();

	ctx.restore();

}


// ============================================================
// GEOMETRÍA DEL DIAPASÓN
// ============================================================

function getFretPosition(fret) {

	// Longitud útil del mástil
	const neckLength = (rotation === 90 || rotation === 270) ? boardWidth : boardHeight;

	let position;

	//------------------------------------------------
	// Modo sin escala (trastes equidistantes)
	//------------------------------------------------

	if (!displayMode) {

		position = (neckLength / fretCount) * fret;

	} else {

		//------------------------------------------------
		// Escala temperada real
		//------------------------------------------------

		const scaleLength = 648;

		const realPosition = scaleLength - (scaleLength / Math.pow(2, fret / 12));

		const lastFretPosition = scaleLength - (scaleLength / Math.pow(2, fretCount / 12));

		position = (realPosition / lastFretPosition) * neckLength;

	}

	//------------------------------------------------
	// Invertir el sentido del mástil
	//------------------------------------------------

	if (rotation === 180 || rotation === 90) {

		position = neckLength - position;

	}

	return position;

}

function getFretFromPosition(position) {

	for (let fret = 1; fret <= fretCount; fret++) {

		const start = getFretPosition(fret - 1);
		const end = getFretPosition(fret);

		if (position >= Math.min(start, end) && position <= Math.max(start, end)) {
			return fret;
		}

	}

	return null;

}

function getFretCenter(fret) {

	const start = getFretPosition(fret - 1);
	const end = getFretPosition(fret);

	return (start + end) / 2;

}

// ============================================================
// INTERACCIÓN CON RATÓN
// ============================================================


function getNotePosition(string, fret) {

	if (fret === 0) {

		const gap = 5;

		switch (rotation) {

			case 0:

				return {
					x: boardleft + (stringCount - 1 - string) * stringSpace,
					y: boardtop + gap / 2
				};

			case 270:

				return {
					x: boardleft + gap / 2,
					y: boardtop + string * stringSpace
				};

			case 180:

				return {
					x: boardleft + string * stringSpace,
					y: boardbottom - gap / 2
				};

			case 90:

				return {
					x: boardright - gap / 2,
					y: boardtop + (stringCount - 1 - string) * stringSpace
				};

		}

	}

	return getCellCenter(string, fret);

}

function getCellCenter(string, fret) {

	const fretCenter = getFretCenter(fret);

	switch (rotation) {

		//------------------------------------------------
		// Vertical (cejuela arriba)
		//------------------------------------------------

		case 0:

			return {
				x: boardleft + (stringCount - 1 - string) * stringSpace,
				y: boardtop + fretCenter
			};

		//------------------------------------------------
		// Horizontal (cejuela izquierda)
		//------------------------------------------------

		case 270:

			return {
				x: boardleft + fretCenter,
				y: boardtop + string * stringSpace
			};

		//------------------------------------------------
		// Vertical (cejuela abajo)
		//------------------------------------------------

		case 180:

			return {
				x: boardleft + string * stringSpace,
				y: boardtop + fretCenter
			};

		//------------------------------------------------
		// Horizontal (cejuela derecha)
		//------------------------------------------------

		case 90:

			return {
				x: boardleft + fretCenter,
				y: boardtop + (stringCount - 1 - string) * stringSpace
			};

	}

}

function getCellFromMouse(x, y) {

	const minX = boardleft;
	const maxX = boardright;
	const minY = boardtop - stringSpace / 2;
	const maxY = boardbottom + stringSpace / 2;

	if (x < minX || x > maxX || y < minY || y > maxY) return null;

	let string;
	let fret;

	switch (rotation) {

		//------------------------------------------------
		// Vertical (cejuela arriba)
		//------------------------------------------------

		case 0:

			string = Math.round((x - boardleft) / stringSpace);
			string = stringCount - 1 - string;
			fret = getFretFromPosition(y - boardtop);

			break;

		//------------------------------------------------
		// Horizontal (cejuela izquierda)
		//------------------------------------------------

		case 270:

			string = Math.round((y - boardtop) / stringSpace);
			fret = getFretFromPosition(x - boardleft);

			break;

		//------------------------------------------------
		// Vertical (cejuela abajo)
		//------------------------------------------------

		case 180:

			string = Math.round((x - boardleft) / stringSpace);
			fret = getFretFromPosition(y - boardtop);

			break;

		//------------------------------------------------
		// Horizontal (cejuela derecha)
		//------------------------------------------------

		case 90:

			string = Math.round((y - boardtop) / stringSpace);
			string = stringCount - 1 - string;
			fret = getFretFromPosition(x - boardleft);

			break;

	}

	if (fret === null) return null;

	string = Math.max(0, Math.min(stringCount - 1, string));

	return {
		string,
		fret
	};

}

function getNutStringFromMouse(x, y) {

	switch (rotation) {

		//------------------------------------------------
		// Vertical (cejuela arriba)
		//------------------------------------------------

		case 0: {

			if (y > boardtop + 8) return null;

			let string = Math.round((x - boardleft) / stringSpace);
			string = stringCount - 1 - string;

			if (string < 0 || string >= stringCount) return null;

			return string;

		}

		//------------------------------------------------
		// Horizontal (cejuela izquierda)
		//------------------------------------------------

		case 270: {

			if (x > boardleft + 8) return null;

			let string = Math.round((y - boardtop) / stringSpace);

			if (string < 0 || string >= stringCount) return null;

			return string;

		}

		//------------------------------------------------
		// Vertical (cejuela abajo)
		//------------------------------------------------

		case 180: {

			if (y < boardbottom - 8) return null;

			let string = Math.round((x - boardleft) / stringSpace);

			if (string < 0 || string >= stringCount) return null;

			return string;

		}

		//------------------------------------------------
		// Horizontal (cejuela derecha)
		//------------------------------------------------

		case 90: {

			if (x < boardright - 8) return null;

			let string = Math.round((y - boardtop) / stringSpace);
			string = stringCount - 1 - string;

			if (string < 0 || string >= stringCount) return null;

			return string;

		}

	}

	return null;

}

function getDynamicNeckLength() {

	const calculatedLength = fretCount * PIXELS_PER_FRET;

	return Math.max(MIN_NECK_LENGTH,Math.min(MAX_NECK_LENGTH, calculatedLength));

}


// ============================================================
// UTILIDADES DE COLOR
// ============================================================

function getStringColor() {

	if (fretboardStyle === "blank") {
		return "rgba(70, 70, 70, 0.85)";
	}

	return "rgba(205, 127, 50, 0.95)";	
}

function getInlayColor() {

	if (fretboardStyle === "rosewood") {
		return "rgba(245, 245, 245, 0.5)";
	}

	return "rgba(0, 0, 0, 0.40)";
}

function getNutColor() {

	if (fretboardStyle === "rosewood") {
		return "rgba(218, 160, 95, 0.98)";
	}

	return "rgba(0, 0, 0, 0.85)";
}


function undo() {

	if (history.length === 0) {
		return;
	}

	const lastState = history.pop();

	notes = lastState.notes;
	nutNotes = lastState.nutNotes;
	barreNotes = lastState.barreNotes ?? [];

	drawNotes();

	aSequence = buildOrderedSequence();

	aChords = buildOrderedChords();

	loadArrayNotas();

	if (isScoreVisible) scoreRender();

}

function updateHoverCell(e) {

	if (isMobile || (editMode !== "note" && editMode !== "barre")) {

		if (hoverCell !== null) {

			hoverCell = null;

			drawNotes();

		}

		return;

	}

	const cell = getCellFromMouse(e.offsetX,e.offsetY);

	const sameCell =
		hoverCell &&
		cell &&
		hoverCell.string === cell.string &&
		hoverCell.fret === cell.fret;

	if (sameCell) {
		return;
	}

	// Si sales del área válida del diapasón, elimina el círculo.
	if (!cell && hoverCell === null) {
		return;
	}

	hoverCell = cell;

	drawNotes();

}

function updateHoverNut(e) {

	if (
		window.innerWidth <= maxMediaScreenWidth ||
		(editMode !== "note" && editMode !== "barre")
	) {

		if (hoverNut !== null) {

			hoverNut = null;

			drawNotes();

		}

		return;

	}

	const nut = getNutStringFromMouse(
		e.offsetX,
		e.offsetY
	);

	if (nut === hoverNut) {
		return;
	}

	hoverNut = nut;

	drawNotes();

}

function getTextColor(backgroundColor) {

    const hex = backgroundColor.replace("#", "");

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness > 155 ? "#000" : "#fff";
}

function getNoteText(x, y, text, isNut = false) {

	if (chkNoteNames.checked) {

		let { string, fret } = getCellFromMouse(x, y);

		if (isNut) fret--;

		const scale = scales[cmbKey.value];

		const useFlats = scale?.some(note => note.includes("b"));

		if (useFlats) {
			text = fretboardMapNotesFlats[string][fret];
		} else {
			text = fretboardMapNotes[string][fret];
		}

		// B → Cb en tonalidad de Gb
		if (cmbKey.value === "Gb") {
			text = text.replace(/^B(\d+)$/, "Cb$1");
		}

		text = convertNote(text, cmbNoteNames.value);

		// Quitar número de octava
		text = text.replace(/\d+$/, "");
	}

	return text;

}

function convertNote(note, notation = "latin") {

    if (notation === "anglo") {
        return note;
    }

    const notes = {
        "C": "Do",
        "D": "Re",
        "E": "Mi",
        "F": "Fa",
        "G": "Sol",
        "A": "La",
        "B": "Si"
    };

    return note.replace(/^([A-G])([#♯b♭]?)(\d+)$/, (_, name, accidental, octave) => {
        return notes[name] + accidental + octave;
    });

}