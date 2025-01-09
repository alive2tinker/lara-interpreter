<template>
  <div class="editor-container" ref="container">
    <div id="container" ref="editorContainer"></div>
  </div>
</template>

<script>
export default {
  name: 'MonacoEditor',
  
  emits: ['editor-mounted'],
  
  data() {
    return {
      editor: null,
      resizeObserver: null
    }
  },
  
  mounted() {
    this.initializeEditor();
    
    // Setup resize observer
    this.resizeObserver = new ResizeObserver(this.resizeEditor);
    this.resizeObserver.observe(this.$refs.container);
  },
  
  methods: {
    initializeEditor() {
      require(['vs/editor/editor.main'], () => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        this.editor = monaco.editor.create(this.$refs.editorContainer, {
          value: `<?php\n//write your code here`,
          language: "php",
          automaticLayout: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          theme: mediaQuery.matches ? 'vs-dark' : 'vs-light',
          fontSize: 14,
          lineNumbers: 'on',
          renderWhitespace: 'none',
          tabSize: 4,
          wordWrap: 'on',
          fontLigatures: true,
          fontFamily: 'Fira Code, monospace'
        });
        
        this.$emit('editor-mounted', this.editor);
      });
    },
    
    resizeEditor() {
      if (this.editor) {
        const { width, height } = this.$refs.container.getBoundingClientRect();
        this.editor.layout({ width, height });
      }
    }
  },
  
  beforeUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.editor) {
      this.editor.dispose();
    }
  }
}
</script>

<style scoped>
.editor-container {
  width: 100%;
  height: 100%;
}
</style> 