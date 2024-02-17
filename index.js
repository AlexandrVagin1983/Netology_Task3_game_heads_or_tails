#!/usr/bin/env node
"use strict"; 

function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
  }
  
function formatDate(date) {
   return (
    [
    date.getFullYear(),
    padTo2Digits(date.getMonth() + 1),
    padTo2Digits(date.getDate()),
    ].join('-') +
    ' ' +
    [
    padTo2Digits(date.getHours()),
    padTo2Digits(date.getMinutes()),
    padTo2Digits(date.getSeconds()),
    ].join(':')
   );
}

//Генерирует случайно число в заданном диапазоне:
const generateNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
    }

//Запрашивает у пользователя число:
const getUserNumber = async () => {
    const readline = require('node:readline/promises');
    const { stdin: input, stdout: output } = require('node:process');
    const rl = readline.createInterface({ input, output });
    const number = await rl.question('Орел 1, решка 2? (a/abort прервать): ');
    rl.close();
    return number;
   } 

//Выполняет одну итерацию игры в орел и решка - запрашивает число у пользователя и получает ответ:
const runGame = async function () {
    
    let number = generateNumber (1, 2) // генерируем случайное число
    //Запрашиваем у пользователя число:
    let userNumber = await getUserNumber();
    //Сверяем введенное пользователем число с выбранным случайно:      
    if (userNumber == 'a' || userNumber == 'abort') {
        console.log('Завершение игры.');
        return {'randomNuber': userNumber, 'inputUser': 'abort', 'result': 'Пользователь завершил игру.'}; 
    }
    if (isNaN(userNumber)) {
        console.log('Необходимо указывать числовое значение.');
        return {'randomNuber': number, 'inputUser': userNumber, 'result': 'Необходимо указывать числовое значение.'};
    }
    if (+userNumber == number) {
        console.log('Верно.');
        return {'randomNuber': number, 'inputUser': userNumber, 'result': 'Пользователь угадал загаданное число.'};
    }
    else {
        console.log('Неверно.');
        return {'randomNuber': number, 'inputUser': userNumber, 'result': 'Пользователь не угадал загаданное число.'};
    }   
}

//Записываем переданную строку в файл в "синронном" режиме:
function writeStringToFile(data, writeStream) {
    return new Promise((resolve, reject) => {        
        writeStream.write(data, 'utf-8', (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });s
}

const startGame  = async (logPreviosGame, fileName) => {
    
    //создаем поток для записы данных в файл fileName
    const writeStream  = require('fs').createWriteStream(fileName);

    //Переносим данные о предыдущих играх в файл:
    await writeStringToFile (logPreviosGame, writeStream);

    //Записываем старт игры:
    await writeStringToFile (`Начало новой игры: ${ formatDate(new Date()) } \n`, writeStream);

    //Начинаем игру Орел или Решка:
    let gameResult = {'randomNuber':0, 'inputUser':0, 'result': ''};
    do {
        gameResult = await runGame();
        //Записываем результат текущей итерации:
        await writeStringToFile (`  Случайное чило: ${ gameResult['randomNuber']}. Ввод пользователя: ${ gameResult['inputUser']}. Результат: ${ gameResult['result']}.\n`, writeStream);
        
    }
    while (gameResult['inputUser'] !== 'abort')

    //Запсываем окончание игры:
    await writeStringToFile (`Окончание игры: ${ formatDate(new Date()) } \n\n`, writeStream);
}

//Для получения агрументов консольного вызова в виде объекта используем библиотеку yargs
const yargs = require('yargs/yargs')
const hideBin  = require('yargs/helpers').hideBin;

//Описываем настройки агрументов командной строки: 
const argv = yargs(hideBin(process.argv))
.option('file', { //создаем альясы для запланированных действий:
    alias: "f", 
    description: "Имя файла для сохранения статистики. Формат: something.txt. Example: game -f logGame.txt",
    type: "string",
    })
.alias('help', 'h') //Добавим альяс для help
.argv;

//Проверяем что параметры были указаны корректно
if  (!argv.hasOwnProperty('file')) {
    console.log('Не был указан параметр -f. Пример корректного вызова: game -f logGame.txt');
    return;
}
 //Определяеем файл в который будем помещать логи игры:
 const fileName = argv['file'];
 if (!fileName) {
    console.log('В параметр -f было переданно пустое имя файла. Пример корректного вызова: game -f logGame.txt');
    return;
 }
 //Нужно чтобы каждый запуск новой игры не перезаписывал файл с логами, а дописывал новую игру к старым логам, поэтому прочитаем содержимое файла если он существует:
 const fs = require('fs');
 let data = '';
 const readerStream = fs.createReadStream(fileName);
 readerStream
 .setEncoding('UTF8')
 .on('data', (chank) =>{
     data += chank
 })
 .on('error', () => {
     //файл не существует, поэтому переносить данные из старого файла нет необходимости:
     startGame('', fileName);
 })
 .on('end', () => {
     //Файл существует его содержимое находится в переменной data, запускам новую игру:
     startGame(data, fileName);
 })
