
"use strict";

// ==================================================
// PROYECTOS
// ==================================================


function newProject() {

	if (projectModified && isAdmin) {

		if (!confirm("¿Crear un proyecto nuevo? Se perderán los cambios no guardados.")) {
			return false;
		}

	}

	currentProjectId = generateIDKey();

	initializeArrays();

	projectModified = false;

	resetControlsValues("newProject");

	libraryPanel.querySelector(".projectOpenButton.active")?.classList.remove("active");

	showAlert("Nuevo proyecto creado.", "info");

	return true;

}

async function loadProject(project) {

	if (!project) return;

	// --------------------------------
	// DATOS GENERALES
	// --------------------------------

	projectModified = false;

	currentProjectId = project.id ?? "";

	projectTitle = project.title ?? "";

	cmbProjectCategory.value = project.category ?? 1;

	if (cmbProjectCategory.value !== project.category && categories.length > 0) {
		cmbProjectCategory.value = categories[0].id;
	}

	projectType = project.projectType ?? "fretboard";

	fretboardType = project.fretboardType === "" ? "sequence" : project.fretboardType;

	// --------------------------------
	// SETTINGS
	// --------------------------------

	fretCount = Math.max(5, Math.min(24, project.settings?.fretCount ?? 10));
	displayMode = parseBoolean(project.settings?.displayMode, true);
	inlays = parseBoolean(project.settings?.inlays, false);
	orientation = project.settings?.orientation ?? "vertical";
	rotated = parseBoolean(project.settings?.rotated, false);
	fretboardStyle = project.settings?.fretboardStyle ?? "maple";

	projectBar = project.settings?.bar ?? "4/4";
	cmbBar.value = projectBar;

	getBarGroups();
	setBarGroups();

	scoreScale = project.settings?.scoreScale;
	tipoSecuencia = project.settings?.tipoSecuencia ?? "up";
	direccion = parseBoolean(project.settings?.direccion, false);
	countBars = project.settings?.countBars ?? 0;
	repetitionSequence = project.settings?.repetitionSequence ?? 2;
	currentInstrument = project.settings?.currentInstrument ?? "piano";
	fretNumbers = project.settings?.fretNumbers ?? 1;
	showFretNumbers = parseBoolean(project.settings?.showFretNumbers, false);
	bpm = project.settings?.bpm ?? 90;
	key = project.settings?.key ?? "C";
	scoreStaves = project.settings?.scoreStaves ?? "all";
	scoreLayout = project.settings?.scoreLayout ?? "vertical";
	swing = parseBoolean(project.settings?.swing, false);
	isFretboardVisible = parseBoolean(project.settings?.isFretboardVisible, true);
	isScoreVisible = parseBoolean(project.settings?.isScoreVisible, false);
	metronomeOn = parseBoolean(project.settings?.metronomeOn, true);
	notation = project.settings?.notation ?? "";


	initializeArrays();

	// --------------------------------
	// NOTAS
	// --------------------------------

	notes = (project.notes || []).map(note => ({
		string: note.string,
		fret: note.fret,
		color: note.color,
		text: note.text,
		chord: note.chord,
		order: note.order
	}));


	// --------------------------------
	// BARRAS
	// --------------------------------

	barreNotes = (project.barres || []).map(barre => ({
		fret: barre.fret,
		startString: barre.startString,
		color: barre.color,
		text: barre.text,
		chord: barre.chord,
		order: barre.order
	}));


	// --------------------------------
	// NUT
	// --------------------------------

	(project.nutNotes || []).forEach(note => {

		if (note.string >= 0 && note.string < stringCount) {

			nutNotes[note.string] = {
				color: note.color,
				text: note.text,
				chord: note.chord,
				order: note.order
			};

		}

	});

	noteOrder = getMaxOrder();


	// --------------------------------
	// RECURSOS MULTIMEDIA
	// --------------------------------

	if (project.resources) {

		for (const type of Object.keys(project.resources)) {

			if (Array.isArray(project.resources[type])) {

				resources[type] = project.resources[type].map(resource => ({

					content: resource.content || ""

				}));

			}

		}

	}


	// --------------------------------
	// CONFIGURACION APP
	// --------------------------------

	resetControlsValues("loadProject");

}

function parseLibraryXml(xml) {

	xmlVersion = xml.querySelector("library")?.getAttribute("version") || "1.0";
	xmlLibraryType = xml.querySelector("library")?.getAttribute("type") || "";
	xmlCreated = xml.querySelector("library")?.getAttribute("created") || "";

	libraryName = xml.querySelector("library")?.getAttribute("name") || "Sin Nombre";
	libraryNameText.value = libraryName;

	libraryDesc = xml.querySelector("desc")?.textContent.trim() || "";
	libraryDescText.value = libraryDesc;

	categories = [];

	const categoryNodes = xml.querySelectorAll("categories > category");

	categoryNodes.forEach(categoryNode => {

		categories.push({

			id: categoryNode.getAttribute("id"),
			name: categoryNode.textContent.trim()

		});

	});

	refreshCategoryList();

	return [...xml.querySelectorAll("project")].map(projectNode => {

		const settingsNode = projectNode.querySelector("settings");

		const getSetting = (name,fallback = "") => {

			const node = settingsNode?.querySelector(name);

			if (!node) return fallback;

			const value = node.textContent.trim();

			if (typeof fallback === "boolean") return value === "true";

			if (typeof fallback === "number") {

				const number = Number(value);

				return Number.isNaN(number) ? fallback : number;

			}

			return value;

		};

		const project = {

			id: projectNode.getAttribute("id") || "",

			title: projectNode.getAttribute("title") || "",

			category: projectNode.getAttribute("category") || "",

			projectType: projectNode.getAttribute("projectType") || "",

			fretboardType: projectNode.getAttribute("fretboardType") || "",

			settings: {

				orientation: getSetting("orientation","horizontal"),
				fretboardStyle: getSetting("fretboardStyle","maple"),
				fretCount: getSetting("fretCount","10"),
				displayMode: getSetting("displayMode","scale"),
				inlays: getSetting("inlays",true),
				rotated: getSetting("rotated",false),
				bar: getSetting("bar","4/4"),
				scoreScale: getSetting("scoreScale","auto"),
				tipoSecuencia: getSetting("tipoSecuencia","up"),
				direccion: getSetting("direccion",false),
				countBars: getSetting("countBars",1),
				repetitionSequence: getSetting("repetitionSequence",1),
				isFretboardVisible: getSetting("isFretboardVisible",true),
				isScoreVisible: getSetting("isScoreVisible",true),
				currentInstrument: getSetting("currentInstrument","piano"),
				fretNumbers: getSetting("fretNumbers",1),
				showFretNumbers: getSetting("showFretNumbers",false),
				bpm: getSetting("bpm",90),
				key: getSetting("key","C"),
				scoreStaves: getSetting("scoreStaves","all"),
				scoreLayout: getSetting("scoreLayout","vertical"),
				swing: getSetting("swing",false),
				metronomeOn: getSetting("metronomeOn",true),
				notation: getSetting("notation","")

			},

			notes: [],
			barres: [],
			nutNotes: [],

			// --------------------------------
			// RECURSOS MULTIMEDIA
			// --------------------------------

			resources: {

				text: [],
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

			}

		};


		// --------------------------------
		// NOTAS
		// --------------------------------

		projectNode.querySelectorAll("notes > note").forEach(noteNode => {

			project.notes.push({

				string: Number(noteNode.getAttribute("string")),
				fret: Number(noteNode.getAttribute("fret")),
				color: noteNode.getAttribute("color") || "#000000",
				text: noteNode.getAttribute("text") || "",
				chord: noteNode.getAttribute("chord") || "",
				order: Number(noteNode.getAttribute("order")) || 0

			});

		});


		// --------------------------------
		// BARRAS
		// --------------------------------

		projectNode.querySelectorAll("barres > barre").forEach(barreNode => {

			project.barres.push({

				fret: Number(barreNode.getAttribute("fret")),
				startString: Number(barreNode.getAttribute("startString")),
				color: barreNode.getAttribute("color") || "#000000",
				text: barreNode.getAttribute("text") || "",
				chord: barreNode.getAttribute("chord") || "",
				order: Number(barreNode.getAttribute("order")) || 0

			});

		});


		// --------------------------------
		// NOTAS DE CEJILLA
		// --------------------------------

		projectNode.querySelectorAll("nutNotes > nutNote").forEach(nutNode => {

			project.nutNotes.push({

				string: Number(nutNode.getAttribute("string")),
				color: nutNode.getAttribute("color") || "#000000",
				text: nutNode.getAttribute("text") || "",
				chord: nutNode.getAttribute("chord") || "",
				order: Number(nutNode.getAttribute("order")) || 0

			});

		});


		// --------------------------------
		// RECURSOS MULTIMEDIA
		// --------------------------------

		projectNode.querySelectorAll("resources > resource").forEach(resourceNode => {

			const type = resourceNode.getAttribute("type") || "";

			if (!project.resources[type]) return;

			project.resources[type].push({

				content: resourceNode.getAttribute("content") || ""

			});

		});


		return project;

	});

}

function getCurrentProject() {

	const projectTitle = titleText.value.trim();

	let notacion = chkNoteNames.checked ? cmbNoteNames.value : "";

	if (!projectTitle) {

		alert("Escribe un título antes de guardar el proyecto.");
		titleText.focus();

		return null;

	}

	return {

		id: currentProjectId,

		title: projectTitle,

		category: cmbProjectCategory.value,

		projectType: cmbProjectType.value === "fretboard" ? "fretboard" : "multimedia",

		fretboardType: cmbProjectType.value === "fretboard" ? cmbFretboardType.value : "",

		settings: {
			orientation: orientation,
			fretboardStyle: cmbDiapason.value,
			fretCount: numFrets.value,
			displayMode: displayMode,
			inlays: chkInlays.checked,
			rotated: rotated,
			bar: cmbBar.value,
			scoreScale: scoreScale,
			tipoSecuencia: cmbTipoSecuencia.value,
			direccion: chkDireccion.checked,
			countBars: cmbCountIn.value,
			repetitionSequence: cmbPlayerRepeats.value,
			isFretboardVisible: isFretboardVisible,
			isScoreVisible: isScoreVisible,
			currentInstrument: cmbSamplerInstrument.value,
			fretNumbers: numberFrets.value,
			showFretNumbers: chkShowNumber.checked,
			bpm: sliderBpm.value,
			key: cmbKey.value,
			scoreStaves: cmbScoreStaves.value,
			scoreLayout: cmbScoreLayout.value,
			swing: chkPlayerSwing.checked,
			metronomeOn: chkMetronomeOn.checked,
			notation: notacion
		},

		notes: notes.map(note => ({
			string: note.string,
			fret: note.fret,
			color: note.color,
			text: note.text,
			chord: note.chord,
			order: note.order
		})),

		barres: barreNotes.map(barre => ({
			fret: barre.fret,
			startString: barre.startString,
			color: barre.color,
			text: barre.text,
			chord: barre.chord,
			order: barre.order
		})),

		nutNotes: nutNotes.map((note, string) => {

			if (!note) return null;

			return {
				string,
				color: note.color,
				text: note.text,
				chord: note.chord,
				order: note.order
			};

		}).filter(note => note !== null),

		resources: Object.fromEntries(

			Object.entries(resources).map(([type, resourceList]) => [

				type,

				resourceList.map(resource => ({

					content: resource.content || ""

				}))

			])

		)

	};

}

function projectToXml(project) {

	const lines = [];

	lines.push(
		`\t<project ` +
		`id="${escapeXml(project.id)}" ` +
		`title="${escapeXml(project.title)}" ` +
		`category="${escapeXml(project.category)}" ` +
		`projectType="${escapeXml(project.projectType)}" ` +
		`fretboardType="${escapeXml(project.fretboardType)}">`
	);

	if (project.projectType === "fretboard") {

		lines.push(`\t\t<settings>`);
		lines.push(`\t\t\t<orientation>${escapeXml(project.settings.orientation)}</orientation>`);
		lines.push(`\t\t\t<fretboardStyle>${escapeXml(project.settings.fretboardStyle)}</fretboardStyle>`);
		lines.push(`\t\t\t<fretCount>${project.settings.fretCount}</fretCount>`);
		lines.push(`\t\t\t<displayMode>${escapeXml(project.settings.displayMode)}</displayMode>`);
		lines.push(`\t\t\t<inlays>${project.settings.inlays}</inlays>`);
		lines.push(`\t\t\t<rotated>${project.settings.rotated}</rotated>`);
		lines.push(`\t\t\t<bar>${escapeXml(project.settings.bar)}</bar>`);
		lines.push(`\t\t\t<scoreScale>${escapeXml(project.settings.scoreScale)}</scoreScale>`);
		lines.push(`\t\t\t<tipoSecuencia>${escapeXml(project.settings.tipoSecuencia)}</tipoSecuencia>`);
		lines.push(`\t\t\t<direccion>${project.settings.direccion}</direccion>`);
		lines.push(`\t\t\t<countBars>${project.settings.countBars}</countBars>`);
		lines.push(`\t\t\t<repetitionSequence>${project.settings.repetitionSequence}</repetitionSequence>`);
		lines.push(`\t\t\t<isFretboardVisible>${project.settings.isFretboardVisible}</isFretboardVisible>`);
		lines.push(`\t\t\t<isScoreVisible>${project.settings.isScoreVisible}</isScoreVisible>`);
		lines.push(`\t\t\t<currentInstrument>${escapeXml(project.settings.currentInstrument)}</currentInstrument>`);
		lines.push(`\t\t\t<fretNumbers>${project.settings.fretNumbers}</fretNumbers>`);
		lines.push(`\t\t\t<showFretNumbers>${project.settings.showFretNumbers}</showFretNumbers>`);
		lines.push(`\t\t\t<bpm>${project.settings.bpm}</bpm>`);
		lines.push(`\t\t\t<key>${escapeXml(project.settings.key)}</key>`);
		lines.push(`\t\t\t<scoreStaves>${escapeXml(project.settings.scoreStaves)}</scoreStaves>`);
		lines.push(`\t\t\t<scoreLayout>${escapeXml(project.settings.scoreLayout)}</scoreLayout>`);
		lines.push(`\t\t\t<swing>${project.settings.swing}</swing>`);
		lines.push(`\t\t\t<metronomeOn>${project.settings.metronomeOn}</metronomeOn>`);
		lines.push(`\t\t\t<notation>${escapeXml(project.settings.notation)}</notation>`);
		lines.push(`\t\t</settings>`);

	} else {

//		lines.push(`\t\t<settings/>`);

	}


	// --------------------------------
	// NOTAS
	// --------------------------------

	if (project.notes && project.notes.length > 0) {

		lines.push(`\t\t<notes>`);

		project.notes.forEach(note => {

			lines.push(
				`\t\t\t<note ` +
				`string="${note.string}" ` +
				`fret="${note.fret}" ` +
				`color="${escapeXml(note.color)}" ` +
				`text="${escapeXml(note.text)}" ` +
				`chord="${escapeXml(note.chord)}" ` +
				`order="${escapeXml(note.order)}"/>`
			);

		});

		lines.push(`\t\t</notes>`);

	} else {

//		lines.push(`\t\t<notes/>`);

	}


	// --------------------------------
	// BARRAS
	// --------------------------------

	if (project.barres && project.barres.length > 0) {

		lines.push(`\t\t<barres>`);

		project.barres.forEach(barre => {

			lines.push(
				`\t\t\t<barre ` +
				`fret="${barre.fret}" ` +
				`startString="${barre.startString}" ` +
				`color="${escapeXml(barre.color)}" ` +
				`text="${escapeXml(barre.text)}" ` +
				`chord="${escapeXml(barre.chord)}" ` +
				`order="${escapeXml(barre.order)}"/>`
			);

		});

		lines.push(`\t\t</barres>`);

	} else {

//		lines.push(`\t\t<barres/>`);

	}


	// --------------------------------
	// NOTAS DE CEJILLA
	// --------------------------------

	if (project.nutNotes && project.nutNotes.length > 0) {

		lines.push(`\t\t<nutNotes>`);

		project.nutNotes.forEach(note => {

			lines.push(
				`\t\t\t<nutNote ` +
				`string="${note.string}" ` +
				`color="${escapeXml(note.color)}" ` +
				`text="${escapeXml(note.text)}" ` +
				`chord="${escapeXml(note.chord)}" ` +
				`order="${escapeXml(note.order)}"/>`
			);

		});

		lines.push(`\t\t</nutNotes>`);

	} else {

//		lines.push(`\t\t<nutNotes/>`);

	}

	// --------------------------------
	// RECURSOS MULTIMEDIA
	// --------------------------------

	const resourceTypes = Object.keys(project.resources || {});

	const hasResources = resourceTypes.some(type =>
		Array.isArray(project.resources[type]) &&
		project.resources[type].length > 0
	);

	if (hasResources) {

		lines.push(`\t\t<resources>`);

		resourceTypes.forEach(type => {

			if (!Array.isArray(project.resources[type])) return;

			project.resources[type].forEach(resource => {

				lines.push(
					`\t\t\t<resource ` +
					`type="${escapeXml(type)}" ` +
					`content="${escapeXml(resource.content || "")}` +
					`"/>`
				);

			});

		});

		lines.push(`\t\t</resources>`);

	} else {

//		lines.push(`\t\t<resources/>`);

	}


	lines.push(`\t</project>`);

	return lines.join("\n");

}

function writeLibraryXML() {

	const today = new Date();
	const date = String(today.getDate()).padStart(2, "0") + "/" + String(today.getMonth() + 1).padStart(2, "0") + "/" + today.getFullYear();

	const lines = [];

	xmlVersion = (parseFloat(xmlVersion) + 0.1).toFixed(1);

	lines.push('<?xml version="1.0" encoding="UTF-8"?>');
	lines.push(
		'<library ' +
		`version="${escapeXml(xmlVersion)}" ` +
		`type="${escapeXml(xmlLibraryType)}" ` +
		`created="${escapeXml(xmlCreated)}" ` +
		`modified="${escapeXml(date)}" ` +
		`name="${escapeXml(libraryName)}">`
	);
//	lines.push("");

	// Descripción
	lines.push("\t<desc>");
	lines.push(`\t\t${escapeXml(libraryDesc)}"`);
	lines.push("\t</desc>");

	// Categorías
	lines.push("\t<categories>");

	categories.forEach(category => {

		lines.push(`\t\t<category id="${escapeXml(category.id)}">${escapeXml(category.name)}</category>`);

	});

	lines.push("\t</categories>");
//	lines.push("");

	// Proyectos
	library.forEach(project => {

		lines.push(projectToXml(project));
//		lines.push("");

	});

	lines.push("</library>");

	return lines.join("\n");

}

async function openLibraryXMLFile() {

	try {

		if (!window.showOpenFilePicker) {

			alert("Tu navegador no permite editar directamente el XML. Al guardar se descargará " + xmlLibrary);

			return false;
		}


		// --------------------------------
		// SELECCIONAR ARCHIVO
		// --------------------------------

		const [fileHandle] =
			await window.showOpenFilePicker({

				types: [{
					description: "Proyectos de Fretboard",
					accept: {"application/xml": [".xml"]}
				}],

				multiple: false

			});


		// --------------------------------
		// GUARDAR HANDLE
		// --------------------------------

		libraryFileHandle = fileHandle;

		xmlLibrary = fileHandle.name;


		// --------------------------------
		// LEER ARCHIVO
		// --------------------------------

		const file = await fileHandle.getFile();

		const xmlText = await file.text();


		// --------------------------------
		// PARSEAR XML
		// --------------------------------

		const xml = parseXML(xmlText);

		const loadedProjects = parseLibraryXml(xml);


		// --------------------------------
		// REEMPLAZAR PROYECTOS
		// --------------------------------

		library = loadedProjects;

		libraryLoaded = true;


		// --------------------------------
		// ACTUALIZAR INFORMACIÓN
		// --------------------------------

		xmlType = "Local";

		setLibraryInfo(fileHandle.name);


		// --------------------------------
		// ABRIR PANEL
		// --------------------------------

		openLibraryPanel();


		// --------------------------------
		// RENDERIZAR LISTA
		// --------------------------------

		renderLibrary();

		// --------------------------------
		// ABRIR PRIMER PROYECTO
		// --------------------------------

		if (library.length > 0) {

			const firstProject = getFirstProject();

			if (firstProject) {

				await selectProject(firstProject);

			} else {

				newProject();

			}

		} else {

			newProject();

		}

		renderProject();

		return true;

	} catch (error) {

		// Cancelar selector de archivos

		if (error.name === "AbortError") {

			return false;

		}

		console.error("Error al abrir la biblioteca de proyectos:",error);

		library = [];
		libraryLoaded = false;

		return false;

	}

}

function renderLibrary() {

	// Eliminar todas las categorías actuales excepto la cabecera
	libraryPanel.querySelectorAll(".projectCategory").forEach(category => category.remove());

	getSortedCategories().forEach(category => {

		// --------------------------------
		// CONTENEDOR DE LA CATEGORÍA
		// --------------------------------

		const categoryContainer = document.createElement("div");

		categoryContainer.className = "projectCategory";


		// --------------------------------
		// BOTÓN DE LA CATEGORÍA
		// --------------------------------

		const categoryButton = document.createElement("button");

		categoryButton.type = "button";
		categoryButton.className = "projectCategoryButton";
		categoryButton.dataset.projectCategory = category.id;
		categoryButton.setAttribute("aria-expanded", "false");

		const title = document.createElement("span");

		title.textContent = category.name;

		const icon = document.createElement("i");

		icon.className = "fa-solid fa-chevron-down";

		categoryButton.appendChild(title);
		categoryButton.appendChild(icon);

		// --------------------------------
		// LISTA DE PROYECTOS
		// --------------------------------

		const list = document.createElement("ul");

		list.className = "projectCategoryList";
		list.id = `projectList_${category.id}`;

		categoryContainer.appendChild(categoryButton);
		categoryContainer.appendChild(list);

		libraryPanel.appendChild(categoryContainer);

		// --------------------------------
		// PROYECTOS DE LA CATEGORÍA
		// --------------------------------
/*
		const categoryProjects = library
			.filter(project => project.category === category.id)
			.sort((a, b) =>
				a.title.localeCompare(
					b.title,
					"es",
					{sensitivity: "base"}
				)
			);
*/

		const categoryProjects = library.filter(project => project.category === category.id);

		categoryProjects.forEach(project => {

			const item = document.createElement("li");

			item.className = "projectItem";

			// --------------------------------
			// BOTÓN ABRIR PROYECTO
			// --------------------------------

			const openButton = document.createElement("button");

			openButton.type = "button";
			openButton.className = "projectOpenButton";
			openButton.dataset.projectId = project.id;
			openButton.title = `Abrir: ${project.title}`;

			if (!isUserActive){

				openButton.disabled = true;

				const iLocker = document.createElement("i");

				iLocker.id = "projectLocked";
				iLocker.className = "fa-solid fa-lock";

				openButton.appendChild(iLocker);
			}

			const titleSpan = document.createElement("span");

			titleSpan.className = "projectTitle";

			let iType = "<i class='fa-solid fa-guitar'></i>";

			const resourceTypes = Object.keys(project.resources)
				.filter(type =>
					Array.isArray(project.resources[type]) && project.resources[type].length > 0
				);

			if (project.projectType === "fretboard") {

				iType = "<i class='fa-solid fa-guitar'></i>";

			} else if (resourceTypes.length > 1) {

				iType = "<i class='fa-solid fa-photo-film'></i>";

			} else if (resourceTypes.length === 1) {

				switch (resourceTypes[0]){

					case "text":
						iType = "<i class='fa-solid fa-file-lines'></i>";
						break;

					case "video":
						iType = "<i class='fa-solid fa-film'></i>";
						break;

					case "audio":
						iType = "<i class='fa-solid fa-compact-disc'></i>";
						break;

					case "image":
						iType = "<i class='fa-solid fa-image'></i>";
						break;

					case "pdf":
						iType = "<i class='fa-solid fa-file-pdf'></i>";
						break;

					case "document":
						iType = "<i class='fa-solid fa-file-lines'></i>";
						break;

					case "midi":
						iType = "<i class='fa-solid fa-file-audio'></i>";
						break;

					case "score":
						iType = "<i class='fa-solid fa-music'></i>";
						break;

					case "html":
						iType = "<i class='fa-solid fa-file-code'></i>";
						break;

					case "link":
						iType = "<i class='fa-solid fa-link'></i>";
						break;

					case "iframe":
						iType = "<i class='fa-solid fa-code'></i>";
						break;

				}

			}

			titleSpan.innerHTML = iType + project.title;

			openButton.appendChild(titleSpan);

			const currentProject = library.find(item => item.id === project.id);

			// Al pulsar, seleccionamos explícitamente
			openButton.addEventListener("click", async () => {

				if (!currentProject) return;

				if (projectModified) {

					if (!confirm("Hay cambios sin guardar que se perderán. ¿Deseas abrir el proyecto?")) {
						return false;
					}

				}

				await selectProject(currentProject);

				renderProject();

				if (isMobile) closeLibraryPanel();

			});

			item.appendChild(openButton);


			// --------------------------------
			// BOTÓN ELIMINAR
			// --------------------------------

			if (isAdmin) {

				const deleteButton = document.createElement("button");

				deleteButton.type = "button";
				deleteButton.className = "projectDeleteButton";
				deleteButton.title = "Eliminar proyecto";

				deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>';

				deleteButton.addEventListener("click", async (e) => {

					e.stopPropagation();

					if (!currentProject) return;

					deleteProject(currentProject.id);

				});

				item.appendChild(deleteButton);
			}

			list.appendChild(item);

		});

	});


	// --------------------------------
	// EVENTOS DE CATEGORÍAS
	// --------------------------------

	setupProjectCategories();


	// --------------------------------
	// ACTUALIZAR PROYECTO SELECCIONADO
	// --------------------------------

	updateSelectedProjectButton();

}

async function selectProject(project) {

	if (!project) return;

	currentProjectId = project.id;

	openProjectCategory(project.category);

	updateSelectedProjectButton();

	await loadProject(project);

}

async function saveCurrentProject() {

	const project = getCurrentProject();

	if (!project) return false;

	const existingIndex = library.findIndex(
		existing => existing.id === project.id
	);

	if (existingIndex >= 0) {

		library[existingIndex] = project;

	} else {

		library.push(project);

	}

	const saved = await saveProjectsFile();

	if (saved) {

		projectModified = false;

		renderLibrary();

		setLibraryInfo(xmlLibrary.substring(xmlLibrary.indexOf("/") + 1));

		openProjectCategory(project.category);

		showAlert("Proyecto guardado correctamente.", "success");

	}

	return saved;

}

async function saveProjectsFile() {

	const xmlText = writeLibraryXML();

	// Chrome / Edge: guardar en el archivo elegido.
	if (libraryFileHandle) {

		try {

			const writable = await libraryFileHandle.createWritable();

			await writable.write(xmlText);
			await writable.close();

			return true;

		} catch (error) {

			showAlert("No se pudo escribir el XML elegido. Se descargará una copia.","error");

		}

	}

	// Alternativa: descargar el archivo.
	try {

		const blob = new Blob(
			[xmlText],
			{type:"application/xml;charset=utf-8"}
		);

		downloadBlob(blob,xmlLibrary.substring(xmlLibrary.lastIndexOf("/") + 1));

		return true;

	} catch (error) {

		showAlert("No se pudo descargar el archivo XML.","error");
		console.log("No se pudo descargar el archivo XML: ",error);

		return false;

	}

}

function downloadBlob(blob, filename) {

	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");

	link.href = url;
	link.download = filename;

	document.body.appendChild(link);

	link.click();
	link.remove();

	URL.revokeObjectURL(url);

}

async function deleteProject(id) {

	const project = library.find(p => p.id === id);

	if (!project) return;

	if (!confirm(`¿Eliminar el proyecto "${project.title}"?`)) {
		return;
	}

	// Eliminar del array
	library = library.filter(p => p.id !== id);

	// Guardar el XML
	saveProjectsFile();

	// Actualizar la lista
	renderLibrary();

	// Crear un proyecto nuevo
	newProject();

	renderProject();

}

function escapeXml(value) {

	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");

}

function generateIDKey() {

//    return crypto.getRandomValues(new BigUint64Array(1))[0].toString();
//    return crypto.getRandomValues(new Uint32Array(1))[0].toString();
//	return (crypto.getRandomValues(new Uint32Array(1))[0] % 10000).toString().padStart(4, "0");
//	return crypto.randomUUID().replaceAll("-", "");

	return crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
}

function updateSelectedProjectButton() {

	document.querySelectorAll(".projectOpenButton")
		.forEach(button => {

			button.classList.toggle("active",button.dataset.projectId === currentProjectId);

		});

}

function setupProjectCategories() {

	const categoryButtons = document.querySelectorAll(".projectCategoryButton");

	categoryButtons.forEach(button => {

		button.addEventListener("click", () => {

			const list = button.nextElementSibling;

			if (!list || !list.classList.contains("projectCategoryList")) {
				return;
			}

			const isOpen = button.getAttribute("aria-expanded") === "true";

			button.setAttribute("aria-expanded",String(!isOpen));

			list.classList.toggle("isOpen", !isOpen);

		});

	});

}

function openProjectCategory(category) {

	const button = document.querySelector(
		`.projectCategoryButton[data-project-category="${category}"]`
	);

	if (!button) {
		return;
	}

	const isOpen = button.getAttribute("aria-expanded") === "true";

	if (!isOpen) {

		button.click();

	}

}

function refreshCategoryList() {

	cmbProjectCategory.innerHTML = "";

	getSortedCategories().forEach(category => {

		const option = document.createElement("option");

		option.value = category.id;
		option.textContent = category.name;

		cmbProjectCategory.appendChild(option);

	});

}

function getSortedCategories() {
	return [...categories].sort((a, b) =>
		a.name.localeCompare(b.name, "es", { sensitivity: "base" })
	);
}

function addCategory() {

	const name = prompt("Nombre de la nueva categoría:");

	if (!name) return;

	const trimmedName = name.trim();

	if (trimmedName === "") return;

	const exists = categories.some(category =>
		category.name.toLowerCase() === trimmedName.toLowerCase()
	);

	if (exists) {

		alert("Ya existe una categoría con ese nombre.");

		return;

	}

	if (!newProject()) return;

	const categoryId = generateIDKey(); //categories.length > 0 ? categories.length + 1 : 1;

	const category = {

		id: categoryId, 
		name: trimmedName

	};

	categories.push(category);

	refreshCategoryList();

	renderLibrary();

	cmbProjectCategory.value = category.id;

	saveProjectsFile();

}

function deleteCategory() {

	if (categories.length <= 1) {

		alert("Debe existir al menos una categoría.");

		return;

	}

	const categoryId = cmbProjectCategory.value;

	const category = categories.find(c => c.id === categoryId);

	if (!category) {
		return;
	}

	const categoryProjects = library.filter(
		project => project.category === categoryId
	);

	if (categoryProjects.length > 0) {

		const message =
			`La categoría "${category.name}" contiene ${categoryProjects.length} proyecto(s).\n\n` +
			`Si continúas, se eliminarán también todos esos proyectos.\n\n` +
			`¿Deseas continuar?`;

		if (!confirm(message)) {
			return;
		}

		// Si el proyecto abierto pertenece a esta categoría, crear uno nuevo
		const openedProject = library.find(
			project => project.id === currentProjectId
		);

		if (openedProject && openedProject.category === categoryId) {
			newProject();
		}

		// Eliminar los proyectos de la categoría
		library = library.filter(
			project => project.category !== categoryId
		);

	} else {

		if (!confirm(`¿Eliminar la categoría "${category.name}"?`)) {
			return;
		}

	}

	// Eliminar la categoría
	categories = categories.filter(
		category => category.id !== categoryId
	);

	refreshCategoryList();

	renderLibrary();

	if (categories.length > 0) {
		cmbProjectCategory.value = categories[0].id;
	}

	saveProjectsFile();

}

async function renderProject(){

	if (projectType !== "fretboard") {

		await renderMultimedia();

	}else{

		setPlayerValues();

		neckImageLoaded = false;

		if (fretboardStyle !== "blank") await loadFretboardImage();

		if (isFretboardVisible) resizeCanvas();

		if (isScoreVisible) scoreRender();

	}

	if (isAdmin) {

		if (menuOpen !== "projects") setMenu("projects");

	}else{
/*
		if (projectType !== "fretboard" && isUserActive){
			if (menuOpen !== "edit") setMenu("edit");
		}else{
*/
			if (menuOpen !== "metronome") setMenu("metronome");
//		}

	}

}

function createLibrary(fileName,type = "") {

	const today = new Date();
	const date = String(today.getDate()).padStart(2, "0") + "/" + String(today.getMonth() + 1).padStart(2, "0") + "/" + today.getFullYear();

	const lines = [];

	lines.push('<?xml version="1.0" encoding="UTF-8"?>');

	lines.push(
		`<library ` +
		`version="1.0" ` +
		`type="${escapeXml(type)}" ` +
		`created="${escapeXml(date)}" ` +
		`modified="" ` +
		`name="${escapeXml(fileName)}" ` +
		`desc="">`
	);

	lines.push(`</library>`);

	const xmlContent = lines.join("\n");

	const blob = new Blob(
		[xmlContent],
		{ type: "application/xml;charset=utf-8" }
	);

	const url = URL.createObjectURL(blob);

	const link = document.createElement("a");

	link.href = url;

	link.download = (usuario === "" ? fileName : usuario) + ".xml";

	document.body.appendChild(link);

	link.click();

	document.body.removeChild(link);

	URL.revokeObjectURL(url);

	return true;

}

function setLibraryInfo(fileName){

	libraryPanelHeaderTitle.textContent = libraryName === "" ? "Sin Nombre" : libraryName;

	let txtInfo = "";

	if (isAdmin && xmlType === "Server"){
		txtInfo = txtInfo + "<i><a href='";
		txtInfo = txtInfo + xmlLibrary + "' target='_blank'>Librería " + fileName.replace(dataURL_Library, "") + "</a></i><br>";
		txtInfo = txtInfo + "</a></i><br>";
	}

	if (libraryDesc !== "") txtInfo = txtInfo + libraryDesc;

	libraryPanelInfo.innerHTML = txtInfo;

	if (txtInfo === "") libraryPanelInfo.style.display = "none";

}

function getFirstProject() {

	if (!library || library.length === 0) {
		return null;
	}

	const firstCategory = getSortedCategories()
		.find(category =>
			library.some(project => project.category === category.id)
		);

	if (!firstCategory) {
		return null;
	}

	return library
		.find(project => project.category === firstCategory.id) || null;

/*
	return library
		.filter(project => project.category === firstCategory.id)
		.sort((a, b) =>
			a.title.localeCompare(b.title, undefined, {
				sensitivity: "base"
			})
		)[0] || null;
*/

}
