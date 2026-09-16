
////////////////////////////////////////////////////////////
// RENDER BUFFER
////////////////////////////////////////////////////////////

async function renderBuffer() {

    if (!player.lastNotes || player.lastNotes.length === 0) {

        alert("No hay nada para renderizar. Pulse Play primero.");

        return false;

    }

    const stepTime = Tone.Time(
        metronome.subdivisionFigure()
    ).toSeconds();

    if (player.lastMode === "sequence") {

        audioBuffer = await renderSequence(

            instrumentDefs[currentInstrument],

            player.lastNotes,

            stepTime,

            player.gate,

            player.repeticiones,

            player.countInBars

        );

    } else {

        audioBuffer = await renderChord(

            instrumentDefs[currentInstrument],

            player.lastNotes,

            stepTime,

            player.gate,

            player.repeticiones,

            player.countInBars

        );

    }

    console.log("Buffer generado");

    console.log(audioBuffer);

}


function PlayStopBuffer(){

    if (!isPlayingBuffer) {

	if (!playBuffer()) return;

        isPlayingBuffer = true;

        setControlsEnabled(false);

        playBuffer();

    } else {

        isPlayingBuffer = false;

        setControlsEnabled(true);

        stopBuffer();

    }

}

////////////////////////////////////////////////////////////
// RENDER METRONOMO
////////////////////////////////////////////////////////////

function renderMetronomeClick(synth,beat,subBeat,time) {

    if (subBeat === 1) {

        if (beat === 1) {

            synth.triggerAttackRelease(
                "C6",
                "32n",
                time
            );

        } else {

            synth.triggerAttackRelease(
                "G5",
                "32n",
                time
            );

        }

    } else if (metronome.subBeatSound) {

        synth.triggerAttackRelease(
            "E5",
            "32n",
            time
        );

    }

}

function renderCountInClick(synth, beat, time) {

    synth.triggerAttackRelease(

        beat === 1 ? "C6" : "G5",

        "32n",

        time

    );

}

////////////////////////////////////////////////////////////
// RENDER SECUENCIA
////////////////////////////////////////////////////////////

async function renderSequence(instrument,notas,stepTime,gate,repeticiones,countInBars = 0) {

    console.log("Renderizando secuencia...");

    const beatTime = Tone.Time("4n").toSeconds();
    const stepsPerBar = metronome.beatsPerBar * metronome.subdivision;
    const barsNeeded = Math.max(1,Math.ceil(notas.length / stepsPerBar));
    const totalSteps = barsNeeded * stepsPerBar;

    return await Tone.Offline(async () => {

        const samplerSynth = new Tone.Sampler(instrument).toDestination();
        samplerSynth.volume.value = player.instrument.volume.value;

        const metronomeSynth = new Tone.Synth(Metronome.SYNTH_OPTIONS).toDestination();
        metronomeSynth.volume.value = metronome.synth.volume.value;

        await Tone.loaded();

        let tiempo = 0;

        ////////////////////////////////////////////////////////
        // Cuenta atrás
        ////////////////////////////////////////////////////////

        for (let bar = 0; bar < countInBars; bar++) {

            for (let beat = 1; beat <= metronome.beatsPerBar; beat++) {

                metronomeSynth.triggerAttackRelease(
                    beat === 1 ? "C6" : "G5",
                    "32n",
                    tiempo
                );

                tiempo += beatTime;

            }

        }

        ////////////////////////////////////////////////////////
        // Secuencia + silencios
        ////////////////////////////////////////////////////////

        let beat = 1, subBeat = 1;

        for (let r = 0; r < repeticiones; r++) {

            for (let i = 0; i < totalSteps; i++) {

                const nota = notas[i];

                if (nota !== undefined)
                    samplerSynth.triggerAttackRelease(
                        nota,
                        gate,
                        tiempo,
                        player.getVelocity(beat,subBeat)
                    );

                if (player.metronomeOn)
                    renderMetronomeClick(
                        metronomeSynth,
                        beat,
                        subBeat,
                        tiempo
                    );

                tiempo += (player.swingFeel && metronome.subdivision === 2)
                    ? (subBeat === 1
                        ? stepTime * (player.swingAmount * 2)
                        : stepTime * ((1 - player.swingAmount) * 2))
                    : stepTime;

                if (++subBeat > metronome.subdivision) {

                    subBeat = 1;

                    if (++beat > metronome.beatsPerBar)
                        beat = 1;

                }

            }

        }

    },

    countInBars * beatTime * metronome.beatsPerBar
    + totalSteps * stepTime * repeticiones
    + 2);

}

////////////////////////////////////////////////////////////
// RENDER ACORDE
////////////////////////////////////////////////////////////

async function renderChord(instrument,notas,stepTime,gate,repeticiones,countInBars = 0) {

    console.log("Renderizando acorde...");

    return await Tone.Offline(async () => {

        const samplerSynth = new Tone.Sampler(instrument).toDestination();
        samplerSynth.volume.value = player.instrument.volume.value;

        const metronomeSynth = new Tone.Synth(Metronome.SYNTH_OPTIONS).toDestination();
        metronomeSynth.volume.value = metronome.synth.volume.value;

        await Tone.loaded();

        ////////////////////////////////////////////////////////
        // Cuenta atrás
        ////////////////////////////////////////////////////////

        let tiempo = 0;
        const beatTime = Tone.Time("4n").toSeconds();

        for (let bar = 0; bar < countInBars; bar++) {

            for (let beat = 1; beat <= metronome.beatsPerBar; beat++) {

                metronomeSynth.triggerAttackRelease(
                    beat === 1 ? "C6" : "G5",
                    "32n",
                    tiempo
                );

                tiempo += beatTime;

            }

        }

        ////////////////////////////////////////////////////////
        // Acorde
        ////////////////////////////////////////////////////////

        let beat = 1;
        const totalBeats =
            metronome.beatsPerBar * repeticiones;

        const chordGate = beatTime * 0.9;

        for (let i = 0; i < totalBeats; i++) {

            samplerSynth.triggerAttackRelease(
                notas,
                chordGate,
                tiempo
            );

            if (player.metronomeOn) {

                renderMetronomeClick(
                    metronomeSynth,
                    beat,
                    1,
                    tiempo
                );

            }

            if (++beat > metronome.beatsPerBar) {

                beat = 1;

            }

            tiempo += beatTime;

        }

    },

    countInBars * metronome.beatsPerBar * Tone.Time("4n").toSeconds()
    + metronome.beatsPerBar * repeticiones * Tone.Time("4n").toSeconds()
    + 2);

}


////////////////////////////////////////////////////////////
//
// REPRODUCIR BUFFER
//
////////////////////////////////////////////////////////////

function playBuffer() {

    if (!audioBuffer) {

        alert("Primero debes renderizar el buffer.");

        return false;

    }

    ////////////////////////////////////////////////////////////
    // Detener reproducción actual
    ////////////////////////////////////////////////////////////

    player.stop();

    if (audioPlayer) {

        audioPlayer.stop();

        audioPlayer.dispose();

        audioPlayer = null;

    }

    ////////////////////////////////////////////////////////////
    // Crear reproductor
    ////////////////////////////////////////////////////////////

    audioPlayer = new Tone.Player().toDestination();

    audioPlayer.buffer = new Tone.ToneAudioBuffer(
        audioBuffer
    );

    ////////////////////////////////////////////////////////////
    // Reproducir
    ////////////////////////////////////////////////////////////

    audioPlayer.start();

    player.playing = true;

    ////////////////////////////////////////////////////////////
    // Detectar final
    ////////////////////////////////////////////////////////////

    audioPlayer.onstop = () => {

        player.playing = false;

    };

}

function stopBuffer() {

    if (!audioPlayer) {

        return;

    }

    audioPlayer.stop();

    audioPlayer.dispose();

    audioPlayer = null;

    if (player.autoMetronome) {

        metronome.stop();

        player.autoMetronome = false;

    }

    player.playing = false;

}

////////////////////////////////////////////////////////////
//
// GUARDAR ARCHIVO DE AUDIO
//
////////////////////////////////////////////////////////////

async function saveAudio(formato = "mp3"){

    if (!audioBuffer) {

        alert("Primero debes generar el buffer.");

        return;

    }

    let datos;
    let mime;

    switch (formato.toLowerCase()) {

        case "mp3":

            datos = audioBufferToMp3(audioBuffer);

            mime = "audio/mpeg";

            break;

        case "wav":

            datos = audioBufferToWav(audioBuffer);

            mime = "audio/wav";

            break;

    }

    const blob = Array.isArray(datos)

        ? new Blob(datos, { type: mime })

        : new Blob([datos], { type: mime });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = "audio." + formato.toLowerCase();

    a.click();

    URL.revokeObjectURL(url);

}

////////////////////////////////////////////////////////////
//
// AUDIOBUFFER -> WAV
//
////////////////////////////////////////////////////////////

function audioBufferToWav(buffer) {

    const numChannels = buffer.numberOfChannels;

    const sampleRate = buffer.sampleRate;

    const numSamples = buffer.length;

    const bytesPerSample = 2;

    const blockAlign = numChannels * bytesPerSample;

    const byteRate = sampleRate * blockAlign;

    const dataSize = numSamples * blockAlign;

    const arrayBuffer = new ArrayBuffer(44 + dataSize);

    const view = new DataView(arrayBuffer);

    writeString(view, 0, "RIFF");

    view.setUint32(4, 36 + dataSize, true);

    writeString(view, 8, "WAVE");

    writeString(view, 12, "fmt ");

    view.setUint32(16, 16, true);

    view.setUint16(20, 1, true);

    view.setUint16(22, numChannels, true);

    view.setUint32(24, sampleRate, true);

    view.setUint32(28, byteRate, true);

    view.setUint16(32, blockAlign, true);

    view.setUint16(34, 16, true);

    writeString(view, 36, "data");

    view.setUint32(40, dataSize, true);

    let offset = 44;

    for (let i = 0; i < numSamples; i++) {

        for (let ch = 0; ch < numChannels; ch++) {

            let sample = buffer.getChannelData(ch)[i];

            sample = Math.max(-1, Math.min(1, sample));

            sample = sample < 0

                ? sample * 32768

                : sample * 32767;

            view.setInt16(

                offset,

                sample,

                true

            );

            offset += 2;

        }

    }

    return arrayBuffer;

}

////////////////////////////////////////////////////////////
//
// ESCRIBIR TEXTO EN CABECERA WAV
//
////////////////////////////////////////////////////////////

function writeString(view, offset, text) {

    for (let i = 0; i < text.length; i++) {

        view.setUint8(offset + i,text.charCodeAt(i));

    }

}

////////////////////////////////////////////////////////////
//
// AUDIOBUFFER -> MP3
//
////////////////////////////////////////////////////////////

function audioBufferToMp3(buffer) {

    const numChannels = buffer.numberOfChannels;

    const sampleRate = buffer.sampleRate;

    const kbps = 192;

    const mp3encoder = new lamejs.Mp3Encoder(

        numChannels,

        sampleRate,

        kbps

    );

    const blockSize = 1152;

    const mp3Data = [];

    ////////////////////////////////////////////////////////////
    // MONO
    ////////////////////////////////////////////////////////////

    if (numChannels === 1) {

        const samples = buffer.getChannelData(0);

        const pcm = new Int16Array(samples.length);

        for (let i = 0; i < samples.length; i++) {

            let s = Math.max(-1, Math.min(1, samples[i]));

            pcm[i] = s < 0

                ? s * 32768

                : s * 32767;

        }

        for (let i = 0; i < pcm.length; i += blockSize) {

            const chunk = pcm.subarray(

                i,

                i + blockSize

            );

            const mp3buf = mp3encoder.encodeBuffer(chunk);

            if (mp3buf.length > 0) {

                mp3Data.push(

                    new Int8Array(mp3buf)

                );

            }

        }

    }

    ////////////////////////////////////////////////////////////
    // ESTÉREO
    ////////////////////////////////////////////////////////////

    else {

        const left = buffer.getChannelData(0);

        const right = buffer.getChannelData(1);

        const leftPCM = new Int16Array(left.length);

        const rightPCM = new Int16Array(right.length);

        for (let i = 0; i < left.length; i++) {

            let l = Math.max(-1, Math.min(1, left[i]));

            let r = Math.max(-1, Math.min(1, right[i]));

            leftPCM[i] = l < 0

                ? l * 32768

                : l * 32767;

            rightPCM[i] = r < 0

                ? r * 32768

                : r * 32767;

        }

        for (let i = 0; i < leftPCM.length; i += blockSize) {

            const leftChunk = leftPCM.subarray(

                i,

                i + blockSize

            );

            const rightChunk = rightPCM.subarray(

                i,

                i + blockSize

            );

            const mp3buf = mp3encoder.encodeBuffer(

                leftChunk,

                rightChunk

            );

            if (mp3buf.length > 0) {

                mp3Data.push(

                    new Int8Array(mp3buf)

                );

            }

        }

    }

    ////////////////////////////////////////////////////////////
    // FINALIZAR
    ////////////////////////////////////////////////////////////

    const end = mp3encoder.flush();

    if (end.length > 0) {

        mp3Data.push(

            new Int8Array(end)

        );

    }

    return mp3Data;

}



////////////////////////////////////////////////////////////
//
// MIDI
//
////////////////////////////////////////////////////////////

async function playMidi(filePath) {

	await Tone.start();

	// Si todavía no hemos cargado el MIDI, lo cargamos
	if (!midiData) {

		midiData = await Midi.fromUrl(filePath);

		// Limpiar cualquier reproducción anterior
		Tone.Transport.stop();
		Tone.Transport.cancel();

		// Crear un sintetizador por pista
		midiData.tracks.forEach(track => {

			if (track.notes.length === 0) {
				return;
			}

			const synth = new Tone.PolySynth(Tone.Synth).toDestination();

			midiSynths.push(synth);

			track.notes.forEach(note => {

				Tone.Transport.schedule(time => {

					synth.triggerAttackRelease(
						note.name,
						note.duration,
						time,
						note.velocity
					);

				}, note.time);

			});

		});

	}

	Tone.Transport.start();

}

function stopMidi() {

	Tone.Transport.stop();

	Tone.Transport.cancel();

	Tone.Transport.position = 0;

	midiSynths.forEach(synth => {

		synth.releaseAll();
		synth.dispose();

	});

	midiSynths = [];
	midiData = null;

}


////////////////////////////////////////////////////////////
//
// VIDEO
//
////////////////////////////////////////////////////////////

async function getCameraAndMicrophone() {

	let stream = null;

	try {

		// --------------------------------
		// CREAR STREAM
		// --------------------------------

		stream = await navigator.mediaDevices.getUserMedia({

			video: isMobile
				? true
				: {
					width: { ideal: 1920 },
					height: { ideal: 1080 }
				},

			audio: true

		});

		const camera = stream.getVideoTracks()[0];
		const microphone = stream.getAudioTracks()[0];

		// --------------------------------
		// CONSTRUIR COMBO DE RESOLUCIONES
		// --------------------------------

		const modes = await buildResolutionCombo(camera);

		camerasInfo.push({

			deviceId: camera.getSettings().deviceId,
			label: camera.label,
			modes: modes

		});

		// --------------------------------
		// CONFIGURACIÓN REAL
		// --------------------------------

		const settingsVideo = camera.getSettings();

		const realWidth = settingsVideo.width;
		const realHeight = settingsVideo.height;
		const realFrameRate = Math.round(settingsVideo.frameRate || 0);

		cmbResolucion.dataset.previousValue =
			`${realWidth}x${realHeight}@${realFrameRate}`;

		cmbResolucion.disabled = isMobile;

		// --------------------------------
		// CARGAR DISPOSITIVOS
		// --------------------------------

		const devices = await navigator.mediaDevices.enumerateDevices();

		cmbCamera.innerHTML = "";
		cmbMicrophone.innerHTML = "";

		devices.forEach(device => {

			if (device.kind === "videoinput") {

				const option = document.createElement("option");

				option.value = device.deviceId;
				option.textContent = device.label || "Cámara";

				cmbCamera.appendChild(option);

				if (device.deviceId === camera.getSettings().deviceId) {

					option.selected = true;

					cmbCamera.dataset.previousValue = device.deviceId;

				}

			}

			if (device.kind === "audioinput") {

				const option = document.createElement("option");

				option.value = device.deviceId;
				option.textContent = device.label || "Micrófono";

				cmbMicrophone.appendChild(option);

				if (device.deviceId === microphone.getSettings().deviceId) {

					option.selected = true;

					cmbMicrophone.dataset.previousValue = device.deviceId;

				}

			}

		});

		// --------------------------------
		// CANVAS DE GRABACIÓN
		// --------------------------------

		recordingCanvas = document.createElement("canvas");

		recordingCanvas.width = realWidth;
		recordingCanvas.height = realHeight;

		recordingContext = recordingCanvas.getContext("2d");

		// --------------------------------
		// AUDIO
		// --------------------------------

		if (audioContext) {

			await audioContext.close();

		}

		audioContext = new AudioContext();

		if (audioMeterAnimation) {

			cancelAnimationFrame(audioMeterAnimation);

		}

		audioAnalyser = null;
		audioMeterAnimation = null;

		audioDestination = audioContext.createMediaStreamDestination();

		microphoneSource = audioContext.createMediaStreamSource(stream);

		microphoneSource.connect(audioDestination);

		startAudioMeter();

		// --------------------------------
		// STREAM DE GRABACIÓN
		// --------------------------------

		const captureFrameRate =
			isMobile
				? 30
				: Math.min(60,realFrameRate || 30);

		const videoTrack =
			recordingCanvas.captureStream(captureFrameRate).getVideoTracks()[0];

		recordingStream = new MediaStream();

		recordingStream.addTrack(videoTrack);

		recordingStream.addTrack(
			audioDestination.stream.getAudioTracks()[0]
		);

		// --------------------------------
		// DIBUJAR CÁMARA
		// --------------------------------

		function drawRecordingVideo() {

			if (
				localVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
			) {

				recordingContext.save();

				if (btnVideoMirror.classList.contains("active")) {

					recordingContext.translate(recordingCanvas.width,0);
					recordingContext.scale(-1,1);

				}

				recordingContext.drawImage(
					localVideo,
					0,
					0,
					recordingCanvas.width,
					recordingCanvas.height
				);

				recordingContext.restore();

			}

			requestAnimationFrame(drawRecordingVideo);

		}

		drawRecordingVideo();

		return {
			stream: stream,
			camera: camera,
			microphone: microphone
		};

	} catch (error) {

		if (stream) {

			stream.getTracks().forEach(track => {
				track.stop();
			});

		}

		showAlert("No se pudo acceder a la cámara y al micrófono","error");
		console.error("No se pudo acceder a la cámara y al micrófono:",error);

		return null;

	}

}

async function buildResolutionCombo(track) {

	cmbResolucion.innerHTML = "";

	if (!track) return;

	const capabilities = track.getCapabilities();
	const settings = track.getSettings();

	// --------------------------------
	// MÓVIL
	// --------------------------------

	if (isMobile) {

		const width = settings.width;
		const height = settings.height;
		const fps = Math.round(settings.frameRate || 0);

		const option = document.createElement("option");

		option.value =
			`${width}x${height}@${fps}`;

		option.textContent =
			`${getResolutionName(width,height)}${width} × ${height} - ${fps} fps`;

		cmbResolucion.appendChild(option);

		cmbResolucion.dataset.previousValue = option.value;

		return [{
			width: width,
			height: height,
			fps: fps
		}];

	}

	// --------------------------------
	// PC
	// --------------------------------

	if (!capabilities.width || !capabilities.height || !capabilities.frameRate) {
		return;
	}

	const originalSettings = track.getSettings();

	const maxWidth = capabilities.width.max;
	const maxHeight = capabilities.height.max;
	const maxFrameRate = capabilities.frameRate.max;

	const resolutions = [

		{ width: maxWidth, height: maxHeight },

		{
			width: Math.round(maxWidth * 2 / 3),
			height: Math.round(maxHeight * 2 / 3)
		},

		{
			width: Math.round(maxWidth / 2),
			height: Math.round(maxHeight / 2)
		},

		{
			width: Math.round(maxWidth / 3),
			height: Math.round(maxHeight / 3)
		},

		{
			width: originalSettings.width,
			height: originalSettings.height
		}

	];

	const uniqueResolutions = [];

	resolutions.forEach(resolution => {

		if (
			resolution.width < capabilities.width.min ||
			resolution.height < capabilities.height.min
		) {
			return;
		}

		const exists = uniqueResolutions.some(item =>
			item.width === resolution.width &&
			item.height === resolution.height
		);

		if (!exists) {
			uniqueResolutions.push(resolution);
		}

	});

	const modes = [];

	// --------------------------------
	// CURSOR DE ESPERA
	// --------------------------------

	document.body.style.cursor = "wait";

	try {

		try {

			// --------------------------------
			// PROBAR RESOLUCIONES
			// --------------------------------

			for (const resolution of uniqueResolutions) {

				try {

					await track.applyConstraints({

						width: {
							exact: resolution.width
						},

						height: {
							exact: resolution.height
						},

						frameRate: {
							ideal: maxFrameRate
						}

					});

					const current = track.getSettings();

					if (
						current.width === resolution.width &&
						current.height === resolution.height &&
						current.frameRate
					) {

						modes.push({

							width: current.width,
							height: current.height,
							fps: Math.round(current.frameRate)

						});

					}

				} catch (error) {

					// Resolución no disponible.

				}

			}

			// --------------------------------
			// ORDENAR
			// --------------------------------

			modes.sort((a,b) => {

				if (a.width !== b.width) {
					return b.width - a.width;
				}

				if (a.height !== b.height) {
					return b.height - a.height;
				}

				return b.fps - a.fps;

			});

			// --------------------------------
			// CREAR COMBO
			// --------------------------------

			modes.forEach(mode => {

				const option = document.createElement("option");

				option.value =
					`${mode.width}x${mode.height}@${mode.fps}`;

				option.textContent =
					`${getResolutionName(mode.width,mode.height)}${mode.width} × ${mode.height} - ${mode.fps} fps`;

				cmbResolucion.appendChild(option);

			});

		} finally {

			// --------------------------------
			// RESTAURAR CONFIGURACIÓN ORIGINAL
			// --------------------------------

			try {

				await track.applyConstraints({

					width: {
						exact: originalSettings.width
					},

					height: {
						exact: originalSettings.height
					},

					frameRate: {
						exact: originalSettings.frameRate
					}

				});

			} catch (error) {

				// Mantener configuración actual.

			}

		}

		// --------------------------------
		// SELECCIONAR CONFIGURACIÓN REAL
		// --------------------------------

		const current = track.getSettings();

		const currentValue =
			`${current.width}x${current.height}@${Math.round(current.frameRate || 0)}`;

		const currentOption = Array.from(cmbResolucion.options).find(option =>
			option.value === currentValue
		);

		if (currentOption) {

			cmbResolucion.value = currentValue;

		} else if (cmbResolucion.options.length > 0) {

			cmbResolucion.selectedIndex = 0;

		}

		cmbResolucion.dataset.previousValue = cmbResolucion.value;

	} finally {

		document.body.style.cursor = "";

	}

	return modes;

}

function getResolutionValues() {

	const value = cmbResolucion.value;

	if (!value) {
		return null;
	}

	const match = value.match(/^(\d+)x(\d+)@(\d+)$/);

	if (!match) {
		return null;
	}

	return {
		width: parseInt(match[1],10),
		height: parseInt(match[2],10),
		frameRate: parseInt(match[3],10)
	};

}

function getResolutionName(width, height) {

	if (width >= 3840 && height >= 2160) return "4K UHD ";
	if (width >= 2560 && height >= 1440) return "QHD ";
	if (width >= 1920 && height >= 1080) return "Full HD ";
	if (width >= 1280 && height >= 720) return "HD ";
	if (width >= 1024 && height >= 576) return "SD+ ";
	if (width >= 854 && height >= 480) return "SD ";
	if (width >= 640 && height >= 480) return "VGA ";

	return "";

}

async function changeResolution() {

	if (isMobile) {
		return false;
	}

	if (!localStream) {
		return false;
	}

	const videoTrack = localStream.getVideoTracks()[0];

	if (!videoTrack) {
		return false;
	}

	const resolution = getResolutionValues();

	if (!resolution) {
		return false;
	}

	const previousSettings = videoTrack.getSettings();

	try {

		await videoTrack.applyConstraints({

			width: {
				exact: resolution.width
			},

			height: {
				exact: resolution.height
			},

			frameRate: {
				exact: resolution.frameRate
			}

		});

		const settings = videoTrack.getSettings();

		if (
			settings.width !== resolution.width ||
			settings.height !== resolution.height ||
			Math.round(settings.frameRate) !== resolution.frameRate
		) {

			throw new Error("La cámara no ha aplicado el modo solicitado.");

		}

		if (recordingCanvas) {

			recordingCanvas.width = settings.width;
			recordingCanvas.height = settings.height;

		}

		cmbResolucion.dataset.previousValue = cmbResolucion.value;

		updateVideoInfo();

		return true;

	} catch (error) {

		try {

			await videoTrack.applyConstraints({

				width: {
					exact: previousSettings.width
				},

				height: {
					exact: previousSettings.height
				},

				frameRate: {
					exact: previousSettings.frameRate
				}

			});

		} catch (restoreError) {

			console.error("No se pudo restaurar la configuración anterior de la cámara:",restoreError);

		}

		switch (error.name) {

			case "OverconstrainedError":

				showAlert("La cámara no puede utilizar la resolución y los FPS seleccionados.","error");

				break;

			case "NotReadableError":

				showAlert("No se puede modificar la configuración de la cámara. Puede estar siendo utilizada por otra aplicación.","error");

				break;

			case "NotAllowedError":

				showAlert("El navegador no permite modificar la configuración de la cámara.","error");

				break;

			default:

				showAlert("No se pudo cambiar la resolución de la cámara.","error");

				break;

		}

		console.error("No se pudo cambiar la resolución:",error.name,error);

		return false;

	}

}

async function changeCamera() {

	let stream = null;

	try {

		if (!localStream) {
			return false;
		}

		const deviceId = cmbCamera.value;

		// --------------------------------
		// BUSCAR INFORMACIÓN GUARDADA
		// --------------------------------

		let cameraInfo = camerasInfo.find(camera =>
			camera.deviceId === deviceId
		);

		// --------------------------------
		// ABRIR CÁMARA
		// --------------------------------

		stream = await navigator.mediaDevices.getUserMedia({

			video: {
				deviceId: { exact: deviceId }
			},

			audio: false

		});

		const newCamera = stream.getVideoTracks()[0];

		// --------------------------------
		// COMPROBAR CÁMARA SOLO LA PRIMERA VEZ
		// --------------------------------

		if (!cameraInfo) {

			const modes = await buildResolutionCombo(newCamera);

			cameraInfo = {

				deviceId: deviceId,
				label: cmbCamera.options[cmbCamera.selectedIndex]?.textContent || "Cámara",
				modes: modes

			};

			camerasInfo.push(cameraInfo);

		} else {

			// --------------------------------
			// CARGAR MODOS GUARDADOS
			// --------------------------------

			cmbResolucion.innerHTML = "";

			cameraInfo.modes.forEach(mode => {

				const option = document.createElement("option");

				option.value =
					`${mode.width}x${mode.height}@${mode.fps}`;

				option.textContent =
					`${getResolutionName(mode.width,mode.height)}${mode.width} × ${mode.height} - ${mode.fps} fps`;

				cmbResolucion.appendChild(option);

			});

		}

		cmbResolucion.disabled = isMobile;

		// --------------------------------
		// CONFIGURACIÓN REAL
		// --------------------------------

		const settingsVideo = newCamera.getSettings();

		const realWidth = settingsVideo.width;
		const realHeight = settingsVideo.height;
		const realFrameRate = Math.round(settingsVideo.frameRate || 0);

		const currentValue =
			`${realWidth}x${realHeight}@${realFrameRate}`;

		// --------------------------------
		// SELECCIONAR MODO ACTUAL
		// --------------------------------

		const currentOption = Array.from(cmbResolucion.options).find(option =>
			option.value === currentValue
		);

		if (currentOption) {

			cmbResolucion.value = currentValue;

		} else if (cmbResolucion.options.length > 0) {

			cmbResolucion.selectedIndex = 0;

		}

		cmbResolucion.dataset.previousValue = cmbResolucion.value;

		// --------------------------------
		// ACTUALIZAR CANVAS
		// --------------------------------

		if (recordingCanvas) {

			recordingCanvas.width = realWidth;
			recordingCanvas.height = realHeight;

		}

		// --------------------------------
		// CAMBIAR CÁMARA
		// --------------------------------

		const oldCamera = localStream.getVideoTracks()[0];

		if (oldCamera) {

			localStream.removeTrack(oldCamera);
			oldCamera.stop();

		}

		localStream.addTrack(newCamera);

		localVideo.srcObject = localStream;

		// --------------------------------
		// ACTUALIZAR INFORMACIÓN
		// --------------------------------

		updateVideoInfo();

		return true;

	} catch (error) {

		if (stream) {

			stream.getTracks().forEach(track => {
				track.stop();
			});

		}

		switch (error.name) {

			case "NotAllowedError":

				showAlert("El navegador no permite acceder a esta cámara. Comprueba los permisos de cámara del navegador.","error");

				break;

			case "NotFoundError":

				showAlert("No se ha encontrado la cámara seleccionada.","error");

				break;

			case "OverconstrainedError":

				showAlert("La cámara seleccionada no está disponible con la configuración solicitada.","error");

				break;

			case "NotReadableError":

				showAlert("No se puede acceder a la cámara seleccionada. Puede estar siendo utilizada por otra aplicación.","error");

				break;

			case "SecurityError":

				showAlert("El navegador ha bloqueado el acceso a la cámara por motivos de seguridad.","error");

				break;

			default:

				showAlert("No se pudo cambiar la cámara.","error");

				break;

		}

		console.error("No se pudo cambiar la cámara:",error.name,error);

		return false;

	}

}

async function changeMicrophone() {

	let stream = null;

	try {

		if (!localStream) {
			return false;
		}

		// --------------------------------
		// ABRIR MICRÓFONO SELECCIONADO
		// --------------------------------

		stream = await navigator.mediaDevices.getUserMedia({

			audio: {
				deviceId: { exact: cmbMicrophone.value }
			},

			video: false

		});

		const newMicrophone = stream.getAudioTracks()[0];

		// --------------------------------
		// COMPROBAR SISTEMA DE AUDIO
		// --------------------------------

		if (!audioContext || !audioDestination) {

			throw new Error("El sistema de audio no está preparado.");

		}

		// --------------------------------
		// CAMBIAR FUENTE DE AUDIO
		// --------------------------------

		if (microphoneSource) {

			microphoneSource.disconnect();

		}

		microphoneSource = audioContext.createMediaStreamSource(stream);

		microphoneSource.connect(audioDestination);

		startAudioMeter();

		// --------------------------------
		// CAMBIAR MICRÓFONO DEL STREAM LOCAL
		// --------------------------------

		const oldMicrophone = localStream.getAudioTracks()[0];

		if (oldMicrophone) {

			localStream.removeTrack(oldMicrophone);
			oldMicrophone.stop();

		}

		localStream.addTrack(newMicrophone);

		localVideo.srcObject = localStream;

		// --------------------------------
		// ACTUALIZAR INFORMACIÓN
		// --------------------------------

		updateVideoInfo();

		return true;

	} catch (error) {

		if (stream) {

			stream.getTracks().forEach(track => {
				track.stop();
			});

		}

		switch (error.name) {

			case "NotAllowedError":

				showAlert("El navegador no permite acceder a este micrófono. Comprueba los permisos de micrófono del navegador.","error");

				break;

			case "NotFoundError":

				showAlert("No se ha encontrado el micrófono seleccionado.","error");

				break;

			case "OverconstrainedError":

				showAlert("El micrófono seleccionado no puede utilizarse con la configuración solicitada.","error");

				break;

			case "NotReadableError":

				showAlert("No se puede acceder al micrófono seleccionado. Puede estar siendo utilizado por otra aplicación.","error");

				break;

			case "SecurityError":

				showAlert("El navegador ha bloqueado el acceso al micrófono por motivos de seguridad.","error");

				break;

			default:

				showAlert("No se pudo cambiar el micrófono.","error");

				break;

		}

		console.error("No se pudo cambiar el micrófono:",error.name,error);

		return false;

	}

}

function updateVideoInfo() {

	if (!localStream) return;

	const videoTrack = localStream.getVideoTracks()[0];
	const audioTrack = localStream.getAudioTracks()[0];

	if (!videoTrack || !audioTrack) return;

	const videoSettings = videoTrack.getSettings();
	const audioSettings = audioTrack.getSettings();

	videoInfo.textContent =
		`Resolución: ${videoSettings.width} x ${videoSettings.height} - ${videoSettings.frameRate} fps | ` +
		`Audio: ${audioSettings.sampleRate} Hz - ${audioSettings.sampleSize} bit - ${audioSettings.channelCount} canales`;

}

function getMultimediaDevicesInfo(media){

	const camera = media.camera;

	console.log("Nombre:", camera.label);
	console.log("ID pista:", camera.id);
	console.log("Tipo:", camera.kind);
	console.log("Activada:", camera.enabled);
	console.log("Silenciada:", camera.muted);
	console.log("Estado:", camera.readyState);

	const settingsVideo = media.camera.getSettings();

	console.log("Device ID:", settingsVideo.deviceId);
	console.log("Group ID:", settingsVideo.groupId);
	console.log("Ancho:", settingsVideo.width);
	console.log("Alto:", settingsVideo.height);
	console.log("Relación de aspecto:", settingsVideo.aspectRatio);
	console.log("FPS:", settingsVideo.frameRate);
	console.log("Orientación:", settingsVideo.facingMode);

	console.log("Settings:", camera.getSettings());
	console.log("Capabilities:", camera.getCapabilities());

	const microphone = media.microphone;

	console.log("Nombre:", microphone.label);
	console.log("ID de pista:", microphone.id);
	console.log("Tipo:", microphone.kind);
	console.log("Activado:", microphone.enabled);
	console.log("Silenciado:", microphone.muted);
	console.log("Estado:", microphone.readyState);

	console.log("Settings:", microphone.getSettings());
	console.log("Capabilities:", microphone.getCapabilities());

	const settings = microphone.getSettings();

	console.log("Device ID:", settings.deviceId);
	console.log("Group ID:", settings.groupId);
	console.log("Sample rate:", settings.sampleRate);
	console.log("Sample size:", settings.sampleSize);
	console.log("Canales:", settings.channelCount);
	console.log("Echo cancellation:", settings.echoCancellation);
	console.log("Noise suppression:", settings.noiseSuppression);
	console.log("Auto gain:", settings.autoGainControl);

}

function recordVideo(){ 
 
	if (!localStream) { 
 
		alert("Primero debes iniciar la cámara."); 
		return; 
 
	} 
 
	// -------------------------------- 
	// INICIAR GRABACIÓN 
	// -------------------------------- 
 
	if (!mediaRecorder || mediaRecorder.state === "inactive") { 
 
		recordedChunks = []; 
 
		if (!recordingStream) { 
 
			showAlert("No se ha podido preparar la grabación.","error"); 
			return; 
 
		} 
 
		// -------------------------------- 
		// DETECTAR FORMATO COMPATIBLE 
		// -------------------------------- 
 
		const mimeTypes = [
			"video/webm;codecs=vp9,opus",
			"video/webm;codecs=vp8,opus",
			"video/webm"
		];

		const mimeType = mimeTypes.find(type =>
			MediaRecorder.isTypeSupported(type)
		);

		if (!mimeType) { 
 
			showAlert("El navegador no soporta un formato de grabación compatible.","error"); 
			return; 
 
		} 
 
		// -------------------------------- 
		// CREAR MEDIA RECORDER 
		// -------------------------------- 
 
		mediaRecorder = new MediaRecorder(recordingStream, { 
 
			mimeType: mimeType, 
			videoBitsPerSecond: 5000000 
 
		}); 
 
		mediaRecorder.ondataavailable = event => { 
 
			if (event.data.size > 0) { 
 
				recordedChunks.push(event.data); 
 
			} 
 
		}; 
 
		mediaRecorder.onstop = () => { 
 
			stopRecordingTimer(); 
 
			const blob = new Blob(recordedChunks, { 
				type: mimeType 
			}); 
 
			const url = URL.createObjectURL(blob); 
 
			const a = document.createElement("a"); 
 
			a.href = url; 
 
			a.download = (videoTitle.value.trim() || "untitled") + ".webm"; 
 
			a.click(); 
 
			URL.revokeObjectURL(url); 
 
		}; 
 
		mediaRecorder.start(); 
 
		startRecordingTimer(); 
 
		btnVideoRecord.innerHTML = "<i class='fa-solid fa-circle'></i><span>Parar</span>"; 
		btnVideoRecord.classList.remove("buttonPlay"); 
		btnVideoRecord.classList.add("buttonStop"); 
 
		btnVideoClose.disabled = true; 
 
	} else { 
 
		mediaRecorder.stop(); 
 
		btnVideoRecord.innerHTML = "<i class='fa-solid fa-circle'></i><span>Grabar</span>"; 
		btnVideoRecord.classList.add("buttonPlay"); 
		btnVideoRecord.classList.remove("buttonStop"); 
 
		btnVideoClose.disabled = false; 
 
	} 
 
}

function startAudioMeter() {

	if (!microphoneSource || !audioContext) return;

	if (audioAnalyser && audioAnalyser.context !== audioContext) {

		audioAnalyser = null;
		audioMeterAnimation = null;

	}

	if (!audioAnalyser) {

		audioAnalyser = audioContext.createAnalyser();

		audioAnalyser.fftSize = 256;

	}

	try {

		microphoneSource.disconnect(audioAnalyser);

	} catch (error) {

	}

	microphoneSource.connect(audioAnalyser);

	if (audioMeterAnimation) return;

	const data = new Uint8Array(audioAnalyser.fftSize);

	function updateAudioMeter() {

		if (!audioAnalyser) return;

		audioAnalyser.getByteTimeDomainData(data);

		let sum = 0;

		for (let i = 0; i < data.length; i++) {

			const value = (data[i] - 128) / 128;

			sum += value * value;

		}

		const rms = Math.sqrt(sum / data.length);

		const level = Math.min(100, rms * 250);

		audioMeterLevel.style.width = level + "%";

		audioMeterAnimation = requestAnimationFrame(updateAudioMeter);

	}

	updateAudioMeter();

}

function startRecordingTimer() {

	recordingTime = 0;

	recordingTimeElement.innerHTML = "<i class='fa-solid fa-circle'></i> 00:00";

	recordingTimeElement.style.display = "block";

	recordingTimer = setInterval(() => {

		recordingTime++;

		const minutes = Math.floor(recordingTime / 60);
		const seconds = recordingTime % 60;

		recordingTimeElement.innerHTML = `<i class="fa-solid fa-circle"></i> ${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;

	},1000);

}

function stopRecordingTimer() {

	clearInterval(recordingTimer);

	recordingTimer = null;

	recordingTimeElement.style.display = "none";

}




////////////////////////////////////////////////////////////
// MULTIMEDIA
////////////////////////////////////////////////////////////

async function selectMultimediaFolder() {

	try {

		multimediaDirectory = await window.showDirectoryPicker();


		// Comprobar que es la carpeta multimedia

		if (multimediaDirectory.name !== "multimedia") {

			alert("Debes seleccionar la carpeta 'multimedia'.");

			multimediaDirectory = null;

			return false;

		}


		// Crear las carpetas si no existen

		const folders = [
			"video",
			"audio",
			"midi",
			"image",
			"score",
			"pdf",
			"document",
			"html"
		];


		for (const folder of folders) {

			await multimediaDirectory.getDirectoryHandle(
				folder,
				{ create: true }
			);

		}


		return true;

	} catch (error) {

		console.error("Error seleccionando la carpeta multimedia:", error);

		multimediaDirectory = null;

		return false;

	}

}

async function selectMultimediaFiles() {

	// --------------------------------
	// TIPOS SIN ARCHIVO
	// --------------------------------

	if (projectType === "link" || projectType === "iframe") {

		let content;

		if (projectType === "link") content = prompt("Introduzca la URL:");

		if (projectType === "iframe") content = prompt("Pegue aquí el código de inserción:");

		if (!content) return;

		resources[projectType].push({

			name: content.trim(),

			path: content.trim(),

			file: null

		});

		createMultimediaElement(projectType, content.trim());

		return;

	}


	// --------------------------------
	// SELECCIONAR CARPETA MULTIMEDIA
	// --------------------------------

	if (!multimediaDirectory) {

		alert("Seleccione primero una carpeta de destino.");

		const folderSelected = await selectMultimediaFolder();

		if (!folderSelected) return;

	}


	// --------------------------------
	// TIPOS DE ARCHIVO
	// --------------------------------

	const input = document.createElement("input");

	input.type = "file";

	input.multiple = true;

	switch (projectType) {

		case "video":

			input.accept = ["video/*",".mp4",".mpeg",".mpg",".avi",".mov",".webm",".mkv",".m4v"].join(",");

			break;

		case "audio":

			input.accept = ["audio/*",".mp3",".wav",".ogg",".oga",".m4a",".aac",".flac",".opus"].join(",");

			break;

		case "midi":

			input.accept = [".mid,.midi"].join(",");

			break;

		case "image":

			input.accept = ["image/*",".png",".jpg",".jpeg",".gif",".bmp",".webp",".svg"].join(",");

			break;

		case "score":

			input.accept = [".musicxml",".mxl"].join(",");

			break;

		case "pdf":

			input.accept = [".pdf"].join(",");

			break;

		case "document":

			input.accept = [".doc",".docx",".txt"].join(",");

			break;

		case "html":

			input.accept = [".html",".htm"].join(",");

			break;

		default:

			return;

	}


	// --------------------------------
	// SELECCIONAR ARCHIVOS
	// --------------------------------

	input.addEventListener("change", async () => {

		const files = Array.from(input.files);

		for (const file of files) {

			if (!isValidFile(file, projectType)) {
				continue;
			}

			await saveFileToMultimedia(file, projectType);

		}

//		console.log(resources);

	});

	input.click();

}

async function saveFileToMultimedia(file, type) {

	try {

		// --------------------------------
		// CARPETA DEL TIPO
		// --------------------------------

		const folder = await multimediaDirectory.getDirectoryHandle(
			type,
			{ create: true }
		);


		// --------------------------------
		// CREAR ARCHIVO
		// --------------------------------

		const name = file.name.substring(0,file.name.lastIndexOf(".")).replace(/[\s.]+/g,"-");
		const extension = file.name.split(".").pop();

		const lib = xmlProjects.substring(xmlProjects.lastIndexOf("/") + 1,xmlProjects.lastIndexOf("."));

		const fileName = lib + "-" + currentProjectId + "-" + name + "." + extension;

		const fileHandle = await folder.getFileHandle(
			fileName,
			{ create: true }
		);

		// --------------------------------
		// ESCRIBIR ARCHIVO
		// --------------------------------

		const writable = await fileHandle.createWritable();

		await writable.write(file);

		await writable.close();


		// --------------------------------
		// GUARDAR REFERENCIA
		// --------------------------------

		resources[type].push({

			name: fileName,

		});

		createMultimediaElement(type,fileName);

		showAlert("Archivo guardado.", "success");

	} catch (error) {

		showAlert("Error guardando el archivo", "error");
		console.log("Error guardando el archivo: " + error);

	}

}

function isValidFile(file, type) {

	const extension = file.name.toLowerCase().split(".").pop();

	const mime = file.type.toLowerCase();

	switch (type) {

		case "video":

			return mime.startsWith("video/") ||
				["mp4","mpeg","mpg","avi","mov","webm","mkv","m4v"].includes(extension);

		case "audio":

			return mime.startsWith("audio/") ||
				["mp3","wav","ogg","oga","m4a","aac","flac","opus"].includes(extension);

		case "midi":

			return mime === "audio/midi" || mime === "audio/x-midi" || 
				["mid","midi"].includes(extension);

		case "image":

			return mime.startsWith("image/") ||
				["png","jpg","jpeg","gif","bmp","webp","svg"].includes(extension);

		case "score":

			return ["musicxml","mxl"].includes(extension) ||
				mime === "application/vnd.recordare.musicxml" ||
				mime === "application/vnd.recordare.musicxml+xml";

		case "pdf":

			return extension === "pdf" ||
				mime === "application/pdf";

		case "document":

			return ["doc","docx","txt"].includes(extension) ||
				mime === "text/plain" ||
				mime === "application/msword" ||
				mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

		case "html":

			return ["html","htm"].includes(extension) ||
				mime === "text/html";

		default:

			return false;

	}

}

async function addDroppedResource(file) {

	// --------------------------------
	// COMPROBAR ARCHIVO
	// --------------------------------

	if (!isValidFile(file,projectType)) {

		showAlert("El archivo no corresponde al formato del proyecto.","info");

		return;

	}

	// --------------------------------
	// GUARDAR ARCHIVO
	// --------------------------------

	await saveFileToMultimedia(file,projectType);

}

function createMultimediaElement(type, fileName) {

	let element;
	let resourceUrl = "";

	const realName = fileName.substring(fileName.indexOf("-", fileName.indexOf("-") + 1) + 1);

	if (type === "link" || type === "iframe"){
		resourceUrl = fileName;
	}else{
		resourceUrl = dataURL_Multimedia + type + "/" + fileName;
	}

	switch (type) {

		case "video":

			element = document.createElement("video");
			element.src = resourceUrl;
			element.controls = true;
			element.controlsList.add("nodownload");
			element.playsInline = true;

			element.addEventListener("contextmenu", event => {
				event.preventDefault();
			});

			break;


		case "audio": {

			element = document.createElement("div");

			const audioLink = document.createElement("a");

			audioLink.href = resourceUrl;
			audioLink.innerHTML = "<i class='fa-solid fa-music'></i> " + (realName || "");
			audioLink.target = "_blank";

			const audio = document.createElement("audio");

			audio.src = resourceUrl;
			audio.controls = true;
			audio.controlsList = "nodownload";

			audio.addEventListener("contextmenu", event => {
				event.preventDefault();
			});

			element.appendChild(audioLink);
			element.appendChild(document.createElement("br"));
			element.appendChild(audio);

			break;

		}


		case "midi": {

			element = document.createElement("div");

			element.className = "midi-player";

			const midiLink = document.createElement("a");

			midiLink.href = resourceUrl;
			midiLink.innerHTML = "<i class='fa-solid fa-music'></i> " + (realName || "");
			midiLink.target = "_blank";


			const btnPlay = document.createElement("button");

			btnPlay.innerHTML = "<i class='fa-solid fa-play'></i>";

			btnPlay.title = "Reproducir MIDI";


			const btnStop = document.createElement("button");

			btnStop.innerHTML = "<i class='fa-solid fa-stop'></i>";

			btnStop.title = "Detener MIDI";

			btnStop.disabled = true;


			btnPlay.addEventListener("click", async () => {

				await playMidi(resourceUrl);

				btnPlay.disabled = true;
				btnStop.disabled = false;

			});


			btnStop.addEventListener("click", () => {

				stopMidi();

				btnPlay.disabled = false;
				btnStop.disabled = true;

			});


			const midiLinkContainer = document.createElement("div");

			midiLinkContainer.className = "midi-link";

			midiLinkContainer.appendChild(midiLink);


			element.appendChild(midiLinkContainer);

			element.appendChild(btnPlay);

			element.appendChild(btnStop);

			break;

		}


		case "image":

			element = document.createElement("img");

			element.src = resourceUrl;

			element.alt = fileName || "";

			break;


		case "pdf":

			element = document.createElement("iframe");
			element.className = "iframe-link";

			if (isLocal){
				element.src = resourceUrl;
			}else{
				element.src = "https://docs.google.com/viewer?embedded=true&url="+ baseURL + resourceUrl;
			}

			break;


		case "document": {

			let extension = "";

			if (fileName) extension = fileName.toLowerCase().split(".").pop();

			if (extension === "doc" || extension === "docx") {

				if (isLocal){

					/*
					const arrayBuffer = await file.arrayBuffer();
					const result = await mammoth.convertToHtml({arrayBuffer});
					iframeDocument.body.innerHTML = result.value;
					*/

					element = document.createElement("a");
					element.href = resourceUrl;
					element.innerHTML = "<i class='fa-solid fa-file-word'></i> " + (realName || "");
					element.target = "_blank";

				}else{

					element = document.createElement("iframe");
					element.className = "iframe-html";
					element.src = "https://docs.google.com/viewer?embedded=true&url="+ baseURL + resourceUrl;

				}

			} else if (extension === "txt") {

				element = document.createElement("iframe");
				element.className = "iframe-doc";
				element.src = resourceUrl;

			}

			break;

		}


		case "html":

			element = document.createElement("iframe");

			element.className = "iframe-html";

			element.src = resourceUrl;

			break;


		case "score":
/*
			element = document.createElement("div");

			element.textContent = fileName || "";

			break;
*/

		// --------------------------------
		// LINK
		// --------------------------------

		case "link":

			element = document.createElement("iframe");

			element.className = "iframe-link";

			element.src = resourceUrl;

			element.allowFullscreen = true;

			break;


		// --------------------------------
		// iframe
		// --------------------------------

		case "iframe": {

			if (!resourceUrl) {

				showAlert("El código de inserción está vacío.","error");

				return;

			}

			element = document.createElement("div");

			element.innerHTML = resourceUrl;

			break;

		}


		default:

			return;

	}

	workspaceMultimedia.appendChild(element);

}

async function renderMultimedia() {

	workspaceMultimedia.innerHTML = "";

	if (isAdmin){

		// ZONA DRAG & DROP ----------------------

		const dropZone = document.createElement("div");

		dropZone.id = "multimediaDropZone";

		dropZone.innerHTML = "<i class='fa-solid fa-cloud-arrow-up'></i><span>Arrastra aquí un archivo</span>";

		workspaceMultimedia.appendChild(dropZone);


		// DRAG & DROP ----------------------

		dropZone.addEventListener("dragover", event => {

			event.preventDefault();

			event.stopPropagation();

			event.dataTransfer.dropEffect = "copy";

			dropZone.classList.add("dragover");

		});


		dropZone.addEventListener("dragleave", event => {

			event.preventDefault();

			event.stopPropagation();

			// Solo quitarlo si realmente salimos de la zona

			if (!dropZone.contains(event.relatedTarget)) {

				dropZone.classList.remove("dragover");

			}

		});


		dropZone.addEventListener("drop", async event => {

			event.preventDefault();

			event.stopPropagation();

			dropZone.classList.remove("dragover");


			const files = event.dataTransfer.files;

			if (!files || files.length === 0) return;


			const file = files[0];


			// Seleccionar carpeta multimedia si no está seleccionada

			if (!multimediaDirectory) {

				const selected = await selectMultimediaFolder();

				if (!selected) return;

			}


			await addDroppedResource(file);

		});

	}

	const project = projects.find(project => project.id === currentProjectId);

	if (!project || !project.resources) return;

	// RECURSOS ----------------------

	for (const type of Object.keys(project.resources)) {

		for (const resource of project.resources[type]) {

			createMultimediaElement(type, resource.name);

		}

	}

}
