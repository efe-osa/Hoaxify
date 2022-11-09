const app = require("./v1/app");
const sequelize = require("./v1/config/database");

const PORT = 3000;

sequelize.sync();

app.listen(PORT, () => {
  console.log(`This app is running on http://localhost:${PORT}`);
});
