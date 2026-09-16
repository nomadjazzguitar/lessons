"use strict";

/*==================================================
	URLs
==================================================*/

let baseURL = "https://themachetazo.github.io/jazzguitarnomad/fretboard/";

let dataURL = "";

const isLocal = window.location.protocol === "file:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

//Para que funcione el pintado y guardado de la imagen renderizada del mastil en drawFretdoard en local, los achivos de imagenes del mastil tienen que estar en un servidor
if (isLocal) dataURL = baseURL;

const dataURL_Images = dataURL + "img/";
const dataURL_Users = dataURL;
const dataURL_Library = dataURL + "projects/";
const dataURL_Multimedia = dataURL_Library + "multimedia/";

const dataURL_Samples = "https://themachetazo.github.io/jazzguitarnomad/samples/";

/*==================================================
	CONFIGURACIÓN GENERAL DE LA APLICACIÓN
==================================================*/

let isMobile = false;
let isTouchDevice = false;

const stringCount = 6;

const maxMediaScreenWidth = 768;
let screenRotated = screen.orientation.angle;

let menuOpen = "";

let editMode = "view";

let projectTitle = "Proyecto nuevo sin título";
let displayMode = true;
let fretCount = 10;
let orientation = "horizontal";
let rotation = 0; /* vertical: 0 / 180, horizontal: 90 / 270 */
let rotated = false;
let projectBar = 4;
let projectFigure = 1;
let scoreScale = "auto";
let projectType = "fretboard";
let fretboardType = "sequence";
let countBars = 0;
let repetitionSequence = 2;
let isFretboardVisible = true;
let isScoreVisible = false;
let currentInstrument = "piano";
let tipoSecuencia = "up";
let direccion = false;
let fretNumbers = 1;
let showFretNumbers = true;
let bpm = 90;
let key = "C";
let scoreStaves = "all";
let scoreLayout = "vertical";
let swing = false;
let metronomeOn = true;
let inlays = true;
let notation = "";

let topControlsWasOpen = true;
let libraryWasClosed = false;

let currentTheme = "dark";

const themes = {

	dark: {
		"--color-main-text": "#d5d5d5",
		"--color-highlight": "#1268A8",
		"--color-dark-background": "#262626",
		"--color-fretboard-background": "#262626",
		"--color-light-background": "#353333",
		"--color-tools": "#413F3F",
		"--color-border": "#404040",
		"--color-red": "#c62828",
		"--color-text": "#ffffff",
		"--color-back": "#000000",
		"--color-medium": "#777777",
		"--color-disabled": "#D5D5D5",
		"--color-logo": "#FFFFFF",
		"--color-selected": "#999999"
	},

	light: {
		"--color-main-text": "#2A2A2A",
		"--color-highlight": "#4CAF70",
		"--color-dark-background": "#DDDDDD",
		"--color-fretboard-background": "#FFFFFF",
		"--color-light-background": "#F2F2F2",
		"--color-tools": "#DDDDDD",
		"--color-border": "#BFBFBF",
		"--color-red": "#C62828",
		"--color-text": "#1A1A1A",
		"--color-back": "#E9E9E9",
		"--color-medium": "#777777",
		"--color-disabled": "#A5A5A5",
		"--color-logo": "#000000",
		"--color-selected": "#999999"
	}

};


/*==================================================
	USUARIOS Y PROYECTOS
==================================================*/

let appMode = "Designer";

let users = [];
let user;
let userName;
let xmlUsers = dataURL_Users + "users.xml";
let xmlUsersVersion = "1.0";
let isUserActive = true;

let isAdmin = false;

let lib = null;

let projectsLoaded = false;

let projects = [];
let projectsFileHandle = null;

let currentProjectId = null;

let projectModified = false;

let categories = [];

let xmlProjects = dataURL_Library + "welcome.xml";

let xmlVersion = "1.0";
let xmlType = "Server";

let xmlLibraryUser = "";
let xmlCreated = "";

let libraryName = "Sin Nombre";
let libraryDesc = "Descripción";

let k = "admin";

/*==================================================
	IMÁGENES
==================================================*/

let fretboardStyle = "maple";

const fretboardImages = {
	maple: dataURL_Images + "maple.png",
	rosewood: dataURL_Images + "rosewood.png"
};

let neckImageLoaded = false;
const neckImage = new Image();

const brandLogo = document.getElementById("brandLogo");
const footerBrandLogo = document.getElementById("footerBrandLogo");


/*==================================================
	GEOMETRÍA Y MEDIDAS DEL DIAPASÓN
==================================================*/

const HORIZONTAL_WIDTH = 850;
const HORIZONTAL_HEIGHT = 105;
const VERTICAL_WIDTH = HORIZONTAL_HEIGHT;
const VERTICAL_HEIGHT = HORIZONTAL_WIDTH;

const MIN_NECK_LENGTH = 420;
const MAX_NECK_LENGTH = 1320;

const PIXELS_PER_FRET = 55;

const marginX = 12;
const marginBottom = 12;

let stringSpace;
let fretSpace;

let boardleft = 12;
let boardtop = 12;
let boardright;
let boardbottom;
let boardWidth;
let boardHeight;

let imageLeft;
let imageTop;
let imageWidth;
let imageHeight;

let neckBleed;
let neckRadius;

let fretboardBackground = null;
let fretboardPlaybackBackground = null;

let fitCanvasWidth = false;


/*==================================================
	NOTAS
==================================================*/

let noteOrder = 0;

let sequenceIndex = 0;

let hoverCell = null;
let hoverNut = null;

let notes = [];
let nutNotes = Array(stringCount).fill(null); //array con una posición por cada cuerda
let barreNotes = [];

let aSequence = [];
let aChords = [];

let NOTAS = [];
let ACORDES = [];

let history = [];
const maxHistory = 50;

/*==================================================
	PLAYER y SCORE
==================================================*/

const EVENT_X_TOLERANCE = 12;
const SCORE_SYSTEM_Y_TOLERANCE = 150;
const SCORE_PROGRESS_BAR_WIDTH = 2;
const SCORE_PROGRESS_BAR_MARGIN = 8;

let scoreSystems = [];
let scoreEvents = [];
let scoreEventIndex = 0;
let scoreSvg = null;
let scoreIsReady = false;
let scoreProgressBar = null;
let scoreCurrentSystem = -1;
const scoreNoteColor = "blue";
const scoreScrollColor = "green";

let scoreArray = [];
let scoreFooter = "www.jazzguitarnomad.com";

let firstTick = true;

let metronome = null;
let player = null;

let instruments = null;
let instrument = null;

let isPlaying = false;
let isPlayingBuffer = false;


/*==================================================
	MULTIMEDIA
==================================================*/

let audioBuffer = null;
let audioPlayer = null;

let recordingStream = null;
let recordingCanvas = null;
let recordingContext = null;

let audioContext = null;
let audioDestination = null;
let microphoneSource = null;

let localStream;
let mediaRecorder;
let recordedChunks = [];

let audioAnalyser = null;
let audioMeterAnimation = null;

let multimediaDirectory = null;

let recordingTime = 0;
let recordingTimer = null;

let camerasInfo = [];

let resources = {

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

let midiData = null;
let midiSynths = [];

/*==================================================
	REFERENCIAS DOM: LAYOUT, LOADING
==================================================*/

const appLayout = document.getElementById("appLayout");

const loadingScreen = document.getElementById("loadingScreen");
const loadingText = document.getElementById("loadingText");
const loadingProgressBar = document.getElementById("loadingProgressBar");
const loadingSpinner = document.getElementById("loadingSpinner");

const appAlert = document.getElementById("appAlert");
const alertIcon = document.getElementById("alertIcon");
const alertMessage = document.getElementById("alertMessage");

let alertTimeout;


/*==================================================
	REFERENCIAS DOM: MENU
==================================================*/

const mainMenu = document.getElementById("mainMenu");

const brand = document.getElementById("brand");
const topBar = document.getElementById("topBar");

const topControlsContainer = document.getElementById("topControlsContainer");

const btnUser = document.getElementById("btnUser");
const txtUserTitle = document.getElementById("txtUserTitle");

const btnProyectos = document.getElementById("btnProyectos");
const btnEdicion = document.getElementById("btnEdicion");
const btnFretboard = document.getElementById("btnFretboard");
const btnPlayer = document.getElementById("btnPlayer");
const btnScore = document.getElementById("btnScore");
const btnMetronome = document.getElementById("btnMetronome");
const btnMultimedia = document.getElementById("btnMultimedia");

const btnProyectosPopup = document.getElementById("btnProyectosPopup");
const btnEdicionPopup = document.getElementById("btnEdicionPopup");
const btnFretboardPopup = document.getElementById("btnFretboardPopup");
const btnPlayerPopup = document.getElementById("btnPlayerPopup");
const btnScorePopup = document.getElementById("btnScorePopup");
const btnMetronomePopup = document.getElementById("btnMetronomePopup");
const btnMultimediaPopup = document.getElementById("btnMultimediaPopup");

const btnMenuSelector = document.getElementById("btnMenuSelector");
const menuPopup = document.getElementById("menuPopup");

const menuSelectorText = document.getElementById("menuSelectorText");
const menuSelectorIcon = document.getElementById("menuSelectorIcon");

const videoInfo = document.getElementById("videoInfo");
const recordingTimeElement = document.getElementById("recordingTime");
const audioMeterLevel = document.getElementById("audioMeterLevel");

/*==================================================
	REFERENCIAS DOM: CONTROLES DEL DIAPASÓN
==================================================*/

const fretboardPicker = document.getElementById("fretboardPicker");
const colorPicker = document.getElementById("colorPicker");
const colorPreview = document.getElementById("colorPreview");
const noteText = document.getElementById("noteText");
const titleText = document.getElementById("titleText");
const chkTitle = document.getElementById("chkTitle");
const chkTitleViewMode = document.getElementById("chkTitleViewMode");
const chkScoreTitle = document.getElementById("chkScoreTitle");
const chkScoreTitleViewMode = document.getElementById("chkScoreTitleViewMode");
const numFrets = document.getElementById("numFrets");
const btnLessFrets = document.getElementById("btnLessFrets");
const btnMoreFrets = document.getElementById("btnMoreFrets");
const sliderFrets = document.getElementById("sliderFrets");
const numberFrets = document.getElementById("numberFrets");
const btnLessNumberFrets = document.getElementById("btnLessNumberFrets");
const btnMoreNumberFrets = document.getElementById("btnMoreNumberFrets");
const chkShowNumber = document.getElementById("chkShowNumber");
const cmbDiapason = document.getElementById("cmbDiapason");
const chkInlays = document.getElementById("chkInlays");


/*==================================================
	REFERENCIAS DOM: GRUPOS DE HERRAMIENTAS
==================================================*/

const topProject = document.getElementById("topProject");
const topCategory = document.getElementById("topCategory");
const topLibrary = document.getElementById("topLibrary");
const topTitle = document.getElementById("topTitle");
const topShare = document.getElementById("topShare");
const topEdit = document.getElementById("topEdit");
const topUndo = document.getElementById("topUndo");
const topColor = document.getElementById("topColor");
const topFrets = document.getElementById("topFrets");
const topNumbers = document.getElementById("topNumbers");
const topFretboard = document.getElementById("topFretboard");
const topView = document.getElementById("topView");
const topOrientation = document.getElementById("topOrientation");
const topMidi = document.getElementById("topMidi");
const topPlayStop = document.getElementById("topPlayStop");
const topMetronome = document.getElementById("topMetronome");
const topTempo = document.getElementById("topTempo");
const topType = document.getElementById("topType");
const topDireccion = document.getElementById("topDireccion");
const topTimeSignature = document.getElementById("topTimeSignature");
const topBuffer = document.getElementById("topBuffer");
const topAudio = document.getElementById("topAudio");
const topVideo = document.getElementById("topVideo");
const topScoreDownload = document.getElementById("topScoreDownload");
const topChords = document.getElementById("topChords");
const topTitleViewMode = document.getElementById("topTitleViewMode");
const topLibraryInfo = document.getElementById("topLibraryInfo");
const topScroll = document.getElementById("topScroll");
const topProjectGuest = document.getElementById("topProjectGuest");

/*==================================================
	REFERENCIAS DOM: BARRA DE HERRAMIENTAS
==================================================*/

const btnEdit = document.getElementById("btnEdit");
const btnBarre = document.getElementById("btnBarre");
const btnErase = document.getElementById("btnErase");
const btnUndo = document.getElementById("btnUndo");
const btnDisplay = document.getElementById("btnDisplay");
const btnRotate = document.getElementById("btnRotate");
const chkFretboardZoom = document.getElementById("chkFretboardZoom");

/*==================================================
	REFERENCIAS DOM: PROYECTOS
==================================================*/

const btnNewUser = document.getElementById("btnNewUser");
const btnCreate = document.getElementById("btnCreate");
const btnOpen = document.getElementById("btnOpen");
const btnNewProject = document.getElementById("btnNewProject");
const btnNewProjectGuest = document.getElementById("btnNewProjectGuest");
const btnSaveProject = document.getElementById("btnSaveProject");
const btnDelProject = document.getElementById("btnDelProject");
const btnShare = document.getElementById("btnShare");
const btnCopyCanvas = document.getElementById("btnCopyCanvas");
const btnDownloadCanvas = document.getElementById("btnDownloadCanvas");
const topFretboardDownload = document.getElementById("topFretboardDownload");
const chordProjectList = document.getElementById("chordProjectList");
const scaleProjectList = document.getElementById("scaleProjectList");
const otherProjectList = document.getElementById("otherProjectList");
const cmbProjectCategory = document.getElementById("cmbProjectCategory");
const btnNewCategory = document.getElementById("btnNewCategory");
const btnDelCategory = document.getElementById("btnDelCategory");
const projectPanelInfo = document.getElementById("projectPanelInfo");
const projectPanelHeaderTitle = document.getElementById("projectPanelHeaderTitle");
const libraryNameText = document.getElementById("libraryNameText");
const libraryDescText = document.getElementById("libraryDescText");
const btnNewChord = document.getElementById("btnNewChord");
const btnDelChord = document.getElementById("btnDelChord");


/*==================================================
	REFERENCIAS DOM: WORKSPACE
==================================================*/

const workspace = document.getElementById("workspace");
const canvas = document.getElementById("workspaceCanvas");
const ctx = canvas.getContext("2d");

const cursor = document.getElementById("cursorTool");

const workspaceMultimedia = document.getElementById("workspaceMultimedia");
const workspaceFretboard = document.getElementById("workspaceFretboard");
const workspaceScore = document.getElementById("workspaceScore");
const workspaceProjectsPanel = document.getElementById("workspaceProjectsPanel");
const workspaceTitleText = document.getElementById("workspaceTitleText");

const btnPlayStop = document.getElementById("btnPlayStop");
const btnShowProjectPanel = document.getElementById("btnShowProjectPanel");
const btnFretboardVisible = document.getElementById("btnFretboardVisible");
const btnScoreVisible = document.getElementById("btnScoreVisible");
const btnVertical = document.getElementById("btnVertical");
const btnHorizontal = document.getElementById("btnHorizontal");


/*==================================================
	REFERENCIAS DOM: PLAYER y PARTITURA
==================================================*/

const scoreFloatingStopButton = document.getElementById("scoreFloatingStopButton");

const btnLessTempo = document.getElementById("btnLessTempo");
const btnMoreTempo = document.getElementById("btnMoreTempo");
const numBpm = document.getElementById("numBpm");
const btnTime4 = document.getElementById("btnTime4");
const btnTime3 = document.getElementById("btnTime3");

const btnScoreDownloadImage = document.getElementById("btnScoreDownloadImage");
const cmbChords = document.getElementById("cmbChords");

const cmbNoteNames = document.getElementById("cmbNoteNames");
const chkNoteNames = document.getElementById("chkNoteNames");
const chkNoteAccidentals = document.getElementById("chkNoteAccidentals");

const cmbProjectType = document.getElementById("cmbProjectType");
const cmbFretboardType = document.getElementById("cmbFretboardType");
const cmbFretboardTypeGuest = document.getElementById("cmbFretboardTypeGuest");
const cmbTipoSecuencia = document.getElementById("cmbTipoSecuencia");
const chkDireccion = document.getElementById("chkDireccion");

const cmbBar = document.getElementById("cmbBar");
const cmbFigure = document.getElementById("cmbFigure");
const cmbKey = document.getElementById("cmbKey");

const sliderBpm = document.getElementById("sliderBpm");

const samplerGate = document.getElementById("samplerGate");

const workspaceTimeInfo = document.getElementById("workspaceTimeInfo");
const workspaceMetronome = document.getElementById("workspaceMetronome");
const player_repeatInfo = document.getElementById("player_repeatInfo");
const metronome_Info = document.getElementById("metronome_Info");

const cmbCountIn = document.getElementById("cmbCountIn");

const cmbPlayerRepeats = document.getElementById("cmbPlayerRepeats");

const chkPlayerSwing = document.getElementById("chkPlayerSwing");

const cmbSamplerInstrument = document.getElementById("cmbSamplerInstrument");
const sliderSamplerVolume = document.getElementById("samplerVolume");

const btnPlayStopMetronome = document.getElementById("btnPlayStopMetronome");
const metronome_timeline = document.getElementById("metronome_timeline");
const sliderMetronomeVolumen = document.getElementById("sliderMetronomeVolumen");
const sliderMetronomeVolumen_2 = document.getElementById("sliderMetronomeVolumen_2");
const chkMetronomeOn = document.getElementById("chkMetronomeOn");
const chkMetronomeBeatSound = document.getElementById("chkMetronomeBeatSound");

const chkAutoScroll = document.getElementById("chkAutoScroll");

const vexTab_container = document.querySelector(".vextab-auto");

const cmbScoreScale = document.getElementById("cmbScoreScale");
const sliderScoreZoom = document.getElementById("sliderScoreZoom");
const cmbScoreStaves = document.getElementById("cmbScoreStaves");
const cmbScoreLayout = document.getElementById("cmbScoreLayout");
const sliderScoreStaveDistance = document.getElementById("sliderScoreStaveDistance");
const sliderScoreStaveMargin = document.getElementById("sliderScoreStaveMargin");

const chkEditSound = document.getElementById("chkEditSound");

/*==================================================
	REFERENCIAS DOM: MULTIMEDIA
==================================================*/

const btnRenderBuffer = document.getElementById("btnRenderBuffer");
const player_bufferState = document.getElementById("player_bufferState");
const cmbAudioFormat = document.getElementById("cmbAudioFormat");
const btnSaveAudio = document.getElementById("btnSaveAudio");

const cmbCamera = document.getElementById("cmbCamera");
const cmbResolucion = document.getElementById("cmbResolucion");
const cmbMicrophone = document.getElementById("cmbMicrophone");

const btnAbrirVideo = document.getElementById("btnAbrirVideo");
const btnUploadFile = document.getElementById("btnUploadFile");

const videoContainer = document.getElementById("videoContainer");
const btnAudioMute = document.getElementById("btnAudioMute");
const btnVideoMute = document.getElementById("btnVideoMute");
const btnVideoRecord = document.getElementById("btnVideoRecord");
const btnVideoMirror = document.getElementById("btnVideoMirror");
const btnVideoClose = document.getElementById("btnVideoClose");

const localVideo = document.getElementById("localVideo");

const videoTitle = document.getElementById("videoTitle");

/*==================================================
	INSTRUMENTOS
==================================================*/

const instrumentDefs = {

    ////////////////////////////////////////////////////////////
    // PIANO SALAMANDER
    ////////////////////////////////////////////////////////////

    piano: {

        urls: {

            A0: "A0.mp3",

            C1: "C1.mp3",
            "D#1": "Ds1.mp3",
            "F#1": "Fs1.mp3",
            A1: "A1.mp3",

            C2: "C2.mp3",
            "D#2": "Ds2.mp3",
            "F#2": "Fs2.mp3",
            A2: "A2.mp3",

            C3: "C3.mp3",
            "D#3": "Ds3.mp3",
            "F#3": "Fs3.mp3",
            A3: "A3.mp3",

            C4: "C4.mp3",
            "D#4": "Ds4.mp3",
            "F#4": "Fs4.mp3",
            A4: "A4.mp3",

            C5: "C5.mp3",
            "D#5": "Ds5.mp3",
            "F#5": "Fs5.mp3",
            A5: "A5.mp3",

            C6: "C6.mp3",
            "D#6": "Ds6.mp3",
            "F#6": "Fs6.mp3",
            A6: "A6.mp3",

            C7: "C7.mp3",
            "D#7": "Ds7.mp3",
            "F#7": "Fs7.mp3",
            A7: "A7.mp3",

            C8: "C8.mp3"

        },

        release: 0.05,

        baseUrl: dataURL_Samples + "piano/"

    },

    ////////////////////////////////////////////////////////////
    // GUITARRA CLÁSICA
    ////////////////////////////////////////////////////////////

    cguitar: {

        urls: {

            E2: "E2.mp3",
            G2: "G2.mp3",
            A2: "A2.mp3",
            C3: "C3.mp3",
            D3: "D3.mp3",

            E3: "E3.mp3",
            G3: "G3.mp3",
            A3: "A3.mp3",
            C4: "C4.mp3",
            D4: "D4.mp3",

            E4: "E4.mp3",
            G4: "G4.mp3",
            A4: "A4.mp3",
            C5: "C5.mp3",
            D5: "D5.mp3",

            E5: "E5.mp3",
            G5: "G5.mp3",
            A5: "A5.mp3",
            C6: "C6.mp3",

            E6: "E6.mp3"

        },

        release: 0.10,

        baseUrl: dataURL_Samples + "cguitar/"

    }

};

const fretboardMapNotes = [
  // 1ª cuerda (E4)
  ["E4","F4","F#4","G4","G#4","A4","A#4","B4","C5","C#5","D5","D#5","E5","F5","F#5","G5","G#5","A5","A#5","B5","C6","C#6","D6","D#6","E6"],

  // 2ª cuerda (B3)
  ["B3","C4","C#4","D4","D#4","E4","F4","F#4","G4","G#4","A4","A#4","B4","C5","C#5","D5","D#5","E5","F5","F#5","G5","G#5","A5","A#5","B5"],

  // 3ª cuerda (G3)
  ["G3","G#3","A3","A#3","B3","C4","C#4","D4","D#4","E4","F4","F#4","G4","G#4","A4","A#4","B4","C5","C#5","D5","D#5","E5","F5","F#5","G5"],

  // 4ª cuerda (D3)
  ["D3","D#3","E3","F3","F#3","G3","G#3","A3","A#3","B3","C4","C#4","D4","D#4","E4","F4","F#4","G4","G#4","A4","A#4","B4","C5","C#5","D5"],

  // 5ª cuerda (A2)
  ["A2","A#2","B2","C3","C#3","D3","D#3","E3","F3","F#3","G3","G#3","A3","A#3","B3","C4","C#4","D4","D#4","E4","F4","F#4","G4","G#4","A4"],

  // 6ª cuerda (E2)
  ["E2","F2","F#2","G2","G#2","A2","A#2","B2","C3","C#3","D3","D#3","E3","F3","F#3","G3","G#3","A3","A#3","B3","C4","C#4","D4","D#4","E4"]
];

const fretboardMapNotesFlats = [
  // 1ª cuerda (E4)
  ["E4","F4","Gb4","G4","Ab4","A4","Bb4","B4","C5","Db5","D5","Eb5","E5","F5","Gb5","G5","Ab5","A5","Bb5","B5","C6","Db6","D6","Eb6","E6"],

  // 2ª cuerda (B3)
  ["B3","C4","Db4","D4","Eb4","E4","F4","Gb4","G4","Ab4","A4","Bb4","B4","C5","Db5","D5","Eb5","E5","F5","Gb5","G5","Ab5","A5","Bb5","B5"],

  // 3ª cuerda (G3)
  ["G3","Ab3","A3","Bb3","B3","C4","Db4","D4","Eb4","E4","F4","Gb4","G4","Ab4","A4","Bb4","B4","C5","Db5","D5","Eb5","E5","F5","Gb5"],

  // 4ª cuerda (D3)
  ["D3","Eb3","E3","F3","Gb3","G3","Ab3","A3","Bb3","B3","C4","Db4","D4","Eb4","E4","F4","Gb4","G4","Ab4","A4","Bb4","B4","C5","Db5","D5"],

  // 5ª cuerda (A2)
  ["A2","Bb2","B2","C3","Db3","D3","Eb3","E3","F3","Gb3","G3","Ab3","A3","Bb3","B3","C4","Db4","D4","Eb4","E4","F4","Gb4","G4","Ab4","A4"],

  // 6ª cuerda (E2)
  ["E2","F2","Gb2","G2","Ab2","A2","Bb2","B2","C3","Db3","D3","Eb3","E3","F3","Gb3","G3","Ab3","A3","Bb3","B3","C4","Db4","D4","Eb4","E4"]
];

const scales = {

	"C":  ["C",  "D",  "E",  "F",  "G",  "A",  "B"],
	"Db": ["Db", "Eb", "F",  "Gb", "Ab", "Bb", "C"],
	"D":  ["D",  "E",  "F#", "G",  "A",  "B",  "C#"],
	"Eb": ["Eb", "F",  "G",  "Ab", "Bb", "C",  "D"],
	"E":  ["E",  "F#", "G#", "A",  "B",  "C#", "D#"],
	"F":  ["F",  "G",  "A",  "Bb", "C",  "D",  "E"],
	"Gb": ["Gb", "Ab", "Bb", "Cb", "Db", "Eb", "F"],
	"G":  ["G",  "A",  "B",  "C",  "D",  "E",  "F#"],
	"Ab": ["Ab", "Bb", "C",  "Db", "Eb", "F",  "G"],
	"A":  ["A",  "B",  "C#", "D",  "E",  "F#", "G#"],
	"Bb": ["Bb", "C",  "D",  "Eb", "F",  "G",  "A"],
	"B":  ["B",  "C#", "D#", "E",  "F#", "G#", "A#"]

};
//scales["D"][0] // ->"D"
