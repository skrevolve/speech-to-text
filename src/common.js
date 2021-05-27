let selected_method;
let isHotfixMode = false;

let final_transcript = '';
let recognizing = false;
let ignore_onend;
let start_timestamp;

let two_line = /\n\n/g;
let one_line = /\n/g;

let current_sentence = null;

let first_char = /\S/;
let iter_cnt = 0;
let results = [];

for (let i = 0; i < langs.length; i++) {
    select_language.options[i] = new Option(langs[i][0], i);
}

for (let i = 0; i < methods.length; i++) {
    select_method.options[i] = new Option(methods[i][0], i);
}

select_language.selectedIndex = 0;
updateCountry();
select_dialect.selectedIndex = 0;
select_method.selectedIndex = 1;
updateMethod();
showInfo('info_start');
showRandomSentence(false);

function updateMethod() {
    selected_method = methods[select_method.selectedIndex][0];

    console.log(selected_method);

    if (selected_method === 'Traditional') {
        showHotfixButton('none');
    } else {
        showHotfixButton('inline-block');
    }
    showInputWindow(selected_method);
}

function updateCountry() {
    for (let i = select_dialect.options.length - 1; i >= 0; i--) {
        select_dialect.remove(i);
    }
    let list = langs[select_language.selectedIndex];
    for (let i = 1; i < list.length; i++) {
        select_dialect.options.add(new Option(list[i][1], list[i][0]));
    }
    select_dialect.style.visibility = list[1].length == 1 ? 'hidden' : 'visible';
}


if (!('webkitSpeechRecognition' in window)) {
    upgrade();
} else {
    start_button.style.display = 'inline-block';
    var recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = function() {
        recognizing = true;
        showInfo('info_speak_now');
        start_img.src = 'resource/mic-animate.gif';
    };

    recognition.onerror = function(event) {
        if (event.error == 'no-speech') {
            start_img.src = 'resource/mic.gif';
            showInfo('info_no_speech');
            ignore_onend = true;
        }
        if (event.error == 'audio-capture') {
            start_img.src = 'resource/mic.gif';
            showInfo('info_no_microphone');
            ignore_onend = true;
        }
        if (event.error == 'not-allowed') {
            if (event.timeStamp - start_timestamp < 100) {
                showInfo('info_blocked');
            } else {
                showInfo('info_denied');
            }
            ignore_onend = true;
        }
    };

    recognition.onend = function() {
        recognizing = false;
        if (ignore_onend) {
            return;
        }
        start_img.src = 'resource/mic.gif';
        if (!final_transcript) {
            showInfo('info_start');
            return;
        }
        showInfo('');

        if (window.getSelection) {
            window.getSelection().removeAllRanges();
            let range = document.createRange();
            range.selectNode(document.getElementById('final_span'));
            window.getSelection().addRange(range);
        }
    };

    recognition.onresult = function(event) {
        if (selected_method === 'Traditional') {
            let interim_transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final_transcript += event.results[i][0].transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }
            final_transcript = capitalize(final_transcript);

            final_span.innerHTML = addToInputText(final_transcript);
            interim_span.innerHTML = linebreak(interim_transcript);

            if (final_transcript || interim_transcript) {
                showNextButton('inline-block');
            }
        } else {
            final_transcript = '';
            let interim_transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final_transcript += event.results[i][0].transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }
            final_transcript = capitalize(final_transcript);

            if (isHotfixMode) {
                // hotfixInputText(document.getElementById("ours_span").innerHTML, final_transcript);
                hotfixText = final_transcript;
                interim_span.innerHTML = linebreak(interim_transcript);
            } else {
                appendToInputTextOurs(final_transcript);
                interim_span.innerHTML = linebreak(interim_transcript);
            }


            if (final_transcript || interim_transcript) {
                showNextButton('inline-block');
            }
        }

    };
}

let hotfixText = '';

function pauseRecording() {
    if (recognizing) {
        recognizing = false;
        recognition.stop();
    }
}

function upgrade() {
    start_button.style.visibility = 'hidden';
    showInfo('info_upgrade');
}

function addToInputText(final_transcript) {
    document.getElementById("final_span").value = final_transcript;
    return;
}

function addToInputTextOurs(final_transcript) {
    document.getElementById("ours_span").innerHTML = final_transcript;
    return;
}

function appendToInputTextOurs(final_transcript) {
    document.getElementById("ours_span").innerHTML = document.getElementById("ours_span").innerHTML + final_transcript;
    return;
}


function linebreak(s) {
    return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
}


function capitalize(s) {
    return s.replace(first_char, function(m) { return m.toUpperCase(); });
}

function submitButton() {
    saveResults();

    if (++iter_cnt === config.MAX_ITERATION) {
        showResults();
    } else {
        showRandomSentence(true);
    }

    if (selected_method === 'Traditional') {
        final_span.innerHTML = addToInputText('');
    } else {
        ours_span.innerHTML = addToInputTextOurs('');
    }
    final_transcript = '';
}

function retryButton() {
    final_transcript = '';
    iter_cnt = 0;
    recognition.lang = select_dialect.value;
    recognition.start();
    ignore_onend = false;
    final_span.innerHTML = '';
    interim_span.innerHTML = '';
    start_img.src = 'resource/mic-slash.gif';
    showInfo('info_allow');
    showNextButton('none');
    showRetryButton('none');
    start_timestamp = Date.now();
    experiment_result.innerHTML = '';
    showRandomSentence(true);
}

function showResults() {
    pauseRecording();
    showRetryButton('inline-block');
    showNextButton('none');
    experiment_result.innerHTML = 'Results: <br>' + JSON.stringify(results);
}

function parseResult(submitted, answer, time) {
    let res = {};
    console.log(submitted);
    console.log(answer);
    console.log(time);
    let words_submitted = submitted.split(' ');
    let words_answer = answer.split(' ');

    const word_cnt = words_answer.length;
    let word_correct = 0;

    console.log(words_submitted, words_answer);

    for (let idx in words_answer) {
        if (words_answer[idx] &&
            words_submitted[idx] &&
            words_answer[idx].toLowerCase() === words_submitted[idx].toLowerCase()) {
            word_correct++;
        }
    }

    res['accuracy'] = word_correct / word_cnt;
    res['time_diff'] = Date.now() - time;

    return res;
}

function saveResults() {
    const res = parseResult(final_span.value.trim(), current_sentence, start_timestamp)
    results.push(res);
}


 function showRandomSentence(show) {
    //  if (show === true) {
    //      const length = sentences.length;
    //      const randomSentence = sentences[Math.floor(Math.random()*length)];
    //      given_sentence.innerHTML = randomSentence;
    //      current_sentence = randomSentence;
    //  } else {
    //      given_sentence.innerHTML = '';
    //  }
}

function startButton() {
    if (recognizing) {
        recognition.stop();
        return;
    }
    final_transcript = '';
    recognition.lang = select_dialect.value;
    recognition.start();
    ignore_onend = false;
    final_span.innerHTML = '';
    interim_span.innerHTML = '';
    start_img.src = 'resource/mic-slash.gif';
    showInfo('info_allow');
    showNextButton('none');
    showRetryButton('none');
    start_timestamp = Date.now();
    experiment_result.innerHTML = '';
    showRandomSentence(true);
}

function hotfixButton() {
    console.log('hotfixButton click');

    final_transcript = '';

    if (isHotfixMode) {
        isHotfixMode = false;
        hotfix_button_img.src = 'resource/fix.png';
        appendToInputTextOurs(hotfixText);
    } else {
        isHotfixMode = true;
        hotfix_button_img.src = 'resource/fixing.png';
    }
}

function clearButton() {
    addToInputTextOurs('');
    final_transcript = '';
}

function showInfo(s) {
    if (s) {
        for (let child = info.firstChild; child; child = child.nextSibling) {
            if (child.style) {
                child.style.display = child.id == s ? 'inline' : 'none';
            }
        }
        info.style.visibility = 'visible';
    } else {
        info.style.visibility = 'hidden';
    }
}

function showNextButton(style) {
    submit_button.style.display = style;
}

function showRetryButton(style) {
    retry_button.style.display = style;
}

function showHotfixButton(style) {
    hotfix_img.style.display = style;
    clear_img.style.display = style;
}

function showInputWindow(type) {
    if (type === 'Traditional') {
        final_span.style.display = 'block';
        ours_span.style.display = 'none';
    } else {
        final_span.style.display = 'none';
        ours_span.style.display = 'block';
    }
}