
"use strict";

/*============================
MAIN FUNCTIONS
==============================*/

async function initializeApp() {

	try {

		// USUARIO Y CONTROLES ----------------------

		setLoadingProgress(10, "Configurando interface de usuario...");

		getURLParams();

		await loadXML("user",xmlUsers);

		setUserState();

		configureUserControls();


		// PROJECTS ----------------------

		setLoadingProgress(20, "Cargando proyectos...");

		await loadXML("project",xmlProjects);

		await initializeProjects();


		// IMÁGENES ----------------------

		setLoadingProgress(30, "Cargando imágenes...");

		await loadFretboardImage();

		resizeCanvas();


		// PLAYER ----------------------

		setLoadingProgress(40, "Cargando instrumentos...");

		instruments = {
			piano: createSampler("piano"),
			cguitar: createSampler("cguitar")
		};

		setLoadingProgress(50, "Configurando metrónomo...");

		metronome = new Metronome();

		setLoadingProgress(60, "Configurando reproductor...");

		instrument = instruments[currentInstrument];

		player = new MusicPlayer(instrument,metronome);

		setPlayerValues();


		// MÁSTIL ----------------------

		setLoadingProgress(70, "Renderizando mástil...");

		resizeCanvas();


		// SCORE ----------------------

		setLoadingProgress(80, "Renderizando partitura...");

		if (isScoreVisible) scoreRender();


		// MULTIMEDIA ----------------------

		setLoadingProgress(90, "Renderizando multimedia...");

		if (projectType !== "fretboard") await renderMultimedia();



		// FIN ----------------------

		setLoadingProgress(100, "Carga completada");

		hideLoadingScreen();


	} catch (error) {

		console.error("Error durante la carga: ",error);

		setErrorLoadingProgress(error);

	}

}

function setTheme(mode) {

	const root = document.documentElement;
	const theme = themes[mode];

	if (!theme) return;

	for (const [variable, value] of Object.entries(theme)) {

		root.style.setProperty(variable, value);

	}

	const urlLogo = dataURL_Images + "logo-" + (mode === "dark" ? "FFF" : "000") + ".png";

	brandLogo.src = urlLogo;
	footerBrandLogo.src = urlLogo;

}

function getURLParams(){

	const params = new URLSearchParams(window.location.search);

	user = params.get("user");

	isAdmin = params.has("admin") || user === "admin";

	lib = params.get("lib");

	currentProjectId = params.get("id");

}

function setUserState(){

	isMobile = window.innerWidth <= maxMediaScreenWidth;
	isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

	isUserActive = true;

	appMode = "Designer";

	if (!isAdmin) {

		if (user !== null){

			const currentUser = users.find(item => item.IDUser === user);
	
			if (currentUser) {

				userName = currentUser.name;

				if (!currentUser.active){
					showAlert("El usuario '" + userName +"' no está activo.", "error");
					isUserActive = false;
				}else{
					isUserActive = true;
				}

			}else{
				showAlert("El usuario '" + user + "' no existe.", "error");
				isUserActive = true;
				user = null;
			}
		}

		if (user === null && currentProjectId !== null) {

			appMode = "Guest";
		}

	}else{
		user = "admin";

	}

	if (!isAdmin && user !== null) xmlProjects = dataURL_Library + user + ".xml";

	if (lib !== null && isUserActive) xmlProjects = dataURL_Library + lib + ".xml";

}

function configureUserControls(){

	if (!isAdmin) {

		topLibrary.style.display = "none";
		topLibraryInfo.style.display = "none";
		btnSaveProject.style.display = "none";
		btnDelProject.style.display = "none";
		topTitle.style.display = "none";
		topCategory.style.display = "none";
		topShare.style.display = "none";
		topMultimedia.style.display = "none";

		btnProyectos.style.display = "none";
		btnProyectosPopup.style.display = "none";

		btnUser.classList.remove("admin");
		btnUser.classList.add("user");

		cmbResolucion.style.display = "none";

		if (appMode === "Guest"){

			if (projectType !== "fretboard"){
				setMenu("edit");
			}else{
				setMenu("metronome");
			}

			btnEdicion.style.display = "none";
			btnEdicionPopup.style.display = "none";

			topFretboardDownload.style.display = "none";
			topScoreDownload.style.display = "none";

			btnShowProjectPanel.style.display = "none";

			btnUser.querySelector("i").className = "fa-solid fa-user-lock";
			txtUserTitle.textContent = "Invitado";

		}else{

			if (user === null) {

				setMenu("edit");

				btnShowProjectPanel.style.display = "none";

				btnUser.querySelector("i").className = "fa-solid fa-user-tie";
				txtUserTitle.textContent = "Invitado";

			}else{

				if (projectType !== "fretboard"){
					setMenu("fretboard");
				}else{
					setMenu("metronome");
				}

				if (!isUserActive){
					btnUser.querySelector("i").className = "fa-solid fa-user-lock";
				}else{
					btnUser.querySelector("i").className = "fa-solid fa-user-tie";
				}

				const txt = userName.includes(" ") ? userName.substring(0, userName.indexOf(" ")) : userName;
				txtUserTitle.textContent = txt;

			}

		}

		if (!isUserActive){

			setControlsEnabled(false);

			topFretboardDownload.style.display = "none";
			topScoreDownload.style.display = "none";

			btnProyectos.style.display = "none";
			btnProyectosPopup.style.display = "none";
			btnEdicion.style.display = "none";
			btnEdicionPopup.style.display = "none";
			btnMultimedia.style.display = "none";
			btnMultimediaPopup.style.display = "none";

			btnMenuSelector.disabled = false;
			btnShowProjectPanel.disabled = false;
			btnFretboard.disabled = false;
			btnFretboardPopup.disabled = false;
			btnScore.disabled = false;
			btnScorePopup.disabled = false;
			btnPlayer.disabled = false;
			btnPlayerPopup.disabled = false;
			btnMetronome.disabled = false;
			btnMetronomePopup.disabled = false;

			btnPlayStop.disabled = true;

			btnUser.querySelector("i").className = "fa-solid fa-user-lock";

			setMenu("metronome");

		}

	} else {

		setMenu("projects");

		topProjectGuest.style.display = "none";
		topTitleViewMode.style.display = "none";

		topMultimedia.style.display = "";

		btnUser.classList.remove("user");
		btnUser.classList.add("admin");
		btnUser.querySelector("i").className = "fa-solid fa-user-shield";
		btnUser.style.cursor = "pointer";

		txtUserTitle.textContent = "Admin";

	}

	workspaceTimeInfo.style.display = "none";

	updateTopBarMenu();

	cursor.innerHTML = "";
	cursor.style.color = colorPicker.value;

	if (isMobile) {

		cursor.style.display = "none";

		fitCanvasWidth = true;
		chkFretboardZoom.checked = true;

		menuSelectorText.textContent = "MENÚ";
		menuSelectorIcon.className = "fa-solid fa-gear fa-fw";

		closeLibraryPanel();

		closeTopControls();

	} else {

		cursor.style.display = "";

		openTopControls();

	}

}

function setMenu(m){

	// alternar abrir-cerrar si se pulsa el mismo menú
	if (btnMenuSelector.style.display === "none" && menuOpen === m) {

		if (topControlsContainer.classList.contains("isOpen")) {

			closeTopControls();

		} else {

			openTopControls();

		}

		return;

	}

	menuOpen = m;

	btnProyectos.classList.remove("active");
	btnEdicion.classList.remove("active");
	btnFretboard.classList.remove("active");
	btnPlayer.classList.remove("active");
	btnScore.classList.remove("active");
	btnMetronome.classList.remove("active");
	btnMultimedia.classList.remove("active");

	[
		topProject,
		topCategory,
		topLibrary,
		topTitle,
		topTitleViewMode,
		topShare,
		topEdit,
		topUndo,
		topChords,
		topScroll,
		topColor,
		topNoteNames,
		topFrets,
		topNumbers,
		topOrientation,
		topFretboardScale,
		topDiapason,
		topInstrument,
		topTempo,
		topTimeSignature,
		topType,
		topDireccion,
		topScoreStaves,
		topScoreScale,
		topScoreMargin,
		topScoreDownload,
		topFretboardDownload,
		topVolumen,
		topRepeats,
		topArticulation,
		topMetronomePlay,
		topMetronomeControls,
		topBuffer,
		topAudio,
		topVideo,
		topMultimedia,
		topLibraryInfo,
		topProjectGuest,
		topUser

	].forEach(control => control.classList.add("isHidden"));

	switch (menuOpen){

		case "projects":

			btnProyectos.classList.add("active");

			showMenuControls(
				topUser,
				topProject,
				topLibraryInfo,
				topCategory,
				topType,
				topLibrary,
				topShare,
				topTitle
			);

			menuSelectorText.textContent = "PROYECTOS";
			menuSelectorIcon.className = "fa-solid fa-folder";

			break;

		case "edit":

			btnEdicion.classList.add("active");

			showMenuControls(
				topEdit,
				topUndo,
				topColor,
				topChords,
				topProjectGuest
			);

			menuSelectorText.textContent = "EDICIÓN";
			menuSelectorIcon.className = "fa-solid fa-pen";

			break;

		case "fretboard":

			btnFretboard.classList.add("active");

			showMenuControls(
				topFretboardScale,
				topDiapason,
				topFrets,
				topNumbers,
				topNoteNames,
				topOrientation
			);

			menuSelectorText.textContent = "MÁSTIL";
			menuSelectorIcon.className = "fa-solid fa-guitar";

			break;

		case "player":

			btnPlayer.classList.add("active");

			showMenuControls(
				topRepeats,
				topTempo,
				topInstrument,
				topArticulation,
				topVolumen
			);

			menuSelectorText.textContent = "PLAYER";
			menuSelectorIcon.className = "fa-solid fa-circle-play";

			break;

		case "score":

			btnScore.classList.add("active");

			showMenuControls(
				topTitleViewMode,
				topTimeSignature,
				topDireccion,
				topScoreStaves,
				topScoreScale,
				topScroll,
				topScoreMargin
			);

			menuSelectorText.textContent = "PARTITURA";
			menuSelectorIcon.className = "fa-solid fa-music";

			break;

		case "multimedia":

			btnMultimedia.classList.add("active");

			showMenuControls(
				topFretboardDownload,
				topScoreDownload,
				topBuffer,
				topAudio,
				topVideo,
				topMultimedia
			);

			menuSelectorText.textContent = "MULTIMEDIA";
			menuSelectorIcon.className = "fa-solid fa-photo-film";

			break;

		case "metronome":

			btnMetronome.classList.add("active");

			showMenuControls(
				topMetronomePlay,
				topTempo,
				topMetronomeControls,
				topTimeSignature
			);

			menuSelectorText.textContent = "METRÓNOMO";
			menuSelectorIcon.className = "fa-solid fa-stopwatch";

			break;

	}

	openTopControls();

}

async function initializeProjects() {

    // --------------------------------
    // PANEL
    // --------------------------------

    if (!isMobile && appMode !== "Guest" && user !== null) {

	openLibraryPanel();

    }

    // --------------------------------
    // INFORMACION DE LIBRERIA
    // --------------------------------

    setLibraryInfo(xmlProjects);

    // --------------------------------
    // NO HAY BIBLIOTECA
    // --------------------------------

    if (!projectsLoaded) {

        initializeEmptyProject();

        libraryNameText.disabled = true;
        libraryDescText.disabled = true;

        btnSaveProject.disabled = true;
        btnDelProject.disabled = true;

        cmbProjectCategory.disabled = true;
        btnNewCategory.disabled = true;
        btnDelCategory.disabled = true;

        return;

    }

    // --------------------------------
    // RENDERIZAR BIBLIOTECA
    // --------------------------------

    renderLibrary();

    // --------------------------------
    // ABRIR PROYECTO DE LA URL
    // --------------------------------

    if (currentProjectId !== null && isUserActive) {

        const project = projects.find(project => project.id === currentProjectId);

        if (project) {

            await selectProject(project);


        } else {

            showAlert("No se encontró el proyecto '" + currentProjectId + "'","error");

            initializeEmptyProject();

        }

    }else if (user !== null && isUserActive) {

        // --------------------------------
        // ABRIR PRIMER PROYECTO
        // --------------------------------

        const firstProject = getFirstProject();

        if (firstProject) {

            await selectProject(firstProject);

        } else {

            initializeEmptyProject();

        }

    } else {

        // --------------------------------
        // DISEÑADOR SIN USUARIO
        // --------------------------------

        initializeEmptyProject();

    }

}

function initializeEmptyProject() {

	currentProjectId = generateIDKey();

	resetControlsValues("init");

	if (user === null) workspaceTitleText.style.display = "none";
}

async function loadXML(type,file) {

	try {

		const response = await fetch(file);

		if (!response.ok) {
			throw new Error("No se pudo cargar " + file);
		}

		const xmlText = await response.text();

		const xml = parseXML(xmlText);

		if (!xml) return false;

		switch (type) {

			case "user":

				users = await parseUsersXml(xml);

				break;

			case "project":

				projectsLoaded = false;
				projects = parseProjectsXml(xml);
				projectsLoaded = true;

				break;

			default:

				throw new Error("Tipo de XML no válido: " + type);

		}

		return true;

	} catch (error) {

		console.warn("Error cargando " + file,error);

		if (type === "user") {

			users = [];

		} else if (type === "project") {

			projects = [];
			projectsLoaded = false;

		}

		return false;

	}

}

function parseXML(xmlText) {

	const parser = new DOMParser();

	const xml = parser.parseFromString(xmlText,"application/xml");

	const parserError = xml.querySelector("parsererror");

	if (parserError) {
		throw new Error("El archivo XML no tiene un formato válido.");
	}

	return xml;

}

function resetControlsValues(state){

	if (state === "init"){

		orientation = window.innerWidth <= 480 ? "vertical" : "horizontal";
		isScoreVisible = window.innerWidth <= 480 ? false : true;

		projectType = "fretboard";
		fretboardType = "sequence";

	}

	if (state === "newProject"){
		if (!isAdmin) {
			projectType = "fretboard";
			cmbProjectType.value = projectType;
		}
	}

	if (state !== "loadProject"){

		if (cmbProjectType.value !== "fretboard") fretboardType = "sequence";

		projectTitle = "";
		fretCount = 10;
		projectBar = 4;
		projectFigure = 1;
		scoreScale = "auto";
		countBars = 0;
		repetitionSequence = 2;
		isFretboardVisible = true;
		key = "C";
		tipoSecuencia = "up";
		direccion = false;
		swing = false;
		metronomeOn = true;
		displayMode = true;
		inlays = true;
		fretNumbers = 1;
		showFretNumbers = true;
		bpm = 90;
		scoreStaves = "all";
		scoreLayout = "vertical";
		notation = "";
		rotation = 0;
		rotated = false;

/*
		fretboardStyle = "maple";
		currentInstrument = "piano";
*/

	}

	titleText.value = projectTitle;
	workspaceTitleText.textContent = cmbProjectCategory.value !== "" ? cmbProjectCategory.value + " - " : "";
	workspaceTitleText.textContent = projectTitle === "" ? workspaceTitleText.textContent + "Proyecto nuevo sin título" : workspaceTitleText.textContent + projectTitle;

	chkShowTitle.checked = false;
	chkScoreTitle.checked = false;
	chkScoreTitleViewMode.checked = false;

	numFrets.value = fretCount;
	sliderFrets.value = fretCount;
	sliderFrets.title = fretCount;

	cmbDiapason.value = fretboardStyle;

	noteText.value = "";

	setBarGroups();

	if (scoreScale !== "auto") {
		cmbScoreScale.value = "zoom";
		sliderScoreZoom.value = scoreScale;
		scoreScale = parseFloat(scoreScale / 100);
	}else{
		cmbScoreScale.value = scoreScale; //auto
		sliderScoreZoom.value = 50;
	}
	sliderScoreZoom.title = sliderScoreZoom.value + "%";

	cmbTipoSecuencia.value = tipoSecuencia;

	cmbCountIn.value = countBars;

	cmbPlayerRepeats.value = repetitionSequence;

	cmbSamplerInstrument.value = currentInstrument;

	numberFrets.value = fretNumbers;
	chkShowNumber.checked = showFretNumbers;

	numBpm.value = bpm;
	sliderBpm.value = bpm;
	sliderBpm.title = bpm;

	cmbKey.value = key;

	cmbScoreStaves.value = scoreStaves;
	cmbScoreLayout.value = scoreLayout;

	chkPlayerSwing.checked = swing;
	if (chkPlayerSwing.checked) chkMetronomeBeatSound.checked = false;

	chkMetronomeOn.checked = metronomeOn;

	btnFretboardVisible.classList.toggle("active",isFretboardVisible);
	btnScoreVisible.classList.toggle("active",isScoreVisible);

	sliderMetronomeVolumen.value = -12;
	sliderMetronomeVolumen_2.value = sliderMetronomeVolumen.value;
	sliderMetronomeVolumen.title = sliderMetronomeVolumen.value + " dB";
	sliderMetronomeVolumen_2.title = sliderMetronomeVolumen.title;

	samplerVolume.value = 0;
	samplerVolume.title = samplerVolume.value + " dB";

	samplerGate.value = 100;
	samplerVolume.title = "100";

	cmbProjectCategory.disabled = false;
	btnNewCategory.disabled = false;
	btnDelCategory.disabled = false;

	if (state !== "loadProject"){

		resetComboChords();

	}else{

		loadComboChords();

	}

	cmbProjectType.value = projectType;

	cmbFretboardType.value = fretboardType;
	cmbFretboardTypeGuest.value = fretboardType;

	changeFretboardType();

	btnDisplay.classList.toggle("active", displayMode);

	setControlsState();

	chkInlays.checked = displayMode ? inlays : false;

	chkNoteNames.checked = notation;
	if (notation !== "") cmbNoteNames.value  = notation;

	setEditMode("view");

	setOrientation(orientation);

	setWorkspaceLayout();

	loadArrayNotas();

}

function initializeArrays(){

	resources = {
		video: [],
		audio: [],
		midi: [],
		image: [],
		score: [],
		pdf: [],
		document: [],
		html: [],
		link: [],
		iframe: []
	};

	history = [];
	notes = [];
	barreNotes = [];
	nutNotes = Array(stringCount).fill(null);
	noteOrder = 0;
	aSequence = [];
	aChords = [];

}

function changeFretboardType() {

	switch (fretboardType) {

		case "fretboard":

			isScoreVisible = false;

			setWorkspaceLayout();

			break;

		case "sequence":

			break;

		case "chord":

			break;

	}

	setControlsState();

}

function setControlsEnabled(enabled) {

    const controls = document.querySelectorAll(
        "input, select, button"
    );

    controls.forEach(control => {
        control.disabled = !enabled;
    });

    document.querySelectorAll("#topControlsContainer span").forEach(span => {
	span.style.opacity = enabled ? 1 : "0.55";
    });

    if (enabled) {

	setControlsState();

    }

}

function setControlsState() {

	const isFretboard = fretboardType === "fretboard";
	const isChord = fretboardType === "chord";
	const noDisplayMode = !displayMode;
	const isGuestFretboard = appMode === "Guest" && isFretboard;
	const isMultimedia = cmbProjectType.value !== "fretboard";


	// --------------------------------
	// TIPO DE FRETBOARD
	// --------------------------------

	chkMetronomeOn.disabled = isFretboard;

	cmbChords.disabled = !isChord;
	btnNewChord.disabled = !isChord;
	btnDelChord.disabled = !isChord;


	// --------------------------------
	// PLAYER / SCORE
	// --------------------------------

	const playerScoreDisabled = isFretboard || noDisplayMode || isMultimedia;

	btnPlayer.disabled = playerScoreDisabled;
	btnPlayerPopup.disabled = playerScoreDisabled;

	btnScore.disabled = playerScoreDisabled;
	btnScorePopup.disabled = playerScoreDisabled;


	// --------------------------------
	// PLAY / STOP
	// --------------------------------

	let playStopDisabled = noDisplayMode || isMultimedia;

	if (isGuestFretboard) {
		playStopDisabled = true;
	}

	if (isUserActive) {
		btnPlayStop.disabled = playStopDisabled;
	} else {
		btnPlayStop.disabled = true;
	}


	// --------------------------------
	// SCORE VISIBLE
	// --------------------------------

	btnScoreVisible.disabled = isFretboard || noDisplayMode || isMultimedia;


	// --------------------------------
	// FRETBOARD VISIBLE
	// --------------------------------

	btnFretboardVisible.disabled = isFretboard && appMode === "Guest" || isMultimedia;


	// --------------------------------
	// AUDIO / RENDER
	// --------------------------------

	const renderDisabled = isFretboard || noDisplayMode || isMultimedia;

	if (isAdmin) {

		btnRenderBuffer.disabled = renderDisabled;
		cmbAudioFormat.disabled = renderDisabled;
		btnSaveAudio.disabled = renderDisabled;
		btnCopyCanvas.disabled = renderDisabled;
		btnDownloadCanvas.disabled = renderDisabled;
		btnScoreDownloadImage.disabled = renderDisabled;

	} else {

		btnMultimedia.disabled = noDisplayMode;
		btnMultimediaPopup.disabled = noDisplayMode;

	}


	// --------------------------------
	// CONTROLES DEL FRETBOARD
	// --------------------------------

	chkInlays.disabled = noDisplayMode || !isUserActive;

	chkNoteNames.disabled = noDisplayMode;

	btnLessNumberFrets.disabled = Boolean(displayMode);
	numberFrets.disabled = Boolean(displayMode);
	btnMoreNumberFrets.disabled = Boolean(displayMode);


	// --------------------------------
	// MULTIMEDIA / EDICIÓN
	// --------------------------------

	btnEdicion.disabled = isMultimedia;
	btnEdicionPopup.disabled = isMultimedia;

	btnFretboard.disabled = isMultimedia;
	btnFretboardPopup.disabled = isMultimedia;

	btnVertical.disabled = isMultimedia;
	btnHorizontal.disabled = isMultimedia;

/*
	chkShowTitle.disabled = isMultimedia;
	chkScoreTitle.disabled = isMultimedia;
*/

	cmbFretboardType.disabled = isMultimedia;

	btnUploadFile.disabled = !isMultimedia;

	// --------------------------------
	// DESCARGAS SUPERIORES
	// --------------------------------

	btnCopyCanvas.disabled = isMultimedia;
	btnDownloadCanvas.disabled = isMultimedia;
	btnScoreDownloadImage.disabled = isMultimedia;
	cmbAudioFormat.disabled = isMultimedia;
	btnSaveAudio.disabled = isMultimedia;
	btnRenderBuffer.disabled = isMultimedia;

	// --------------------------------
	// GUEST + FRETBOARD
	// --------------------------------

	if (isGuestFretboard) {

		btnScore.disabled = true;
		btnScorePopup.disabled = true;

		btnPlayer.disabled = true;
		btnPlayerPopup.disabled = true;

		btnRenderBuffer.disabled = true;
		cmbAudioFormat.disabled = true;
		btnSaveAudio.disabled = true;

		btnCopyCanvas.disabled = true;
		btnDownloadCanvas.disabled = true;
		btnScoreDownloadImage.disabled = true;

		btnPlayStop.disabled = true;

		btnFretboardVisible.disabled = true;
		btnScoreVisible.disabled = true;

	}


	// --------------------------------
	// SIN DISPLAY MODE
	// --------------------------------

	if (noDisplayMode) {

		chkInlays.checked = false;
		chkNoteNames.checked = false;

		isScoreVisible = false;

	}


	// --------------------------------
	// WORKSPACE MULTIMEDIA
	// --------------------------------

	workspace.classList.toggle("multimedia",isMultimedia);

}

function updateTopBarMenu() {

	const topBarWidth = topBar.clientWidth;

	const brandWidth = brand.offsetWidth;

	const toggleWidth = btnUser.offsetWidth;


	// Mostrar temporalmente el menú para poder medirlo

	const previousDisplay = mainMenu.style.display;

	mainMenu.style.visibility = "hidden";
	mainMenu.style.display = "flex";

	let menuWidth = 0;

	mainMenu.querySelectorAll(".menuButton").forEach(button => {

		menuWidth += button.offsetWidth;

	});

	const requiredWidth = brandWidth + menuWidth + toggleWidth;

	// Restaurar visibilidad

	mainMenu.style.visibility = "";
	mainMenu.style.display = previousDisplay;

	if (requiredWidth <= topBarWidth) {

		mainMenu.style.display = "flex";

		brandName.style.display = "none";

		btnMenuSelector.style.display = "none";

		menuPopup.classList.remove("isOpen");

	} else {

		mainMenu.style.display = "none";

		brandName.style.display = "flex";

		btnMenuSelector.style.display = "flex";

	}

}

function updateFretNumberControls() {

	numFrets.value = fretCount;
	sliderFrets.value = fretCount;
	sliderFrets.title = fretCount;

	const maxFirstFret = 25 - fretCount;

	if (parseInt(numberFrets.value) > maxFirstFret) {

		numberFrets.value = maxFirstFret;

	}

}

function updateFigureOptions() {
    const previousValue = cmbFigure.value;
    const denominator = cmbBar.value.split("/")[1];
    cmbFigure.innerHTML = "";
    if (denominator === "4") {
        cmbFigure.innerHTML = `
            <option value="1">Negra</option>
            <option value="2">Corchea</option>
            <option value="4">Semicorchea</option>
        `;
    } else if (denominator === "8") {
        cmbFigure.innerHTML = `<option value="2">Corchea</option>`;
    }
    const option = cmbFigure.querySelector(`option[value="${previousValue}"]`);
    if (option) option.selected = true;
}

function getBarGroups() {
    const time = cmbBar.value;
    const [numerator, denominator] = time.split("/").map(Number);
    if (denominator === 4) {
        projectBar = numerator;
        projectFigure = parseInt(cmbFigure.value, 10);
    } else if (time === "6/8") {
        projectBar = 2;
        projectFigure = 3;
    } else if (time === "9/8") {
        projectBar = 3;
        projectFigure = 3;
    } else if (time === "12/8") {
        projectBar = 4;
        projectFigure = 3;
    } else if (time === "5/8") {
        projectBar = 1;
        projectFigure = 5;
    } else if (time === "7/8") {
        projectBar = 1;
        projectFigure = 7;
    }
}

function setBarGroups() {

	if (projectFigure === 3) {

		if (projectBar === 2) {

			cmbBar.value = "6/8";

		} else if (projectBar === 3) {

			cmbBar.value = "9/8";

		} else if (projectBar === 4) {

			cmbBar.value = "12/8";

		}

	} else if (projectFigure === 5) {

		cmbBar.value = "5/8";

	} else if (projectFigure === 7) {

		cmbBar.value = "7/8";

	} else {

		cmbBar.value = projectBar + "/4";

		cmbFigure.value = projectFigure;

	}

	updateFigureOptions();

}

function saveHistory() {

	const snapshot = {
		notes: structuredClone(notes),
		nutNotes: structuredClone(nutNotes),
		barreNotes: structuredClone(barreNotes)
	};

	history.push(snapshot);

	if (history.length > maxHistory) {
		history.shift();
	}

}

function showProjectPanel(){

	if (workspaceProjectsPanel.classList.contains("panelHidden")) {

		openLibraryPanel();

	}else{

		closeLibraryPanel();
	}
}

function openLibraryPanel(){

	workspaceProjectsPanel.classList.remove("panelHidden");

	btnShowProjectPanel.classList.add("active");

	btnShowProjectPanel.title = "Ocultar librería";

	btnShowProjectPanel.innerHTML = "<i class='fa-solid fa-angles-left'></i>";

}

function closeLibraryPanel(){

	workspaceProjectsPanel.classList.add("panelHidden");

	btnShowProjectPanel.classList.remove("active");

	btnShowProjectPanel.title = "Ver librería";

	btnShowProjectPanel.innerHTML = "<i class='fa-solid fa-angles-right'></i>";

}

function openTopControls(){

	topControlsContainer.classList.add("isOpen");

}

function closeTopControls() {

	topControlsContainer.classList.remove("isOpen");

}

function setEditMode(newMode) {

	if (editMode === newMode) newMode = "view";

	editMode = newMode;

	btnEdit.classList.toggle("active",newMode === "note");
	btnErase.classList.toggle("active",newMode === "erase");
	btnBarre.classList.toggle("active",newMode === "barre");

	btnBarre.setAttribute("aria-pressed",String(newMode === "barre"));

	switch (newMode) {

		case "view":

			cursor.innerHTML = '';

			break;

		case "note":

			cursor.innerHTML = '<i class="fa-solid fa-pencil"></i>';

			if (!isMobile) {
				noteText.value = "";
				noteText.focus({ preventScroll: true });
			}

			closeLibraryPanel();

			break;

		case "erase":

			cursor.innerHTML = '<i class="fa-solid fa-eraser"></i>';

			break;

		case "barre":

			cursor.innerHTML = '<i class="fa-solid fa-grip-lines"></i>';

			break;

	}

	cursor.style.color = colorPicker.value;

}

function showMenuControls(...controls){

	controls.forEach(control => control.classList.remove("isHidden"));

}

function setOrientation(o){

	orientation = o;

	if (o === "vertical"){

		rotation = rotated ? 180 : 0;

		workspace.classList.remove("horizontal");
		workspace.classList.add("vertical");

	} else {

		rotation = rotated ? 270 : 90;

		workspace.classList.remove("vertical");
		workspace.classList.add("horizontal");

	}

	updateOrientationButtons();

}

function rotateFretboard(){

    rotated = !rotated;

    switch(rotation){

        case 0:
            rotation = 180;
            break;

        case 180:
            rotation = 0;
            break;

        case 90:
            rotation = 270;
            break;

        case 270:
            rotation = 90;
            break;
    }

    updateOrientationButtons();

}

function updateOrientationButtons(){

	btnVertical.classList.toggle("active",orientation === "vertical");
	btnHorizontal.classList.toggle("active",orientation === "horizontal");

	btnRotate.classList.toggle("active",rotated);

}

function scrollToFretboardNut(){

	if (!isFretboardVisible) return;

	requestAnimationFrame(() => {

		switch (rotation){

			case 0:
//				workspaceFretboard.scrollTop = 0;
				document.body.scrollTop = 0;

				break;

			case 180:
//				workspaceFretboard.scrollTop = workspaceFretboard.scrollHeight;
				document.body.scrollTop = document.body.scrollHeight;

				break;

			case 270:
				workspaceFretboard.scrollLeft = 0;

				break;

			case 90:
				workspaceFretboard.scrollLeft = workspaceFretboard.scrollWidth;

				break;
		}

	});

}

function setWorkspaceLayout(){

	//------------------------------------------------
	// Nunca permitir que ambos estén ocultos
	//------------------------------------------------

	if (!isScoreVisible && !isFretboardVisible) {

		isFretboardVisible = true;

	}

	//------------------------------------------------
	// Mostrar / ocultar
	//------------------------------------------------

	workspaceFretboard.style.display = isFretboardVisible ? "" : "none";

	workspaceScore.style.display = isScoreVisible ? "" : "none";

	//------------------------------------------------
	// Configurar layout
	//------------------------------------------------

	workspace.classList.remove(
		"horizontal",
		"vertical",
		"contentOnly",
		"scoreOnly"
	);

	if (isFretboardVisible && isScoreVisible) {

		workspace.classList.add(orientation);

	} else if (isFretboardVisible) {

		workspace.classList.add("contentOnly");

	} else {

		workspace.classList.add("scoreOnly");

	}

	//------------------------------------------------
	// Estado de los botones
	//------------------------------------------------

	btnFretboardVisible.classList.toggle("active",isFretboardVisible);

	btnScoreVisible.classList.toggle("active",isScoreVisible);

}

function setPlayStopButton(button, isPlaying, showText = true){

	if (isPlaying) {

		button.innerHTML = showText
			? "<i class='fa-solid fa-stop'></i><span>Stop</span>"
			: "<i class='fa-solid fa-stop'></i>";

		if (chkAutoScroll.checked) scoreFloatingStopButton.style.display = "flex";

	} else {

		button.innerHTML = showText
			? "<i class='fa-solid fa-play'></i><span>Play</span>"
			: "<i class='fa-solid fa-play'></i>";


		scoreFloatingStopButton.style.display = "none";
	}

	button.classList.toggle("buttonPlay", !isPlaying);
	button.classList.toggle("buttonStop", isPlaying);

}

function parseBoolean(value, defaultValue = false) {

	if (value === undefined || value === null) {
		return defaultValue;
	}

	if (typeof value === "boolean") {
		return value;
	}

	if (typeof value === "string") {
		return value.toLowerCase() === "true";
	}

	return Boolean(value);
}

async function copyCanvasToClipboard() {

    try {

        const blob = await new Promise(resolve =>
            canvas.toBlob(resolve, "image/png")
        );

        await navigator.clipboard.write([
            new ClipboardItem({
                "image/png": blob
            })
        ]);

        showAlert("Imagen copiada al portapapeles.", "success");

    }
    catch (err) {

        console.error(err);

        showAlert("No ha sido posible copiar la imagen.", "error");

    }

}

function downloadCanvas() {

    const link = document.createElement("a");

    const titulo = workspaceTitleText.textContent;

    link.download = titulo + ".png";

    link.href = canvas.toDataURL("image/png");

    link.click();

}

function setLoadingProgress(percent,text){

	loadingProgressBar.style.width = percent + "%";
	loadingText.textContent = text;
}

function hideLoadingScreen() {

	loadingSpinner.classList.add("isCompleted");

	setTimeout(() => {

		loadingScreen.classList.add("isHidden");

		setTimeout(() => {loadingScreen.remove();}, 550);

	}, 500);

}

function setErrorLoadingProgress(err){

	loadingText.innerHTML = "<i class='fa-solid fa-circle-exclamation'></i> Error " + loadingText.textContent + "<br><br><span>" + err + "</span>";
	loadingText.classList.add("error");
	loadingSpinner.style.display = "none";

}

function showAlert(message, type = "success", duration = 2500) {

	// Cancelar desaparición anterior

	clearTimeout(alertTimeout);

	// Mensaje

	alertMessage.textContent = message;

	// Tipo

	appAlert.classList.remove("success", "error");

	if (type === "success") {

		appAlert.classList.add("success");

		alertIcon.className = "fa-solid fa-circle-check";

	}  else if (type === "error") {

		appAlert.classList.add("error");

		alertIcon.className = "fa-solid fa-circle-xmark";

	} else {

		appAlert.classList.add("info");

		alertIcon.className = "fa-solid fa-circle-info";

	}

	// Mostrar

	appAlert.classList.add("show");

	// Ocultar después del tiempo indicado

	alertTimeout = setTimeout(() => {

		appAlert.classList.remove("show");

	}, duration);

}

function loadComboChords() {

	cmbChords.innerHTML = "";

	let maxChord = -1;

	// --------------------------------
	// NOTES
	// --------------------------------

	notes.forEach(note => {

		const chord = Number(note.chord);

		if (Number.isInteger(chord)) {

			maxChord = Math.max(maxChord, chord);

		}

	});

	// --------------------------------
	// BARRE NOTES
	// --------------------------------

	barreNotes.forEach(barre => {

		const chord = Number(barre.chord);

		if (Number.isInteger(chord)) {

			maxChord = Math.max(maxChord, chord);

		}

	});

	// --------------------------------
	// NUT NOTES
	// --------------------------------

	nutNotes.forEach(note => {

		if (!note) return;

		const chord = Number(note.chord);

		if (Number.isInteger(chord)) {

			maxChord = Math.max(maxChord, chord);

		}

	});

	// --------------------------------
	// SI NO HAY ACORDES
	// --------------------------------

	if (maxChord < 0) {

		resetComboChords();

		return;

	}

	// --------------------------------
	// CREAR OPTIONS
	// --------------------------------

	for (let chord = 0; chord <= maxChord; chord++) {

		const option = document.createElement("option");

		option.value = chord;
		option.textContent = "Acorde " + (chord + 1);

		cmbChords.appendChild(option);

	}

	// --------------------------------
	// SELECCIONAR EL PRIMERO
	// --------------------------------

	cmbChords.value = 0;

}

function resetComboChords() {

	cmbChords.innerHTML = "";

	const option = document.createElement("option");

	option.value = 0;
	option.textContent = "Acorde 1";

	cmbChords.appendChild(option);

	cmbChords.value = 0;

}

function addChord() {

	const nextChord = cmbChords.options.length;

	const option = document.createElement("option");

	option.value = nextChord;
	option.textContent = "Acorde " + (nextChord + 1);

	cmbChords.appendChild(option);

	cmbChords.selectedIndex = cmbChords.options.length - 1;

}

function delChord() {

	const selectedIndex = cmbChords.selectedIndex;

	// --------------------------------
	// NO PERMITIR BORRAR ACORDE 1
	// --------------------------------

	if (selectedIndex <= 0) {
		alert("No esta permitido eliminar el primer acorde.")
		return;
	}

	const selectedChord = Number(cmbChords.value);

	// --------------------------------
	// ELIMINAR Y RENUMERAR NOTES
	// --------------------------------

	notes = notes
		.filter(note => {

			return Number(note.chord) !== selectedChord;

		})
		.map(note => {

			const chord = Number(note.chord);

			return {
				...note,
				chord: chord > selectedChord ? chord - 1 : chord
			};

		});

	// --------------------------------
	// ELIMINAR Y RENUMERAR BARRE NOTES
	// --------------------------------

	barreNotes = barreNotes
		.filter(barre => {

			return Number(barre.chord) !== selectedChord;

		})
		.map(barre => {

			const chord = Number(barre.chord);

			return {
				...barre,
				chord: chord > selectedChord ? chord - 1 : chord
			};

		});

	// --------------------------------
	// ELIMINAR Y RENUMERAR NUT NOTES
	// --------------------------------

	nutNotes.forEach((note, string) => {

		if (!note) {
			return;
		}

		const chord = Number(note.chord);

		// Eliminar notas del acorde borrado
		if (chord === selectedChord) {

			nutNotes[string] = null;

			return;

		}

		// Renumerar acordes posteriores
		if (chord > selectedChord) {

			nutNotes[string].chord = chord - 1;

		}

	});

	// --------------------------------
	// ELIMINAR OPTION
	// --------------------------------

	cmbChords.remove(selectedIndex);

	// --------------------------------
	// RENOMBRAR OPTIONS
	// --------------------------------

	for (let i = 0; i < cmbChords.options.length; i++) {

		cmbChords.options[i].value = String(i);
		cmbChords.options[i].textContent = "Acorde " + (i + 1);

	}

	// --------------------------------
	// SELECCIONAR ACORDE
	// --------------------------------

	if (cmbChords.options.length > 0) {

		const newIndex = Math.min(selectedIndex,cmbChords.options.length - 1);

		cmbChords.selectedIndex = newIndex;

	}

	// --------------------------------
	// CARGAR NOTAS MUSICALES
	// --------------------------------

	aChords = buildOrderedChords();

	loadArrayNotas();

}

function keyHasFlats() {

	const scale = scales[cmbKey.value];

	if (!scale) return false;

	return scale.some(note => note.includes("b"));

}

function loadFretboardImage() {

	return new Promise((resolve, reject) => {

		neckImage.crossOrigin = "Anonymous";

		neckImage.onload = () => {

			neckImageLoaded = true;

			resolve();

		};

		neckImage.onerror = () => {

			neckImageLoaded = false;

			reject(new Error(`No se pudo cargar la imagen del diapasón: ${neckImage.src}`));

		};

		neckImage.src = fretboardImages[fretboardStyle];

	});

}

function resizeCanvas() {

	const isHorizontal = rotation === 90 || rotation === 270;

	let leftMargin = marginX;
	let rightMargin = marginX;
	let topMargin = 12;
	let bottomMargin = marginBottom;

	//------------------------------------------------
	// Título
	//------------------------------------------------

	if (chkShowTitle.checked) {

		topMargin = 42;

	}

	//------------------------------------------------
	// Números
	//------------------------------------------------

	if (showFretNumbers) {

		//------------------------------------------------
		// Números de trastes
		//------------------------------------------------

		if (rotation === 0) leftMargin = Math.max(leftMargin, 40);

		if (rotation === 180) rightMargin = Math.max(rightMargin, 40);

		if (rotation === 270) bottomMargin = Math.max(bottomMargin, 40);

		if (rotation === 90) topMargin = Math.max(topMargin, 40);

		//------------------------------------------------
		// Números de cuerdas
		//------------------------------------------------

		if (rotation === 0 || rotation === 90) topMargin = Math.max(topMargin, 40);

		if (rotation === 180 || rotation === 270) bottomMargin = Math.max(bottomMargin, 40);

		//------------------------------------------------
		// Margen lateral para números de cuerdas
		//------------------------------------------------

		if (rotation === 90) rightMargin = Math.max(rightMargin, 40);

		if (rotation === 270) leftMargin = Math.max(leftMargin, 40);

	}

	//------------------------------------------------
	// Título + números superiores
	//------------------------------------------------

	if (chkShowTitle.checked && showFretNumbers && (rotation === 0 || rotation === 90)) {

		topMargin = 68;

	}

	//------------------------------------------------
	// Dimensiones del mástil
	//------------------------------------------------

	const neckLength = getDynamicNeckLength();

	if (isHorizontal) {

		boardWidth = neckLength;
		boardHeight = HORIZONTAL_HEIGHT;

	} else {

		boardWidth = VERTICAL_WIDTH;
		boardHeight = neckLength;

	}

	//------------------------------------------------
	// Canvas
	//------------------------------------------------

	canvas.width = Math.round(boardWidth + leftMargin + rightMargin);
	canvas.height = Math.round(boardHeight + topMargin + bottomMargin);

	boardleft = leftMargin;
	boardtop = topMargin;

	boardright = boardleft + boardWidth;
	boardbottom = boardtop + boardHeight;

	//------------------------------------------------
	// Notas
	//------------------------------------------------

	if (cmbFretboardType.value !== "chord"){
		aSequence = buildOrderedSequence();
	}else{
		aChords = buildOrderedChords();
	}

	loadArrayNotas();

	//------------------------------------------------
	// Pintado
	//------------------------------------------------

	drawFretboard();

	drawNotes();

	scrollToFretboardNut();

}

function zoomCanvas() {

	const isHorizontal = rotation === 90 || rotation === 270;

	let leftMargin = marginX;
	let rightMargin = marginX;
	let topMargin = 12;
	let bottomMargin = marginBottom;


	//------------------------------------------------
	// Título
	//------------------------------------------------

	if (chkShowTitle.checked) {

		topMargin = 42;

	}

	//------------------------------------------------
	// Números
	//------------------------------------------------

	if (showFretNumbers) {

		//------------------------------------------------
		// Números de trastes
		//------------------------------------------------

		if (rotation === 0) leftMargin = Math.max(leftMargin, 40);
		if (rotation === 180) rightMargin = Math.max(rightMargin, 40);
		if (rotation === 270) bottomMargin = Math.max(bottomMargin, 40);
		if (rotation === 90) topMargin = Math.max(topMargin, 40);

		//------------------------------------------------
		// Números de cuerdas
		//------------------------------------------------

		if (rotation === 0 || rotation === 90) topMargin = Math.max(topMargin, 40);
		if (rotation === 180 || rotation === 270) bottomMargin = Math.max(bottomMargin, 40);


		//------------------------------------------------
		// Margen lateral para números de cuerdas
		//------------------------------------------------

		if (rotation === 90) rightMargin = Math.max(rightMargin, 40);
		if (rotation === 270) leftMargin = Math.max(leftMargin, 40);

	}


	//------------------------------------------------
	// Título + números superiores
	//------------------------------------------------

	if ( chkShowTitle.checked && showFretNumbers && (rotation === 0 || rotation === 90)) {

		topMargin = 68;

	}


	//------------------------------------------------
	// Dimensiones del mástil
	//------------------------------------------------

	const neckLength = getDynamicNeckLength();


	if (isHorizontal) {

		boardWidth = neckLength;
		boardHeight = HORIZONTAL_HEIGHT;

	} else {

		boardWidth = VERTICAL_WIDTH;
		boardHeight = neckLength;

	}


	//------------------------------------------------
	// Canvas
	//------------------------------------------------

	canvas.width = Math.round(boardWidth + leftMargin + rightMargin);

	canvas.height = Math.round(boardHeight + topMargin + bottomMargin);

	boardleft = leftMargin;
	boardtop = topMargin;

	boardright = boardleft + boardWidth;
	boardbottom = boardtop + boardHeight;


	//------------------------------------------------
	// Notas
	//------------------------------------------------

	if (cmbFretboardType.value !== "chord") {

		aSequence = buildOrderedSequence();

	} else {

		aChords = buildOrderedChords();

	}

	loadArrayNotas();

	//------------------------------------------------
	// Pintado
	//------------------------------------------------

	drawFretboard();

	drawNotes();

	scrollToFretboardNut();

	//------------------------------------------------
	// AJUSTAR AL ANCHO
	//------------------------------------------------

	if (fitCanvasWidth) {

		const style = getComputedStyle(workspaceFretboard);

		const availableWidth = workspaceFretboard.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);

		if (availableWidth > 0) {

			const scale = availableWidth / canvas.width;

			canvas.style.width = `${Math.floor(canvas.width * scale)}px`;

			canvas.style.height = `${Math.floor(canvas.height * scale)}px`;

		}

	} else {

		//------------------------------------------------
		// RESTAURAR TAMAÑO ORIGINAL
		//------------------------------------------------

		canvas.style.width = "";
		canvas.style.height = "";

	}

}

function chordNoteExists(string,fret,chord) {

	return aChords.some(note =>
		note.string === string &&
		note.fret === fret &&
		note.chord === Number(chord)
	);

}

async function encryptUser(email, password) {

	const encoder = new TextEncoder();

	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		encoder.encode(password),
		"PBKDF2",
		false,
		["deriveKey"]
	);

	const salt = crypto.getRandomValues(new Uint8Array(16));

	const key = await crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt,
			iterations: 100000,
			hash: "SHA-256"
		},
		keyMaterial,
		{
			name: "AES-GCM",
			length: 256
		},
		false,
		["encrypt", "decrypt"]
	);

	const iv = crypto.getRandomValues(new Uint8Array(12));

	const encrypted = await crypto.subtle.encrypt(
		{
			name: "AES-GCM",
			iv
		},
		key,
		encoder.encode(email)
	);

	// Convertir a Base64 para poder transportarlo
	const data = new Uint8Array([
		...salt,
		...iv,
		...new Uint8Array(encrypted)
	]);

	return btoa(String.fromCharCode(...data));
}

async function decryptUser(encryptedData, password) {

	try {

		const encoder = new TextEncoder();
		const decoder = new TextDecoder();

		const data = Uint8Array.from(
			atob(encryptedData),
			c => c.charCodeAt(0)
		);

		const salt = data.slice(0, 16);
		const iv = data.slice(16, 28);
		const encrypted = data.slice(28);

		const keyMaterial = await crypto.subtle.importKey(
			"raw",
			encoder.encode(password),
			"PBKDF2",
			false,
			["deriveKey"]
		);

		const key = await crypto.subtle.deriveKey(
			{
				name: "PBKDF2",
				salt,
				iterations: 100000,
				hash: "SHA-256"
			},
			keyMaterial,
			{
				name: "AES-GCM",
				length: 256
			},
			false,
			["decrypt"]
		);

		const decrypted = await crypto.subtle.decrypt(
			{
				name: "AES-GCM",
				iv
			},
			key,
			encrypted
		);

		return decoder.decode(decrypted);

	} catch (error) {

		return null;

	}

}

async function parseUsersXml(xml) {

	const usersNode = xml.querySelector("users");

	xmlUsersVersion = usersNode.getAttribute("version") || "1.0";

	const u = await Promise.all(

		[...xml.querySelectorAll("user")].map(async node => ({

			IDUser: node.getAttribute("IDUser"),
			name: node.getAttribute("name"),
			email: node.getAttribute("email"),
			permits: node.getAttribute("permits"),
			active: node.getAttribute("active") === "true",
			alta: node.getAttribute("alta"),
			baja: node.getAttribute("baja")

		}))

	);

	return u;

}

async function addUser(name, email) {

	try {

		// Comprobar que existe el array
		if (!Array.isArray(users)) {

			users = [];

		}

		const encrypted = await encryptUser(email, k);

		const date = new Date();

		const alta = String(date.getDate()).padStart(2, "0") + "/" + String(date.getMonth() + 1).padStart(2, "0") + "/" + date.getFullYear();

		const IDUser = generateIDKey();

		const userData = {

			IDUser: IDUser,
			name: name,
			email: encrypted,
			permits: "",
			active: true,
			alta: alta,
			baja: ""

		};

		users.push(userData);

		saveUsersXml();

		const created = createLibrary(name,IDUser);

		showAlert(created
			? "Usuario '" + name + "', con email '" + email + "' y librería creados."
			: "Usuario '" + name + "', con email '" + email + "' creado. No se pudo crear la librería.",
			created ? "success" : "error");

	} catch (error) {

		showAlert("No se pudo crear el usuario","error");
		console.log("No se pudo crear el usuario",error);

	}

}

function saveUsersXml() {

	try {

		xmlUsersVersion = (parseFloat(xmlUsersVersion) + 0.1).toFixed(1);

		let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';

		xml += '<users version="' + escapeXml(xmlUsersVersion) + '">\n';

		users.forEach(user => {

			xml += '\t<user';

			xml += ' IDUser="' + escapeXml(user.IDUser) + '"';
			xml += ' name="' + escapeXml(user.name) + '"';
			xml += ' email="' + escapeXml(user.email) + '"';
			xml += ' active="' + user.active + '"';
			xml += ' permits="' + escapeXml(user.permits) + '"';
			xml += ' alta="' + escapeXml(user.alta) + '"';
			xml += ' baja="' + escapeXml(user.baja) + '"';

			xml += ' />\n';

		});

		xml += '</users>';

		const blob = new Blob(
			[xml],
			{ type: "application/xml" }
		);

		const url = URL.createObjectURL(blob);

		const a = document.createElement("a");

		a.href = url;
		a.download = "users.xml";

		a.click();

		URL.revokeObjectURL(url);

		return true;

	} catch (error) {

		console.error("Error al guardar users.xml:", error);

		return false;

	}

}

function changeComboFretboardType(value){

	const oldType = fretboardType;

	fretboardType = value;

	cmbFretboardType.value = value;
	cmbFretboardTypeGuest.value = value;

	if (newProject()) {
	
		renderProject();

	}else{

		fretboardType = oldType;
		cmbFretboardType.value = oldType;
		cmbFretboardTypeGuest.value = oldType;

	}
}
