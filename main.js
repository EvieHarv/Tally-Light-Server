import pkg from 'serialport';
const SerialPort = pkg;

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { Atem } = require('atem-connection')
const myAtem = new Atem()
function atemLog(msg){ console.log('Atem Log:', msg); }
function atemErr(msg){ console.error('Atem Error:', msg); }
myAtem.on('info', atemLog)
myAtem.on('error', atemErr)

myAtem.connect('192.168.168.240')

myAtem.on('connected', () => {
    console.log('Atem Connected')
})


let port;

let portList;
await SerialPort.list().then(ports=>{ portList = ports; } , err=>console.log(err))

// Find pico
let portPath;
portList.forEach(port => {
    if (port.vendorId == "2E8A") // Pico Vendor ID
    {
        portPath = port.path;
    };
});

port = new SerialPort(portPath, {
    baudRate: 115200
})

console.log('Connected to serial on', portPath);

const convert = (from, to) => str => Buffer.from(str, from).toString(to);
const hexToUtf8 = convert('hex', 'utf8');

// Read data that is available but keep the stream in "paused mode"
port.on('readable', function () {
    const data = port.read();
    process.stdout.write(hexToUtf8(data));
});

// Open errors will be emitted as an error event
port.on('error', function(err) {
    console.log('Error: ', err.message);
});

function writeNum(num)
{
    port.write(num.toString() + '\r');
}

function setOnlineCam(num){ if (num >= 0 && num <= 6) { writeNum(num); } else { throw new Error(num + ' not in valid camera range.'); } }
function setPreviewCam(num){  if (num >= 0 && num <= 6) { writeNum(num + 7); } else { throw new Error(num + ' not in valid camera range.'); } }

setTimeout(function(){ setOnlineCam(0); }, 100)
setTimeout(function(){ setPreviewCam(0); }, 100)


myAtem.on('stateChanged', (state, path) => {
    console.log(state) // catch the ATEM state.
    console.log(path) // state change path.

    if(!state || !state.video || !state.video.mixEffects || !state.video.mixEffects[0]) return;

    const preview = state.video.mixEffects[0].previewInput;
    const program = state.video.mixEffects[0].programInput;

    console.log('Setting Online Camera to', programInput)
    setOnlineCam(programInput);
    console.log('Setting Preview Camera to', previewInput)
    setPreviewCam(previewInput)
})