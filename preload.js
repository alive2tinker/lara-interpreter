const { exec } = require('child_process');
const { writeFileSync, unlinkSync } = require('fs');
const { contextBridge } = require('electron');
const path = require('path');

contextBridge.exposeInMainWorld('nodeAPI', {
    runPHP: (code, callback) => {
        const tempFilePath = path.join(__dirname, 'temp.php');

        try {
            // Write code to a temporary PHP file
            writeFileSync(tempFilePath, code);
            console.log(tempFilePath);
            console.log("code right before execution");
            // Execute the PHP file
            exec(`php "${tempFilePath}"`, (error, stdout, stderr) => {
                unlinkSync(tempFilePath); // Delete the temp file after execution

                if (error) {
                    callback({ error: stderr });
                    return;
                }
                callback({ output: stdout });
            });
        } catch (err) {
            callback({ error: `File system error: ${err.message}` });
        }
    },
});
