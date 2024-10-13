'use strict';

const { spawn } = require('child_process');

async function fetchOffices(location, winston) {

    let data = "";
    let dataErr = "";

    winston.info("location: " + location);

    console.log('python', [__dirname + "/gen_office.py", String(location).replaceAll("\"", '')]);
    const pythonProcess = spawn('python', [__dirname + "/gen_office.py", String(location).replaceAll("\"", '')]);

    // Collect data from stdout
    pythonProcess.stdout.on('data', (chunk) => {
        data += chunk.toString();
    });

    pythonProcess.stderr.on('data', (chunk) => {
        dataErr += chunk.toString();
    });

    return new Promise(function(resolve, reject) {
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                winston.info("gen_office.py success");

                // need to clean up the returned data.
                data = data.split("assistant:")[1].trim();
                data = JSON.parse(data);

                resolve(data);
            } else {
                winston.error(`Process exited with code ${code}`);
                
                console.log(dataErr);
                
                reject();
            }
        });
    });
}

async function fetchVcs(idea, location, winston) {

    let data = "";

    winston.info("idea: " + idea);
    winston.info("location: " + location);

    console.log('python', [__dirname + "/gen_vc.py", String(idea), String(location)]);
    const pythonProcess = spawn('python', [__dirname + "/gen_vc.py", String(idea), String(location)]);

    // Collect data from stdout
    pythonProcess.stdout.on('data', (chunk) => {
        data += chunk.toString();
    });

    return new Promise(function(resolve, reject) {
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                winston.info("vc_gen.py success");

                // need to clean up the returned data.
                data = data.split("assistant:")[1].trim();
                data = JSON.parse(data);

                resolve(data);
            } else {
                winston.error(`Process exited with code ${code}`);
                reject();
            }
        });
    });
}

async function generateLogos(idea, guid, db, winston) {
    
    // TODO: enable later
    return;

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
    fetchOffices,
    fetchVcs,
    generateLogos
};