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

// Declaring global constants
const SLEEP_DELAY = 2000;

let userTask, userTime, pomodoroTime, breakTime, timePassed;

const sleep = (ms = SLEEP_DELAY) => new Promise(r => setTimeout(r, ms))

async function welcome() {
    
    const msg = `Welcome  to

    CLI  Pomodoro`
    figlet(msg, (err, data) => {
        console.log(gradient.pastel.multiline(data))
    })
    // await playSound("error");
    await sleep();

    console.log(`
    ${chalk.gray(`This is a simple Pomodoro Application, that works in your command line!
    Created by Khoa Nguyen @https://github.com/hkhoa-ng`)}

    ============================================================
    |  ${chalk.blue(`Let's start working together!`)}                           |
    |  Enter your ${chalk.blue('Task')} and choose your ${chalk.blue('Session Period')}          |
    |  Then press ${chalk.blue('Enter')} to start!                              |
    |                                                          |
    |  ${chalk.blue('CLI Pomodoro')} will play a sound and show a notification  |
    |  when work/break time's up. Something like this!         |
    ============================================================
    `)
    notifier.notify({
        title: 'CLI Pomodoro',
        message: `This is a notification!`,
        closeLabel: 'Got it!',
        sound: true,
        wait: true,
    });
    await playSound("upload", 3);
}

async function askInformation() {
    const taskAnswer = await inquirer.prompt({
        name: 'user_task',
        type: 'input',
        message: 'What are you working on today?',
        default() {
            return 'Coding';
        }
    })
    const timeAnswer = await inquirer.prompt({
        name: 'user_time',
        type: 'list',
        message: 'Choose your Pomodoro period:',
        choices: [
            '25-minute session, 5-minute break',
            '50-minute session, 10-minute break'
        ]
    })

    userTask = taskAnswer.user_task;
    userTime = timeAnswer.user_time;
    timePassed = 0;
    if (userTime === '25-minute session, 5-minute break') {
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
        text: `A ${userTime} session is created for you at ${moment().format('hh:mm A')}!`
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

    console.log(`
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
        timePassed = 0;
        notifier.notify({
            title: 'CLI Pomodoro',
            message: `Great work! Let's have break!`,
            closeLabel: 'Got it!',
            wait: true,
            sound: true
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
            sound: true
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
await askInformation();
await handleInput();
await pomodoro();