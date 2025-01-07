require.config({ paths: { vs: "node_modules/monaco-editor/min/vs" } });

window.MonacoEnvironment = {
  getWorkerUrl: function (moduleId, label) {
    const blob = new Blob(
      [
        `
        self.MonacoEnvironment = {
            baseUrl: 'node_modules/monaco-editor/min/'
        };
        importScripts('node_modules/monaco-editor/min/vs/base/worker/workerMain.js');
        `,
      ],
      { type: "application/javascript" }
    );
    return URL.createObjectURL(blob);
  },
};

let editor;
let isExecuting = false;

require(["vs/editor/editor.main"], function () {
  const container = document.getElementById("container");
  editor = monaco.editor.create(container, {
    value: `<?php\n//write your code here
$user = User::find(1);
echo $user->name;`,
    language: "php",
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    theme: 'vs-dark',
    fontSize: 14,
    lineNumbers: 'on',
    renderWhitespace: 'none',
    tabSize: 4,
    wordWrap: 'on'
  });

  const runCodeButton = document.getElementById("run-code");
  const outputContainer = document.getElementById("output-container");

  runCodeButton.addEventListener("click", () => {
    if (isExecuting) return;
    
    isExecuting = true;
    const code = editor.getValue();
    
    runCodeButton.disabled = true;
    outputContainer.textContent = "Running...";

    window.nodeAPI.runPHP(code, (result) => {
      if (result.error) {
        outputContainer.innerHTML = `<pre class="error">${result.error}</pre>`;
      } else if (result.output) {
        outputContainer.innerHTML = `<pre class="output">${result.output}</pre>`;
      } else {
        outputContainer.innerHTML = `<pre class="error">No output or unexpected error occurred</pre>`;
      }
      runCodeButton.disabled = false;
      isExecuting = false;
    });
  });

  // Optimized resize handler
  let resizeTimeout;
  const resizeEditor = () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const { width, height } = container.getBoundingClientRect();
      editor.layout({ width, height });
    }, 100);
  };

  const resizeObserver = new ResizeObserver(resizeEditor);
  resizeObserver.observe(container);

  // Cleanup on window unload
  window.addEventListener('unload', () => {
    resizeObserver.disconnect();
    editor.dispose();
  });
});

// Prevent all reload shortcuts
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R')) {
    e.preventDefault();
    return false;
  }
}, { capture: true });

const runCodeButton = document.getElementById("run-code");
runCodeButton.disabled = false; // Enable run button by default

// Restore directory selection button
const selectDirectoryButton = document.getElementById("select-project");
selectDirectoryButton.style.display = ''; // Show the button

selectDirectoryButton.addEventListener("click", async () => {
  try {
    const directory = await window.directoryAPI.selectDirectory();
    if (directory) {
      window.directoryAPI.updateTitle(directory);
      outputContainer.innerHTML = `<pre class="output">Selected Laravel project: ${directory}</pre>`;
    }
  } catch (error) {
    console.error("An error occurred while selecting a directory:", error);
    outputContainer.innerHTML = `<pre class="error">Error selecting directory: ${error.message}</pre>`;
  }
});
