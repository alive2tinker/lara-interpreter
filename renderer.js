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

require(["vs/editor/editor.main"], function () {
  const container = document.getElementById("container");
  const editor = monaco.editor.create(container, {
    value: `<?php
//write your code here`,
    language: "php",
  });

  const runCodeButton = document.getElementById("run-code");
  const outputContainer = document.getElementById("output-container");

  runCodeButton.addEventListener("click", () => {
    let code = editor.getValue();

    //   // Remove '<?php' and '?>' tags
    //   code = code.replace(/^<\?php\s*/, "").replace(/\?>\s*$/, "");

    //   // Remove single-line and multi-line comments
    //   code = code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "");

    //   // Trim whitespace to clean any leading/trailing empty lines
    //   code = code.trim();

    // Clear previous output
    outputContainer.textContent = "Running...";

    // Use the exposed Node.js API
    window.nodeAPI.runPHP(code, (result) => {
      if (result.error) {
        outputContainer.innerHTML = `<pre style="color: red;">${result.error}</pre>`;
      } else {
        outputContainer.innerHTML = `<pre>${result.output}</pre>`;
      }
    });
  });
  const resizeEditor = () => {
    const { width, height } = container.getBoundingClientRect();
    editor.layout({ width, height });
  };

  window.addEventListener("resize", resizeEditor);
  resizeEditor();
});

const selectDirectoryButton = document.getElementById("select-project");

selectDirectoryButton.addEventListener("click", async () => {
  try {
    const directory = await window.directoryAPI.selectDirectory();

    console.log("updating title to: ", directory);
  
    window.directoryAPI.updateTitle(directory);

    console.log("Selected directory:", directory);
  } catch (error) {
    console.error("An error occurred while selecting a directory:", error);
  }
});
