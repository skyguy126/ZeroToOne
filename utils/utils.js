'use strict';

const { spawn } = require('child_process');

async function generateLogos(idea, guid, db, winston) {

    const outputFolderPath = __dirname + "/../static/logos/" + guid;

    winston.info("outputFolder: " + outputFolderPath);
    winston.info("idea: " + idea);

    //
    // Spawn the python stable diffusion generator.
    //

    console.log('python', [__dirname + "/gen_logos.py", String(idea), guid, outputFolderPath]);
    const pythonProcess = spawn('python', [__dirname + "/gen_logos.py", String(idea), guid, outputFolderPath]);

    // Collect data from stdout
    pythonProcess.stdout.on('data', (data) => {
        console.log(data.toString());
    });

    // Collect error from stderr
    pythonProcess.stderr.on('data', (data) => {
       console.log(data.toString());
    });

    // When the process exits
    pythonProcess.on('close', (code) => {
        if (code === 0) {

            winston.info("image gen success");
            
            db.set(`requests.${guid}.output.logos`, [
                "/logos/" + guid + "/0.png",
                "/logos/" + guid + "/1.png",
                "/logos/" + guid + "/2.png"
            ]).write();

        } else {
            winston.error(`Process exited with code ${code}`);
        }
    });

    // implicitly returns a promise but we don't care about completion.
}

module.exports = {
    generateLogos
};