const express = require("express");
const UserRouter = require("./routes/UserRouter");
const i18next = require("i18next");
const backend = require("i18next-fs-backend");
const middleware = require("i18next-http-middleware");
const ErrorHandler = require("./utils/error/ErrorHandler");

i18next
  .use(backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: "en",
    lng: "en",
    ns: ["translation"],
    defaultNS: "translation",
    backend: {
      loadPath: "./locales/{{lng}}/{{ns}}.json",
    },
    detection: {
      lookupHeader: "accept-language",
    },
  });

const app = express();
// services
app.use(middleware.handle(i18next));
app.use(express.json());

// TODO: add api versioning
// app.use(v1);

// Routes
app.use("/api/1.0", UserRouter);

app.use(ErrorHandler);
module.exports = app;
