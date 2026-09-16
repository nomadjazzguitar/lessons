class MusicPlayer {

	constructor(instrument, metronome) {

		this.instrument = instrument;
		this.metronome = metronome;
		this.part = null;
		this.playing = false;
		this.gate = null;
		this.repeticiones = 2;
		this.metronomeOn = false;
		this.autoMetronome = false;
		this.stopEvent = null;
		this.repeatEvents = [];
		this.countInEvent = null;
		this.countInBars = 0;
		this.swingFeel = false;
		this.swingAmount = 0.66;

		////////////////////////////////////////////////////////////
		// BUFFER
		////////////////////////////////////////////////////////////

		this.lastNotes = null;
		this.lastMode = null;

	}

	////////////////////////////////////////////////////////////
	// CONFIGURACIÓN
	////////////////////////////////////////////////////////////

	setCountInBars(bars) {

		this.countInBars = parseInt(bars, 10);

	}

	setRepeticiones(repeats) {

		this.repeticiones = parseInt(repeats, 10);

	}

	setGate(gate) {

		const step = Tone.Time(this.metronome.subdivisionFigure()).toSeconds();
		this.gate = step * (parseInt(gate, 10) / 100);

	}

	setInstrumentVolume(db) {

		this.instrument.volume.value = db;

	}

	setMetronomeOn(enabled) {

		this.metronomeOn = enabled;

	}

	setSwingFeel(value) {

		this.swingFeel = value;

	}

	////////////////////////////////////////////////////////////
	// ACENTOS
	////////////////////////////////////////////////////////////

	getVelocity(beat, subBeat) {

		if (this.swingFeel && this.metronome.subdivision === 2) {

			if (beat === 1 && subBeat === 1) return 0.90;
			if (subBeat === 2) return 1.00;

			return 0.85;

		}

		if (beat === 1 && subBeat === 1) return 1.00;
		if (subBeat === 1) return 0.90;

		return 0.65;

	}

	////////////////////////////////////////////////////////////
	// CUENTA ATRÁS
	////////////////////////////////////////////////////////////

	startWithCountIn(callback) {

		if (this.countInBars <= 0 || !this.metronomeOn) {

			callback();
			return;

		}

		if (this.countInEvent !== null) {

			Tone.Transport.clear(this.countInEvent);
			this.countInEvent = null;

		}

		Tone.Transport.stop();
		Tone.Transport.position = 0;

		let beat = 1;

		const totalBeats = this.metronome.beatsPerBar * this.countInBars;

		this.countInEvent = Tone.Transport.scheduleRepeat(

			(time) => {

				if (beat === 1) {

					this.metronome.synth.triggerAttackRelease("C6", "32n", time);

				} else {

					this.metronome.synth.triggerAttackRelease("G5", "32n", time);

				}

				beat++;

				if (beat > this.metronome.beatsPerBar) {
					beat = 1;
				}

			},

			"4n"

		);

		const endTime = Math.max(
			0,
			Tone.Time("4n").toSeconds() * totalBeats
		);

		Tone.Transport.scheduleOnce(

			() => {

				if (this.countInEvent !== null) {

					Tone.Transport.clear(this.countInEvent);
					this.countInEvent = null;

				}

				Tone.Transport.stop();
				Tone.Transport.position = 0;

				callback();

			},

			endTime

		);

		Tone.Transport.start();

	}

	////////////////////////////////////////////////////////////
	// RESTART
	////////////////////////////////////////////////////////////

	restart() {

		if (!this.playing) return;

		if (this.lastMode === "sequence") {

			this.playSequence(this.lastNotes);

		} else if (this.lastMode === "chord") {

			this.playChord(this.lastNotes);

		}

	}

	////////////////////////////////////////////////////////////
	// PLAY
	////////////////////////////////////////////////////////////

	playSequence(listaNotas) {

		this.playEvents(listaNotas, "sequence");

	}

	playChord(chordArray) {

		this.playEvents(chordArray, "chord");

	}

	playEvents(items, mode) {

		this.stop(false);

		this.lastNotes = [...items];
		this.lastMode = mode;

		const stepSeconds = Tone.Time(this.metronome.subdivisionFigure()).toSeconds();
		const gate = this.gate;
		const stepsPerBar = this.metronome.beatsPerBar * this.metronome.subdivision;
		const totalBars = Math.max(1, Math.ceil(items.length / stepsPerBar));
		const eventos = [];

		let tiempo = 0;

		for (let i = 0; i < items.length; i++) {

			const beat =
				Math.floor(i / this.metronome.subdivision) %
				this.metronome.beatsPerBar + 1;

			const subBeat = i % this.metronome.subdivision + 1;

			eventos.push([
				Math.max(0, tiempo),
				{ value: items[i], beat, subBeat }
			]);

			if (this.swingFeel && this.metronome.subdivision === 2) {

				tiempo += subBeat === 1
					? stepSeconds * (this.swingAmount * 2)
					: stepSeconds * ((1 - this.swingAmount) * 2);

			} else {

				tiempo += stepSeconds;

			}

		}

		const duracion = Math.max(
			0,
			stepsPerBar * totalBars * stepSeconds
		);

		this.part = new Tone.Part(

			(time, data) => {

				Tone.Draw.schedule(
					() => emitPlayerBeat(data.beat, data.subBeat, "tick"),
					time
				);

				this.instrument.triggerAttackRelease(
					data.value,
					gate,
					time,
					this.getVelocity(data.beat, data.subBeat)
				);

			},

			eventos

		);

		this.part.loop = true;
		this.part.loopStart = 0;
		this.part.loopEnd = duracion;
		this.part.start(0);

		this.repeatEvents = [];

		for (let r = 1; r <= this.repeticiones; r++) {

			const repeatTime = Math.max(0, duracion * (r - 1));

			this.repeatEvents.push(
				Tone.Transport.scheduleOnce(
					() => emitPlayerBeat(1, 1, "repeat", r),
					repeatTime
				)
			);

		}

		Tone.Transport.position = 0;
		Tone.Transport.loop = false;

		if (this.stopEvent !== null) {

			Tone.Transport.clear(this.stopEvent);
			this.stopEvent = null;

		}

		const stopTime = Math.max(
			0,
			duracion * this.repeticiones
		);

		this.stopEvent = Tone.Transport.scheduleOnce(

			() => {

				this.stopEvent = null;

				emitPlayerBeat(1, 1, "end");

				this.stop(false);

			},

			stopTime

		);

		if (this.metronomeOn) {

			this.autoMetronome = true;
			this.metronome.start();

		} else {

			this.autoMetronome = false;

		}

		if (Tone.Transport.state !== "started") {
			Tone.Transport.start();
		}

		this.playing = true;

	}

	////////////////////////////////////////////////////////////
	// PLAY TEMPORAL
	////////////////////////////////////////////////////////////

	async playNoteFor(note, duration = 2) {

		this.stop(false);

		this.playing = true;

		try {

			await Tone.start();

			this.instrument.triggerAttack(note);

			await new Promise(resolve => {

				setTimeout(resolve, duration * 1000);

			});

			this.instrument.triggerRelease(note);

		} catch (error) {

			console.error("Error al reproducir la nota:", error);

		}

		this.playing = false;

	}

	async playChordFor(chord, duration = 2) {

		this.stop(false);

		this.playing = true;

		try {

			await Tone.start();

			chord.forEach(note => {

				this.instrument.triggerAttack(note);

			});

			await new Promise(resolve => {

				setTimeout(resolve, duration * 1000);

			});

			chord.forEach(note => {

				this.instrument.triggerRelease(note);

			});

		} catch (error) {

			console.error("Error al reproducir el acorde:", error);

		}

		this.playing = false;

	}

	////////////////////////////////////////////////////////////
	// STOP
	////////////////////////////////////////////////////////////

	stop(emitEvent = true) {

		if (this.stopEvent !== null) {

			Tone.Transport.clear(this.stopEvent);
			this.stopEvent = null;

		}

		if (this.repeatEvents) {

			this.repeatEvents.forEach(id => Tone.Transport.clear(id));
			this.repeatEvents = [];

		}

		if (this.countInEvent !== null) {

			Tone.Transport.clear(this.countInEvent);
			this.countInEvent = null;

		}

		Tone.Transport.stop();
		Tone.Transport.position = 0;

		if (this.part) {

			try {
				this.part.stop(0);
			} catch (error) {
				console.warn("Error al detener Tone.Part:", error);
			}

			try {
				this.part.dispose();
			} catch (error) {
				console.warn("Error al liberar Tone.Part:", error);
			}

			this.part = null;

		}

		if (this.audioPlayer) {

			try {
				this.audioPlayer.stop(0);
			} catch (error) {
				console.warn("Error al detener audioPlayer:", error);
			}

			try {
				this.audioPlayer.dispose();
			} catch (error) {
				console.warn("Error al liberar audioPlayer:", error);
			}

			this.audioPlayer = null;

		}

		if (this.autoMetronome) {
			this.metronome.stop();
		}

		this.autoMetronome = false;
		this.playing = false;

		if (emitEvent) {
			emitPlayerBeat(1, 1, "stop");
		}

	}

}