
"use strict";

//==================================================
// DOCUMENT EVENTS
//==================================================

document.addEventListener("DOMContentLoaded", () => {

	setTheme(currentTheme);

});

window.addEventListener("load", () => {

	initializeApp();

});

window.addEventListener("resize", () => {

	isMobile = window.innerWidth <= maxMediaScreenWidth;

	updateTopBarMenu();

	if (isMobile && !topControls.classList.contains("isOpen")){

		menuPopup.classList.remove("isOpen");

		menuSelectorText.textContent = "MENÚ";
		menuSelectorIcon.className = "fa-solid fa-gear fa-fw";

	}

	if (!isPlaying && isFretboardVisible) resizeCanvas();

	if (!isPlaying && isScoreVisible) scoreRender();

	if (window.innerWidth >= 480) btnToggleLibraryPanel.style.display = "none";

});

window.addEventListener("orientationchange", () => {

	const newRotated = screen.orientation.angle;

	if (newRotated !== screenRotated) {

		screenRotated = newRotated;

		requestAnimationFrame(() => {

			updateTopBarMenu();

		});

	}

	if (window.innerWidth >= 480) btnToggleLibraryPanel.style.display = "none";

});

document.addEventListener("keydown", e => {

	if (!isStudentActive || isPlaying) return;

	if (videoContainer.style.display === "flex") return;

/*
	if (e.code === "Space") {

		e.preventDefault();

		if (!btnPlayStop.disabled) btnPlayStop.click();

		return;
	}
*/

	if (!e.ctrlKey && !e.metaKey) return;

	switch (e.key.toLowerCase()) {

		case "p":

			e.preventDefault();

			btnNewProject.click();

			break;

		case "s":

			e.preventDefault();

			if (isAdmin && !btnSaveProject.disabled) btnSaveProject.click();

			break;

		case "a":

			e.preventDefault();

			if (isAdmin) btnOpenLibrary.click();

			break;

		case "e":

			e.preventDefault();

			if (!btnEdit.disabled) {

				if (menuOpen !== "edit") setMenu("edit");

				if (editMode !== "note") setEditMode("note");

			}

			break;

		case "z":

			e.preventDefault();

			if (editMode !== "view") undo();

			break;

	}

});

document.addEventListener("click",(e)=>{

	//Cerra el boton de menu cuando se pincha fuera de él
	if(!menuPopup.contains(e.target) && !btnMenuSelector.contains(e.target)){

		menuPopup.classList.remove("isOpen");

	}

});

document.addEventListener("contextmenu", (e) => {

	if (!isAdmin) e.preventDefault();

});

document.addEventListener("dragover", event => {

	event.preventDefault();

});


document.addEventListener("drop", event => {

	event.preventDefault();

});



////////////////////////////////////////////////////////////
//
// PLAYER DISPATCH EVENTS
//
////////////////////////////////////////////////////////////


function emitMetronomeBeat(beat,subBeat,mode="tick") {

    document.dispatchEvent(new CustomEvent("metronomeBeat",{
        detail:{beat,subBeat,mode}
    }));

}

document.addEventListener("metronomeBeat", (e) => {

	let { beat, subBeat, mode } = e.detail;

	switch (mode) {

		case "restart":
		case "stop":

			workspaceMetronome.style.display = "none";

			resetMetronomeTimeline();

			break;

		case "start":
		case "tick":

			workspaceMetronome.style.display = "flex";

			updateMetronomeTimeline(beat, subBeat);

			metronome_Info.innerHTML = "Metrónomo: <b>" + beat + " / " + subBeat + "</b>";

			break;

	}

});

function emitPlayerBeat(beat, subBeat, mode = "tick", repetition = 1) {

    document.dispatchEvent(new CustomEvent("playerBeat", {
        detail: {
            beat,
            subBeat,
            repetition,
            mode
        }
    }));

}

document.addEventListener("playerBeat", (e) => {

	let { beat, subBeat, mode, repetition } = e.detail;

	switch (mode) {

		case "sequence":
		case "chord":

			countBars = 1;
			repetitionSequence = 1;
			firstTick = true;

			break;

		case "tick":

			if (isFretboardVisible) {

				// Restaurar mástil + notas con opacidad
				if (fretboardPlaybackBackground) ctx.putImageData(fretboardPlaybackBackground,0,0);

				// Pintar cada nota o acorde
				if (fretboardType === "sequence") {

					const note = scoreArray[sequenceIndex];

					if (note) drawPlayingMarker(note.x,note.y);

				}else if (fretboardType === "chord") {

					const chord = scoreArray.find(note => note.chord === sequenceIndex);

					if (chord) {

						scoreArray.filter(note => note.chord === chord.chord)
							.forEach(note => {

								drawPlayingMarker(note.x,note.y);

							});

					}

				}

				sequenceIndex++;

			}

			if (beat === 1 && subBeat === 1) {

				if (firstTick) {

					firstTick = false;

				} else {

					countBars++;

				}

			}

			if (isScoreVisible) scorePaint_scoreTick();

			break;

		case "repeat":

			repetitionSequence = repetition;
			countBars = 1;
			firstTick = true;

			sequenceIndex = 0;

			if (isScoreVisible) scorePaint_stop();

			break;

		case "stop":

			if (isFretboardVisible) {
				drawFretboard();
				drawNotes();
			}

			if (isScoreVisible) scorePaint_stop();

			resetPlaybackTimeline();

			break;

		case "end":

			if (isFretboardVisible && chkFretboardZoom.checked && orientation === "horizontal") {	
				zoomCanvas();
				fitCanvasWidth = !fitCanvasWidth;
			}

			if (isFretboardVisible) {
				drawFretboard();
				drawNotes();
			}

			if (isScoreVisible) scorePaint_stop();

			resetPlaybackTimeline();

			workspaceTimeInfo.style.display = "none";

			setControlsEnabled(true);

			isPlaying = false;

			setPlayStopButton(btnPlayStop, false);

			if (!isMobile && topControlsWasOpen) openTopControls();
			topControlsWasOpen = false;

			if (!isMobile && libraryWasOpen && appMode !== "Shared") openLibraryPanel();
			libraryWasOpen = false;

			break;

	}

	if (mode === "sequence" || mode === "chord" || mode === "tick" || mode === "repeat") {

		player_repeatInfo.innerHTML = "Repetición: <b>" + repetitionSequence + "&nbsp;</b>Compás: <b>" + countBars + "</b>";

	}else{
		if (chkAutoScroll.checked) document.body.scrollTo({top: 0,left: 0,behavior: "smooth"});
	}
});


//==================================================
// EVENTOS DIBUJO CANVAS
//==================================================

canvas.addEventListener("mouseenter", () => {

	if (isTouchDevice) {
		cursor.style.display = "none";
	}else{
		cursor.style.display = "block";
	}

});

canvas.addEventListener("mouseleave", () => {

	cursor.style.display = "none";

	hoverCell = null;
	hoverNut = null;

	if (editMode !== "view") drawNotes();

});

canvas.addEventListener("mousemove", (e) => {

	if (isTouchDevice) {

		cursor.style.display = "none";

		if (hoverCell !== null || hoverNut !== null) {

			hoverCell = null;
			hoverNut = null;

			if (editMode !== "view") drawNotes();

		}

		return;

	}

	if (editMode === "view") return;

	cursor.style.left = e.pageX + "px";
	cursor.style.top = e.pageY + "px";

	updateHoverNut(e);
	updateHoverCell(e);

});

canvas.addEventListener("click", (e) => {

	if (editMode === "view") return;

	let chord = cmbChords.value;
	if (cmbFretboardType.value !== "chord") chord = "";

	projectModified = true;

	if (projectType !== "fretboard") btnPlayStop.disabled = false;

	const nutString = getNutStringFromMouse(e.offsetX,e.offsetY);

	// Zona de la cejuela física
	if (nutString !== null) {

		if (editMode === "note") {
			
			if (chkEditSound.checked && displayMode) player.playNoteFor(fretboardMapNotes[nutString][0], 1);

			// En acordes no permitir dos veces la misma nota.
			if (cmbFretboardType.value === "chord" && chordNoteExists(nutString,0,chord)) return;

			noteOrder++;

			saveHistory();

			nutNotes[nutString] = {
				color: colorPicker.value,
				text: noteText.value.trim(),
				chord: chord,
				order: noteOrder
			};

			if (!isMobile) noteText.focus({ preventScroll: true });
			noteText.value = "";

		} else if (editMode === "erase") {

			if (nutNotes[nutString]) {

				saveHistory();

				nutNotes[nutString] = null;

			}

		}

		if (!isMobile && editMode !== "erase") noteText.focus({ preventScroll: true });

		noteText.value = "";

		if (cmbFretboardType.value !== "chord"){
			aSequence = buildOrderedSequence();
		}else{
			aChords = buildOrderedChords();
		}

		loadArrayNotas();

		drawNotes();

		if (isScoreVisible) scoreRender();

		//Hacer sonar el acorde
		if (chkEditSound.checked && displayMode && cmbFretboardType.value === "chord"){
			const chordToPlay = aChords.filter(item => item.chord === parseInt(cmbChords.value, 10)).map(item => item.note);		
			if (chordToPlay.length > 0) player.playChordFor(chordToPlay, 1);
		}

		return;

	}

	// Zona de los trastes
	const cell = getCellFromMouse(e.offsetX,e.offsetY);

	if (!cell) return;

	// Zona de los trastes
	switch (editMode) {

		case "barre":

			if (chkEditSound.checked && displayMode && cmbFretboardType.value !== "chord") player.playNoteFor(fretboardMapNotes[cell.string][cell.fret], 1);

			noteOrder++;

			saveHistory();

			// Elimina cualquier cejilla existente en ese traste
			barreNotes = barreNotes.filter(barre => {
				return barre.fret !== cell.fret;
			});

			// Elimina notas normales que quedarían cubiertas por la cejilla
			notes = notes.filter(note => {

				if (note.fret !== cell.fret) {
					return true;
				}

				// La cejilla ocupa desde la cuerda 0 hasta la cuerda pulsada
				return note.string > cell.string;

			});

			// En acordes, no crear una cejilla redundante si ya existe una cejilla que empieza en esa cuerda y tiene ese traste.
			if (cmbFretboardType.value === "chord" &&
				barreNotes.some(barre =>
					barre.fret === cell.fret &&
					barre.startString === cell.string &&
					Number(barre.chord) === Number(chord)
				)
			) return;

			barreNotes.push({
				fret: cell.fret,
				startString: cell.string,
				color: colorPicker.value,
				text: noteText.value.trim(),
				chord: chord,
				order: noteOrder
			});

			break;

		case "note":

			if (chkEditSound.checked && displayMode && cmbFretboardType.value !== "chord") player.playNoteFor(fretboardMapNotes[cell.string][cell.fret], 1);

			// Solo los acordes impiden repetir una nota. En secuencias se permite repetirla.
			if (cmbFretboardType.value === "chord" && chordNoteExists(cell.string,cell.fret,chord)) return;

			saveHistory();

			noteOrder++;

			notes.push({
				string: cell.string,
				fret: cell.fret,
				color: colorPicker.value,
				text: noteText.value.trim(),
				chord: chord,
				order: noteOrder
			});

			break;

		case "erase":

			const noteExists = notes.some(note =>
				note.string === cell.string &&
				note.fret === cell.fret &&
				(cmbFretboardType.value !== "chord" || Number(note.chord) === Number(chord))
			);

			const barreExists = barreNotes.some(barre =>
				barre.fret === cell.fret &&
				cell.string <= barre.startString &&
				(cmbFretboardType.value !== "chord" || Number(barre.chord) === Number(chord))
			);

			if (noteExists || barreExists) {

				saveHistory();

				if (noteExists) {

					notes = notes.filter(note => {

						return !(
							note.string === cell.string &&
							note.fret === cell.fret &&
							(cmbFretboardType.value !== "chord" || Number(note.chord) === Number(chord))
						);

					});
				}

				if (barreExists) {

					barreNotes = barreNotes.filter(barre => {

						if (barre.fret !== cell.fret) {
							return true;
						}

						if (cmbFretboardType.value === "chord" && Number(barre.chord) !== Number(chord)) {
							return true;
						}

						// La cejilla ocupa desde la cuerda 0 hasta startString.
						// Se borra si se pulsa cualquier cuerda ocupada por ella.
						return cell.string > barre.startString;

					});

				}

			}

			break;

	}

	if (!isMobile && editMode !== "erase") noteText.focus({ preventScroll: true });

	noteText.value = "";

	if (cmbFretboardType.value !== "chord"){
		aSequence = buildOrderedSequence();
	}else{
		aChords = buildOrderedChords();
	}

	loadArrayNotas();

	drawNotes();

	if (isScoreVisible) scoreRender();

	//Hacer sonar el acorde
	if (chkEditSound.checked && displayMode && cmbFretboardType.value === "chord"){
		const chordToPlay = aChords.filter(item => item.chord === parseInt(cmbChords.value, 10)).map(item => item.note);		
		if (chordToPlay.length > 0) player.playChordFor(chordToPlay, 1);
	}

});



//==================================================
// EVENTOS APP
//==================================================

cmbNoteNames.addEventListener("change",()=>{

	if (chkNoteNames.checked) notation = this.value;

	if (isFretboardVisible) drawNotes();

});

chkNoteNames.addEventListener("change",()=>{

	if (!this.checked) notation = "";

	if (isFretboardVisible) drawNotes();

});

btnNewChord.addEventListener("click", () => {
	addChord();
});

btnDelChord.addEventListener("click", () => {
	delChord();
});

btnImgDownload.addEventListener("click", () => {
	downloadFretboard();
	downloadScore();
});

btnCopyScore.addEventListener("click", () => {
	copyScore();
});

colorPicker.addEventListener("change", () => {

    colorPreview.style.backgroundColor = colorPicker.value;
    cursor.style.color = colorPicker.value;

});

cmbProjectCategory.addEventListener("change",(e)=>{
	projectModified = true;
});

btnNewCategory.addEventListener("click", () => {
	addCategory();
});

btnDelCategory.addEventListener("click", () => {
	deleteCategory();
});

btnLibraries.addEventListener("click", () => {
	setMenu("libraries",true);
});

btnProyectos.addEventListener("click", () => {
	setMenu("projects",true);
});

btnEdicion.addEventListener("click", () => {
	setMenu("edit",true);
});

btnFretboard.addEventListener("click", () => {
	setMenu("fretboard",true);
});

btnPlayer.addEventListener("click", () => {
	setMenu("player",true);
});

btnScore.addEventListener("click", () => {
	setMenu("score",true);
});

btnMetronome.addEventListener("click", () => {
	setMenu("metronome",true);
});

btnMultimedia.addEventListener("click", () => {
	setMenu("multimedia",true);
});

btnMenuSelector.addEventListener("click", () => {

	if (topControls.classList.contains("isOpen")) closeTopControls();

	menuPopup.classList.toggle("isOpen");

	menuSelectorText.textContent = "MENÚ";
	menuSelectorIcon.className = "fa-solid fa-gear fa-fw";

});

menuPopup.querySelectorAll("button").forEach(button=>{

	button.addEventListener("click",()=>{

		setMenu(button.dataset.menu,true);

		menuPopup.classList.remove("isOpen");
	
		if (isMobile) closeLibraryPanel();

	});

});

cmbDiapason.addEventListener("change", () => {

	fretboardStyle = cmbDiapason.value;
	neckImageLoaded = false;

	if (fretboardStyle !== "blank") {

		loadFretboardImage()
			.then(() => {

				drawFretboard();
				drawNotes();

			})
			.catch(error => {

				console.error(error);

				fretboardStyle = "blank";
				cmbDiapason.value = fretboardStyle;

				drawFretboard();
				drawNotes();

			});

	} else {

		drawFretboard();
		drawNotes();

	}

});

btnShowLibraryPanel.addEventListener("click", () => {

	if (isMobile) {
		btnMenuSelector.click();
	}

	if (appMain.classList.contains("libraryHidden")) {

		openLibraryPanel();

	}else{

		closeLibraryPanel();

//		if (!isMobile && isScoreVisible) scoreRender();
	}

});

btnToggleLibraryPanel.addEventListener("click", () => {

	btnShowLibraryPanel.click();

});

titleText.addEventListener("input", () => {

	projectTitle = titleText.value.trim() || "Sin Título";

	const cat = cmbProjectCategory.selectedIndex >= 0 ? cmbProjectCategory.options[cmbProjectCategory.selectedIndex].textContent : "";

	workspaceTitleText.textContent = cat !== "" ? cat + " > " : "";
	workspaceTitleText.textContent = workspaceTitleText.textContent + projectTitle;

	if (cmbProjectType.value === "fretboard"){

		if (isFretboardVisible) resizeCanvas();

		if (isScoreVisible) scoreRender();
	}

});

chkShowTitle.addEventListener("change", () => {

	if (isFretboardVisible) resizeCanvas();

});

chkScoreTitle.addEventListener("change", function () {

    if (isScoreVisible) scoreRender();

});

chkShowNumber.addEventListener("change", () => {

	showFretNumbers = !showFretNumbers;

	if (isFretboardVisible) resizeCanvas();

});

btnCopyCanvas.addEventListener("click", () => {

	if (navigator.clipboard && window.ClipboardItem) {
		copyCanvasToClipboard();
	}

});

btnAddLibrary.addEventListener("click", () => {

	isNewLibrary = true;
	labelLibraryId.textContent = "";
	textLibraryName.value = "";
	textAreaLibrary.value = "";
	cmbLevels.value = 1;

	librariesContainer.style.display = "flex";

});

btnModifyLibrary.addEventListener("click", () => {

	isNewLibrary = false;
	labelLibraryId.innerHTML = "<b>Id:</b> " + libraryId + " - <b>Fecha creación: </b>" + libraryCreated;
	textLibraryName.value = libraryName;
	textAreaLibrary.value = libraryDesc;
	cmbLevels.value = libraryLevel;

	librariesContainer.style.display = "flex";

});

btnSaveLibrary.addEventListener("click", () => {

	const name = textLibraryName.value.trim();

	if (name === "") {

		alert("Escribe un nombre.");

		textLibraryName.focus();
		return;

	}

	if (isNewLibrary){

		if (createLibrary(name,"library")) {

			showAlert("Librería '" + libraryName + "' creada.", "success");

		}

	}else{

		libraryName = name;
		libraryDesc = textAreaLibrary.value.trim();
		libraryLevel = cmbLevels.value;

		saveLibrariesFiles();

		setLibraryInfo(xmlLibrary);

		showAlert("Librería '" + libraryName + "' modificada.", "success");

	}

	librariesContainer.style.display = "none";

});

btnLibrariesPanelClose.addEventListener("click", () => {

	librariesContainer.style.display = "none";

});

btnOpenLibrary.addEventListener("click", async () => {

	if (projectModified) {

		if (!confirm("Hay cambios sin guardar que se perderán. ¿Deseas abrir una nueva librería de proyectos?")) {
			return;
		}
	}

	if (await openLibraryXMLFile()){

		textLibraryName.disabled = false;
		textAreaLibrary.disabled = false;
		btnSaveProject.disabled = false;
		btnDelProject.disabled = false;

	}

});

textLibraryName.addEventListener("input", () => {

	projectModified = true;
	libraryName = textLibraryName.value.trim() || "Sin Nombre";

});

textAreaLibrary.addEventListener("input", () => {

	projectModified = true;
	libraryDesc = textAreaLibrary.value.trim() || "Descripción";

});

btnShare.addEventListener("click", () => {
	
	if(currentProjectId !== null) {

		const lib = xmlLibrary.substring(xmlLibrary.lastIndexOf("/") + 1).replace(/\.xml$/, "");

		const shareUrl = `${location.origin}${location.pathname}?lib=${lib}&id=${currentProjectId}`;

		navigator.clipboard.writeText(shareUrl);

		showAlert("URL de la Librería copiada al portapapeles.", "success");
	}

});

btnNewProject.addEventListener("click", () => {

	if (newProject()) renderProject();

});

btnNewProjectGuest.addEventListener("click", () => {

	btnNewProject.click();

});

btnSaveProject.addEventListener("click", async () => {

	if (cmbProjectCategory.options.length === 0){

		alert("Debes añadir una categoría al proyecto.");

		return;
	}

	await saveCurrentProject();

});

btnDelProject.addEventListener("click", () => {
	deleteProject(currentProjectId);
});

btnEdit.addEventListener("click", () => {
	setEditMode("note");
});

btnBarre.addEventListener("click", () => {
	setEditMode("barre");
});

btnErase.addEventListener("click", () => {
	setEditMode("erase");
});

btnUndo.addEventListener("click", () => {
	undo();
});

btnRotate.addEventListener("click", () => {

	rotateFretboard();

	if (isFretboardVisible) resizeCanvas();

	if (isScoreVisible) scoreRender();

});

chkFretboardZoom.addEventListener("change", () => {

	fitCanvasWidth = !fitCanvasWidth;

});

btnVertical.addEventListener("click", () => {

	setOrientation("vertical");

	if (isFretboardVisible) resizeCanvas();

});

btnHorizontal.addEventListener("click", () => {

	setOrientation("horizontal");

	if (isFretboardVisible) resizeCanvas();

});

btnDisplay.addEventListener("click", () => {

	displayMode = !displayMode;

	btnDisplay.classList.toggle("active", displayMode);

	if (isFretboardVisible) resizeCanvas();

});

chkInlays.addEventListener("change", function () {

	inlays = this.checked;

	if (isFretboardVisible) {

		drawFretboard();
		drawNotes();

	}

});

sliderFrets.addEventListener("input", () => {

	const previousFretCount = fretCount;

	fretCount = parseInt(sliderFrets.value);

	updateFretNumberControls();

	if (isFretboardVisible) resizeCanvas();

	if (fretCount > previousFretCount) scrollToFretboardNut();

});

numFrets.addEventListener("change", () => {

	const previousFretCount = fretCount;

	fretCount = parseInt(numFrets.value);

	// Limitar también si el usuario escribe un valor manualmente
	fretCount = Math.max(4,Math.min(24, fretCount));

	updateFretNumberControls();

	if (isFretboardVisible) resizeCanvas();

	if (fretCount > previousFretCount) scrollToFretboardNut();

});

btnMoreFrets.addEventListener("click", () => {

	if (fretCount >= 24) return;

	fretCount++;

	updateFretNumberControls();

	if (isFretboardVisible) resizeCanvas();

});

btnLessFrets.addEventListener("click", () => {

	if (fretCount <= 4) return;

	fretCount--;

	updateFretNumberControls();

	if (isFretboardVisible) resizeCanvas();

});

btnMoreNumberFrets.addEventListener("click", () => {

	let nFrets = numberFrets.value == null || numberFrets.value === "" ? 1 : parseInt(numberFrets.value);

	const maxFirstFret = 25 - fretCount;

	if (nFrets >= maxFirstFret) return;

	numberFrets.value = nFrets + 1;

	fretNumbers = numberFrets.value;

	if (isFretboardVisible) resizeCanvas();

});

btnLessNumberFrets.addEventListener("click", () => {

	let nFrets = numberFrets.value == null || numberFrets.value === "" ? 1 : parseInt(numberFrets.value);

	if (nFrets <= 1) return;

	numberFrets.value = nFrets - 1;

	fretNumbers = numberFrets.value;

	if (isFretboardVisible) resizeCanvas();

});

sliderBpm.addEventListener("input", function () {

	sliderBpm.title = this.value;

	numBpm.value = parseInt(this.value);

	bpm = numBpm.value;

	metronome.setBpm(numBpm.value);

	player.setGate(samplerGate.value);

});

numBpm.addEventListener("change", () => {

	let tempoCount = parseInt(numBpm.value);

	// Limitar también si el usuario escribe un valor manualmente
	tempoCount = Math.max(30, Math.min(300, tempoCount));

	numBpm.value = tempoCount;

	bpm = numBpm.value;

	sliderBpm.value = parseInt(numBpm.value);
	sliderBpm.title = numBpm.value;

	metronome.setBpm(numBpm.value);

	player.setGate(samplerGate.value);

});

btnLessTempo.addEventListener("click", () => {

	let nTempo = numBpm.value == null || numBpm.value === "" ? 1 : parseInt(numBpm.value);

	if (nTempo <= 30) {return;}

	numBpm.value = nTempo - 1;

	bpm = numBpm.value;

	sliderBpm.value = parseInt(numBpm.value);
	sliderBpm.title = numBpm.value;

	metronome.setBpm(numBpm.value);

	player.setGate(samplerGate.value);

});

btnMoreTempo.addEventListener("click", () => {

	let nTempo = numBpm.value == null || numBpm.value === "" ? 1 : parseInt(numBpm.value);

	if (nTempo >= 300) {return;}

	numBpm.value = nTempo + 1;

	bpm = numBpm.value;

	sliderBpm.value = parseInt(numBpm.value);
	sliderBpm.title = numBpm.value;

	metronome.setBpm(numBpm.value);

	player.setGate(samplerGate.value);

});

cmbBar.addEventListener("change", function () {

    updateFigureOptions();

    projectBar = cmbBar.value;
    projectFigure = cmbFigure.value;

    metronome.setMeter(projectBar);
    metronome.setSubdivision(projectFigure);

    player.setGate(samplerGate.value);

    if (isScoreVisible) scoreRender();

});

cmbFigure.addEventListener("change", function () {

    projectFigure = cmbFigure.value;

    metronome.setSubdivision(projectFigure);

    player.setGate(samplerGate.value);

    if (isScoreVisible) scoreRender();

});

cmbKey.addEventListener("change", function () {

	key = cmbKey.value;

	if (isFretboardVisible) drawNotes();

	if (isScoreVisible) scoreRender();

});

cmbProjectType.addEventListener("change", () => {

	projectType = cmbProjectType.value;

	newProject();

});

cmbFretboardType.addEventListener("change", function () {

	changeComboFretboardType(cmbFretboardType.value);

});

cmbFretboardTypeGuest.addEventListener("change", function () {

	changeComboFretboardType(cmbFretboardTypeGuest.value);

});

cmbTipoSecuencia.addEventListener("change", function () {

	tipoSecuencia = cmbTipoSecuencia.value;

	if (tipoSecuencia === "up" || tipoSecuencia === "down") chkDireccion.checked = false;

	loadArrayNotas();

	if (isScoreVisible) scoreRender();

});

chkDireccion.addEventListener("change", function () {

	direccion = this.checked;

	loadArrayNotas();

	if (isScoreVisible) scoreRender();

});

sliderMetronomeVolumen.addEventListener("input", function () {

    sliderMetronomeVolumen.title = this.value + " dB";

    sliderMetronomeVolumen_2.title = this.value + " dB";
    sliderMetronomeVolumen_2.value = this.value;

    metronome.setVolume(parseFloat(this.value));

});

sliderMetronomeVolumen_2.addEventListener("input", function () {

    sliderMetronomeVolumen_2.title = this.value + " dB";

    sliderMetronomeVolumen.title = this.value + " dB";
    sliderMetronomeVolumen.value = this.value;

    metronome.setVolume(parseFloat(this.value));

});

btnPlayStopMetronome.addEventListener("click", async function () {

	await metronomePlayStop();

});

chkMetronomeOn.addEventListener("change", function () {

	metronomeOn = this.value;

	player.setMetronomeOn(this.checked);

});

chkMetronomeBeatSound.addEventListener("change", function () {

	metronome.subBeatSound = !metronome.subBeatSound;

});

sliderSamplerVolume.addEventListener("input", function () {

    sliderSamplerVolume.title = this.value + " dB";

    player.setInstrumentVolume(parseFloat(this.value));

});

cmbSamplerInstrument.onchange = function () {

	currentInstrument = this.value;

	setInstrument(this.value);

};

samplerGate.addEventListener("input", function () {

    samplerGate.title = this.value;

    player.setGate(this.value);

});

chkPlayerSwing.addEventListener("change", function () {

	swing = this.checked;

	player.setSwingFeel(this.checked);

	if (this.checked) chkMetronomeBeatSound.checked = false;

});

cmbPlayerRepeats.addEventListener("change", function () {

	playerRepeats = this.value;
	
	player.setRepeticiones(this.value);

	if (isScoreVisible) scoreRender();

});

cmbCountIn.addEventListener("change", function () {

	countInBars = this.value;

	player.setCountInBars(this.value);

});

btnPlayStop.addEventListener("click", async function () {

	playMusic();

	btnPlayStop.focus({ focusVisible: true, preventScroll: true });

});

scoreFloatingStopButton.addEventListener("click", async function () {

	playMusic();

	scoreFloatingStopButton.focus({ focusVisible: true, preventScroll: true });

});

btnRenderBuffer.addEventListener("click", async function () {

//    setControlsEnabled(false);

    await Tone.start();

    player_bufferState.innerHTML = "Rendering...";

    try {

        if (!await renderBuffer()){
	        player_bufferState.innerHTML = "Waiting...";
	}else{

	        player_bufferState.innerHTML = "Generated";
	}
    }
    catch (e) {

        console.error(e);

        player_bufferState.innerHTML = "Error";

    }

//    setControlsEnabled(true);

});

btnSaveAudio.addEventListener("click", function () {

    saveAudio(cmbAudioFormat.value);

});

cmbScoreLayout.addEventListener("change", function () {

	scoreLayout = this.value;

	if (isScoreVisible) scoreRender();

});

sliderScoreStaveDistance.addEventListener("change", function () {

    sliderScoreStaveDistance.title = sliderScoreStaveDistance.value;

    if (isScoreVisible) scoreRender();

});

sliderScoreStaveMargin.addEventListener("change", function () {

    sliderScoreStaveMargin.title = sliderScoreStaveMargin.value;

    if (isScoreVisible) scoreRender();

});

cmbScoreStaves.addEventListener("change", function () {

    scoreStaves = this.value;

    if (isScoreVisible) scoreRender();

    if (!scoreSvg) return;

    scorePaint_stop();

    scorePaint_initScorePlayback(scoreSvg);

});

cmbScoreScale.addEventListener("change", function () {

	if (cmbScoreScale.value == "auto"){
		scoreScale = "auto";
	}else{
		scoreScale = parseFloat(sliderScoreZoom.value / 100);
	}

	if (isScoreVisible) scoreRender();

});

sliderScoreZoom.addEventListener("change", function () {

    sliderScoreZoom.title = sliderScoreZoom.value + "%";

    scoreScale = parseFloat(sliderScoreZoom.value / 100);

    cmbScoreScale.value = "zoom";

    if (isScoreVisible) scoreRender();

});

btnFretboardVisible.addEventListener("click", () => {

	if (isFretboardVisible && !isScoreVisible) return;

	isFretboardVisible = !isFretboardVisible;

	setWorkspaceLayout();

	if (isFretboardVisible) resizeCanvas();

	if (isScoreVisible) scoreRender();

	renderMultimedia();

});

btnScoreVisible.addEventListener("click", () => {

	if (isScoreVisible && !isFretboardVisible) return;

	isScoreVisible = !isScoreVisible;

	setWorkspaceLayout();

	if (isScoreVisible) scoreRender();

	renderMultimedia();

});

btnNewStudent.addEventListener("click", () => {

	const name = prompt("Introduce un nombre:");

	if (name === null) return;

	const email = prompt("Introduce un email:");

	if (email !== null) {

		const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (regex.test(email)){

			addStudent(name,email);

		}else{
			showAlert("Correo eléctrónico no válido", "error");
		}
	}

});

cmbStudents.addEventListener("change", async () => {

	const url = window.location.origin + window.location.pathname;

	window.open("?admin&lib=" + cmbStudents.value, "_self");	

});

cmbLibraries.addEventListener("change", async () => {

	const url = window.location.origin + window.location.pathname;

	window.open("?admin&lib=" + cmbLibraries.value, "_self");	

});

btnStudent.addEventListener("click", () => {

	currentTheme = currentTheme === "dark" ? "light" : "dark";

	setTheme(currentTheme);

	if (isFretboardVisible) resizeCanvas();

});

btnAbrirVideo.addEventListener("click", async () => {

	const media = await getCameraAndMicrophone();

	if (media) {

		const now = new Date();

		const dateTime =
			now.getFullYear() +
			String(now.getMonth() + 1).padStart(2, "0") +
			String(now.getDate()).padStart(2, "0") + "-" +
			String(now.getHours()).padStart(2, "0") + "-" +
			String(now.getMinutes()).padStart(2, "0");

		videoTitle.value = dateTime;

		videoContainer.style.display = "flex";

		localStream = media.stream;

		localVideo.srcObject = localStream;

		updateVideoInfo();

	}

});

btnVideoClose.addEventListener("click", () => {

	videoContainer.style.display = "none"

	btnAudioMute.classList.remove("active");
	btnVideoMute.classList.remove("active");
	btnVideoMirror.classList.remove("active");

	btnVideoRecord.innerHTML = "<i class='fa-solid fa-circle'></i><span>Grabar</span>";

	if (localVideo.srcObject) {

		localVideo.srcObject.getTracks().forEach(track => track.stop());

		localVideo.srcObject = null;

	}

});

btnAudioMute.addEventListener("click", () => {

	if (!localStream) return;

	const audioTrack = localStream.getAudioTracks()[0];

	if (!audioTrack) return;

	audioTrack.enabled = !audioTrack.enabled;

	btnAudioMute.classList.toggle("active", !audioTrack.enabled);

	const icon = btnAudioMute.querySelector("i");

	icon.classList.toggle("fa-microphone-slash", !audioTrack.enabled);
	icon.classList.toggle("fa-microphone", audioTrack.enabled);

});

btnVideoMute.addEventListener("click", () => {

	if (!localStream) return;

	const videoTrack = localStream.getVideoTracks()[0];

	if (!videoTrack) return;

	videoTrack.enabled = !videoTrack.enabled;

	btnVideoMute.classList.toggle("active", !videoTrack.enabled);

	const icon = btnVideoMute.querySelector("i");

	icon.classList.toggle("fa-video-slash", !videoTrack.enabled);
	icon.classList.toggle("fa-video", videoTrack.enabled);

});

btnVideoMirror.addEventListener("click", () => {

	btnVideoMirror.classList.toggle("active");

	localVideo.style.transform = btnVideoMirror.classList.contains("active") ? "scaleX(-1)" : "scaleX(1)";

});

btnVideoRecord.addEventListener("click", () => {

	if (videoTitle.value.trim() === "") {

		alert("Introduce un título.");
		videoTitle.focus();
		return;

	}

	recordVideo();

});

cmbCamera.addEventListener("change", async () => {

	document.body.style.cursor = "wait";
	btnVideoRecord.disabled = true;

	const previousValue = cmbCamera.dataset.previousValue || cmbCamera.value;

	if (await changeCamera()) {

		cmbCamera.dataset.previousValue = cmbCamera.value;

	} else {

		cmbCamera.value = previousValue;

	}

	document.body.style.cursor = "";
	btnVideoRecord.disabled = false;

});

cmbResolucion.addEventListener("change", async () => {

	document.body.style.cursor = "wait";
	btnVideoRecord.disabled = true;

	const previousValue = cmbResolucion.dataset.previousValue || cmbResolucion.value;

	if (await changeResolution()) {

		cmbResolucion.dataset.previousValue = cmbResolucion.value;

	} else {

		cmbResolucion.value = previousValue;

	}

	document.body.style.cursor = "";
	btnVideoRecord.disabled = false;

});

cmbMicrophone.addEventListener("change", async () => {

	document.body.style.cursor = "wait";
	btnVideoRecord.disabled = true;

	const previousValue = cmbMicrophone.dataset.previousValue || cmbMicrophone.value;

	if (await changeMicrophone()) {

		cmbMicrophone.dataset.previousValue = cmbMicrophone.value;

	} else {

		cmbMicrophone.value = previousValue;

	}

	document.body.style.cursor = "";
	btnVideoRecord.disabled = false;

});

btnGuitarAmp.addEventListener("click", () => {

	window.open("https://www.noise-box.es/#/amp", "_blank");

});

btnUpload.addEventListener("click", () => {

	window.open(repositoryURL, "_blank");

});

resourceWidthInput.addEventListener("input", () => {

	let value = Number(resourceWidthInput.value);

	if (resourceWidthInput.value === "" || !Number.isFinite(value)) value = resourceWidth;

	value = Math.max(0, Math.min(100, value));

	resourceWidthInput.value = value;

});

btnUploadFile.addEventListener("click", () => {

	selectMultimediaFiles();

});

btnSaveMultimediaText.addEventListener("click", () => {

	let text = textAreaMultimedia.value.trim();

	if (text === ""){

		alert("El texto esta vacío.");

//		textAreaMultimedia.focus();

	}else{

		let xmlText = "<![CDATA[" + text + "]]>";

		multimediaResources.push({
			type: "text",
			content: xmlText,
			width: resourceWidthInput.value
		});

		createMultimediaElement("text",text,resourceWidthInput.value);

		textAreaMultimedia.value = "";

	}

});

multimediaDropZone.addEventListener("dragover", event => {

	const pType = cmbMultimedia.value !== "text" && cmbMultimedia.value !== "link" && cmbMultimedia.value !== "iframe";
	if (!pType) return;

	event.preventDefault();

	event.stopPropagation();

	event.dataTransfer.dropEffect = "copy";

	multimediaDropZone.classList.add("dragover");

});

multimediaDropZone.addEventListener("dragleave", event => {

	const pType = cmbMultimedia.value !== "text" && cmbMultimedia.value !== "link" && cmbMultimedia.value !== "iframe";
	if (!pType) return;

	event.preventDefault();

	event.stopPropagation();

	// Solo quitarlo si realmente salimos de la zona

	if (!multimediaDropZone.contains(event.relatedTarget)) {

		multimediaDropZone.classList.remove("dragover");

	}

});

multimediaDropZone.addEventListener("drop", async event => {

	const pType = cmbMultimedia.value !== "text" && cmbMultimedia.value !== "link" && cmbMultimedia.value !== "iframe";
	if (!pType) return;

	event.preventDefault();

	event.stopPropagation();

	multimediaDropZone.classList.remove("dragover");

	const files = event.dataTransfer.files;

	if (!files || files.length === 0) return;

	const file = files[0];

	// Seleccionar carpeta multimedia si no está seleccionada

	if (!multimediaDirectory) {

		const selected = await selectMultimediaFolder();

		if (!selected) return;

	}

	await addDroppedResource(file,Number(resourceWidthInput.value));

});

btnProjectSearch.addEventListener("click", () => {

	searchProject();

});

txtSearch.addEventListener("keydown", event => {

	if (event.key === "Enter") searchProject();

});

btnLibraryHomeButton.addEventListener("click", () => {

	showHome(!isHome);

});

btnLibraryAccess.addEventListener("click", () => {

	openLibraryPanel();

});
