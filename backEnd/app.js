const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs')
const { exec } = require('child_process');
const app = express();
const upload = multer({ dest: 'uploads/' });
const port = 3000;

app.use(cors())
app.use(express.urlencoded({ extended: true }));

app.post('/compress', upload.single('file'), async (req, res) => {
    try {
        const quality = req.body.quality
        const inputFilePath = req.file.path; // 上传的PDF文件路径
        const outputFilePath = './output/compressed.pdf'; // 压缩后的PDF文件路径
        // 执行 Ghostscript 命令行来压缩 PDF
        let sys = 'gs'
        if (process.platform.toLowerCase().includes('win')) {
            sys = 'gswin64 '
        }
        const command = `${sys} -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/${quality} -dNOPAUSE -dQUIET -dBATCH -sOutputFile=${outputFilePath} ${inputFilePath}`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('压缩PDF文件出错', error);
                res.status(500).send('压缩PDF文件出错');
                return;
            }
            // 删除上传文件
            fs.readdir('./uploads', (err, files) => {
                if (err) {
                console.error('读取上传文件夹时出错:', err);
                return;
                }
                files.forEach((file) => {
                const filePath = `./uploads/${file}`;
                fs.unlink(filePath, (err) => {
                    if (err) {
                    console.error(`删除文件 ${filePath} 时出错:`, err);
                    }
                });
                });
            });
            // 设置响应头，让浏览器下载文件
            res.setHeader('Content-Disposition', 'attachment;');
            res.setHeader('Content-Type', 'application/pdf');
            res.download(outputFilePath);
            // 返回压缩后的PDF文件并在响应结束后删除输出文件
            res.on('finish', () => {
                // 删除输出文件
                fs.unlink(outputFilePath, (err) => {
                    if (err) {
                        console.error('删除输出文件出错', err);
                    }
                });
            });
        });
    }
    catch (error) {
        console.error('压缩 PDF 文件出错', error);
        res.status(500).send('压缩 PDF 文件出错');
    }
});

app.listen(port, () => {
  console.log(`应用程序正在运行，访问 http://localhost:${port}`);
});
