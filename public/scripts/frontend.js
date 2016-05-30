"use strict";

window.onload = initialize;

var inputField;
var previousQuestions = [];
var displayedPreviousQuestionIndex;
var currentUnsentMessage = "";

function initialize() {
    inputField = document.getElementById("question");
    inputField.addEventListener("keypress", onKeyPress);
    var form = inputField.parentNode;
    form.parentNode.appendChild(inputField);
    form.parentNode.removeChild(form);
    document.getElementById("conversation").scrollTop = 100000000;
    setupPreviousQuestions();
    inputField.placeholder = previousQuestions[previousQuestions.length - 1];
}

function setupPreviousQuestions() {
    var suggestions = [
        'What are the five biggest cities in Germany that have a female mayor?',
        'When was Jimmy Wales born?',
        'Who is the head of state of China?'
    ];
    previousQuestions = shuffle(suggestions);
    var questionElements = document.getElementsByClassName("question");
    for (var i=0; i< questionElements.length; i++) {
        previousQuestions.push(questionElements[i].textContent);
    }
    displayedPreviousQuestionIndex = previousQuestions.length;
}

function onKeyPress(event) {
    if (isArrowUpKey(event)) {
        retypePreviousQuestion();
        return false;
    }
    if (isArrowDownKey(event)) {
        retypeNextQuestion();
        return false;
    }
    if (isEnterKey(event)) {
        submitQuestion();
        return false;
    }
}

function isArrowUpKey(event) {
    return event.keyCode == 38;
}

function isArrowDownKey(event) {
    return event.keyCode == 40;
}

function isEnterKey(event) {
    return event.keyCode == 13;
}

function retypePreviousQuestion() {
    if (displayedPreviousQuestionIndex == previousQuestions.length) {
        currentUnsentMessage = inputField.value;
    }
    displayedPreviousQuestionIndex = Math.max(0, displayedPreviousQuestionIndex - 1);
    if (previousQuestions[displayedPreviousQuestionIndex]) {
        setTimeout(function() {inputField.value = previousQuestions[displayedPreviousQuestionIndex];}, 0);
    }
}

function retypeNextQuestion() {
    displayedPreviousQuestionIndex = Math.min(previousQuestions.length, displayedPreviousQuestionIndex + 1);
    if (displayedPreviousQuestionIndex < previousQuestions.length) {
        setTimeout(function() {inputField.value = previousQuestions[displayedPreviousQuestionIndex];}, 0);
    } else {
        setTimeout(function() {inputField.value = currentUnsentMessage;}, 0);
    }
}

function submitQuestion() {
    var questionText = inputField.value;
    previousQuestions.push(questionText);
    displayMessage(questionText, "question");
    submitApi(questionText);
    setTimeout(function() {inputField.value = "";}, 0);
    displayedPreviousQuestionIndex = previousQuestions.length;
    inputField.placeholder = previousQuestions[previousQuestions.length - 1];
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

function shuffle(array) {
    var counter = array.length;
    while (counter > 0) {
        var index = Math.floor(Math.random() * counter);
        counter--;
        var swapTemp = array[counter];
        array[counter] = array[index];
        array[index] = swapTemp;
    }
    return array;
}
