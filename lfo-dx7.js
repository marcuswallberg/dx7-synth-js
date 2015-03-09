var LfoDX7 = (function() {

	// Constants
	var LFO_FREQUENCY_TABLE = [
		0.062506,  0.124815,  0.311474,  0.435381,  0.619784,
		0.744396,  0.930495,  1.116390,  1.284220,  1.496880,
		1.567830,  1.738994,  1.910158,  2.081322,  2.252486,
		2.423650,  2.580668,  2.737686,  2.894704,  3.051722,
		3.208740,  3.366820,  3.524900,  3.682980,  3.841060,
		3.999140,  4.159420,  4.319700,  4.479980,  4.640260,
		4.800540,  4.953584,  5.106628,  5.259672,  5.412716,
		5.565760,  5.724918,  5.884076,  6.043234,  6.202392,
		6.361550,  6.520044,  6.678538,  6.837032,  6.995526,
		7.154020,  7.300500,  7.446980,  7.593460,  7.739940,
		7.886420,  8.020588,  8.154756,  8.288924,  8.423092,
		8.557260,  8.712624,  8.867988,  9.023352,  9.178716,
		9.334080,  9.669644, 10.005208, 10.340772, 10.676336,
		11.011900, 11.963680, 12.915460, 13.867240, 14.819020,
		15.770800, 16.640240, 17.509680, 18.379120, 19.248560,
		20.118000, 21.040700, 21.963400, 22.886100, 23.808800,
		24.731500, 25.759740, 26.787980, 27.816220, 28.844460,
		29.872700, 31.228200, 32.583700, 33.939200, 35.294700,
		36.650200, 37.812480, 38.974760, 40.137040, 41.299320,
		42.461600, 43.639800, 44.818000, 45.996200, 47.174400,
		47.174400, 47.174400, 47.174400, 47.174400, 47.174400,
		47.174400, 47.174400, 47.174400, 47.174400, 47.174400,
		47.174400, 47.174400, 47.174400, 47.174400, 47.174400,
		47.174400, 47.174400, 47.174400, 47.174400, 47.174400,
		47.174400, 47.174400, 47.174400, 47.174400, 47.174400,
		47.174400, 47.174400, 47.174400
	];
	var AMP_MOD_TABLE = [
		0.0, 0.784829, 0.819230, 0.855139, 0.892622, 0.931748,
		0.972589, 1.015221, 1.059721, 1.106171, 1.154658, 1.205270,
		1.258100, 1.313246, 1.370809, 1.430896, 1.493616, 1.559085,
		1.627424, 1.698759, 1.773220, 1.850945, 1.932077, 2.016765,
		2.105166, 2.197441, 2.293761, 2.394303, 2.499252, 2.608801,
		2.723152, 2.842515, 2.967111, 3.097167, 3.232925, 3.374633,
		3.522552, 3.676956, 3.838127, 4.006362, 4.181972, 4.365280,
		4.556622, 4.756352, 4.964836, 5.182458, 5.409620, 5.646738,
		5.894251, 6.152612, 6.422298, 6.703805, 6.997652, 7.304378,
		7.624549, 7.958754, 8.307609, 8.671754, 9.051861, 9.448629,
		9.862789, 10.295103, 10.746365, 11.217408, 11.709099,
		12.222341, 12.758080, 13.317302, 13.901036, 14.510357,
		15.146387, 15.810295, 16.503304, 17.226690, 17.981783,
		18.769975, 19.592715, 20.451518, 21.347965, 22.283705,
		23.260462, 24.280032, 25.344294, 26.455204, 27.614809,
		28.825243, 30.088734, 31.407606, 32.784289, 34.221315,
		35.721330, 37.287095, 38.921492, 40.627529, 42.408347,
		44.267222, 46.207578, 48.232984, 50.347169, 52.75
	];
	var PITCH_MOD_TABLE = [
		0, 0.0264, 0.0534, 0.0889, 0.1612, 0.2769, 0.4967, 1
	];
	var LFO_MODE_TRIANGLE = 0,
		LFO_MODE_SAW_DOWN = 1,
		LFO_MODE_SAW_UP = 2,
		LFO_MODE_SQUARE = 3,
		LFO_MODE_SINE = 4,
		LFO_MODE_SAMPLE_HOLD = 5;

	// Private static variables
	var phaseStep = 0;
	var modDepth = 0;
	var sampleHoldRandom = 0;

	// see https://github.com/smbolton/hexter/blob/621202b4f6ac45ee068a5d6586d3abe91db63eaf/src/dx7_voice.c#L1002
	function LfoDX7() {
		this.phase = 0;
		this.val = 0;
		this.counter = 0;
		LfoDX7.updateFrequency();
	}

	LfoDX7.prototype.render = function() {
		var amp;
		if (this.counter % LFO_RATE == 0) {
			switch (PARAMS.lfoWaveform) {
				case LFO_MODE_TRIANGLE:
					if (this.phase < PERIOD_HALF)
						amp = 4 * this.phase * PERIOD_RECIP - 1;
					else
						amp = 3 - 4 * this.phase * PERIOD_RECIP;
					break;
				case LFO_MODE_SAW_DOWN:
					amp = 1 - 2 * this.phase * PERIOD_RECIP;
					break;
				case LFO_MODE_SAW_UP:
					amp = 2 * this.phase * PERIOD_RECIP - 1;
					break;
				case LFO_MODE_SQUARE:
					amp = (this.phase < PERIOD_HALF) ? -1 : 1;
					break;
				case LFO_MODE_SINE:
					amp = Math.sin(this.phase);
					break;
				case LFO_MODE_SAMPLE_HOLD:
					amp = sampleHoldRandom;
					break;
			}

			this.val = Math.pow(modDepth, amp);
			this.phase += phaseStep;
			if (this.phase >= PERIOD) {
				sampleHoldRandom = 1 - Math.random() * 2;
				this.phase -= PERIOD;
			}
		}
		this.counter++;
		return this.val;
	};

	LfoDX7.updateFrequency = function() {
		var frequency = LFO_FREQUENCY_TABLE[PARAMS.lfoSpeed];
		phaseStep = PERIOD * frequency/LFO_RATE; // radians per sample
		modDepth = 1 + PITCH_MOD_TABLE[PARAMS.lfoPitchModSens] * (PARAMS.lfoPitchModDepth / 99);
		console.log("Lfo updateFrequency / lfoSpeed:", PARAMS.lfoSpeed, "freq:", frequency);
	};

	return LfoDX7;
})();