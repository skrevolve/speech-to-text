

class SpeechRecognitionApi{
    constructor(options){
        const SpeechToText = window.speechRecognition || window.webkitSpeechRecognition;
        this.speechApi = new SpeechToText();
        this.output = options.output ? options.output : document.createElement("div");
        this.speechApi.continuous = true;
        this.speechApi.interimResult = false;
        this.speechApi.onresult = (event) => {
            var resultIndex = event.resultIndex;
            var transcript = event.results[resultIndex][0].transcript;
            this.output.textContent += transcript;
        }
    }
    init(){
        this.speechApi.start();
    }
    stop(){
        this.speechApi.stop();
    }
}

window.onload = function(){
    var speech = new SpeechRecognitionApi({
        output: document.querySelector(".output")
    });
    document.querySelector(".btn_start").addEventListener("click", () =>{
        speech.init();
    })
    document.querySelector(".btn_end").addEventListener("click", () =>{
        speech.stop();
    })
}