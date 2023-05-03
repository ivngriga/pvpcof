import React, {useMemo} from "react";
import ReactDOM from "react-dom";
import "./index.scss";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

import WalletWrapper from './WalletWrapper'

ReactDOM.render(
  <React.StrictMode>
      <BrowserRouter>
        <WalletWrapper>
          <App/>
        </WalletWrapper>
      </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root")
);
