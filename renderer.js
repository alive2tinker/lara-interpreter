import { createApp } from 'vue'
import MonacoEditor from './components/MonacoEditor.vue'

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

const app = createApp({
  data() {
    return {
      editor: null,
      isExecuting: false,
      isModalOpen: false,
      settings: {
        fontSize: 14,
        tabSize: 4,
        wordWrap: true,
        minimap: false,
        fontLigatures: true
      },
      outputText: '',
      selectedDirectory: ''
    }
  },
  
  mounted() {
    // Watch for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => this.setTheme(e.matches));
    
    // Load saved settings
    this.loadSettings();
    
    // Prevent reload shortcuts
    window.addEventListener('keydown', this.preventReload);
    
    // Handle escape key
    document.addEventListener('keydown', this.handleEscape);
  },
  
  methods: {
    setTheme(isDark) {
      document.documentElement.classList.toggle('dark', isDark);
      if (this.editor) {
        this.editor.updateOptions({
          theme: isDark ? 'vs-dark' : 'vs-light'
        });
      }
    },
    
    async runCode() {
      if (this.isExecuting) return;
      
      this.isExecuting = true;
      const code = this.editor.getValue();
      
      const cleanedCode = code
        .replace(/<\?php/g, '')
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');
      
      try {
        const result = await window.nodeAPI.runPHP(cleanedCode);
        if (result.error) {
          this.outputText = `<pre class="error">${result.error}</pre>`;
        } else if (result.output) {
          this.outputText = `<pre class="output">${result.output}</pre>`;
        } else {
          this.outputText = `<pre class="error">No output or unexpected error occurred</pre>`;
        }
      } catch (error) {
        this.outputText = `<pre class="error">${error.message}</pre>`;
      } finally {
        this.isExecuting = false;
      }
    },
    
    async selectDirectory() {
      try {
        const directory = await window.directoryAPI.selectDirectory();
        if (directory) {
          window.directoryAPI.updateTitle(directory);
          this.selectedDirectory = directory;
          this.outputText = `<pre class="output">Selected Laravel project: ${directory}</pre>`;
        }
      } catch (error) {
        console.error("An error occurred while selecting a directory:", error);
        this.outputText = `<pre class="error">Error selecting directory: ${error.message}</pre>`;
      }
    },
    
    loadSettings() {
      const savedSettings = JSON.parse(localStorage.getItem('editorSettings') || '{}');
      this.settings = {
        fontSize: savedSettings.fontSize || 14,
        tabSize: savedSettings.tabSize || 4,
        wordWrap: savedSettings.wordWrap !== undefined ? savedSettings.wordWrap : true,
        minimap: savedSettings.minimap || false,
        fontLigatures: savedSettings.fontLigatures !== undefined ? savedSettings.fontLigatures : true
      };
    },
    
    saveSettings() {
      localStorage.setItem('editorSettings', JSON.stringify(this.settings));
      this.applySettings();
      this.isModalOpen = false;
    },
    
    applySettings() {
      if (this.editor) {
        this.editor.updateOptions({
          fontSize: this.settings.fontSize,
          tabSize: this.settings.tabSize,
          wordWrap: this.settings.wordWrap ? 'on' : 'off',
          minimap: { enabled: this.settings.minimap },
          fontLigatures: this.settings.fontLigatures,
          fontFamily: this.settings.fontLigatures ? 'Fira Code, monospace' : 'monospace'
        });
      }
    },
    
    preventReload(e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        return false;
      }
    },
    
    handleEscape(e) {
      if (e.key === 'Escape' && this.isModalOpen) {
        this.isModalOpen = false;
      }
    },
    
    onEditorMounted(editor) {
      this.editor = editor;
      this.applySettings();
    }
  },
  
  beforeUnmount() {
    window.removeEventListener('keydown', this.preventReload);
    document.removeEventListener('keydown', this.handleEscape);
    if (this.editor) {
      this.editor.dispose();
    }
  }
})

app.component('monaco-editor', MonacoEditor)
app.mount('#app')
