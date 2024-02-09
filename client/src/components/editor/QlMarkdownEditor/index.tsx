import classNames from "classnames";
import { useState } from "react";
import ReactQuill, { ReactQuillProps, Quill, } from "react-quill";

import "./style.scss";


const QlMarkdownEditor = (props: Omit<ReactQuillProps, "theme">) => {
  const {
    className,
    onFocus,
    onBlur,
    modules = {},
    ..._props
  } = props;
  const [isFocus, setFocus] = useState(false);

  return <ReactQuill
    style={{ height: '150px', width: "100%" }}
    {..._props}
    className={
      classNames(
        "ql-markdown-editor",
        isFocus ? "focus" : "",
        className
      )
    }
    theme="snow"
    onFocus={(...args) => {
      setFocus(true);
      if (onFocus) onFocus(...args);
    }}
    onBlur={(...args) => {

      setFocus(false);
      if (onBlur) onBlur(...args)
    }}
    modules={{
      toolbar: [
        ['bold', 'italic', 'underline', 'strike', 'blockquote', 'image'],
        [{ color: ['#000000', '#1282b2', '#FF0000', '#FFD561', '#00880d', '#FFFFFF', '#CCCCCC'] }]
      ],

      markdownShortcuts: {}
    }}
  />
};

export default QlMarkdownEditor;

