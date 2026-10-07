
"use strict";

/*============================
MAIN FUNCTIONS
==============================*/

async function initializeApp() {

	try {

		// USUARIO Y CONTROLES ----------------------

		setLoadingProgress(20, "Configurando interface de estudiante...");

		getURLParams();

		await loadXML("student",xmlStudents);

		setStudentState();

		configureStudentControls();

		resetControlsValues("init");


		// IMÁGENES ----------------------

		setLoadingProgress(10, "Cargando imágenes...");

		await loadFretboardImage();

		resizeCanvas();


		// PROJECTS ----------------------

		setLoadingProgress(30, "Cargando cursos y proyectos...");

		loadComboLevels();

		await loadXML("libraries",xmlLibraries);

		if (isAdmin || student !== null || lib !== null){

			await loadXML("library",xmlLibrary);
		
		}

		await initializeProjects();


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

		if (projectType === "multimedia") await renderMultimedia();



		// INICIO ----------------------

		if (isAdmin || student !== null) showHome(true);


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

	student = params.get("s");

	isAdmin = params.has("admin") || student === "admin";

	lib = params.get("lib");

	currentProjectId = params.get("id");

}

function setStudentState(){

	isMobile = window.innerWidth <= maxMediaScreenWidth;
	isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

	isStudentActive = true;

	appMode = "Designer";

	if (!isAdmin) {

		if (student !== null){

			const currentstudent = students.find(item => item.id === student);
	
			if (currentstudent) {

				studentName = currentstudent.n;

				if (!currentstudent.active){
					showAlert("El estudiante '" + studentName +"' no está activo.", "error");
					isStudentActive = false;
				}else{
					isStudentActive = true;
				}

			}else{
				showAlert("El estudiante '" + student + "' no existe.", "error");
				isStudentActive = true;
				student = null;
			}
		}

		if (student === null && currentProjectId !== null) appMode = "Shared";

	}else{
		student = "admin";
	}

	if (!isAdmin && student !== null) xmlLibrary = dataURL_Libraries + student + ".xml";

	if (lib !== null && isStudentActive) xmlLibrary = dataURL_Libraries + lib + ".xml";

}

function configureStudentControls(){

	if (!isAdmin) {
/*
		topNewStudent.style.display = "none";
		topLibrary.style.display = "none";
		btnSaveProject.style.display = "none";
		btnDelProject.style.display = "none";
		topTitle.style.display = "none";
		topCategory.style.display = "none";
		topShare.style.display = "none";
*/
		btnLibraries.style.display = "none";
		btnLibrariesPopup.style.display = "none";
		btnProyectos.style.display = "none";
		btnProyectosPopup.style.display = "none";

		cmbResolucion.style.display = "none";

		if (appMode === "Shared"){

			btnStudent.querySelector("i").className = "fa-solid fa-circle-user";

			txtStudentTitle.textContent = "Invitado";

		}else{

			if (student === null) {

				setMenu("edit");

				btnStudent.querySelector("i").className = "fa-solid fa-circle-user";

				txtStudentTitle.textContent = "Invitado";

			}else{

				if (!isStudentActive){
					btnStudent.querySelector("i").className = "fa-solid fa-user-lock";
				}else{
					btnStudent.querySelector("i").className = "fa-solid fa-user-graduate";
				}

				const txt = studentName.includes(" ") ? studentName.substring(0, studentName.indexOf(" ")) : studentName;
				txtStudentTitle.textContent = txt;

			}

		}

		if (!isStudentActive){

			setControlsEnabled(false);

			btnMultimedia.style.display = "none";
			btnMultimediaPopup.style.display = "none";

			btnFretboard.disabled = false;
			btnFretboardPopup.disabled = false;
			btnScore.disabled = false;
			btnScorePopup.disabled = false;
			btnPlayer.disabled = false;
			btnPlayerPopup.disabled = false;
			btnMetronome.disabled = false;
			btnMetronomePopup.disabled = false;

			btnMenuSelector.disabled = false;
			btnShowLibraryPanel.disabled = false;

			btnPlayStop.disabled = true;

			btnStudent.querySelector("i").className = "fa-solid fa-user-lock";

		}

		setMenu("metronome");

	} else {

		setMenu("libraries");

		if (!isMobile) openTopControls();

		topProjectGuest.style.display = "none";

		btnStudent.querySelector("i").className = "fa-solid fa-user-shield";

		txtStudentTitle.textContent = "Admin";

	}

	workspaceTimeInfo.style.display = "none";

	cursor.innerHTML = "";
	cursor.style.color = colorPicker.value;

	if (isMobile) {

		cursor.style.display = "none";

		if (!isLocal){
			fitCanvasWidth = true;
			chkFretboardZoom.checked = true;
		}

		menuSelectorText.textContent = "MENÚ";
		menuSelectorIcon.className = "fa-solid fa-gear fa-fw";

		closeLibraryPanel();

	} else {
		cursor.style.display = "";
	}

	if (!isMobile && appMode !== "Shared" && student !== null) {
		openLibraryPanel();
	}

	if (!isAdmin){
		workspaceMultimediaControls.style.display = "none";
	}

	if (student === null) {
		workspaceHeaderContainer.style.display = "none";
	}

	updateTopBarMenu();

}

function setControlsState() {

	const isFretboard = fretboardType === "fretboard";
	const isChord = fretboardType === "chord";
	const noDisplayMode = !displayMode;
	const isSharedFretboard = appMode === "Shared" && isFretboard;
	const isMultimedia = cmbProjectType.value === "multimedia" || isHome;


	// --------------------------------
	// TIPO DE FRETBOARD
	// --------------------------------

	chkMetronomeOn.disabled = isFretboard;

	cmbChords.disabled = !isChord;
	btnNewChord.disabled = !isChord;
	btnDelChord.disabled = !isChord;

	// --------------------------------
	// PLAY / STOP
	// --------------------------------

	let playStopDisabled = noDisplayMode || isMultimedia;

	if (isSharedFretboard) {
		playStopDisabled = true;
	}

	if (isStudentActive) {
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

	btnFretboardVisible.disabled = isFretboard && appMode === "Shared" || isMultimedia;


	// --------------------------------
	// AUDIO / RENDER
	// --------------------------------

	const renderDisabled = isFretboard || noDisplayMode || isMultimedia;

	if (isAdmin) {

		btnRenderBuffer.disabled = renderDisabled;
		cmbAudioFormat.disabled = renderDisabled;
		btnSaveAudio.disabled = renderDisabled;
		btnCopyCanvas.disabled = renderDisabled;
		btnCopyScore.disabled = renderDisabled;
		cmbImgFormat.disabled = renderDisabled;
		btnImgDownload.disabled = renderDisabled;

	}

	// --------------------------------
	// CONTROLES DEL FRETBOARD
	// --------------------------------

	chkInlays.disabled = noDisplayMode;

	chkNoteNames.disabled = noDisplayMode;

	btnLessNumberFrets.disabled = Boolean(displayMode);
	numberFrets.disabled = Boolean(displayMode);
	btnMoreNumberFrets.disabled = Boolean(displayMode);


	// --------------------------------
	// EDICIÓN
	// --------------------------------

	btnPlayer.disabled = isMultimedia;
	btnPlayerPopup.disabled = btnPlayer.disabled;

	btnScore.disabled = isMultimedia;
	btnScorePopup.disabled = btnScore.disabled;

	btnEdicion.disabled = isMultimedia;
	btnEdicionPopup.disabled = btnEdicion.disabled;

	btnFretboard.disabled = isMultimedia;
	btnFretboardPopup.disabled = isMultimedia;

	btnVertical.disabled = isMultimedia;
	btnHorizontal.disabled = isMultimedia;

	chkShowTitle.disabled = isMultimedia;
	chkScoreTitle.disabled = isMultimedia;

	cmbFretboardType.disabled = isMultimedia;

	// --------------------------------
	// DESCARGAS SUPERIORES
	// --------------------------------

	cmbImgFormat.disabled = isMultimedia;
	btnImgDownload.disabled = isMultimedia;
	btnCopyCanvas.disabled = isMultimedia;
	btnCopyScore.disabled = isMultimedia;
	cmbAudioFormat.disabled = isMultimedia;
	btnSaveAudio.disabled = isMultimedia;
	btnRenderBuffer.disabled = isMultimedia;


	// --------------------------------
	// Shared + FRETBOARD
	// --------------------------------

	if (isSharedFretboard) {

		btnScore.disabled = true;
		btnScorePopup.disabled = true;

		btnPlayer.disabled = true;
		btnPlayerPopup.disabled = true;

		btnRenderBuffer.disabled = true;
		cmbAudioFormat.disabled = true;
		btnSaveAudio.disabled = true;

		btnCopyCanvas.disabled = true;
		btnCopyScore.disabled = true;
		btnImgDownload.disabled = true;
		cmbImgFormat.disabled = true;

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

	if (isAdmin){
		btnProyectos.disabled = isHome;
		btnProyectosPopup.disabled = btnProyectos.disabled;
	}

	chkEditSound.disabled = btnEdicion.style.display === "none";

//	chkFretboardZoom.disabled = isLocal;

}

function setHeaderProjectTitle(){

	let txt = "";

	const cat = cmbProjectCategory.selectedIndex >= 0 ? cmbProjectCategory.options[cmbProjectCategory.selectedIndex].textContent : "";

	txt = cat !== "" ? cat + " / " : "";
	txt = projectTitle === "" ? txt + "Sin Título" : txt + projectTitle;
	txt = "<i class='fa-solid fa-folder-open'></i>&nbsp;<span>"+ txt + "</span>";

	return txt;
}

function showHome(value){

	let txt = ""

	if (value === false){

		txt = setHeaderProjectTitle();

		workspaceHome.style.display = "none";

		if (projectType === "fretboard"){
			workspaceControls.style.display = "flex";

			workspaceMetronome.style.display = "flex";
			workspaceTimeInfo.style.display = "none";

			if (isFretboardVisible) workspaceFretboard.style.display = "flex";
			if (isScoreVisible) workspaceScore.style.display = "flex";

		}

		if (multimediaResources.length > 0) {
			workspaceMultimedia.style.display = "block";
		}else{
			workspaceMultimedia.style.display = "none";
		}

		if (isAdmin) workspaceMultimediaControls.style.display = "block";

		btnLibraryHomeButton.classList.remove("active");

		openSelectedProjectCategory();

	}else{

		txt = "<i class='fa-solid fa-house'></i>&nbsp;<span>Página Principal</span>";

		workspaceHome.style.display = "block";

		workspaceControls.style.display = "none";
		workspaceMetronome.style.display = "none";
		workspaceTimeInfo.style.display = "none";
		workspaceFretboard.style.display = "none";
		workspaceScore.style.display = "none";
		workspaceMultimedia.style.display = "none";
		workspaceMultimediaControls.style.display = "none";

		btnLibraryHomeButton.classList.add("active");

		closeAllProjectCategories();

		if (isMobile){

			menuSelectorText.textContent = "MENÚ";
			menuSelectorIcon.className = "fa-solid fa-gear fa-fw";

			closeLibraryPanel();
		}

		setEditMode("view");

	}

	workspaceTitleText.innerHTML = txt;

	if (!isMobile){
		if (isAdmin){
			setMenu("libraries");
		}else{
			setMenu("metronome");
		}
	}

	isHome = value;

	setControlsState();

}

function setMenu(m, click = false){

	// alternar abrir-cerrar si se pulsa el mismo menú
	if (btnMenuSelector.style.display === "none" && menuOpen === m) {

		if (click){
			if (topControls.classList.contains("isOpen")) {
				closeTopControls();
			} else {
				openTopControls();
			}
		}
		return;

	}

	menuOpen = m;

	btnLibraries.classList.remove("active");
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
		topClipboard,
		topImgFormat,
		topVolumen,
		topRepeats,
		topArticulation,
		topMetronomePlay,
		topMetronomeControls,
		topBuffer,
		topAudio,
		topVideo,
		topMultimedia,
		topGuitarAmp,
		topProjectGuest,
		topNewStudent,
		topCatalogue,
		topRepository

	].forEach(control => control.classList.add("isHidden"));

	switch (menuOpen){

		case "libraries":

			btnLibraries.classList.add("active");

			showMenuControls(
				topNewStudent,
				topLibrary,
				topCatalogue,
				topRepository
			);

			menuSelectorText.textContent = "CURSOS";
			menuSelectorIcon.className = "fa-solid fa-book";

			break;

		case "projects":

			btnProyectos.classList.add("active");

			showMenuControls(
				topProject,
				topCategory,
				topType,
				topMultimedia,
				topShare,
				topTitle
			);

			menuSelectorText.textContent = "PROYECTOS";
			menuSelectorIcon.className = "fa-solid fa-folder-open";

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
				topImgFormat,
				topClipboard,
				topBuffer,
				topAudio,
				topVideo,
				topGuitarAmp
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

	if (click) openTopControls();

}

async function initializeProjects() {

	// --------------------------------
	// BIBLIOTECA NO CARGADA
	// --------------------------------

	if (!xmlLibraryLoaded) {

		currentProjectId = generateIDKey();

		textLibraryName.disabled = true;
		textAreaLibrary.disabled = true;

		btnSaveProject.disabled = true;
		btnDelProject.disabled = true;

		cmbProjectCategory.disabled = true;
		btnNewCategory.disabled = true;
		btnDelCategory.disabled = true;

		return;

	}

	// --------------------------------
	// INICIALIZAR BIBLIOTECA
	// --------------------------------

	setLibraryInfo(xmlLibrary);

	renderLibrary();

	// --------------------------------
	// ABRIR PROYECTO DE LA URL
	// --------------------------------

	if (currentProjectId !== null && isStudentActive) {

		const project = library.find(project => project.id === currentProjectId);

		if (project) {

			await selectProject(project);

			return;

		}

		showAlert("No se encontró el proyecto '" + currentProjectId + "'","error");

		currentProjectId = generateIDKey();

		return;

	}

	// --------------------------------
	// ABRIR PRIMER PROYECTO DEL ALUMNO
	// --------------------------------

	if (student !== null && isStudentActive) {

		const firstProject = getFirstProject();

		if (firstProject) {

			await selectProject(firstProject);

			return;

		}

	}

	currentProjectId = generateIDKey();

}

async function loadXML(type,file) {

	try {

		const response = await fetch(file);

		if (!response.ok) throw new Error("No se pudo cargar " + file);

		const xmlText = await response.text();

		const xml = parseXML(xmlText);

		if (!xml) return false;

		switch (type) {

			case "student":

				students = await parseStudentsXml(xml);

				if (students) loadComboStudents();

				break;

			case "libraries":

				libraries = parseLibrariesXml(xml);

				if (libraries) loadComboLibraries();

				break;

			case "library":

				xmlLibraryLoaded = false;
				library = parseLibraryXml(xml);
				xmlLibraryLoaded = true;

				break;

			default:

				throw new Error("Tipo de XML no válido: " + type);

		}

		return true;

	} catch (error) {

		console.warn("Error cargando " + file,error);

		if (type === "student") {

			students = [];

		} else if (type === "libraries") {

			libraries = [];

		} else if (type === "library") {

			library = [];
			xmlLibraryLoaded = false;

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

function initializeArrays(){

	multimediaResources = [];
	history = [];
	notes = [];
	barreNotes = [];
	nutNotes = Array(stringCount).fill(null);
	aSequence = [];
	aChords = [];

	noteOrder = 0;
}

function initializeControlsValues(){

	orientation = window.innerWidth <= 480 ? "vertical" : "horizontal";

	isFretboardVisible = true;
	isScoreVisible = false;
	projectType = "fretboard";
	fretboardType = "sequence";
	projectTitle = "";
	fretCount = 10;
	projectBar = "4/4";
	projectFigure = 1;
	countInBars = 0;
	playerRepeats = 2;
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
	scoreScale = "auto";
	notation = "";
	rotation = 0;
	rotated = false;
	fretboardStyle = "maple";
	currentInstrument = "piano";

}

function resetControlsValues(state){

	if (state === "init") initializeControlsValues();

	if (state === "newProject"){
		projectTitle = "";
	}

	titleText.value = projectTitle;

	numFrets.value = fretCount;
	sliderFrets.value = fretCount;
	sliderFrets.title = fretCount;

	cmbDiapason.value = fretboardStyle;

	noteText.value = "";

	samplerGate.value = 100;

	cmbBar.value = projectBar;
	cmbFigure.value = projectFigure;

	updateFigureOptions();
	getBarGroups();

	cmbSamplerInstrument.value = currentInstrument;

	numBpm.value = bpm;
	sliderBpm.value = bpm;
	sliderBpm.title = bpm;

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

	cmbCountIn.value = countInBars;

	cmbPlayerRepeats.value = playerRepeats;

	numberFrets.value = fretNumbers;
	chkShowNumber.checked = showFretNumbers;

	cmbKey.value = key;

	cmbScoreStaves.value = scoreStaves;
	cmbScoreLayout.value = scoreLayout;

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
	cmbFretboardTypeGuest.value = cmbFretboardType.value;

	cmbMultimedia.value = "text";

	btnDisplay.classList.toggle("active", displayMode);

	setControlsState();

	chkInlays.checked = displayMode ? inlays : false;

	chkNoteNames.checked = notation;
	if (notation !== "") cmbNoteNames.value  = notation;

	setEditMode("view");

	setOrientation(orientation);

	setWorkspaceLayout();

	workspaceTitleText.innerHTML = setHeaderProjectTitle();

	if (state !== "init" && projectType === "fretboard"){

		if (isFretboardVisible) resizeCanvas();

		if (isScoreVisible) {

			if (cmbFretboardType.value !== "chord"){
				aSequence = buildOrderedSequence();
			}else{
				aChords = buildOrderedChords();
			}

			loadArrayNotas();

			scoreRender();

		}
	}

	renderMultimedia();

}

function setControlsEnabled(enabled) {

    const controls = document.querySelectorAll(
        "input, select, button"
    );

    controls.forEach(control => {
        control.disabled = !enabled;
    });

    document.querySelectorAll("#topControls span").forEach(span => {
	span.style.opacity = enabled ? 1 : "0.55";
    });

    if (enabled) setControlsState();

    btnStudent.disabled = false;

}

function updateTopBarMenu() {

	const topBarWidth = topBar.clientWidth;

	const brandWidth = brand.offsetWidth;

	const toggleWidth = btnStudent.offsetWidth;


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
		
	if (window.innerWidth >= 480) {
		btnToggleLibraryPanel.style.display = "none";
	}else{
		btnToggleLibraryPanel.style.display = "";
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
        pBar = numerator;
        pFigure = parseInt(cmbFigure.value, 10);
    } else if (time === "6/8") {
        pBar = 2;
        pFigure = 3;
    } else if (time === "9/8") {
        pBar = 3;
        pFigure = 3;
    } else if (time === "12/8") {
        pBar = 4;
        pFigure = 3;
    } else if (time === "5/8") {
        pBar = 1;
        pFigure = 5;
    } else if (time === "7/8") {
        pBar = 1;
        pFigure = 7;
    }

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

function openLibraryPanel(){

	appMain.classList.remove("libraryHidden");

	btnShowLibraryPanel.title = "Ocultar lista";
	btnShowLibraryPanel.innerHTML = "<i class='fa-solid fa-angles-left'></i>";

	btnToggleLibraryPanel.title = btnShowLibraryPanel.title;
	btnToggleLibraryPanel.innerHTML = btnShowLibraryPanel.innerHTML;
}

function closeLibraryPanel(){

	appMain.classList.add("libraryHidden");

	btnShowLibraryPanel.title = "Ver lista";
	btnShowLibraryPanel.innerHTML = "<i class='fa-solid fa-angles-right'></i>";

	btnToggleLibraryPanel.title = btnShowLibraryPanel.title;
	btnToggleLibraryPanel.innerHTML = btnShowLibraryPanel.innerHTML;

}

function openTopControls(){

	topControls.classList.add("isOpen");

}

function closeTopControls() {

	topControls.classList.remove("isOpen");

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

	} else {

		rotation = rotated ? 270 : 90;

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

	scrollToFretboardNut();

}

function scrollToFretboardNut(){

	return;

	if (!isFretboardVisible) return;

	requestAnimationFrame(() => {

		switch (rotation){

			case 0:
				workspaceFretboard.scrollTop = 0;
				document.body.scrollTop = 0;

				break;

			case 180:
				workspaceFretboard.scrollTop = workspaceFretboard.scrollHeight;
				document.body.scrollTop = document.body.scrollHeight;

				break;

			case 90:
				workspaceFretboard.scrollLeft = 0;

				break;

			case 270:
				workspaceFretboard.scrollLeft = workspaceFretboard.scrollWidth;

				break;
		}

	});

}

function setWorkspaceLayout(){

	workspaceMultimedia.innerHTML = "";

	workspaceTimeInfo.style.display = "none";

	if (projectType === "multimedia"){

		workspaceMultimedia.style.display = "block";
		workspaceControls.style.display = "none";
		workspaceMetronome.style.display = "none";
		workspaceFretboard.style.display = "none";
		workspaceScore.style.display = "none";

	}else{

		if (multimediaResources.length > 0) {
			workspaceMultimedia.style.display = "block";
		}else{
			workspaceMultimedia.style.display = "none";
		}

		workspaceControls.style.display = "flex";
		workspaceMetronome.style.display = "flex";

		// Nunca permitir que ambos estén ocultos
		if (!isScoreVisible && !isFretboardVisible) isFretboardVisible = true;

		workspaceFretboard.style.display = isFretboardVisible ? "flex" : "none";
		workspaceScore.style.display = isScoreVisible ? "flex" : "none";

		btnFretboardVisible.classList.toggle("active",isFretboardVisible);
		btnScoreVisible.classList.toggle("active",isScoreVisible);

	}

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
		if (rotation === 90) bottomMargin = Math.max(bottomMargin, 40);
		if (rotation === 270) topMargin = Math.max(topMargin, 40);

		//------------------------------------------------
		// Números de cuerdas
		//------------------------------------------------

		if (rotation === 0 || rotation === 90) topMargin = Math.max(topMargin, 40);
		if (rotation === 180 || rotation === 270) bottomMargin = Math.max(bottomMargin, 40);

		//------------------------------------------------
		// Margen lateral para números de cuerdas
		//------------------------------------------------

		if (rotation === 270) rightMargin = Math.max(rightMargin, 40);
		if (rotation === 90) leftMargin = Math.max(leftMargin, 40);

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
		if (rotation === 90) bottomMargin = Math.max(bottomMargin, 40);
		if (rotation === 270) topMargin = Math.max(topMargin, 40);

		//------------------------------------------------
		// Números de cuerdas
		//------------------------------------------------

		if (rotation === 0 || rotation === 90) topMargin = Math.max(topMargin, 40);
		if (rotation === 180 || rotation === 270) bottomMargin = Math.max(bottomMargin, 40);


		//------------------------------------------------
		// Margen lateral para números de cuerdas
		//------------------------------------------------

		if (rotation === 270) rightMargin = Math.max(rightMargin, 40);
		if (rotation === 90) leftMargin = Math.max(leftMargin, 40);

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

async function encryptstudent(e) {

	const encoder = new TextEncoder();

	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		encoder.encode(k),
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
		encoder.encode(e)
	);

	// Convertir a Base64 para poder transportarlo
	const data = new Uint8Array([
		...salt,
		...iv,
		...new Uint8Array(encrypted)
	]);

	return btoa(String.fromCharCode(...data));
}

async function decryptstudent(e) {

	try {

		const encoder = new TextEncoder();
		const decoder = new TextDecoder();

		const data = Uint8Array.from(
			atob(e),
			c => c.charCodeAt(0)
		);

		const salt = data.slice(0, 16);
		const iv = data.slice(16, 28);
		const encrypted = data.slice(28);

		const keyMaterial = await crypto.subtle.importKey(
			"raw",
			encoder.encode(k),
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

async function parseStudentsXml(xml) {

	const studentsNode = xml.querySelector("students");

	xmlStudentsVersion = studentsNode.getAttribute("version") || "1.0";

	const u = await Promise.all(

		[...xml.querySelectorAll("student")].map(async node => ({

			id: node.getAttribute("id"),
			n: node.getAttribute("n"),
			e: node.getAttribute("e"),
			active: node.getAttribute("active") === "true",
			alta: node.getAttribute("alta"),
			baja: node.getAttribute("baja"),
			courses: node.getAttribute("courses")

		}))

	);

	return u;

}

async function addStudent(name, email) {

	try {

		// Comprobar que existe el array
		if (!Array.isArray(students)) {

			students = [];

		}

		const n = name; //await encryptstudent(name);

		const e = await encryptstudent(email);

		const date = new Date();

		const alta = String(date.getDate()).padStart(2, "0") + "/" + String(date.getMonth() + 1).padStart(2, "0") + "/" + date.getFullYear();

		const id = "s_" + generateIDKey();

		const studentData = {

			id: id,
			n: n,
			e: e,
			active: true,
			alta: alta,
			baja: "",
			courses: ""

		};

		students.push(studentData);

		saveStudentsXml();

		const created = createLibrary(id,"student");

		loadComboStudents();

		showAlert(created
			? "Estudiante '" + name + "', con email '" + email + "' y librería creados."
			: "Estudiante '" + name + "', con email '" + email + "' creado. No se pudo crear la librería.",
			created ? "success" : "error");

	} catch (error) {

		showAlert("No se pudo crear el estudiante","error");
		console.log("No se pudo crear el estudiante:",error);

	}

}

function saveStudentsXml() {

	try {

		xmlStudentsVersion = (parseFloat(xmlStudentsVersion) + 0.1).toFixed(1);

		let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';

		xml += '<students version="' + escapeXml(xmlStudentsVersion) + '">\n';

		students.forEach(student => {

			xml += '\t<student';

			xml += ' id="' + escapeXml(student.id) + '"';
			xml += ' n="' + escapeXml(student.n) + '"';
			xml += ' e="' + escapeXml(student.e) + '"';
			xml += ' active="' + student.active + '"';
			xml += ' alta="' + escapeXml(student.alta) + '"';
			xml += ' baja="' + escapeXml(student.baja) + '"';
			xml += ' courses=""';

			xml += ' />\n';

		});

		xml += '</students>';

		const blob = new Blob(
			[xml],
			{ type: "application/xml" }
		);

		const url = URL.createObjectURL(blob);

		const a = document.createElement("a");

		a.href = url;
		a.download = "students.xml";

		a.click();

		URL.revokeObjectURL(url);

		return true;

	} catch (error) {

		console.error("Error al guardar el archivo students.xml: ", error);

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

function loadComboLibraries(){

	cmbLibraries.innerHTML = "";

	libraries.forEach(library => {

		const option = document.createElement("option");

		option.value = library.id;
		option.textContent = library.name;

		cmbLibraries.appendChild(option);

	});

	if (isAdmin && lib !==null){
		cmbLibraries.value = lib;
	}else{
		cmbLibraries.selectedIndex = -1;
	}

}

function loadComboStudents(){

	cmbStudents.innerHTML = "";

	students.forEach(student => {

		const option = document.createElement("option");

		option.value = student.id;
		option.textContent = student.n;

		cmbStudents.appendChild(option);

	});

	if (isAdmin && lib !==null){
		cmbStudents.value = lib;
		return;
	}

	if (student !== null){
		cmbStudents.value = student;
	}else{
		cmbStudents.selectedIndex = -1;
	}

}

function loadComboLevels(){

	let l = 0;

	cmbLevels.innerHTML = "";

	difficultyLevels.forEach(level => {

		const option = document.createElement("option");

		option.value = l;
		option.textContent = level.name;

		if (l === 1) option.selected = true;

		l++;

		cmbLevels.appendChild(option);

	});

}
