import * as monaco from "monaco-editor"
import React from "react"

function noop() {}

class MonacoDiffEditor extends React.Component {
  constructor(props) {
    super(props)
    this.containerElement = undefined
    this.__current_value = props.value
    this.__current_original = props.original
  }

  componentDidMount() {
    this.initMonaco()
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.value !== this.__current_value ||
      this.props.original !== this.__current_original
    ) {
      // Always refer to the latest value
      this.__current_value = this.props.value
      this.__current_original = this.props.original
      // Consider the situation of rendering 1+ times before the editor mounted
      if (this.editor) {
        this.__prevent_trigger_change_event = true
        this.updateModel(this.__current_value, this.__current_original)
        this.__prevent_trigger_change_event = false
      }
    }
    if (prevProps.language !== this.props.language) {
      monaco.editor.setModelLanguage(
        this.editor.getModel(),
        this.props.language
      )
    }
    if (prevProps.theme !== this.props.theme) {
      monaco.editor.setTheme(this.props.theme)
    }
    if (
      this.editor &&
      (this.props.width !== prevProps.width ||
        this.props.height !== prevProps.height)
    ) {
      this.editor.layout()
    }
  }

  componentWillUnmount() {
    this.destroyMonaco()
  }

  editorWillMount() {
    const { editorWillMount } = this.props
    editorWillMount(monaco)
  }

  editorDidMount(editor) {
    this.props.editorDidMount(editor, monaco)
    editor.onDidUpdateDiff(() => {
      const value = editor.getModel().modified.getValue()

      // Always refer to the latest value
      this.__current_value = value

      // Only invoking when user input changed
      if (!this.__prevent_trigger_change_event) {
        this.props.onChange(value)
      }
    })
  }

  updateModel(value, original) {
    const { language } = this.props
    const originalModel = monaco.editor.createModel(original, language)
    const modifiedModel = monaco.editor.createModel(value, language)
    this.editor.setModel({
      original: originalModel,
      modified: modifiedModel
    })
  }

  initMonaco() {
    const value =
      this.props.value !== null ? this.props.value : this.props.defaultValue
    const { original, theme, options } = this.props
    if (this.containerElement) {
      // Before initializing monaco editor
      this.editorWillMount(monaco)
      this.editor = monaco.editor.createDiffEditor(
        this.containerElement,
        options
      )
      if (theme) {
        monaco.editor.setTheme(theme)
      }
      // After initializing monaco editor
      this.updateModel(value, original)
      this.editorDidMount(this.editor)
    }
  }

  destroyMonaco() {
    if (typeof this.editor !== "undefined") {
      this.editor.dispose()
    }
  }

  assignRef = component => {
    this.containerElement = component
  }

  render() {
    const { width, height } = this.props
    const fixedWidth =
      width.toString().indexOf("%") !== -1 ? width : `${width}px`
    const fixedHeight =
      height.toString().indexOf("%") !== -1 ? height : `${height}px`
    const style = {
      width: fixedWidth,
      height: fixedHeight
    }

    return (
      <div
        ref={this.assignRef}
        style={style}
        className="react-monaco-editor-container"
      />
    )
  }
}

MonacoDiffEditor.defaultProps = {
  width: "100%",
  height: "100%",
  original: null,
  value: null,
  defaultValue: "",
  language: "javascript",
  theme: null,
  options: {},
  editorDidMount: noop,
  editorWillMount: noop,
  onChange: noop
}

export default MonacoDiffEditor