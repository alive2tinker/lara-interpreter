const { exec } = require('child_process');
const { writeFileSync, unlinkSync, mkdirSync, existsSync } = require('fs');
const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

// Default Laravel installation path
let currentLaravelPath = path.join(__dirname, 'default');

contextBridge.exposeInMainWorld('directoryAPI', {
    selectDirectory: async () => {
        const directory = await ipcRenderer.invoke('select-directory');
        if (directory) {
            currentLaravelPath = directory;
        }
        return directory;
    },
    updateTitle: (directory) => {
        ipcRenderer.send('update-title', directory);
    },
});

contextBridge.exposeInMainWorld('nodeAPI', {
    runPHP: (code, callback) => {
        const tempFilePath = path.join(currentLaravelPath, '/', 'temp.php');

        // Wrap the code in a Laravel-aware PHP script
        const wrappedCode = `<?php
define('LARAVEL_START', microtime(true));

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
$kernel->bootstrap();

try {
    ${code}
} catch (Throwable $e) {
    echo "Error: " . $e->getMessage() . "\\n";
    echo "File: " . $e->getFile() . "\\n";
    echo "Line: " . $e->getLine() . "\\n";
    echo "Stack Trace:\\n" . $e->getTraceAsString();
}
`;

        try {
            // Ensure storage directory exists and is writable
            const storageDir = path.join(currentLaravelPath, 'storage');
            if (!existsSync(storageDir)) {
                mkdirSync(storageDir, { recursive: true, mode: 0o777 });
            }

            // Write the PHP file with proper permissions
            writeFileSync(tempFilePath, wrappedCode, { mode: 0o777 });

            // Get PHP path
            const phpCommand = process.platform === 'win32' ? 'php.exe' : 'php';
            const fullCommand = `${phpCommand} "${tempFilePath}"`;

            console.log('Executing command:', fullCommand);
            console.log('Working directory:', currentLaravelPath);

            // Execute PHP within the Laravel project directory
            exec(fullCommand, {
                cwd: currentLaravelPath,
                env: {
                    ...process.env,
                    PATH: process.env.PATH
                },
                maxBuffer: 1024 * 1024
            }, (error, stdout, stderr) => {
                try {
                    // unlinkSync(tempFilePath);
                } catch (e) {
                    console.error('Error deleting temp file:', e);
                }

                if (error) {
                    callback({ 
                        error: `PHP Execution Error:\n` +
                              `Command: ${fullCommand}\n` +
                              `Working Directory: ${currentLaravelPath}\n` +
                              `Error: ${error.message}\n` +
                              `Stderr: ${stderr}\n` +
                              `Exit Code: ${error.code}\n` +
                              `Temp File Path: ${tempFilePath}\n` +
                              `File Contents:\n${wrappedCode}`
                    });
                    return;
                }

                if (stderr) {
                    callback({ 
                        error: `PHP Warning/Notice:\n${stderr}\nCommand: ${fullCommand}`
                    });
                    return;
                }

                callback({ output: stdout || 'No output' });
            });
        } catch (err) {
            callback({ 
                error: `System Error:\n` +
                       `Message: ${err.message}\n` +
                       `Laravel Path: ${currentLaravelPath}\n` +
                       `Temp File: ${tempFilePath}\n` +
                       `Current Directory: ${process.cwd()}`
            });
        }
    }
});
