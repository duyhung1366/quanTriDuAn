import { CssBaseline } from "@mui/material";
import MarkdownShortcuts from 'quill-markdown-shortcuts';
import React from "react";
import ReactDOM from "react-dom";
import { Quill } from "react-quill";
import "react-quill/dist/quill.bubble.css";
import "react-quill/dist/quill.snow.css";
import { Provider } from "react-redux";
import App from "./App";
import "./index.scss";
import store from "./redux/store";

Quill.register('modules/markdownShortcuts', MarkdownShortcuts);

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <CssBaseline />
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);
