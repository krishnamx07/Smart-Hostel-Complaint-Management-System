const mysqldump = require('mysqldump');
mysqldump({
    connection: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'root',
        database: 'hostel_db',
    },
    dumpToFile: 'test-dump.sql',
}).then(() => {
    console.log("Dump successful");
}).catch(err => {
    console.error("Dump error", err);
});
