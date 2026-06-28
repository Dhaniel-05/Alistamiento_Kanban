const config = require('./src/config/env');
const app = require('./src/app');
const PORT = config.port;

app.listen(PORT, () => {
    console.log(`Servicio Backend establecido en http://localhost:${PORT}`);
});

