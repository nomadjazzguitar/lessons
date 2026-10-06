class Metronome {

    ////////////////////////////////////////////////////////////
    // CONFIGURACIÓN DEL SINTETIZADOR
    ////////////////////////////////////////////////////////////

    static SYNTH_OPTIONS = {

        oscillator: {
            type: "square"
        },

        envelope: {
            attack: 0,
            decay: 0.02,
            sustain: 0,
            release: 0.02
        }

    };

    constructor() {

        ////////////////////////////////////////////////////////////
        // SINTETIZADOR
        ////////////////////////////////////////////////////////////

        this.synth = new Tone.Synth(Metronome.SYNTH_OPTIONS).toDestination();


        ////////////////////////////////////////////////////////////
        // ESTADO
        ////////////////////////////////////////////////////////////

        this.playing = false;

        this.event = null;

        this.beat = 1;

        this.subBeat = 1;

        this.beatsPerBar = 4;

        this.subdivision = 1;

	this.subBeatSound = false;

	////////////////////////////////////////////////////////////
	// CALLBACK
	////////////////////////////////////////////////////////////

	this.onBeat = null;

    }

    setVolume(db){

        this.synth.volume.value = db;

    }

    setBpm(bpm) {

//        Tone.Transport.bpm.rampTo(parseFloat(bpm),0.05);
	Tone.Transport.bpm.value = parseFloat(bpm);

    }

    setMeter(beats) {

        this.beatsPerBar = parseInt(beats);

        this.restart();

    }

    setSubdivision(subdivision) {

        this.subdivision = parseInt(subdivision);

        this.restart();

    }

    subdivisionFigure() {

        switch (this.subdivision) {

            case 1: return "4n";
            case 2: return "8n";
            case 3: return "8t";
            case 4: return "16n";
/*
            case 5: return Tone.Time('4n')/5;
            case 6: return "16t";
            case 7: return Tone.Time('4n')/7;
*/
            default: return "4n";

        }

    }

////////////////////////////////////////////////////////////
//
// START
//
////////////////////////////////////////////////////////////

start() {

    if (this.playing) return;

    this.beat = 1;
    this.subBeat = 1;
    this.playing = true;

    emitMetronomeBeat(1,1,"start");

    if (this.event !== null) {
        Tone.Transport.clear(this.event);
        this.event = null;
    }

    this.event = Tone.Transport.scheduleRepeat(
        (time) => this.tick(time),
        this.subdivisionFigure()
    );

    if (Tone.Transport.state !== "started")
        Tone.Transport.start();

}

    ////////////////////////////////////////////////////////////
    // STOP
    ////////////////////////////////////////////////////////////

stop() {

    this.playing = false;

    if (this.event !== null) {
        Tone.Transport.clear(this.event);
        this.event = null;
    }

    Tone.Transport.stop();
    Tone.Transport.position = 0;

    this.beat = 1;
    this.subBeat = 1;

    emitMetronomeBeat(1,1,"stop");

}

////////////////////////////////////////////////////////////
//
// RESTART
//
////////////////////////////////////////////////////////////

restart() {

	emitMetronomeBeat(1,1,"restart");

	if (!this.playing) return;

	this.stop();
	this.start();

}

    ////////////////////////////////////////////////////////////
    // CLICK
    ////////////////////////////////////////////////////////////

tick(time) {

	time = Math.max(0,time);

	const beat = this.beat, subBeat = this.subBeat;

	if (subBeat === 1) {

		this.synth.triggerAttackRelease(
			beat === 1 ? "C6" : "G5",
			"32n",
			time
		);

	} else if (this.subBeatSound) {

		this.synth.triggerAttackRelease(
			"E5",
			"32n",
			time
		);

	}

	Tone.Draw.schedule(() => {

		if (!this.playing) {
			return;
		}

		emitMetronomeBeat(beat,subBeat,"tick");

	}, time);

	if (++this.subBeat > this.subdivision) {

		this.subBeat = 1;

		if (++this.beat > this.beatsPerBar)
			this.beat = 1;

	}

}

}