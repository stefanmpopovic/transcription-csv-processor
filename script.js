globalStatistics = {};

const fileInput = document.getElementById('fileInput');

fileInput.addEventListener('change', function(e) {
	if (!fileInput.files || fileInput.files.length === 0) {
		alert('Select a file');
		return;
	}
	
	processFile();
});

function processFile() {
	const file = fileInput.files[0];
	const reader = new FileReader();

	reader.onload = function(event) {
		const contents = event.target.result;
		
		// Here you can call your processing function on 'contents'
		// For example:
		const processedData = processData(contents);
		App();

		// Create a new Blob with the processed data
		const processedBlob = new Blob([processedData], { type: 'text/csv' });

		// Create a temporary URL to the Blob
		const downloadLink = document.getElementById('downloadLink');
		downloadLink.href = URL.createObjectURL(processedBlob);
		
		const actionsDiv = document.getElementById('actions-div');
		actionsDiv.style.visibility = 'visible';
	};

	reader.readAsText(file);
}

function processData(text) {
	let csv = Papa.parse(text);
	let data = csv.data;
	
	let types = [];
	let participants = data.shift();
	
	// Clean and initialize data
	for (let i = 0; i < data.length; i++) {
		for (let j = 0; j < data[i].length; j++) {
			// Remove comments, punctuation, dashes, etc.
			data[i][j] = data[i][j].replace(/\(\(.*\)\)|\-|\(|\)|\!|\?|,|\./g, ' ').trim();
			
			var type = getType(data[i][j]);
			
			if (type && !types.includes(type)) {
				types.push(type);
			}
		}
	}
	
	types.push('Other');
		
	globalStatistics = calculateStatistics(data, participants, types);
	
	return getCsvResult(globalStatistics);
}

function getType(text) {
	let typeMatch = text.match(/\[[A-Z]{2}\]/i);
	return typeMatch ? typeMatch[0] : null;
}

function getCsvResult(statistics) {
	let result = [];
	
	result.push(['Participant', 'Type', 'Word']);
	
	for (let participant in statistics.participants) {
		for (let type in statistics.participants[participant].types) {
			let words = statistics.participants[participant].types[type].words.map(word => word.toUpperCase());
			
			if (words.length <= 0) {
				continue;
			}
			
			words.forEach(word => result.push([participant, type, word]));
		}
	}
	
	return Papa.unparse(result);
}

function calculateStatistics(data, participants, types) {
	let statistics = {
		participants: {},
		types: {},
		words: [],
		sentences: []
	};
	
	participants.forEach(participant => {
		statistics.participants[participant] = {
			types: types.reduce((acc, cur) => {
				acc[cur] = {
					words: [],
					sentences: []
				};
				
				return acc;
			}, {}),
			words: [],
			sentences: []
		};
	});
	
	types.forEach(type => {
		statistics.types[type] = {
			words: [],
			sentences: []
		};
	});
	
	for (let i = 0; i < data.length; i++) {
		for (let j = 0; j < data[i].length; j++) {
			let participant = participants[j];
			let type = getType(data[i][j]) || 'Other';
			let sentence = type === 'Other' ? data[i][j] : data[i][j].replace(type, '');
			let words = sentence.split(' ').filter(word => word);
			
			if (words.length <= 0) {
				continue;
			}
			
			statistics.words.push(...words);
			statistics.sentences.push(sentence);
			statistics.types[type].words.push(...words);
			statistics.types[type].sentences.push(sentence);
			statistics.participants[participant].types[type].words.push(...words);
			statistics.participants[participant].types[type].sentences.push(sentence);
			statistics.participants[participant].words.push(...words);
			statistics.participants[participant].sentences.push(sentence);
		}
	}
	
	return statistics;
}

function copyCsv() {
	navigator.clipboard.writeText(getCsvResult(globalStatistics));
}
