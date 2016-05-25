"use strict";

window.onload = initialize;

var inputField;

function initialize() {
    inputField = document.getElementById("question");
    inputField.addEventListener("keypress", onKeyPress);
    var form = inputField.parentNode;
    form.parentNode.appendChild(inputField);
    form.parentNode.removeChild(form);
    document.getElementById("conversation").scrollTop = 100000000;
    triangleBackground();
}

function onKeyPress(event) {
    if (isEnterKey(event)) {
        submitQuestion();
    }
    return false;
}

function isEnterKey(event) {
    return event.keyCode == 13;
}

function submitQuestion() {
    displayMessage(inputField.value, "question");
    submitApi(inputField.value);
    setTimeout(function() {inputField.value = "";}, 0);
}

function displayMessage(content, author) {
    var messageTextNode = document.createTextNode(content);
    var messageBubble = document.createElement("div");
    messageBubble.classList.add("message");
    messageBubble.classList.add(author);
    messageBubble.appendChild(messageTextNode);
    document.getElementById("conversation").appendChild(messageBubble);
    document.getElementById("conversation").scrollTop = 100000000;
}

function submitApi(questionText) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            displayInterpretationAndAnswer(JSON.parse(xhttp.responseText));
        }
    };
    xhttp.open("POST", "/ajax/");
    xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp.send(JSON.stringify({question:questionText}));
}

function displayInterpretationAndAnswer(result) {
    displayMessage(result.interpretation, "interpretation");
    displayMessage(result.answer, "answer");
}

function triangleBackground() {
    var pattern = Trianglify({
        width: window.innerWidth,
        height: window.innerHeight,
        stroke_width: 0.7,
        x_colors: 'PRGn'
    });
    document.body.appendChild(pattern.svg());
}
