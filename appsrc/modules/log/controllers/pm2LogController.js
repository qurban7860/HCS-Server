const pm2 = require('pm2');
const fs = require('fs');

exports.getPM2Logs = async (req, res) => {
  try {
    var { app = 'hcs-dev-server', out_log = true, err_log, pageNumber = 0, pageSize = 100} = req.query;
    pageNumber = parseInt(pageNumber);
    pageSize = parseInt(pageSize);

    console.log(pageNumber, pageSize);
    if (!app) {
      return res.status(400).json({ error: 'Please provide the application name' });
    }

    pm2.connect((err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to connect to PM2' });
      }

      pm2.list((err, processList) => {
        if (err) {
          console.error(err);
          pm2.disconnect();
          return res.status(500).json({ error: 'Failed to get process list from PM2' });
        }

        const names = processList.map(item => item.name);

        if (!names.includes(app)) {
          pm2.disconnect();
          return res.status(404).json({ error: `Process not found! Available processes: [${names}]` });
        }

        const targetProcess = processList.find(process => process.name === app);

        let filePath = null;
        if (out_log === 'true') {
          filePath = targetProcess.pm2_env.pm_out_log_path;
        }
        if (err_log === 'true') {
          filePath = targetProcess.pm2_env.pm_err_log_path;
        }

        const stream = fs.createReadStream(filePath, { encoding: 'utf8' });

        readPage(pageNumber, pageSize, stream, (pageLines, error) => {
          if (error) {
              console.error('Error:', error);
              return res.status(500).json({ error: 'Internal server error' });
          }

          if (pageLines !== null) {
              return res.status(200).json({ lines: pageLines });
          } else {
              console.log('End of file reached.');
          }
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

function readPage(pageNumber, pageSize, stream, callback) {
  let lines = [];
  let currentPage = 0;

  stream.on('data', (chunk) => {
      const chunkLines = chunk.toString().split('\n');
      lines = lines.concat(chunkLines);
  });

  stream.on('end', () => {
      lines.reverse();
      const start = pageNumber * pageSize;
      const end = start + pageSize;
      const pageLines = lines.slice(start, end);

      currentPage++;

      if (currentPage === pageNumber + 1) {
          callback(pageLines);
      } else {
          console.log('End of file reached before desired page.');
          callback(null);
      }
  });

  stream.on('error', (err) => {
      console.error('Error reading file:', err);
      callback(null, err);
  });
}
