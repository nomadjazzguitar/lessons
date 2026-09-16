
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

	projectPanel.querySelector(".projectOpenButton.active")?.classList.remove("active");

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

	fretboardType = project.fretboardType ?? "sequence";


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

		for (const type of Object.keys(resources)) {

			if (Array.isArray(project.resources[type])) {

				resources[type] = project.resources[type].map(resource => ({

					name: resource.name || ""

				}));

			}

		}

	}


	// --------------------------------
	// CONFIGURACION APP
	// --------------------------------

	resetControlsValues("loadProject");

}

function parseProjectsXml(xml) {

	xmlVersion = xml.querySelector("projects")?.getAttribute("version") || "1.0";
	xmlLibraryUser = xml.querySelector("projects")?.getAttribute("user") || "";
	xmlCreated = xml.querySelector("projects")?.getAttribute("created") || "";

	libraryName = xml.querySelector("projects")?.getAttribute("name") || "Sin Nombre";
	libraryNameText.value = libraryName;

	libraryDesc = xml.querySelector("projects")?.getAttribute("desc") || "";
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

			if (!node) {

				return fallback;

			}

			const value = node.textContent.trim();

			if (typeof fallback === "boolean") {

				return value === "true";

			}

			if (typeof fallback === "number") {

				const number = Number(value);

				return Number.isNaN(number) ? fallback : number;

			}

			return value;

		};

		const project = {

			id: projectNode.getAttribute("id") || "",

			title: projectNode.getAttribute("title") || "",

			category: projectNode.getAttribute("category"),

			projectType: projectNode.getAttribute("projectType"),

			fretboardType: projectNode.getAttribute("fretboardType"),

			settings: {

				orientation: getSetting("orientation","horizontal"),
				fretboardStyle: getSetting("fretboardStyle","maple"),
				fretCount: parseInt(getSetting("fretCount","10")),
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
				order: noteNode.getAttribute("order") || 0

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
				order: barreNode.getAttribute("order") || 0

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
				order: nutNode.getAttribute("order") || 0

			});

		});


		// --------------------------------
		// RECURSOS MULTIMEDIA
		// --------------------------------

		projectNode.querySelectorAll("resources > resource").forEach(resourceNode => {

			const type = resourceNode.getAttribute("type") || "";

			if (!project.resources[type]) return;

			project.resources[type].push({

				name: resourceNode.getAttribute("name") || ""

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

		projectType: cmbProjectType.value,

		fretboardType: cmbFretboardType.value,

		settings: {
			orientation: orientation,
			fretboardStyle: cmbDiapason.value,
			fretCount: numberFrets.value,
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
			fretNumbers: numFrets.value,
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

					name: resource.name || ""

				}))

			])

		)

	};

}

function projectToXml(project, indent = "\t") {

	const lines = [];

	lines.push(
		`${indent}<project ` +
		`id="${escapeXml(project.id)}" ` +
		`title="${escapeXml(project.title)}" ` +
		`category="${escapeXml(project.category)}" ` +
		`projectType="${escapeXml(project.projectType)}" ` +
		`fretboardType="${escapeXml(project.fretboardType)}">`
	);

	if (project.projectType === "fretboard") {

		lines.push(`${indent}\t<settings>`);
		lines.push(`${indent}\t\t<orientation>${escapeXml(project.settings.orientation)}</orientation>`);
		lines.push(`${indent}\t\t<fretboardStyle>${escapeXml(project.settings.fretboardStyle)}</fretboardStyle>`);
		lines.push(`${indent}\t\t<fretCount>${project.settings.fretCount}</fretCount>`);
		lines.push(`${indent}\t\t<displayMode>${escapeXml(project.settings.displayMode)}</displayMode>`);
		lines.push(`${indent}\t\t<inlays>${project.settings.inlays}</inlays>`);
		lines.push(`${indent}\t\t<rotated>${project.settings.rotated}</rotated>`);
		lines.push(`${indent}\t\t<bar>${escapeXml(project.settings.bar)}</bar>`);
		lines.push(`${indent}\t\t<scoreScale>${escapeXml(project.settings.scoreScale)}</scoreScale>`);
		lines.push(`${indent}\t\t<tipoSecuencia>${escapeXml(project.settings.tipoSecuencia)}</tipoSecuencia>`);
		lines.push(`${indent}\t\t<direccion>${project.settings.direccion}</direccion>`);
		lines.push(`${indent}\t\t<countBars>${project.settings.countBars}</countBars>`);
		lines.push(`${indent}\t\t<repetitionSequence>${project.settings.repetitionSequence}</repetitionSequence>`);
		lines.push(`${indent}\t\t<isFretboardVisible>${project.settings.isFretboardVisible}</isFretboardVisible>`);
		lines.push(`${indent}\t\t<isScoreVisible>${project.settings.isScoreVisible}</isScoreVisible>`);
		lines.push(`${indent}\t\t<currentInstrument>${escapeXml(project.settings.currentInstrument)}</currentInstrument>`);
		lines.push(`${indent}\t\t<fretNumbers>${project.settings.fretNumbers}</fretNumbers>`);
		lines.push(`${indent}\t\t<showFretNumbers>${project.settings.showFretNumbers}</showFretNumbers>`);
		lines.push(`${indent}\t\t<bpm>${project.settings.bpm}</bpm>`);
		lines.push(`${indent}\t\t<key>${escapeXml(project.settings.key)}</key>`);
		lines.push(`${indent}\t\t<scoreStaves>${escapeXml(project.settings.scoreStaves)}</scoreStaves>`);
		lines.push(`${indent}\t\t<scoreLayout>${escapeXml(project.settings.scoreLayout)}</scoreLayout>`);
		lines.push(`${indent}\t\t<swing>${project.settings.swing}</swing>`);
		lines.push(`${indent}\t\t<metronomeOn>${project.settings.metronomeOn}</metronomeOn>`);
		lines.push(`${indent}\t\t<notation>${escapeXml(project.settings.notation)}</notation>`);
		lines.push(`${indent}\t</settings>`);

	} else {

		lines.push(`${indent}\t<settings/>`);

	}


	// --------------------------------
	// NOTAS
	// --------------------------------

	if (project.notes && project.notes.length > 0) {

		lines.push(`${indent}\t<notes>`);

		project.notes.forEach(note => {

			lines.push(
				`${indent}\t\t<note ` +
				`string="${note.string}" ` +
				`fret="${note.fret}" ` +
				`color="${escapeXml(note.color)}" ` +
				`text="${escapeXml(note.text)}" ` +
				`chord="${escapeXml(note.chord)}" ` +
				`order="${escapeXml(note.order)}"/>`
			);

		});

		lines.push(`${indent}\t</notes>`);

	} else {

		lines.push(`${indent}\t<notes/>`);

	}


	// --------------------------------
	// BARRAS
	// --------------------------------

	if (project.barres && project.barres.length > 0) {

		lines.push(`${indent}\t<barres>`);

		project.barres.forEach(barre => {

			lines.push(
				`${indent}\t\t<barre ` +
				`fret="${barre.fret}" ` +
				`startString="${barre.startString}" ` +
				`color="${escapeXml(barre.color)}" ` +
				`text="${escapeXml(barre.text)}" ` +
				`chord="${escapeXml(barre.chord)}" ` +
				`order="${escapeXml(barre.order)}"/>`
			);

		});

		lines.push(`${indent}\t</barres>`);

	} else {

		lines.push(`${indent}\t<barres/>`);

	}


	// --------------------------------
	// NOTAS DE CEJILLA
	// --------------------------------

	if (project.nutNotes && project.nutNotes.length > 0) {

		lines.push(`${indent}\t<nutNotes>`);

		project.nutNotes.forEach(note => {

			lines.push(
				`${indent}\t\t<nutNote ` +
				`string="${note.string}" ` +
				`color="${escapeXml(note.color)}" ` +
				`text="${escapeXml(note.text)}" ` +
				`chord="${escapeXml(note.chord)}" ` +
				`order="${escapeXml(note.order)}"/>`
			);

		});

		lines.push(`${indent}\t</nutNotes>`);

	} else {

		lines.push(`${indent}\t<nutNotes/>`);

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

		lines.push(`${indent}\t<resources>`);

		resourceTypes.forEach(type => {

			if (!Array.isArray(project.resources[type])) return;

			project.resources[type].forEach(resource => {

				lines.push(
					`${indent}\t\t<resource ` +
					`type="${escapeXml(type)}" ` +
					`name="${escapeXml(resource.name || "")}" />`
				);

			});

		});

		lines.push(`${indent}\t</resources>`);

	} else {

		lines.push(`${indent}\t<resources/>`);

	}


	lines.push(`${indent}</project>`);

	return lines.join("\n");

}

function writeXMLProjects() {

	const today = new Date();
	const date = String(today.getDate()).padStart(2, "0") + "/" + String(today.getMonth() + 1).padStart(2, "0") + "/" + today.getFullYear();

	const lines = [];

	xmlVersion = (parseFloat(xmlVersion) + 0.1).toFixed(1);

	lines.push('<?xml version="1.0" encoding="UTF-8"?>');
	lines.push(
		'<projects ' +
		`version="${escapeXml(xmlVersion)}" ` +
		`user="${escapeXml(xmlLibraryUser)}" ` +
		`created="${escapeXml(xmlCreated)}" ` +
		`modified="${escapeXml(date)}" ` +
		`name="${escapeXml(libraryName)}" ` +
		`desc="${escapeXml(libraryDesc)}">`
	);

	lines.push("");

	// Categorías
	lines.push("\t<categories>");

	categories.forEach(category => {

		lines.push(
			`\t\t<category id="${escapeXml(category.id)}">${escapeXml(category.name)}</category>`
		);

	});

	lines.push("\t</categories>");
	lines.push("");

	// Proyectos
	projects.forEach(project => {

		lines.push(projectToXml(project));
		lines.push("");

	});

	lines.push("</projects>");

	return lines.join("\n");

}

async function openXMLProjectsFile() {

	try {

		if (!window.showOpenFilePicker) {

			alert("Tu navegador no permite editar directamente el XML. Al guardar se descargará " + xmlProjects);

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

		projectsFileHandle = fileHandle;

		xmlProjects = fileHandle.name;


		// --------------------------------
		// LEER ARCHIVO
		// --------------------------------

		const file = await fileHandle.getFile();

		const xmlText = await file.text();


		// --------------------------------
		// PARSEAR XML
		// --------------------------------

		const xml = parseXML(xmlText);

		const loadedProjects = parseProjectsXml(xml);


		// --------------------------------
		// REEMPLAZAR PROYECTOS
		// --------------------------------

		projects = loadedProjects;

		projectsLoaded = true;


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

		if (projects.length > 0) {

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

		projects = [];
		projectsLoaded = false;

		return false;

	}

}

function renderLibrary() {

	// Eliminar todas las categorías actuales excepto la cabecera
	projectPanel.querySelectorAll(".projectCategory").forEach(category => category.remove());

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

		projectPanel.appendChild(categoryContainer);

		// --------------------------------
		// PROYECTOS DE LA CATEGORÍA
		// --------------------------------
/*
		const categoryProjects = projects
			.filter(project => project.category === category.id)
			.sort((a, b) =>
				a.title.localeCompare(
					b.title,
					"es",
					{sensitivity: "base"}
				)
			);
*/

		const categoryProjects = projects.filter(project => project.category === category.id);

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
					Array.isArray(project.resources[type]) &&
					project.resources[type].length > 0
				)
/*
				.map(type => type === "pdf" ? "document" : type)
				.filter((type, index, array) => array.indexOf(type) === index);
*/

			if (resourceTypes.length > 1) {

				iType = "<i class='fa-solid fa-photo-film'></i>";

			} else {

				switch (project.projectType){

					case "fretboard":
						iType = "<i class='fa-solid fa-guitar'></i>";
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

			const currentProject = projects.find(item => item.id === project.id);

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

	const existingIndex = projects.findIndex(
		existing => existing.id === project.id
	);

	if (existingIndex >= 0) {

		projects[existingIndex] = project;

	} else {

		projects.push(project);

	}

	const saved = await saveProjectsFile();

	if (saved) {

		projectModified = false;

		renderLibrary();

		setLibraryInfo(xmlProjects.substring(xmlProjects.indexOf("/") + 1));

		openProjectCategory(project.category);

		showAlert("Proyecto guardado correctamente.", "success");

	}

	return saved;

}

async function saveProjectsFile() {

	const xmlText = writeXMLProjects();

	// Chrome / Edge: guardar en el archivo elegido.
	if (projectsFileHandle) {

		try {

			const writable = await projectsFileHandle.createWritable();

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

		downloadBlob(blob,xmlProjects.substring(xmlProjects.lastIndexOf("/") + 1));

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

	const project = projects.find(p => p.id === id);

	if (!project) return;

	if (!confirm(`¿Eliminar el proyecto "${project.title}"?`)) {
		return;
	}

	// Eliminar del array
	projects = projects.filter(p => p.id !== id);

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

	const categoryProjects = projects.filter(
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
		const openedProject = projects.find(
			project => project.id === currentProjectId
		);

		if (openedProject && openedProject.category === categoryId) {
			newProject();
		}

		// Eliminar los proyectos de la categoría
		projects = projects.filter(
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

		if (projectType !== "fretboard"){
			if (menuOpen !== "edit") setMenu("edit");
		}else{
			if (menuOpen !== "metronome") setMenu("metronome");
		}

	}

}

function createLibrary(fileName,usuario = "") {

	const today = new Date();
	const date = String(today.getDate()).padStart(2, "0") + "/" + String(today.getMonth() + 1).padStart(2, "0") + "/" + today.getFullYear();

	const lines = [];

	lines.push('<?xml version="1.0" encoding="UTF-8"?>');

	lines.push(
		`<projects ` +
		`version="1.0" ` +
		`user="${escapeXml(usuario)}" ` +
		`created="${escapeXml(date)}" ` +
		`modified="" ` +
		`name="${escapeXml(fileName)}" ` +
		`desc="">`
	);

	lines.push(`</projects>`);

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

	projectPanelHeaderTitle.textContent = libraryName === "" ? "Sin Nombre" : libraryName;

	let txtInfo = "";

	if (isAdmin && xmlType === "Server"){
		txtInfo = txtInfo + "<i><a href='";
		txtInfo = txtInfo + xmlProjects + "' target='_blank'>Librería " + fileName.replace(dataURL_Library, "") + "</a></i><br>";
		txtInfo = txtInfo + "</a></i><br>";
	}

	if (libraryDesc !== "") txtInfo = txtInfo + libraryDesc;

	projectPanelInfo.innerHTML = txtInfo;

	if (txtInfo === "") projectPanelInfo.style.display = "none";

}

function getFirstProject() {

	if (!projects || projects.length === 0) {
		return null;
	}

	const firstCategory = getSortedCategories()
		.find(category =>
			projects.some(project => project.category === category.id)
		);

	if (!firstCategory) {
		return null;
	}

	return projects
		.filter(project => project.category === firstCategory.id)
		.sort((a, b) =>
			a.title.localeCompare(b.title, undefined, {
				sensitivity: "base"
			})
		)[0] || null;

}
