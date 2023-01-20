#!/usr/bin/env node

import chalk from "chalk";
import inquirer from "inquirer";
import gradient from "gradient-string";
import chalkAnimation from "chalk-animation";
import figlet from "figlet";
import { createSpinner } from "nanospinner";
import moment from "moment";
import cliProgress from 'cli-progress';
import colors from 'ansi-colors';
import soundEffects from "node-sound-effects";
import notifier from 'node-notifier'

import {initializeApp} from 'firebase/app'
import {getDatabase, ref, set, remove, get} from 'firebase/database'

const app = initializeApp({
    apiKey: "AIzaSyD0KyQwhRwTz-9faNJ1VQ0VxZZkxBwha2w",
    authDomain: "cli-pomodoro.firebaseapp.com",
    projectId: "cli-pomodoro",
    storageBucket: "cli-pomodoro.appspot.com",
    messagingSenderId: "1006523151356",
    appId: "1:1006523151356:web:60359700f913614224f879",
    measurementId: "G-RFF5DBVHMD",
    databaseURL: "https://cli-pomodoro-default-rtdb.europe-west1.firebasedatabase.app/"
});
const db = getDatabase(app)
let username;
const userDb = [];

// Declaring global constants
const SLEEP_DELAY = 2000;

let userTask, userTime, pomodoroTime, breakTime, timePassed;
let totalTimeOfThisSession = 0;

const sleep = (ms = SLEEP_DELAY) => new Promise(r => setTimeout(r, ms))

async function welcome() {
    playSound("error", 1)
    const msg = `Welcome  to

    CLI  Pomodoro`
    figlet(msg, (err, data) => {
        console.log(gradient.pastel.multiline(data))
    })
    await sleep();

    console.log(`
${chalk.gray(`This is a Pomodoro that works in your command line!
Created by Khoa Nguyen @https://github.com/hkhoa-ng

This Pomodoro can use your unique username to track the total time you
have spent working on different tasks!`)}.

============================================================
|              ${chalk.green(`Let's start working together!`)}               |
============================================================

${chalk.gray(`Please note that if you don't input your username in the
next step, you will share the same user data with other global users.`)}
    `)
}

async function askUserInformation() {
    const usernameAns = await inquirer.prompt({
        name: 'username',
        type: 'input',
        message: 'What is your username?',
        default() {
            return 'global user';
        }
    })
    username = usernameAns.username;
}

async function getDatabaseOfUsername() {
    const userRef = ref(db, `users/${username}/`);
    const spinner1 = createSpinner('Fetching user data...').start();
    await sleep(1000)
    const snapshot = await get(userRef);
    

    if (snapshot.val() === null) {
        spinner1.success({
            text: `Looks like you are a new user! Welcome to CLI Pomodoro, ${chalk.cyan(username)}!`
        })
        return;
    } else {
        spinner1.success({
            text: `Welcome back, ${chalk.cyan(username)}!`
        })
        Object.entries(snapshot.val()).forEach(([task, time]) => {
            userDb.push({
                task: task,
                time: time.minutes
            });
        })
        return;
    }
}

async function updateUserPomodoro() {
    const currentTaskData = userDb.find(task => task.task === userTask);
    const currentTaskTime = currentTaskData === undefined ? 0 : currentTaskData.time
    set(ref(db, `users/${username}/${userTask}`), {
        minutes: currentTaskTime + totalTimeOfThisSession,
    })
}

async function printUserDetails() {
    if (userDb.length !== 0) {
        console.log();
        const spinner1 = createSpinner('Fetching your Pomodoro history...').start();
        await sleep()
        spinner1.success({
            text: `${chalk.cyan(username)}, this is your Pomodoro history:`
        })
        userDb.forEach(task => {
            // The time total is stored in the DB as minutes, so we have to do some formatting here
            const taskName = task.task;
            const taskTime = task.time;
            const hours = Math.floor(taskTime / 60);
            const mins = taskTime % 60;
            const formatTaskTime = `${hours < 10 ? "0" : ""}${hours}h${mins < 10 ? "0" : ""}${mins}m`
            console.log(`  - ${chalk.cyan(taskName)} for a total of ${chalk.cyan(formatTaskTime)}`)
        })
    }
}

async function askPomodoroDetails() {
    console.log();
    const spinner1 = createSpinner('Starting Pomodoro...').start();
    await sleep()
    spinner1.success({
        text: `==========================================================
|      Enter your ${chalk.green('Task')} and choose your ${chalk.green('Session Period')}.     |
|      Choose task in your data to keep working on it.     |
|      Choose a new task to start Pomodoro tracking.       |
|      Press ${chalk.green('Enter')} to start!                               |
============================================================
`
    })
    const taskAnswer = await inquirer.prompt({
        name: 'user_task',
        type: 'input',
        message: 'What are you working on today?',
        default() {
            return 'coding';
        }
    })
    const timeAnswer = await inquirer.prompt({
        name: 'user_time',
        type: 'list',
        message: 'Choose your Pomodoro period:',
        choices: [
            '25-minute work, 5-minute break',
            '50-minute work, 10-minute break'
        ]
    })
    const str = taskAnswer.user_task;

    userTask = str.toLowerCase();
    userTime = timeAnswer.user_time;
    timePassed = 0;
    if (userTime === '25-minute work, 5-minute break') {
        pomodoroTime = 25*60;
        breakTime = 5*60;
    } else {
        pomodoroTime = 50*60;
        breakTime = 10*60;
    }
}

async function handleInput() {
    const spinner1 = createSpinner('Creating session...').start();
    
    await sleep(1000)
    await playSound("change");
    spinner1.success({
        text: `A ${chalk.cyan(userTime)} session for ${chalk.cyan(userTask)} created at ${moment().format('hh:mm A')}!`
    })
    const spinner2 = createSpinner('Starting session...').start();
    
    await sleep(1000)
    await playSound("change");
    spinner2.success({
        text: `Session started!`
    })
    await sleep();
    await playSound("upload", 3);
}

function displayName() {
    const msg = `CLI Pomodoro`
    figlet(msg, (err, data) => {
        console.log(gradient.pastel.multiline(data))
    })
}

function pomodoroClock(isWorking) {
    
    console.clear();
    displayName()
    let now = moment().format('hh:mm A');
    console.log();

    const status = isWorking ? `++ We are ${chalk.cyan(userTask)} 💪...` : `++ We are ${chalk.cyan('Having a Break')} 🍵...`;
    const barTime = isWorking ? pomodoroTime : breakTime;
    console.log(status);
    
    const mins = Math.floor(timePassed / 60) < 10 ? `0${Math.floor(timePassed / 60)}` : `${Math.floor(timePassed / 60)}`
    const secs = (timePassed % 60) < 10 ? `0${(timePassed % 60)}` : `${(timePassed % 60)}`

    console.log();

    const b1 = new cliProgress.SingleBar({
        format: `++ ${now} - ${mins}m${secs}s/${barTime / 60}m |` + colors.cyan('{bar}') + '| {percentage}%',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
    });
    b1.start(400, timePassed / barTime * 400, {
        speed: "N/A"
    });

    const totalTimeInSecs = isWorking ? totalTimeOfThisSession * 60 + timePassed : totalTimeOfThisSession * 60;
    const totalH = Math.floor(totalTimeInSecs / 3600) < 10 ? `0${Math.floor(totalTimeInSecs / 3600)}` : `${Math.floor(totalTimeInSecs / 3600)}`
    const totalM = Math.floor(totalTimeInSecs / 60) < 10 ? `0${Math.floor(totalTimeInSecs / 60)}` : `${Math.floor(totalTimeInSecs / 60)}`
    const totalS = (totalTimeInSecs % 60) < 10 ? `0${(totalTimeInSecs % 60)}` : `${(totalTimeInSecs % 60)}`

    console.log(`

++ You have been ${chalk.cyan(userTask)} for a total of ${chalk.cyan(`${totalH}h${totalM}m${totalS}s`)} in this session.
   Keep up the great job!
    `);
    console.log(`++ If you want to stop ${chalk.cyan('CLI Pomodoro')}, just press ${chalk.red('Ctrl + C')}!`);
    timePassed += 1;
}

async function notification(isWorking) {
    
    console.clear();
    displayName();
    const msg = isWorking ? `
    ========================================
    |  You did great! Let's have a break!  |
    ========================================
    ` : `
    ================================================
    |  What a nice break! Let's get back to work!  |
    ================================================
    `
    const noti = chalkAnimation.rainbow(msg);
    await playSound("upload", 3);
    
    await sleep(5000);
    noti.stop();
}

async function pomodoro() {
    pomodoroClock(true);
    if (timePassed > pomodoroTime) {
        totalTimeOfThisSession += pomodoroTime/60;
        updateUserPomodoro()
        timePassed = 0;
        notifier.notify({
            title: 'CLI Pomodoro',
            message: `Great work! Let's have break!`,
            closeLabel: 'Got it!',
            wait: true,
            // sound: true
        });
        await notification(true);
        breaking();
    } else {
        setTimeout(pomodoro, 1000);
    }
}

async function breaking() {
    pomodoroClock(false);
    if (timePassed > breakTime) {
        timePassed = 0;
        notifier.notify({
            title: 'CLI Pomodoro',
            message: `Time to get back to work!`,
            closeLabel: 'Got it!',
            wait: true,
            // sound: true
        });
        await notification(false);
        pomodoro();
    } else {
        setTimeout(breaking, 1000);
    }
}

async function playSound(sound, repeat=1) {
    for (let i = 0; i < repeat; i++) {
        soundEffects.play(sound);
        await sleep(500);
    }
}

console.clear();
await welcome();
await askUserInformation();
await getDatabaseOfUsername();
await printUserDetails();
await askPomodoroDetails();
await handleInput();
await pomodoro();
